# NAFIADO POS SaaS

Sistema web de punto de venta, inventario y clientes (fiado) construido con Next.js + Supabase + Zustand.

## Requisitos

- Node.js 20+
- Proyecto de Supabase configurado
- Tablas base creadas con:
  - `supabase_ventas.sql`
  - `supabase_clientes.sql`

## Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

La app ahora falla en arranque si estas variables no existen (fail-fast).

## Instalacion y ejecucion

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Hardening aplicado

- Validacion temprana de variables de Supabase.
- Checkout POS transaccional via RPC SQL para evitar carreras de stock.
- Filtrado por `workspace_id` en consultas de clientes e inventario.
- Sidebar solo muestra secciones implementadas para evitar 404.

## Migracion SQL de hardening

Ejecuta este archivo en Supabase SQL Editor:

- `supabase_hardening.sql`

Este script crea la funcion `process_checkout_tx(...)` usada por el checkout atomico.

## Como probar el hardening

1. Arranque seguro de env:
	- Quita temporalmente una variable en `.env.local`.
	- Ejecuta `npm run dev`.
	- Esperado: error inmediato indicando variables faltantes.

2. Flujo base de login:
	- Con variables correctas, ejecuta `npm run dev`.
	- Esperado: login carga sin errores y redirige al POS al iniciar sesion.

3. Aislamiento por workspace:
	- Inicia sesion con usuario A (workspace A), revisa Inventario y Clientes.
	- Inicia sesion con usuario B (workspace B), revisa las mismas vistas.
	- Esperado: cada usuario solo ve sus datos.

4. Checkout transaccional:
	- Configura un producto con stock bajo (ejemplo 1).
	- Intenta dos ventas simultaneas del mismo producto desde dos sesiones.
	- Esperado: una venta se completa y la otra falla con mensaje de stock insuficiente, sin stock negativo.

5. Integridad post-venta:
	- Tras una venta exitosa, valida en Supabase:
	  - `ventas` tiene 1 registro nuevo.
	  - `venta_detalles` tiene lineas correctas.
	  - `inventario.stock` se desconto correctamente.

## Comandos utiles

```bash
npm run lint
npm run build
```
