-- ============================================
-- NAFIADO SaaS - Hardening Checkout Transaction
-- Run in Supabase SQL Editor after base schema scripts.
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inventario_workspace_codigo ON inventario(workspace_id, codigo);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_tenant_estado ON sesiones_caja(tenant_id, estado, fecha_apertura DESC);

ALTER TABLE sesiones_caja
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);

ALTER TABLE detalles_venta
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);

UPDATE ventas
SET tenant_id = workspace_id
WHERE tenant_id IS NULL AND workspace_id IS NOT NULL;

UPDATE detalles_venta
SET tenant_id = workspace_id
WHERE tenant_id IS NULL AND workspace_id IS NOT NULL;

DO $$
DECLARE
  legacy_table text;
BEGIN
  FOREACH legacy_table IN ARRAY ARRAY['venta_detalles', 'ventas_detalles', 'detalles_ventas']
  LOOP
    IF to_regclass(format('public.%s', legacy_table)) IS NOT NULL THEN
      EXECUTE format(
        $sql$
          INSERT INTO detalles_venta (
            id,
            venta_id,
            tenant_id,
            producto_id,
            cantidad,
            precio_unitario_historico,
            subtotal,
            workspace_id,
            producto_codigo,
            producto_nombre,
            precio_unitario,
            subtotal_linea,
            created_at
          )
          SELECT
            legacy.id,
            legacy.venta_id,
            legacy.workspace_id,
            NULL,
            COALESCE(legacy.cantidad, 1),
            COALESCE(legacy.precio_unitario, 0),
            COALESCE(legacy.subtotal_linea, 0),
            legacy.workspace_id,
            legacy.producto_codigo,
            legacy.producto_nombre,
            COALESCE(legacy.precio_unitario, 0),
            COALESCE(legacy.subtotal_linea, 0),
            legacy.created_at
          FROM %I AS legacy
          WHERE NOT EXISTS (
            SELECT 1
            FROM detalles_venta AS current_rows
            WHERE current_rows.id = legacy.id
          )
        $sql$,
        legacy_table
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS referencia_transferencia text;

CREATE OR REPLACE FUNCTION open_cash_session(
  p_workspace_id uuid,
  p_cajero_id uuid,
  p_monto_apertura numeric
)
RETURNS sesiones_caja
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing sesiones_caja;
  v_session sesiones_caja;
BEGIN
  IF p_workspace_id IS NULL THEN
    RAISE EXCEPTION 'workspace_id is required';
  END IF;

  IF p_cajero_id IS NULL THEN
    RAISE EXCEPTION 'cajero_id is required';
  END IF;

  IF COALESCE(p_monto_apertura, 0) < 0 THEN
    RAISE EXCEPTION 'opening amount cannot be negative';
  END IF;

  SELECT *
  INTO v_existing
  FROM sesiones_caja
  WHERE tenant_id = p_workspace_id
    AND usuario_id = p_cajero_id
    AND estado = 'abierta'
  ORDER BY fecha_apertura DESC
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'there is already an open cash session for this cashier';
  END IF;

  INSERT INTO sesiones_caja (
    tenant_id,
    usuario_id,
    estado,
    monto_inicial,
    monto_esperado_cierre
  )
  VALUES (
    p_workspace_id,
    p_cajero_id,
    'abierta',
    COALESCE(p_monto_apertura, 0),
    COALESCE(p_monto_apertura, 0)
  )
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

CREATE OR REPLACE FUNCTION close_cash_session(
  p_workspace_id uuid,
  p_sesion_caja_id uuid,
  p_cajero_id uuid,
  p_monto_declarado_cierre numeric
)
RETURNS sesiones_caja
LANGUAGE plpgsql
AS $$
DECLARE
  v_session sesiones_caja;
  v_expected numeric;
BEGIN
  IF p_workspace_id IS NULL THEN
    RAISE EXCEPTION 'workspace_id is required';
  END IF;

  IF p_sesion_caja_id IS NULL THEN
    RAISE EXCEPTION 'sesion_caja_id is required';
  END IF;

  IF p_cajero_id IS NULL THEN
    RAISE EXCEPTION 'cajero_id is required';
  END IF;

  SELECT *
  INTO v_session
  FROM sesiones_caja
  WHERE id = p_sesion_caja_id
    AND tenant_id = p_workspace_id
    AND usuario_id = p_cajero_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cash session not found';
  END IF;

  IF v_session.estado <> 'abierta' THEN
    RAISE EXCEPTION 'cash session is already closed';
  END IF;

  v_expected := COALESCE(v_session.monto_inicial, 0) + COALESCE(v_session.total_efectivo, 0);

  UPDATE sesiones_caja
  SET estado = 'cerrada',
      monto_declarado_cierre = COALESCE(p_monto_declarado_cierre, 0),
      monto_esperado_cierre = v_expected,
      diferencia_cierre = COALESCE(p_monto_declarado_cierre, 0) - v_expected,
      fecha_cierre = now()
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

CREATE OR REPLACE FUNCTION process_checkout_tx(
  p_workspace_id uuid,
  p_cajero_id uuid,
  p_cliente_id uuid,
  p_cliente_nombre text,
  p_metodo_pago text,
  p_referencia_transferencia text,
  p_tasa_bcv numeric,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  inv_record record;
  v_cash_session record;
  qty int;
  line_subtotal numeric;
  v_total numeric := 0;
  v_total_bs numeric := 0;
  v_venta_id uuid;
  v_metodo_pago text;
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

  v_metodo_pago := COALESCE(NULLIF(trim(p_metodo_pago), ''), 'efectivo');

  SELECT *
  INTO v_cash_session
  FROM sesiones_caja
  WHERE tenant_id = p_workspace_id
    AND usuario_id = p_cajero_id
    AND estado = 'abierta'
  ORDER BY fecha_apertura DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no open cash session found for this cashier';
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
    tenant_id,
    sesion_caja_id,
    cliente_id,
    metodo_pago,
    total_venta,
    estado_venta,
    workspace_id,
    cajero_id,
    cliente_nombre,
    subtotal,
    subtotal_bs,
    impuesto,
    impuesto_bs,
    total,
    total_bs,
    tasa_bcv,
    referencia_transferencia
  )
  VALUES (
    p_workspace_id,
    v_cash_session.id,
    p_cliente_id,
    v_metodo_pago,
    v_total,
    'completada',
    p_workspace_id,
    p_cajero_id,
    p_cliente_nombre,
    v_total,
    v_total_bs,
    0,
    0,
    v_total,
    v_total_bs,
    COALESCE(NULLIF(p_tasa_bcv, 0), 1),
    NULLIF(trim(COALESCE(p_referencia_transferencia, '')), '')
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

    INSERT INTO detalles_venta (
      venta_id,
      tenant_id,
      producto_id,
      cantidad,
      precio_unitario_historico,
      subtotal,
      workspace_id,
      producto_codigo,
      producto_nombre,
      precio_unitario,
      subtotal_linea
    )
    VALUES (
      v_venta_id,
      p_workspace_id,
      NULL,
      qty,
      COALESCE(inv_record.precio_usd, 0),
      line_subtotal,
      p_workspace_id,
      inv_record.codigo,
      inv_record.nombre,
      COALESCE(inv_record.precio_usd, 0),
      line_subtotal
    );

    UPDATE inventario
    SET stock = GREATEST(COALESCE(stock, 0) - qty, 0)
    WHERE workspace_id = p_workspace_id
      AND codigo = inv_record.codigo;
  END LOOP;

  UPDATE sesiones_caja
  SET total_ventas = COALESCE(total_ventas, 0) + v_total,
      total_efectivo = COALESCE(total_efectivo, 0) + CASE WHEN v_metodo_pago = 'efectivo' THEN v_total ELSE 0 END,
      total_transferencias = COALESCE(total_transferencias, 0) + CASE WHEN v_metodo_pago = 'transferencia' THEN v_total ELSE 0 END,
      total_fiado = COALESCE(total_fiado, 0) + CASE WHEN v_metodo_pago = 'fiado' THEN v_total ELSE 0 END,
      monto_esperado_cierre = COALESCE(monto_inicial, 0) + COALESCE(total_efectivo, 0) + CASE WHEN v_metodo_pago = 'efectivo' THEN v_total ELSE 0 END
  WHERE id = v_cash_session.id;

  RETURN jsonb_build_object(
    'id', v_venta_id,
    'sesion_caja_id', v_cash_session.id,
    'total', v_total,
    'total_bs', v_total_bs,
    'tasa_bcv', COALESCE(NULLIF(p_tasa_bcv, 0), 1),
    'metodo_pago', v_metodo_pago,
    'items_count', v_items_count,
    'created_at', v_created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION open_cash_session(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION close_cash_session(uuid, uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION process_checkout_tx(uuid, uuid, uuid, text, text, text, numeric, jsonb) TO authenticated;
