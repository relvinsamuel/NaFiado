-- ============================================
-- NAFIADO SaaS - Tablas de Ventas / Facturación
-- Pegar en Supabase → SQL Editor → Run
-- ============================================

-- 1. Tabla principal de ventas (cada venta = 1 fila)
CREATE TABLE ventas (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id),
  cajero_id     uuid REFERENCES auth.users(id),
  
  -- Datos del cliente (opcional, para ventas a crédito / fiado)
  cliente_nombre  varchar,
  
  -- Totales
  subtotal      numeric NOT NULL DEFAULT 0,
  impuesto      numeric NOT NULL DEFAULT 0,
  total         numeric NOT NULL DEFAULT 0,
  
  -- Método de pago
  metodo_pago   varchar NOT NULL DEFAULT 'efectivo_usd',
  
  -- Timestamps
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla de detalles (cada producto vendido = 1 fila)
CREATE TABLE venta_detalles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id      uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id),
  
  -- Producto vendido (snapshot al momento de la venta)
  producto_codigo   varchar NOT NULL,
  producto_nombre   varchar NOT NULL,
  precio_unitario   numeric NOT NULL,
  cantidad          int NOT NULL DEFAULT 1,
  subtotal_linea    numeric NOT NULL,
  
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. Row Level Security (RLS) - Aislamiento por Workspace
-- ============================================

-- Activar RLS en ambas tablas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven ventas de SU workspace
CREATE POLICY "Usuarios ven ventas de su workspace"
  ON ventas FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- Política: Los usuarios solo ven detalles de SU workspace
CREATE POLICY "Usuarios ven detalles de su workspace"
  ON venta_detalles FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- 4. Índices para rendimiento
-- ============================================
CREATE INDEX idx_ventas_workspace ON ventas(workspace_id);
CREATE INDEX idx_ventas_created   ON ventas(created_at DESC);
CREATE INDEX idx_detalles_venta   ON venta_detalles(venta_id);
