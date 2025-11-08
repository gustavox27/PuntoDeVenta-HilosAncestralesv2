# Arquitectura de la Solución de Fechas

## Visión General

La solución implementa un sistema robusto para manejar correctamente las fechas en diferentes módulos del sistema, preservando exactamente la fecha seleccionada por el usuario sin alteraciones por zona horaria.

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO                               │
│  Selecciona fecha: 08-11-2024 (input type="date")        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   dateUtils.convertDate    │
        │   WithCurrentTime()         │
        │                            │
        │ Convierte a ISO string     │
        │ Preserva exactamente la    │
        │ fecha seleccionada         │
        └────────────────┬───────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │  2024-11-08T14:35:22Z  │
            │  (ISO 8601 Format)      │
            └────────────┬────────────┘
                         │
                         ▼
      ┌──────────────────────────────────┐
      │    Supabase PostgreSQL DB        │
      │                                   │
      │ fecha_registro timestamptz        │
      │ 2024-11-08T14:35:22.000Z         │
      │ Stored Correctly! ✓              │
      └──────────────────────────────────┘
```

---

## 1. Capa de Utilidades (dateUtils.ts)

### Ubicación
```
src/utils/dateUtils.ts
```

### Funciones Exportadas

#### 1.1 convertDateWithCurrentTime()
```typescript
function convertDateWithCurrentTime(selectedDate: string): string
```

**Parámetros:**
- `selectedDate: string` - Fecha en formato YYYY-MM-DD

**Lógica:**
```
Si selectedDate === HOY:
  return new Date().toISOString()  // Incluye hora actual
Else:
  return parseDate(selectedDate).toISOString()  // Preserva fecha exacta
```

**Ejemplo:**
```typescript
// Si hoy es 2024-11-08 a las 14:35:22
convertDateWithCurrentTime("2024-11-08")
// Retorna: "2024-11-08T14:35:22.000Z"

// Si selecciono ayer
convertDateWithCurrentTime("2024-11-07")
// Retorna: "2024-11-07T14:35:22.000Z"
// (Incluye hora actual, pero preserva la fecha exacta)
```

#### 1.2 getTodayDateString()
```typescript
function getTodayDateString(): string
```

**Propósito:**
- Obtener la fecha actual en formato YYYY-MM-DD
- Garantizar consistencia en todo el sistema

**Ejemplo:**
```typescript
// Hoy es 2024-11-08
getTodayDateString()
// Retorna: "2024-11-08"
```

#### 1.3 Funciones Auxiliares
```typescript
convertDateToISO()        // Conversión flexible (futura extensión)
formatDateWithTime()      // Formatea a "YYYY-MM-DD HH:mm:ss"
formatDate()             // Formatea a "YYYY-MM-DD"
```

---

## 2. Integración en Tintorería (Inventario.tsx)

### Flujo de Datos

```
Usuario selecciona fecha
         │
         ▼
─────────────────────────────────────
handleTintoreriaSubmit()
         │
         ├─ Lee tintoreriaData.fecha_registro
         │  (Ej: "2024-11-08")
         │
         ├─ Llama convertDateWithCurrentTime()
         │
         ├─ Recibe ISO string
         │  (Ej: "2024-11-08T14:35:22.000Z")
         │
         ├─ Asigna a productoData:
         │  ├─ fecha_ingreso: fechaISO
         │  └─ fecha_registro: fechaISO
         │
         ▼
Envía a SupabaseService.createProducto()
         │
         ▼
Base de Datos PostgreSQL
```

### Código Implementado

```typescript
// Línea 15: Import
import { convertDateWithCurrentTime, getTodayDateString } from '../utils/dateUtils';

// Línea 54: Inicialización
fecha_registro: getTodayDateString()

// Línea 175-186: Conversión en handleTintoreriaSubmit
const fechaISO = convertDateWithCurrentTime(tintoreriaData.fecha_registro);
const productoData = {
  nombre: tintoreriaData.nombre,
  color: tintoreriaData.color,
  descripcion: tintoreriaData.descripcion,
  estado: 'Por Devanar' as const,
  precio_base: 0,
  precio_uni: 0,
  stock: 0,
  cantidad: parseInt(tintoreriaData.cantidad),
  fecha_ingreso: fechaISO,
  fecha_registro: fechaISO
};
```

### Cambios Realizados
- ❌ Antes: `new Date(tintoreriaData.fecha_registro).toISOString()` (INCORRECTO)
- ✅ Después: `convertDateWithCurrentTime(tintoreriaData.fecha_registro)` (CORRECTO)

---

## 3. Integración en Ventas (Ventas.tsx)

### Flujo de Datos

```
Usuario selecciona fecha en calendario
         │
         ▼
─────────────────────────────────────
procesarVenta()
         │
         ├─ Lee fechaVenta (Ej: "2024-11-08")
         │
         ├─ Llama convertDateWithCurrentTime(fechaVenta)
         │
         ├─ Recibe ISO string
         │  (Ej: "2024-11-08T14:35:22.000Z")
         │
         ├─ Crea objeto venta:
         │  └─ fecha_venta: fechaVentaISO
         │
         ├─ Envía a SupabaseService.createVenta()
         │
         ▼
Base de Datos
         │
         ▼
Genera Boleta PDF
         │
Muestra en Historial
```

### Código Implementado

```typescript
// Línea 14: Import
import { convertDateWithCurrentTime, getTodayDateString } from '../utils/dateUtils';

// Línea 239: Inicialización de fechaVenta
setFechaVenta(getTodayDateString());

// Línea 383: Conversión en procesarVenta
const fechaVentaISO = fechaVenta ? convertDateWithCurrentTime(fechaVenta) : new Date().toISOString();

// Línea 387: Asignación a objeto venta
const venta = {
  id_usuario: usuarioSeleccionado.id,
  fecha_venta: fechaVentaISO,  // ← AQUÍ usa la fecha convertida
  total,
  vendedor: currentUser?.nombre || 'Sistema',
  // ... otros campos
};
```

### Cambios Realizados
- ❌ Antes: `new Date(fechaVenta).toISOString()` (INCORRECTO)
- ✅ Después: `convertDateWithCurrentTime(fechaVenta)` (CORRECTO)

---

## 4. Modelo de Datos

### Tablas de Base de Datos

#### Tabla: productos
```sql
CREATE TABLE productos (
  id uuid PRIMARY KEY,
  nombre text,
  color text,
  estado text CHECK (estado IN ('Por Hilandar', 'Por Devanar', 'Conos Devanados', 'Conos Veteados')),
  precio_base decimal(10,2),
  precio_uni decimal(10,2),
  stock integer,
  cantidad integer,
  fecha_ingreso timestamptz DEFAULT now(),    -- ← Fecha ISO
  fecha_registro timestamptz DEFAULT now(),   -- ← Fecha ISO
  created_at timestamptz DEFAULT now()
);
```

#### Tabla: ventas
```sql
CREATE TABLE ventas (
  id uuid PRIMARY KEY,
  id_usuario uuid REFERENCES usuarios(id),
  fecha_venta timestamptz NOT NULL DEFAULT now(),  -- ← Fecha ISO
  total decimal(10,2),
  vendedor text,
  numero_guia text,
  anticipo_total decimal(10,2),
  saldo_pendiente decimal(10,2),
  descuento_total decimal(10,2),
  estado_pago text CHECK (estado_pago IN ('completo', 'pendiente')),
  completada boolean,
  created_at timestamptz DEFAULT now()
);
```

### Tipos de Datos
- **Type**: `timestamptz` (timestamp with timezone)
- **Zona Horaria**: UTC (Supabase almacena siempre en UTC)
- **Formato Almacenado**: ISO 8601 (Ej: 2024-11-08T14:35:22.000Z)
- **Recuperación**: PostgreSQL convierte automáticamente a zona local

---

## 5. Flujo Completo de Conversión de Fechas

### Caso: Usuario en Lima (UTC-5) registra producto AYER

```
┌──────────────────────────────────────────────────────┐
│ PASO 1: Usuario en Lima selecciona fecha             │
├──────────────────────────────────────────────────────┤
│ Input HTML: <input type="date" value="2024-11-07">   │
│ Lo que se envía: String "2024-11-07"                 │
└─────────────────┬──────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────┐
│ PASO 2: JavaScript recibe la fecha                │
├────────────────────────────────────────────────────┤
│ String: "2024-11-07"                               │
│ selectedDate: "2024-11-07"                         │
└─────────────────┬────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────┐
│ PASO 3: convertDateWithCurrentTime() procesa     │
├──────────────────────────────────────────────────┤
│ 1. Compara con hoy                               │
│    - today = "2024-11-08"                        │
│    - selectedDate = "2024-11-07"                 │
│    - ≠ NO es hoy                                 │
│                                                   │
│ 2. Parsea: [2024, 11, 07]                        │
│                                                   │
│ 3. Crea Date:                                    │
│    new Date(2024, 10, 7, 0, 0, 0, 0)            │
│    → 2024-11-07T00:00:00 en hora local (UTC-5)  │
│                                                   │
│ 4. Construye ISO:                                │
│    "2024-11-07T14:35:22.000Z" (hora actual)     │
│                                                   │
│ NOTA: La FECHA (07) se preserva exacta ✓         │
│       La HORA es la hora actual del sistema      │
└─────────────────┬────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────┐
│ PASO 4: Se envía a Supabase                      │
├──────────────────────────────────────────────────┤
│ {                                                │
│   fecha_ingreso: "2024-11-07T14:35:22.000Z",   │
│   fecha_registro: "2024-11-07T14:35:22.000Z"   │
│ }                                                │
└─────────────────┬────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────┐
│ PASO 5: PostgreSQL almacena en UTC               │
├──────────────────────────────────────────────────┤
│ timestamp: 2024-11-07 14:35:22 UTC              │
│ En Lima (UTC-5): 2024-11-07 09:35:22 Lima        │
│ Formateado: 2024-11-07T14:35:22.000Z             │
└─────────────────┬────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────┐
│ PASO 6: Se recupera de la BD                     │
├──────────────────────────────────────────────────┤
│ Supabase retorna: 2024-11-07T14:35:22.000Z      │
│ JavaScript muestra: 07-11-2024                   │
│ ✓ FECHA CORRECTA - NO CAMBIÓ DE DÍA             │
└──────────────────────────────────────────────────┘
```

---

## 6. Comparación: Antes vs Después

### ANTES (INCORRECTO)
```typescript
// En Inventario.tsx
fecha_registro: new Date(tintoreriaData.fecha_registro).toISOString()

// Problema:
// Si selectedDate = "2024-11-07" (ayer)
// new Date("2024-11-07") interpreta en zona local (UTC-5)
// → Crea: 2024-11-06T19:00:00.000Z (¡Día anterior!)
```

### DESPUÉS (CORRECTO)
```typescript
// En Inventario.tsx
const fechaISO = convertDateWithCurrentTime(tintoreriaData.fecha_registro);
fecha_registro: fechaISO

// Solución:
// Si selectedDate = "2024-11-07" (ayer)
// convertDateWithCurrentTime("2024-11-07")
// → Retorna: 2024-11-07T14:35:22.000Z (¡Exacto!)
```

---

## 7. Ventajas de la Arquitectura

### ✓ Reutilización de Código
- Una sola función `convertDateWithCurrentTime()` usada en 2 módulos
- Fácil mantener si hay cambios futuros

### ✓ Consistencia
- Todos los módulos usan la misma lógica
- No hay variaciones entre Tintorería y Ventas

### ✓ Mantenibilidad
- Código centralizado en `dateUtils.ts`
- Si necesitas cambiar la lógica, cambias 1 archivo

### ✓ Testabilidad
- Las funciones son puras (mismo input = mismo output)
- Fácil de testear

### ✓ Extensibilidad
- `convertDateToISO()` permite futuras variaciones
- `formatDateWithTime()` y `formatDate()` listos para usar

---

## 8. Zona Horaria: America/Lima (UTC-5)

### Configuración
```typescript
// El sistema asume siempre UTC-5
// Sin necesidad de variables de configuración

// Ejemplo:
// Hora local en Lima: 14:35:22
// Hora UTC: 19:35:22
// Formato ISO guardado: 2024-11-08T14:35:22.000Z
```

### Conversión Manual (si es necesario)
```typescript
// De UTC a Lima (UTC-5):
const limaTime = new Date(utcTime.getTime() - 5 * 60 * 60 * 1000);

// De Lima a UTC:
const utcTime = new Date(limaTime.getTime() + 5 * 60 * 60 * 1000);
```

---

## 9. Validación y Testing

### Test Unitario (Ejemplo)
```typescript
describe('dateUtils', () => {
  it('should preserve exact date for past dates', () => {
    const result = convertDateWithCurrentTime('2024-11-07');
    expect(result).toContain('2024-11-07');
    expect(result).not.toContain('2024-11-06');
  });

  it('should include current time for today', () => {
    const today = getTodayDateString();
    const result = convertDateWithCurrentTime(today);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
```

---

## 10. Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                  │
│                                                          │
│  Inventario.tsx          Ventas.tsx       Historial.tsx │
│     (Tintorería)         (Ventas)         (Visualización)│
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE UTILIDADES                    │
│                                                          │
│  dateUtils.ts (Funciones de conversión de fechas)      │
│  - convertDateWithCurrentTime()                         │
│  - getTodayDateString()                                 │
│  - formatDateWithTime()                                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE SERVICIOS                     │
│                                                          │
│  SupabaseService.ts                                    │
│  - createProducto()                                    │
│  - createVenta()                                       │
│  - updateProducto()                                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE DATOS                         │
│                                                          │
│  Supabase PostgreSQL Database                          │
│  - productos (fecha_ingreso, fecha_registro)          │
│  - ventas (fecha_venta)                                │
│  - eventos (fecha)                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Conclusión

La arquitectura implementada:
- ✓ Preserva exactamente las fechas seleccionadas por el usuario
- ✓ Incluye la hora actual del sistema cuando es necesario
- ✓ Maneja correctamente la zona horaria America/Lima (UTC-5)
- ✓ Es reutilizable y fácil de mantener
- ✓ Está centralizada en una única utilidad (dateUtils.ts)
- ✓ No requiere cambios en la base de datos
- ✓ Es compatible con la infraestructura existente de Supabase
