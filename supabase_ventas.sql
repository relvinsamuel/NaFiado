


CREATE TABLE IF NOT EXISTS sesiones_caja (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id               uuid NOT NULL REFERENCES workspaces(id),
  usuario_id              uuid NOT NULL REFERENCES auth.users(id),
  estado                  text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  monto_inicial           numeric NOT NULL DEFAULT 0,
  monto_declarado_cierre  numeric,
  fecha_apertura          timestamptz NOT NULL DEFAULT now(),
  fecha_cierre            timestamptz,

  -- Campos operativos adicionales para cuadre y auditoria.
  monto_esperado_cierre   numeric,
  diferencia_cierre       numeric,
  total_ventas            numeric NOT NULL DEFAULT 0,
  total_efectivo          numeric NOT NULL DEFAULT 0,
  total_transferencias    numeric NOT NULL DEFAULT 0,
  total_fiado             numeric NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id);
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS estado text DEFAULT 'abierta';
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS monto_inicial numeric DEFAULT 0;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS monto_declarado_cierre numeric;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS fecha_apertura timestamptz DEFAULT now();
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS monto_esperado_cierre numeric;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS diferencia_cierre numeric;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS total_ventas numeric DEFAULT 0;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS total_efectivo numeric DEFAULT 0;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS total_transferencias numeric DEFAULT 0;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS total_fiado numeric DEFAULT 0;
ALTER TABLE sesiones_caja ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS ventas (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id               uuid NOT NULL REFERENCES workspaces(id),
  sesion_caja_id          uuid NOT NULL REFERENCES sesiones_caja(id),
  cliente_id              uuid REFERENCES clientes(id),
  metodo_pago             text NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'fiado')),
  total_venta             numeric NOT NULL DEFAULT 0,
  estado_venta            text NOT NULL DEFAULT 'completada' CHECK (estado_venta IN ('completada', 'anulada')),
  created_at              timestamptz NOT NULL DEFAULT now(),

  -- Campos de compatibilidad y trazabilidad ya usados por la app.
  workspace_id            uuid NOT NULL REFERENCES workspaces(id),
  cajero_id               uuid REFERENCES auth.users(id),
  cliente_nombre          varchar,
  subtotal                numeric NOT NULL DEFAULT 0,
  subtotal_bs             numeric NOT NULL DEFAULT 0,
  impuesto                numeric NOT NULL DEFAULT 0,
  impuesto_bs             numeric NOT NULL DEFAULT 0,
  total                   numeric NOT NULL DEFAULT 0,
  total_bs                numeric NOT NULL DEFAULT 0,
  tasa_bcv                numeric NOT NULL DEFAULT 1,
  referencia_transferencia text,

  CONSTRAINT ventas_tenant_workspace_match CHECK (tenant_id = workspace_id),
  CONSTRAINT ventas_total_match CHECK (total_venta = total)
);

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS sesion_caja_id uuid REFERENCES sesiones_caja(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'efectivo';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS total_venta numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado_venta text DEFAULT 'completada';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cajero_id uuid REFERENCES auth.users(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_nombre varchar;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS subtotal_bs numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS impuesto numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS impuesto_bs numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS total_bs numeric DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tasa_bcv numeric DEFAULT 1;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS referencia_transferencia text;

UPDATE ventas
SET tenant_id = workspace_id
WHERE tenant_id IS NULL AND workspace_id IS NOT NULL;

UPDATE ventas
SET total_venta = total
WHERE COALESCE(total_venta, 0) = 0 AND total IS NOT NULL;

UPDATE ventas
SET estado_venta = 'completada'
WHERE estado_venta IS NULL;

CREATE TABLE IF NOT EXISTS detalles_venta (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id                   uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  tenant_id                  uuid NOT NULL REFERENCES workspaces(id),

  -- Nota: producto_id se deja nullable hasta confirmar que inventario usa PK uuid.
  producto_id                uuid,
  cantidad                   int NOT NULL DEFAULT 1,
  precio_unitario_historico  numeric NOT NULL,
  subtotal                   numeric NOT NULL,

  -- Snapshot y compatibilidad con el modelo actual.
  workspace_id               uuid NOT NULL REFERENCES workspaces(id),
  producto_codigo            varchar,
  producto_nombre            varchar,
  precio_unitario            numeric NOT NULL,
  subtotal_linea             numeric NOT NULL,
  created_at                 timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT detalles_tenant_workspace_match CHECK (tenant_id = workspace_id),
  CONSTRAINT detalles_precio_match CHECK (precio_unitario_historico = precio_unitario),
  CONSTRAINT detalles_subtotal_match CHECK (subtotal = subtotal_linea)
);

ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES workspaces(id);
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS producto_id uuid;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS cantidad int DEFAULT 1;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS precio_unitario_historico numeric;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS subtotal numeric;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS producto_codigo varchar;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS producto_nombre varchar;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS precio_unitario numeric DEFAULT 0;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS subtotal_linea numeric DEFAULT 0;
ALTER TABLE detalles_venta ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

UPDATE detalles_venta
SET tenant_id = workspace_id
WHERE tenant_id IS NULL AND workspace_id IS NOT NULL;

UPDATE detalles_venta
SET precio_unitario_historico = precio_unitario
WHERE precio_unitario_historico IS NULL AND precio_unitario IS NOT NULL;

UPDATE detalles_venta
SET subtotal = subtotal_linea
WHERE subtotal IS NULL AND subtotal_linea IS NOT NULL;

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


ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sesiones de caja de su tenant"
  ON sesiones_caja FOR ALL
  USING (tenant_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Usuarios ven ventas de su tenant"
  ON ventas FOR ALL
  USING (tenant_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Usuarios ven detalles de su tenant"
  ON detalles_venta FOR ALL
  USING (tenant_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));


CREATE INDEX IF NOT EXISTS idx_sesiones_caja_tenant_estado ON sesiones_caja(tenant_id, estado, fecha_apertura DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario ON sesiones_caja(usuario_id, fecha_apertura DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_tenant ON ventas(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_sesion_caja ON ventas(sesion_caja_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detalles_venta_venta ON detalles_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalles_venta_tenant ON detalles_venta(tenant_id);
