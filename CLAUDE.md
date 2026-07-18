# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Hilos Ancestrales** — A Point of Sale and inventory management system for a textile/thread production business (Hilandería). Built with React 18 + TypeScript + Vite + Supabase (PostgreSQL).

## Commands

```bash
npm run dev       # Start development server
npm run build     # TypeScript compile + production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test runner is configured; manual testing is done via the running app.

## Architecture

The app is a single-page React application with a feature-per-page structure. State is managed almost entirely at the page level; the only global contexts are `UserContext` (auth) and `ThemeContext` (dark/light mode).

```
src/
  pages/          # One file per major feature (Ventas, Inventario, Usuarios, etc.)
  components/     # UI components, organized by feature subdirectory
  contexts/       # UserContext, ThemeContext
  hooks/          # useAuditLog (comprehensive change tracking)
  services/       # supabaseService.ts (main data layer), plus caching/export/audit services
  types/          # All TypeScript interfaces in types.ts
  utils/          # dateUtils, exportUtils, filterStorageUtils, diffUtils
```

### Data layer

All database operations go through `src/services/supabaseService.ts` (~1000+ lines). It wraps the Supabase client and exports typed functions for every entity. Don't call the Supabase client directly from pages or components — use this service.

### Core domain types (`src/types/types.ts`)

- `Usuario` — users (roles: `Administrador | Vendedor | Almacenero | Cliente`)
- `Producto` — products with 4 lifecycle states: `Por Hilandar | Por Devanar | Conos Devanados | Conos Veteados`
- `Venta` + `VentaDetalle` — sales header and line items
- `Anticipo` — advance payments linked to a client and optionally a sale
- `NotaPedido` — purchase orders
- `Programacion` — production scheduling
- `Evento` — audit log entries (severity: `info | warning | error | critical`)

### Audit system

Every significant write operation must be logged via the `useAuditLog` hook. The hook records the module, action type, entity affected, previous/new values, and severity. `diffUtils.ts` generates the before/after diff shown in the audit UI. Retention and cleanup are handled by `auditRetentionService.ts` / `auditCleanupService.ts`.

### Date handling

All dates must go through `src/utils/dateUtils.ts`. The business timezone is **America/Lima (UTC-5)**. Bypass this utility and dates will shift by timezone offset on display.

### Financial flows

- **Anticipos** (advance payments): clients pay in advance; the amount is credited against future sales. Logic for applying anticipos to a sale lives in `Ventas.tsx` and `supabaseService.ts`.
- **Debt detection**: at checkout, the system checks for unpaid balances and prompts to apply or carry forward. See `DebtDetectionModal` and `DebtPaymentModal`.
- **Saldo pendiente**: `Venta.estado_pago` is `completo` or `pendiente`; partial payments leave a `saldo_pendiente`.

### Export

PDF export uses jsPDF + autotable; Excel uses XLSX. Both are wrapped in `src/services/dataExportService.ts` and `src/utils/exportUtils.ts`.

## PWA — Instalación en Android

La app está configurada como PWA. Para instalarla en Android:
1. Abrir Chrome y navegar a la URL de la app.
2. Chrome mostrará automáticamente el banner "Agregar a la pantalla de inicio" (o usar el menú ⋮ → "Instalar app").
3. Confirmar la instalación; el ícono de "H" azul aparecerá en el launcher.

Notas técnicas:
- Los archivos PWA están en `project/public/`: `manifest.json`, `sw.js`, `icon-192.svg`, `icon-512.svg`.
- Para íconos PNG de mayor compatibilidad en Android < Chrome 93, reemplazar los `.svg` por `.png` del mismo nombre y actualizar el `manifest.json` (cambia `type` a `"image/png"`).
- Para verificar: DevTools → Application → Manifest / Service Workers.

## SQL pendiente (TICKET-INV-01 — ejecutar en Supabase antes de usar Tintorería)

```sql
ALTER TABLE productos ADD COLUMN cantidad_enviada INTEGER NOT NULL DEFAULT 0;
```

## SQL pendiente (TICKET-05 — ejecutar en Supabase antes de usar flujo veteado)

```sql
ALTER TABLE programacion ADD COLUMN es_veteado BOOLEAN NOT NULL DEFAULT FALSE;
```

## Flujos críticos y dependencias entre módulos

### Flujo Procesos → Avance (NotasPedido)

```
Procesos: registrarAvanceTrabajador()
  → tabla avance: cantidad_disponible += N (no toca productos)

AvanceModal (NotasPedido):
  → getAvanceDisponible()       — FROM avance WHERE cantidad_disponible > 0
  → getColoresConClientesPendientes() — FROM notas_pedido_detalle WHERE estado='Enviado'
  Solo muestra colores con AMBAS condiciones. Si una query falla, el modal queda vacío.
```

**Regla crítica**: `avance` y `notas_pedido_detalle` son las dos tablas que alimentan el AvanceModal. Cualquier cambio en el manejo de errores de `supabaseService.ts` que provoque logout inesperado rompería este flujo visualmente.

### Flujo Avance → Inventario (Tintorería)

```
asignarAvanceACliente()
  → avance: cantidad_disponible -= N
  → productos: INSERT estado='Por Devanar', cantidad = N*2, cantidad_enviada = 0
  → notas_pedido_detalle: estado = 'Asignado' (si completo) o mantiene 'Enviado'
  → avance_asignaciones: registro histórico
```

**Regla crítica**: `cantidad` en `productos` es el valor histórico de madejas (nunca se modifica después de la inserción). `cantidad_enviada` es el acumulador de envíos a Hilandería. El campo `Estado de Envío` en Inventario Tintorería se calcula en frontend: `cantidad_enviada === 0` → "Por enviar"; `cantidad_enviada < cantidad` → "Faltan enviar N"; `cantidad_enviada >= cantidad` → "Enviado".

### Flujo Inventario Tintorería → Hilandería

```
handleHilanderiaSubmit() en Inventario.tsx
  → SOLO escribe: productos.cantidad_enviada += cantidadProcesada
  → NUNCA modifica: productos.cantidad (dato histórico)
  → loadPorHilandarProducts: filtra p.cantidad > p.cantidad_enviada
```

**Regla crítica**: Antes de modificar cualquier campo de `productos`, verificar qué módulos lo leen:
- `loadPorHilandarProducts` (Inventario): usa `cantidad` y `cantidad_enviada`
- `asignarAvanceACliente` (AvanceModal): escribe `cantidad` al crear el producto — no tocar después
- Ventas: usa `stock`, `precio_base`, `precio_uni` — independiente de `cantidad`/`cantidad_enviada`

### Flujo Anticipos → Deudas → check_anticipo_usage (protección contra descuadres)

```
aplicarAnticipoADeudasFallback() (supabaseService.ts)
  → ventas: UPDATE saldo_pendiente, anticipo_total, estado_pago, completada
  → eventos: INSERT accion='Aplicar Anticipo a Deuda' (entidad_tipo='venta', monto solo en texto)
  → eventos: INSERT accion='Aplicación Automática de Anticipo' (entidad_tipo='anticipo', entidad_id=<id real>)
  → NUNCA escribe anticipos.venta_id
```

**Regla crítica**: un anticipo aplicado a una deuda pasada vía este flujo **no queda marcado como usado en la tabla `anticipos`** (su `venta_id` permanece `NULL`). La única forma confiable de saber si un anticipo ya se usó para pagar una deuda es el RPC `check_anticipo_usage` (`supabase/migrations/20260717190000_...sql`), que revisa dos condiciones independientes:
1. `anticipos.venta_id IS NOT NULL` (anticipo vinculado directamente a una venta), o
2. Existe un evento `eventos(entidad_tipo='anticipo', entidad_id=<id>, accion='Aplicación Automática de Anticipo')`.

`updateAnticipo` y `deleteAnticipo` (`supabaseService.ts`) llaman a `checkAnticipoUsage`, que envuelve este RPC, **antes** de editar/eliminar un anticipo. Si cualquiera de las dos condiciones es verdadera, la operación se bloquea.

**No modificar `check_anticipo_usage` para volver a depender solo de `venta_id`** — eso reabre el bug que causó un descuadre financiero real (cliente MICHAEL APAZA CAJMA, julio 2026): un anticipo se aplicó a dos deudas y luego se eliminó sin advertencia porque `venta_id` nunca se seteó en ese flujo, dejando las ventas con `saldo_pendiente` reducido pero sin el anticipo que lo financió.

**Actualización (Paso 1, implementado):** `MovementHistory.tsx:handlePayDebt` ya no aplica un saldo agregado bajo id `'sistema'` — llama a `SupabaseService.aplicarAnticiposDisponiblesADeudas`, que ejecuta el RPC `aplicar_anticipos_disponibles_a_deudas` (`supabase/migrations/20260717193000_...sql`). Esa función consume anticipos reales del cliente (`venta_id IS NULL`) en orden FIFO por `fecha_anticipo`, dentro de una única transacción de Postgres, y por cada anticipo realmente consumido genera el evento `'Aplicación Automática de Anticipo'` con su `entidad_id` real — quedando protegido por `check_anticipo_usage` igual que el call-site 1.

**Regla crítica de esta función**: nunca escribe `anticipos.venta_id` ni el monto completo de un anticipo en `ventas.anticipo_total` de una sola venta. `anticipo_total` se incrementa, por cada venta, solo en el monto realmente aplicado a ESA venta (`LEAST(saldo_pendiente_de_la_venta, remanente_del_anticipo)`). Esto es deliberado: existe un bug distinto y ya identificado en `Ventas.tsx:566-589` (flujo de "usar anticipo disponible" al crear una venta NUEVA) que sí hace esto mal — vincula el anticipo COMPLETO (`venta_id`) a una sola venta sin importar si esa venta solo necesitaba una fracción, inflando el `anticipo_total` de esa venta al monto total del anticipo. Ese bug no se corrigió en este ticket (alcance distinto); no usar ese patrón como referencia al tocar código de anticipos.

**Call-site 1, sin tocar**: `Ventas.tsx:handleAplicarDeudas` (se dispara tras registrar un anticipo nuevo, vía `DebtDetectionModal`) sigue usando `aplicarAnticipoADeudas` → `aplicarAnticipoADeudasFallback`, sin cambios.

### Auth — custom vs Supabase Auth

La app usa **auth propio** (tabla `usuarios` + `localStorage`), NO Supabase Auth. El cliente Supabase se usa exclusivamente para queries de datos con la clave anon.

**Regla crítica**: No agregar lógica que reaccione a eventos de `supabase.auth.onAuthStateChange` (`SIGNED_OUT`, `TOKEN_REFRESHED`, etc.) — estos eventos de Supabase Auth no tienen relación con la sesión custom y dispararlos causaría logouts inesperados. El timeout de inactividad (50 min) se maneja exclusivamente mediante `useSessionTimeout` con timers.

## Environment

Supabase credentials live in `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These are required at build time (Vite exposes them as `import.meta.env.*`).
