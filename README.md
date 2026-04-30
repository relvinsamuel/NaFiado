# NAFIADO POS SaaS

Sistema web de punto de venta, inventario y clientes (fiado) construido con Next.js + Supabase + Zustand.

## Requisitos

- Node.js 20+
- Proyecto de Supabase configurado
- Tablas base creadas con:
  - `supabase_ventas.sql`
  - `supabase_clientes.sql`
	- `supabase_hardening.sql`

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

## Flujo de caja obligatorio

El flujo operativo esperado queda asi:

1. Apertura:
	- El cajero abre turno.
	- Supabase crea una fila en `sesion_caja` con estado `Abierta` y `monto_apertura`.

2. Operacion:
	- Cada checkout del POS usa `process_checkout_tx(...)`.
	- La funcion busca una `sesion_caja` abierta del cajero.
	- Si no existe, la venta falla.
	- Si existe, la venta se inserta en `ventas` vinculada a `sesion_caja_id` y se actualizan los acumulados de caja.

3. Cierre:
	- El cajero declara el efectivo contado.
	- `close_cash_session(...)` cambia el estado a `Cerrada`.
	- La funcion calcula `monto_esperado_cierre` y `diferencia_cierre` para detectar sobrante o faltante.

## Migracion SQL de hardening

Ejecuta este archivo en Supabase SQL Editor:

- `supabase_ventas.sql`
- `supabase_clientes.sql`
- `supabase_hardening.sql`

Este ultimo script crea las funciones `open_cash_session(...)`, `close_cash_session(...)` y la version endurecida de `process_checkout_tx(...)` usada por el checkout atomico.

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
	- Abre primero una `sesion_caja` para el cajero.
	- Configura un producto con stock bajo (ejemplo 1).
	- Intenta dos ventas simultaneas del mismo producto desde dos sesiones.
	- Esperado: una venta se completa y la otra falla con mensaje de stock insuficiente, sin stock negativo.
	- Si no existe `sesion_caja` abierta, esperado: la venta falla con error indicando que no hay caja abierta.

5. Integridad post-venta:
	- Tras una venta exitosa, valida en Supabase:
	  - `sesion_caja` sigue en estado `Abierta` y sus totales se actualizaron.
	  - `ventas` tiene 1 registro nuevo.
	  - `ventas.sesion_caja_id` apunta a la sesion abierta.
	  - `venta_detalles` tiene lineas correctas.
	  - `inventario.stock` se desconto correctamente.

6. Cierre de caja:
	- Ejecuta `close_cash_session(...)` con el monto declarado por el cajero.
	- Esperado: `sesion_caja.estado = 'Cerrada'`, `monto_esperado_cierre` calculado y `diferencia_cierre` positiva o negativa segun corresponda.

## Comandos utiles

```bash
npm run lint
npm run build
```
