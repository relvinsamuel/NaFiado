-- ============================================
-- NAFIADO SaaS — Clientes + Sistema de Fiado
-- Pegar en Supabase → SQL Editor → Run
-- ============================================

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nombre        varchar NOT NULL,
  telefono      varchar,
  cedula        varchar,
  email         varchar,
  direccion     varchar,
  notas         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios CRUD clientes de su workspace" ON clientes;
CREATE POLICY "Usuarios CRUD clientes de su workspace"
  ON clientes FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_clientes_workspace ON clientes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- 2. Columna cliente_id en ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS subtotal_bs numeric NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS impuesto_bs numeric NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS total_bs numeric NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tasa_bcv numeric NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);

-- 3. Tabla de Abonos (pagos parciales contra deudas de fiado)
CREATE TABLE IF NOT EXISTS abonos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  cliente_id    uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  monto         numeric NOT NULL CHECK (monto >= 0),
  monto_usd     numeric NOT NULL DEFAULT 0 CHECK (monto_usd >= 0),
  monto_bs      numeric NOT NULL DEFAULT 0 CHECK (monto_bs >= 0),
  tasa_bcv      numeric NOT NULL DEFAULT 0,
  moneda_pago   varchar NOT NULL DEFAULT 'usd',
  metodo_pago   varchar NOT NULL DEFAULT 'efectivo_usd',
  nota          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE abonos ADD COLUMN IF NOT EXISTS monto numeric NOT NULL DEFAULT 0;
ALTER TABLE abonos ADD COLUMN IF NOT EXISTS monto_usd numeric NOT NULL DEFAULT 0;
ALTER TABLE abonos ADD COLUMN IF NOT EXISTS monto_bs numeric NOT NULL DEFAULT 0;
ALTER TABLE abonos ADD COLUMN IF NOT EXISTS tasa_bcv numeric NOT NULL DEFAULT 0;
ALTER TABLE abonos ADD COLUMN IF NOT EXISTS moneda_pago varchar NOT NULL DEFAULT 'usd';

ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios CRUD abonos de su workspace" ON abonos;
CREATE POLICY "Usuarios CRUD abonos de su workspace"
  ON abonos FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_abonos_workspace ON abonos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_abonos_created ON abonos(created_at DESC);
