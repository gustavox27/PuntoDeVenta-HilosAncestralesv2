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

### Estrategia de caché del Service Worker (`public/sw.js`)

**Corregido, 2026-07-18 (CACHE_NAME `v1` → `v2`).** La versión original usaba cache-first para **todo**, incluido `index.html`, con un `CACHE_NAME` estático que nunca cambiaba entre builds. Como `index.html` es la URL que decide qué bundle JS cargar (los bundles de Vite sí tienen hash de contenido en el nombre), un dispositivo que ya había cargado la app seguía sirviendo un `index.html` viejo — apuntando a un bundle viejo — indefinidamente después de cada deploy nuevo, sin ninguna forma de que el usuario se enterara. Esto obligó a hacer Unregister + Clear site data manualmente durante los fixes anteriores (Pasos 1-2 y el fix de cálculo de `getMovementHistory`).

Estrategia actual:
- **Navegación (`event.request.mode === 'navigate'`, o sea cargar `index.html`)**: *network-first* con timeout de 4s. Si hay red, siempre trae la versión desplegada más reciente. Si no hay red o no responde a tiempo, cae a la copia cacheada — el soporte offline para trabajadores en campo sin señal se mantiene igual que antes.
- **Todo lo demás (assets con hash de Vite, íconos, etc.)**: cache-first, sin cambios — es seguro porque la URL de un asset cambia si su contenido cambia; nunca puede servir una versión vieja bajo una URL nueva.
- `skipWaiting()`/`clients.claim()` se mantienen (ya estaban) — el SW nuevo toma control sin esperar a que se cierren pestañas.

**A partir de este deploy, las actualizaciones llegan solas, sin intervención del usuario**: el navegador revisa si `/sw.js` cambió cada vez que se abre la app (mecanismo del propio navegador, no pasa por el `fetch` handler del SW activo), instala el SW nuevo en segundo plano si detecta diferencias, y lo activa de inmediato gracias a `skipWaiting`/`clients.claim`. Esto aplica también a la PWA ya instalada en Android — no hace falta desinstalar/reinstalar, basta con abrir la app una vez con conexión.

**No fue necesario tocar** `manifest.json` ni el script de registro en `index.html` — la instalabilidad de la PWA (ícono, `display: standalone`, banner "Agregar a la pantalla de inicio") no depende de la estrategia de fetch del SW, solo de que exista un manifest válido y un SW registrado con un `fetch` handler, ambos intactos.

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

**Estado (Fix Estructural 1) — verificado en local, 2026-07-18:**
- **Paso 2** (`check_anticipo_usage` detecta aplicaciones vía evento estructurado, no solo `venta_id`): migración `20260717190000_...sql` aplicada en Supabase manualmente vía SQL Editor. Verificado funcionando — vive enteramente en BD, no depende de deploy de frontend.
- **Paso 1** (botón "Pagar" en `MovementHistory.tsx` usa `aplicar_anticipos_disponibles_a_deudas` en vez del id ficticio `'sistema'`): migración `20260717193000_...sql` aplicada en Supabase. Verificado en local que genera el evento `'Aplicación Automática de Anticipo'` con `entidad_id` = UUID real del anticipo (no `'sistema'`), y que el borrado de ese anticipo queda bloqueado con el mensaje de error correcto.
- **Pendiente**: `git push` de los commits `de8b556` (Paso 2) y `158c03d` (Paso 1) — quedaron solo en local. Se hará al final, cuando el resto de tickets relacionados esté resuelto. Hasta entonces, cualquier entorno desplegado desde `origin/main` sigue corriendo el código viejo del botón "Pagar" (síntoma observado: eventos con `entidad_id='sistema'` seguían apareciendo en pruebas posteriores al fix local).
- **Hallazgo relacionado (sin corregir, ticket futuro)**: el service worker (`public/sw.js`) usa `CACHE_NAME` estático (`'hilos-ancestrales-v1'`) con estrategia cache-first sobre `index.html`, sin invalidación ligada al build. Esto significa que, incluso después de desplegar un fix de frontend, un navegador/dispositivo que ya cargó la app antes puede seguir sirviendo `index.html`/bundle viejo indefinidamente. Para que un fix de frontend se refleje hay que forzar DevTools → Application → Service Workers → Unregister + Clear site data (o desinstalar/reinstalar la PWA en Android) — un simple hard refresh no basta.

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

**Regla crítica de esta función**: nunca escribe `anticipos.venta_id` ni el monto completo de un anticipo en `ventas.anticipo_total` de una sola venta. `anticipo_total` se incrementa, por cada venta, solo en el monto realmente aplicado a ESA venta (`LEAST(saldo_pendiente_de_la_venta, remanente_del_anticipo)`). Esto es deliberado: existía un bug distinto en `Ventas.tsx:566-589` (flujo de "usar anticipo disponible" al crear una venta NUEVA) que sí hacía esto mal — vinculaba el anticipo COMPLETO (`venta_id`) a una sola venta sin importar si esa venta solo necesitaba una fracción, inflando el `anticipo_total` de esa venta al monto total del anticipo. Ese bug se corrigió por separado — ver "Fix Flujo D" más abajo. No usar el patrón de `venta_id`-directo para "aplicar crédito existente" en ningún código nuevo de anticipos.

**Call-site 1, sin tocar**: `Ventas.tsx:handleAplicarDeudas` (se dispara tras registrar un anticipo nuevo, vía `DebtDetectionModal`) sigue usando `aplicarAnticipoADeudas` → `aplicarAnticipoADeudasFallback`, sin cambios.

### Fix de cálculo — `getMovementHistory` (Saldo Disponible / Deuda Pendiente)

**Implementado y verificado, 2026-07-18.** `getMovementHistory` (`supabaseService.ts`) calculaba mal los dos números que muestra el "Historial de Movimientos":
- El egreso de cada compra se registraba como `total - saldo_pendiente` (lo pagado), no el total real — subestimaba sistemáticamente cuánto había comprado el cliente.
- `saldoDisponible` recortaba con `Math.max(0, ingreso - egreso)`, escondiendo el déficit real cuando el cliente debía más de lo que tenía en anticipos.
- `deudaPendiente` se calculaba por una ruta aparte (`Σ saldo_pendiente` de ventas con `completada=false`), sin reconciliarse con ingresos/egresos.

Fórmula corregida:
```
totalIngreso = Σ anticipos.monto                          (sin cambio, nunca fue el problema)
totalEgreso  = Σ (venta.total - venta.descuento_total)     (total real de la compra, no lo pagado)
neto = totalIngreso - totalEgreso
saldoDisponible = Math.max(0, neto)
deudaPendiente  = Math.max(0, -neto)
```
Un solo neto, partido en dos números mutuamente excluyentes (nunca ambos > 0). Esto también resuelve, como efecto colateral y sin tocar nada más, el caso de un anticipo consumido solo parcialmente que antes seguía contando su monto completo como disponible — ya no hace falta rastrear cuánto se consumió de cada anticipo individual, porque `totalEgreso` ya refleja el total real de lo comprado.

Se eliminó la rama que generaba el movimiento sintético `pago_${venta.id}` ("Pago Completado") — era un parche para compensar el egreso subestimado; ya no es necesario.

Criterio de aceptación validado: cliente MICHAEL APAZA CAJMA (`b8b90e89-0823-4c60-8c4a-73e3cc274051`) — `totalIngreso=77,185.77`, `totalEgreso=81,000.00` → `saldoDisponible=0.00`, `deudaPendiente=3,814.23`.

**Limitaciones conocidas (no resueltas por este fix):**
1. `obtenerDeudasCliente`/`calcularTotalDeuda` (usadas por el flujo "Pagar" para seleccionar QUÉ ventas específicas pagar) siguen sumando `ventas.saldo_pendiente` fila por fila — una fuente de verdad distinta a la resta agregada de `getMovementHistory`. Para un cliente con `saldo_pendiente` corrompido por el bug de `Ventas.tsx:566-589` (ver arriba), el número agregado (`deudaPendiente`) y la lista de ventas del botón "Pagar" pueden no cuadrar entre sí hasta que ese bug de datos se corrija.
2. Las anotaciones por venta dentro de `movements` (el texto "Saldo pendiente S/ X" y los campos `saldo_pendiente`/`estado_pago` de cada línea de compra) siguen leyendo `venta.saldo_pendiente` directamente — si una venta puntual tiene ese campo corrompido por el mismo bug, esa línea individual puede seguir mostrando un monto incorrecto aunque las tarjetas agregadas (Saldo Disponible / Deuda Pendiente) ya sean correctas.

### Fix Flujo D — `Ventas.tsx` ya no vincula anticipos completos a ventas nuevas

**Implementado, 2026-07-18.** El bug descrito arriba (`Ventas.tsx:566-589`, "usar anticipo disponible" al crear una venta nueva) está corregido: ese bloque ya no llama a `updateAnticipo(anticipo.id, { venta_id: ventaCreada.id })`. Ahora llama a `SupabaseService.marcarAnticiposConsumidos(clienteId, montoAAplicar, ventaCreada.id, usuario)`, que ejecuta el RPC `marcar_anticipos_consumidos` (`supabase/migrations/20260718150000_...sql`).

Esa función **reutiliza el patrón de Paso 1** (loop FIFO por `fecha_anticipo` sobre `anticipos WHERE venta_id IS NULL`, emite el evento `'Aplicación Automática de Anticipo'` con `entidad_id` = ID real del anticipo) pero, a propósito, **no toca la tabla `ventas` en absoluto** — a diferencia de `aplicar_anticipos_disponibles_a_deudas`. Razón: en este flujo el cálculo de `anticipo_total`/`saldo_pendiente` de `Ventas.tsx:487-515` ya es correcto y se usa para generar el PDF de la venta (`ExportUtils.generateSalePDF`) capturando `ventaCreada` del `INSERT` — si esta función también recalculara `ventas`, correría el riesgo de que el PDF quedara desactualizado respecto de lo que se termina guardando en BD. Su única responsabilidad es dejar el rastro protector sobre los anticipos reales consumidos.

**No se tocó**: el cálculo de `Ventas.tsx:487-515` (ya era correcto), el trigger `actualizar_venta_desde_anticipos` (sigue siendo necesario para los casos 1-a-1 legítimos: efectivo al contado, anticipo nuevo del formulario, y `AnticipoManager.tsx`), ni el flujo C (`AnticipoManager.tsx`, pago directo sobre una venta específica — sigue vinculando `venta_id` directamente, que es correcto ahí).

**PENDIENTE — ticket de remediación de datos históricos (no resuelto por este fix, deliberadamente fuera de alcance):** hay 23 ventas de 7 clientes ya corrompidas por este bug antes de corregirse, con S/ 62,842.00 de exceso acumulado (`anticipo_total` inflado más allá de lo que cada venta realmente necesitaba). Confirmado con evidencia de código que **no afecta** el resumen agregado de `getMovementHistory` ni `obtenerDeudasCliente`/`calcularTotalDeuda` (esas 23 ventas quedaron con `saldo_pendiente=0, completada=true`, correctamente excluidas de la lista de deudas). **Sí afecta** contenido visible en: exportación a Excel del historial (`Historial.tsx:133`), boletas regeneradas (`Historial.tsx:165-174`, `handleGenerateBoleta`), y el modal "Detalle de Compra" (`HistorialComprasModal.tsx:563-567`) — todos muestran el `anticipo_total` inflado de esas ventas específicas. Uno de los 7 clientes es MICHAEL APAZA CAJMA (S/ 24,000 de exceso) — no afecta la deuda de 3,814.23 ya validada para él, es un problema de datos independiente en otras compras suyas. Consulta de detección disponible para cuando se aborde ese ticket.

**PENDIENTE — `marcar_anticipos_consumidos` no revierte eventos ya insertados si el crédito resulta insuficiente.** La función devuelve `success:false` cuando `v_total_marcado < p_monto`, pero un `RETURN` en plpgsql no revierte los `INSERT INTO eventos` ya ejecutados dentro del loop — quedarían eventos protectores sobre anticipos que no llegaron a cubrir el monto solicitado. No es bloqueante hoy: el frontend limita el monto a `saldoDisponible` antes de llamar, así que el caso no debería darse en operación normal. Corrección futura: usar `RAISE EXCEPTION` en vez de `RETURN` para ese caso, de forma que Postgres revierta la transacción completa.

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
