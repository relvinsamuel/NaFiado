# 🏗️ NAFIADO SaaS — Blueprint Técnico Completo

> **Última actualización:** Abril 2026  
> **Propósito:** Documentar la arquitectura, estructura de archivos, flujo de datos, base de datos y cada módulo funcional del sistema para que cualquier programador pueda entender, mantener y extender el proyecto.

---

## 1. Visión General del Producto

**Nafiado** es una plataforma SaaS de **Punto de Venta (POS)** y **gestión de inventario** diseñada para pequeños y medianos comercios. El sistema reemplaza un flujo anterior basado en Google Sheets + Google Apps Script por una arquitectura moderna, escalable y multi-tenant.

### Características principales:
- **Multi-tenant:** Cada negocio (ej: "H2O Pinor") opera en su propio `workspace` con datos completamente aislados vía Row Level Security (RLS).
- **Punto de Venta:** Grid de productos, carrito, selector de método de pago, facturación con descuento automático de stock.
- **Inventario:** CRUD completo de productos, alertas de stock bajo/agotado, fichas detalladas con costo, margen y precio auto-calculado.
- **Autenticación:** Login con email/password vía Supabase Auth. Protección de rutas con AuthGuard.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.3 |
| **Lenguaje** | TypeScript | ^5 |
| **UI** | React | 19.2.4 |
| **Estilos** | Tailwind CSS v4 + CSS Custom Properties | ^4 |
| **Estado Global** | Zustand | ^5.0.12 |
| **Base de Datos** | PostgreSQL (Supabase) | — |
| **Autenticación** | Supabase Auth | — |
| **Iconos** | Lucide React | ^1.8.0 |
| **Tipografías** | Google Fonts: **Manrope** (títulos) + **Inter** (cuerpo) | — |

---

## 3. Variables de Entorno

Archivo: `.env.local` (raíz del proyecto, NO se versiona)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

---

## 4. Estructura de Archivos

```
fiado-saas-web/
├── .env.local                    # Claves de Supabase (NO git)
├── package.json                  # Dependencias del proyecto
├── supabase_ventas.sql           # SQL de creación de tablas ventas
├── tsconfig.json
├── postcss.config.mjs
├── next.config.ts
│
├── public/                       # Assets estáticos
│
└── src/
    ├── app/                      # RUTAS (Next.js App Router)
    │   ├── globals.css           # 🎨 Design System (tokens de color, tipografía)
    │   ├── layout.tsx            # Root Layout (fuentes, metadata, AppLayout wrapper)
    │   ├── page.tsx              # "/" → Página del POS
    │   ├── login/
    │   │   └── page.tsx          # "/login" → Pantalla de inicio de sesión
    │   └── inventory/
    │       └── page.tsx          # "/inventory" → Módulo de Inventario
    │
    ├── components/               # COMPONENTES REACT
    │   ├── AppLayout.tsx         # Layout inteligente (oculta Sidebar en /login)
    │   ├── AuthGuard.tsx         # Protector de rutas (redirige si no hay sesión)
    │   ├── Sidebar.tsx           # Navegación lateral con logo Nafiado
    │   ├── ProductGrid.tsx       # Grid de productos en el POS
    │   ├── CartPanel.tsx         # Panel de carrito + selector de pago + botón Cobrar
    │   ├── CheckoutSuccessModal.tsx  # Modal post-venta exitosa
    │   └── inventory/
    │       ├── InventoryTable.tsx    # Tabla ordenable de productos
    │       └── ProductFormModal.tsx  # Modal de crear/editar producto
    │
    └── lib/                      # LÓGICA DE NEGOCIO
        ├── supabase.ts           # Cliente Supabase (singleton)
        ├── store.ts              # Estado global del POS (carrito, checkout)
        └── inventoryStore.ts     # Estado global del Inventario (CRUD, filtros)
```

---

## 5. Design System: "Industrial Precision"

Definido en `DESIGN.md` y materializado en `globals.css`.

### Filosofía
Estética industrial premium. Bordes prohibidos ("No-Line Rule"). Profundidad creada exclusivamente mediante capas tonales de fondos y sombras ambientales difusas.

### Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#a23a00` | CTAs, precios, acentos principales |
| `--color-primary-container` | `#ca4b00` | Gradientes de botones primarios |
| `--color-on-primary` | `#ffffff` | Texto sobre botones primarios |
| `--color-secondary` | `#45655a` | Iconografía, chips, acciones secundarias |
| `--color-secondary-container` | `#e6eee9` | Fondo de chips/etiquetas |
| `--color-surface` | `#f9f9f9` | Capa base del layout |
| `--color-surface-container-low` | `#f4f3f3` | Fondo del área de contenido principal |
| `--color-surface-container-lowest` | `#ffffff` | Cards flotantes |
| `--color-surface-container-highest` | `#d5d5d5` | Fondo de inputs |
| `--color-on-surface` | `#1a1c1c` | Texto principal (nunca #000000) |
| `--color-on-surface-variant` | `#5b6260` | Texto secundario/muted |
| `--color-outline-variant` | `#c3cac7` | Ghost borders (al 15-20% opacidad) |

### Tipografía
- **Manrope** → Títulos, encabezados, números grandes. Clase: `font-manrope`
- **Inter** → Cuerpo de texto, datos tabulares, labels. Clase: `font-inter`

### Reglas de Diseño Clave
1. **No-Line Rule:** Jamás usar `border` sólido para seccionar. Usar cambio de `background-color`.
2. **Glassmorphism en modales:** `backdrop-blur-sm` + fondo semi-transparente.
3. **Botones primarios:** Siempre `bg-gradient-to-r from-primary to-primary-container`.
4. **Sombras:** Solo `shadow-ambient` (30px blur, 5% opacidad). Nunca drop-shadow duro.

---

## 6. Base de Datos (Supabase / PostgreSQL)

### Modelo Entidad-Relación

```
┌─────────────────┐       ┌──────────────────────┐
│   workspaces    │       │   workspace_members   │
│─────────────────│       │──────────────────────│
│ id (uuid, PK)   │◄──────│ workspace_id (FK)     │
│ name            │       │ user_id (FK → auth)   │
│ created_at      │       │ role                  │
└────────┬────────┘       └──────────────────────┘
         │
         │ FK
         ▼
┌──────────────────────────────┐
│         inventario           │
│──────────────────────────────│
│ codigo (varchar, PK)         │
│ workspace_id (uuid, PK, FK)  │ ◄── Clave primaria compuesta
│ nombre (varchar, NOT NULL)   │
│ categoria (varchar)          │
│ costo_unitario (numeric)     │
│ margen_detal (numeric)       │
│ precio_usd (numeric)         │
│ stock (int4)                 │
│ created_at (timestamptz)     │
└──────────────────────────────┘
         │
         │ (referencia lógica via producto_codigo)
         ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│          ventas              │     │       venta_detalles         │
│──────────────────────────────│     │──────────────────────────────│
│ id (uuid, PK, auto)         │◄────│ venta_id (uuid, FK)          │
│ workspace_id (uuid, FK)      │     │ id (uuid, PK, auto)          │
│ cajero_id (uuid, FK → auth)  │     │ workspace_id (uuid, FK)      │
│ cliente_nombre (varchar)     │     │ producto_codigo (varchar)    │
│ subtotal (numeric)           │     │ producto_nombre (varchar)    │
│ impuesto (numeric)           │     │ precio_unitario (numeric)    │
│ total (numeric)              │     │ cantidad (int)               │
│ metodo_pago (varchar)        │     │ subtotal_linea (numeric)     │
│ created_at (timestamptz)     │     │ created_at (timestamptz)     │
└──────────────────────────────┘     └──────────────────────────────┘
```

### Row Level Security (RLS)
Todas las tablas tienen RLS activado. La política base es:
```sql
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid()
))
```
Esto garantiza que un usuario **solo puede leer/escribir datos de su propio workspace**.

---

## 7. Autenticación y Seguridad

### Flujo de Login

```
Usuario abre la app
       │
       ▼
  AuthGuard.tsx ──► ¿Hay sesión activa? (supabase.auth.getSession())
       │                    │
       │ NO                 │ SÍ
       ▼                    ▼
  Redirige a /login    Renderiza la app
       │
       ▼
  LoginPage: email + password
       │
       ▼
  supabase.auth.signInWithPassword()
       │
       │ ✅ Éxito
       ▼
  router.push('/') → Carga el POS
```

### Archivos involucrados:
| Archivo | Responsabilidad |
|---------|----------------|
| `lib/supabase.ts` | Singleton del cliente Supabase |
| `components/AuthGuard.tsx` | Verifica sesión + escucha cambios de auth en tiempo real |
| `components/AppLayout.tsx` | Decide si mostrar el Sidebar (no se muestra en `/login`) |
| `app/login/page.tsx` | Formulario de login con diseño asimétrico |

---

## 8. Módulo: Punto de Venta (POS)

**Ruta:** `/` (página principal)

### Flujo de una Venta

```
1. Cajero ve el ProductGrid con datos de Supabase
2. Hace clic en un producto → se añade al CartPanel
3. Puede ajustar cantidades (+/-) o eliminar items
4. Selecciona método de pago (Efectivo USD, Bs, Pago Móvil, Zelle, Punto)
5. Presiona "Cobrar $XX.XX"
       │
       ▼
   processCheckout() en store.ts
       │
       ├── 1. supabase.auth.getUser() → obtener cajero_id
       ├── 2. INSERT INTO ventas (total, metodo_pago, cajero_id, workspace_id)
       ├── 3. INSERT INTO venta_detalles (por cada item del carrito)
       ├── 4. UPDATE inventario SET stock = stock - cantidad (por cada item)
       └── 5. Limpia carrito + muestra CheckoutSuccessModal
```

### Archivos del módulo:

| Archivo | Función |
|---------|---------|
| `app/page.tsx` | Layout del POS: header con buscador + grid + carrito |
| `components/ProductGrid.tsx` | Renderiza productos desde `store.inventory`, con buscador y chips de categoría |
| `components/CartPanel.tsx` | Panel lateral derecho: items del carrito, +/-, selector de método de pago, botón Cobrar |
| `components/CheckoutSuccessModal.tsx` | Modal post-venta: nº recibo, total, método, fecha. Botones: Nueva Venta / Imprimir |
| `lib/store.ts` | Estado Zustand: `cart[]`, `inventory[]`, `addToCart()`, `removeFromCart()`, `processCheckout()`, `fetchInventory()` |

### Métodos de Pago Soportados:
| ID | Etiqueta |
|----|----------|
| `efectivo_usd` | 💵 Efectivo USD |
| `efectivo_bs` | 🇻🇪 Efectivo Bs |
| `pago_movil` | 📱 Pago Móvil |
| `zelle` | 💳 Zelle |
| `punto` | 💳 Punto de Venta |

---

## 9. Módulo: Inventario

**Ruta:** `/inventory`

### Funcionalidades

| Feature | Descripción |
|---------|-------------|
| **Dashboard de estadísticas** | 4 tarjetas: Total SKUs, Disponible (verde), Stock Bajo (naranja), Valor Total ($) |
| **Filtros de stock** | Botones pill: Todos, Disponible, Stock Bajo (≤3 uds), Agotado (0 uds) |
| **Búsqueda** | Por nombre, código o categoría. En tiempo real |
| **Tabla ordenable** | Columnas: Producto, Código, Categoría, Costo Unit., Margen%, Precio USD, Stock. Ordenable por clic en header |
| **Badges de stock** | 🟢 Verde (>3 uds), 🟠 Naranja "Stock Bajo" (1-3 uds), 🔴 Rojo "Agotado" (0 uds) |
| **Crear producto** | Modal con campos: código/barras, nombre, categoría, stock, costo, margen, precio |
| **Editar producto** | Mismo modal, precargado con datos existentes. Código no editable |
| **Eliminar producto** | Con confirmación `confirm()` antes de borrar |
| **Auto-cálculo de precio** | `precio_usd = costo_unitario × (1 + margen_detal / 100)` |

### Archivos del módulo:

| Archivo | Función |
|---------|---------|
| `app/inventory/page.tsx` | Página completa: header con stats + filtros + tabla |
| `components/inventory/InventoryTable.tsx` | Tabla con sorting, badges, botones de editar/eliminar |
| `components/inventory/ProductFormModal.tsx` | Modal de crear/editar con validación y auto-cálculo |
| `lib/inventoryStore.ts` | Estado Zustand: `products[]`, `fetchProducts()`, `saveProduct()`, `deleteProduct()`, `filteredProducts()`, `stockStats()` |

### Constantes:
- `LOW_STOCK_THRESHOLD = 3` — Productos con stock ≤ 3 se marcan como "Stock Bajo"

---

## 10. Módulos Pendientes (Roadmap)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Clientes / Fiado (CRM)** | ⬜ Pendiente | Gestión de clientes con sistema de crédito (fiado), historial de compras, abonos |
| **Escáner de Facturas** | ⬜ Pendiente | Carga masiva de productos al inventario via escaneo de facturas de proveedores (migración de `ESCANER.1.5_DEF.html`) |
| **Métricas / Dashboard** | ⬜ Pendiente | Gráficos de ventas por día/mes, productos más vendidos, margen promedio |
| **Configuración** | ⬜ Pendiente | Gestión de workspace, usuarios, roles, tasa de cambio |

---

## 11. Navegación (Sidebar)

El Sidebar es un componente colapsable que muestra el logo **Nafiado** (expandido) o **Ni↗** (colapsado). Se expande al hacer hover.

| Ruta | Icono | Nombre | Estado |
|------|-------|--------|--------|
| `/` | Store | Punto de Venta | ✅ Funcional |
| `/inventory` | Database | Inventario | ✅ Funcional |
| `/clients` | Users | Clientes | ⬜ Pendiente |
| `/invoices` | FileText | Facturas | ⬜ Pendiente |
| `/metrics` | BarChart3 | Métricas | ⬜ Pendiente |
| `/settings` | Settings | Configuración | ⬜ Pendiente |

---

## 12. Zustand Stores — Referencia de API

### `store.ts` (POS Store)

```typescript
interface PosStore {
  // Estado
  cart: CartItem[];           // Productos en el carrito actual
  inventory: Product[];       // Catálogo cargado de Supabase
  isLoading: boolean;         // Cargando inventario
  isCheckingOut: boolean;     // Procesando venta
  lastVenta: VentaResult;     // Resultado de la última venta
  showSuccessModal: boolean;  // Controla visibilidad del modal
  workspaceId: string | null; // ID del workspace activo

  // Acciones del carrito
  addToCart(product): void;
  removeFromCart(codigo): void;
  updateQuantity(codigo, qty): void;
  clearCart(): void;
  cartTotal(): number;

  // Datos
  fetchInventory(): Promise<void>;
  fetchWorkspaceId(): Promise<void>;

  // Checkout
  processCheckout(metodoPago, clienteNombre?): Promise<boolean>;
  closeSuccessModal(): void;
}
```

### `inventoryStore.ts` (Inventory Store)

```typescript
interface InventoryStore {
  // Estado
  products: InventoryProduct[];
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  stockFilter: 'all' | 'low' | 'out' | 'healthy';
  editingProduct: InventoryProduct | null;
  isFormOpen: boolean;
  isNewProduct: boolean;

  // UI
  setSearchQuery(q): void;
  setStockFilter(f): void;
  openNewProduct(): void;
  openEditProduct(product): void;
  closeForm(): void;

  // CRUD
  fetchProducts(): Promise<void>;
  saveProduct(product): Promise<boolean>;
  deleteProduct(codigo, workspaceId): Promise<boolean>;

  // Computed
  filteredProducts(): InventoryProduct[];
  stockStats(): { total, healthy, low, out, totalValue };
}
```

---

## 13. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# Build de producción
npm run build

# Lint
npm run lint
```

---

## 14. Archivos Heredados (Legacy)

Estos archivos en la raíz del proyecto son del sistema anterior (Google Sheets) y sirven como referencia:

| Archivo | Descripción |
|---------|-------------|
| `POS2.html` | Frontend monolítico original del POS (Apps Script) |
| `ESCANER.1.5_DEF.html` | Escáner de facturas original |
| `Inventario_H2O_CLEAN.csv` | CSV limpio del inventario (459 productos) |
| `Inventario_H2O_DEFINITIVO - INVENTARIO.csv` | CSV original con todas las columnas |
| `DESIGN.md` | Especificación del Design System "Industrial Precision" |
| `clean_csv.js` | Script para limpiar/normalizar el CSV |

---

## 15. Notas Importantes para el Desarrollador

1. **Todos los componentes con interactividad son `'use client'`** — es obligatorio al usar hooks de React en Next.js App Router.

2. **El `workspace_id` es clave** — Sin él, RLS bloquea todas las operaciones. Se obtiene del primer producto del inventario o de la tabla `workspace_members`.

3. **La clave primaria de `inventario` es COMPUESTA** — `(codigo, workspace_id)`. Esto permite que dos workspaces diferentes tengan el mismo código de producto.

4. **Los precios están en USD** — La columna `precio_usd` es el precio final de venta. El cálculo automático es: `precio = costo_unitario × (1 + margen_detal / 100)`.

5. **El checkout congela precios** — Al registrar una venta en `venta_detalles`, se guarda el `precio_unitario` y `producto_nombre` como snapshot. Si el producto cambia de precio después, las ventas históricas no se ven afectadas.

6. **No hay route middleware** — La protección de rutas se hace client-side vía `AuthGuard.tsx`. Si se necesita SSR protegido, implementar middleware de Next.js en `middleware.ts`.
