-- ============================================
-- NAFIADO SaaS - Hardening Checkout Transaction
-- Run in Supabase SQL Editor after base schema scripts.
-- ============================================

-- Optional but recommended indexes for checkout paths
CREATE INDEX IF NOT EXISTS idx_inventario_workspace_codigo ON inventario(workspace_id, codigo);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id, workspace_id);

-- Atomic checkout function:
-- 1) locks inventory rows
-- 2) validates stock
-- 3) inserts venta + detalles
-- 4) updates stock
CREATE OR REPLACE FUNCTION process_checkout_tx(
  p_workspace_id uuid,
  p_cajero_id uuid,
  p_cliente_id uuid,
  p_cliente_nombre text,
  p_metodo_pago text,
  p_tasa_bcv numeric,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  inv_record record;
  qty int;
  line_subtotal numeric;
  v_total numeric := 0;
  v_total_bs numeric := 0;
  v_venta_id uuid;
  v_items_count int := 0;
  v_created_at timestamptz;
BEGIN
  IF p_workspace_id IS NULL THEN
    RAISE EXCEPTION 'workspace_id is required';
  END IF;

  IF p_cajero_id IS NULL THEN
    RAISE EXCEPTION 'cajero_id is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items are required';
  END IF;

  FOR item IN
    SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    qty := COALESCE((item->>'cantidad')::int, 0);

    IF qty <= 0 THEN
      RAISE EXCEPTION 'invalid quantity for item %', item;
    END IF;

    SELECT codigo, nombre, precio_usd, stock
    INTO inv_record
    FROM inventario
    WHERE workspace_id = p_workspace_id
      AND codigo = item->>'codigo'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product not found: %', item->>'codigo';
    END IF;

    IF COALESCE(inv_record.stock, 0) < qty THEN
      RAISE EXCEPTION 'insufficient stock for product %', inv_record.nombre;
    END IF;

    line_subtotal := COALESCE(inv_record.precio_usd, 0) * qty;
    v_total := v_total + line_subtotal;
    v_items_count := v_items_count + qty;
  END LOOP;

  v_total_bs := v_total * COALESCE(NULLIF(p_tasa_bcv, 0), 1);

  INSERT INTO ventas (
    workspace_id,
    cajero_id,
    cliente_id,
    cliente_nombre,
    subtotal,
    subtotal_bs,
    impuesto,
    impuesto_bs,
    total,
    total_bs,
    tasa_bcv,
    metodo_pago
  )
  VALUES (
    p_workspace_id,
    p_cajero_id,
    p_cliente_id,
    p_cliente_nombre,
    v_total,
    v_total_bs,
    0,
    0,
    v_total,
    v_total_bs,
    COALESCE(NULLIF(p_tasa_bcv, 0), 1),
    COALESCE(NULLIF(p_metodo_pago, ''), 'efectivo_usd')
  )
  RETURNING id, created_at INTO v_venta_id, v_created_at;

  FOR item IN
    SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    qty := COALESCE((item->>'cantidad')::int, 0);

    SELECT codigo, nombre, precio_usd, stock
    INTO inv_record
    FROM inventario
    WHERE workspace_id = p_workspace_id
      AND codigo = item->>'codigo'
    FOR UPDATE;

    line_subtotal := COALESCE(inv_record.precio_usd, 0) * qty;

    INSERT INTO venta_detalles (
      venta_id,
      workspace_id,
      producto_codigo,
      producto_nombre,
      precio_unitario,
      cantidad,
      subtotal_linea
    )
    VALUES (
      v_venta_id,
      p_workspace_id,
      inv_record.codigo,
      inv_record.nombre,
      COALESCE(inv_record.precio_usd, 0),
      qty,
      line_subtotal
    );

    UPDATE inventario
    SET stock = GREATEST(COALESCE(stock, 0) - qty, 0)
    WHERE workspace_id = p_workspace_id
      AND codigo = inv_record.codigo;
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_venta_id,
    'total', v_total,
    'total_bs', v_total_bs,
    'tasa_bcv', COALESCE(NULLIF(p_tasa_bcv, 0), 1),
    'metodo_pago', COALESCE(NULLIF(p_metodo_pago, ''), 'efectivo_usd'),
    'items_count', v_items_count,
    'created_at', v_created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_checkout_tx(uuid, uuid, uuid, text, text, numeric, jsonb) TO authenticated;
