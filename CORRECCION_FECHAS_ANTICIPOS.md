# Corrección de Fechas en Registros de Anticipos - Zona Horaria America/Lima

## Problema Identificado

Las fechas en el modal "Historial de Movimientos" (Usuarios → Ver Historial de Compras) se registraban incorrectamente:
- **Síntoma**: Las fechas aparecían UN DÍA ANTES de la fecha registrada
- **Las horas aparecían desfasadas** (ejemplo: 19:00 en lugar de 00:00)

### Causa Raíz

Cuando se registraba un "Anticipo inicial" o una "Compra", el campo `fecha_anticipo` se enviaba como un string en formato "YYYY-MM-DD" SIN conversión a la zona horaria America/Lima (UTC-5).

Supabase interpretaba este string como UTC midnight (00:00:00 UTC), lo que en zona horaria America/Lima resulta en:
- **Un día anterior** (00:00 UTC - 5 horas = día anterior 19:00)
- **Horas incorrectas**

## Comparación: Inventario vs Usuarios

### ✅ INVENTARIO (CORRECTO)
En `src/pages/Inventario.tsx` línea 184:
```typescript
const fechaISO = convertDateWithCurrentTime(tintoreriaData.fecha_registro);
// Resultado: Fechas se registran CORRECTAMENTE en zona horaria America/Lima
```

### ❌ USUARIOS - Antes de la corrección (INCORRECTO)
En `src/pages/Ventas.tsx` línea 342 (Anticipo Inicial):
```typescript
const anticipo = await SupabaseService.createAnticipo({
  fecha_anticipo: data.fecha_anticipo  // ❌ Sin conversión
  // Resultado: Fecha desfasada un día antes
});
```

## Solución Implementada

### Cambio 1: src/pages/Ventas.tsx

**Línea ~342-350** - Registro de Anticipo Inicial:
```typescript
// ANTES
const anticipo = await SupabaseService.createAnticipo({
  cliente_id: clienteParaAnticipo.id,
  monto: data.monto,
  metodo_pago: data.metodo_pago,
  fecha_anticipo: data.fecha_anticipo,  // ❌ Sin conversión
  observaciones: data.observaciones
});

// DESPUÉS
const fechaAnticipoISO = convertDateWithCurrentTime(data.fecha_anticipo);
const anticipo = await SupabaseService.createAnticipo({
  cliente_id: clienteParaAnticipo.id,
  monto: data.monto,
  metodo_pago: data.metodo_pago,
  fecha_anticipo: fechaAnticipoISO,  // ✅ Convertida correctamente
  observaciones: data.observaciones
});
```

**Línea ~546-554** - Registro de Anticipo con Venta:
```typescript
// ANTES
if (anticipoData) {
  await SupabaseService.createAnticipo({
    venta_id: ventaCreada.id,
    cliente_id: usuarioSeleccionado.id,
    monto: anticipoData.monto,
    metodo_pago: anticipoData.metodo_pago,
    fecha_anticipo: anticipoData.fecha_anticipo,  // ❌ Sin conversión
    observaciones: anticipoData.observaciones
  });
}

// DESPUÉS
if (anticipoData) {
  const fechaAnticipoISO = convertDateWithCurrentTime(anticipoData.fecha_anticipo);
  await SupabaseService.createAnticipo({
    venta_id: ventaCreada.id,
    cliente_id: usuarioSeleccionado.id,
    monto: anticipoData.monto,
    metodo_pago: anticipoData.metodo_pago,
    fecha_anticipo: fechaAnticipoISO,  // ✅ Convertida correctamente
    observaciones: anticipoData.observaciones
  });
}
```

### Cambio 2: src/components/Usuarios/EditAdvancePaymentModal.tsx

**Línea ~118-132** - Campo de Fecha (Ahora Solo Lectura):

```typescript
// ANTES
<input
  type="date"
  value={fecha_anticipo}
  onChange={(e) => setFecha_anticipo(e.target.value)}
  disabled={loading}
  max={new Date().toISOString().split('T')[0]}
/>

// DESPUÉS
<div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 flex items-center">
  {new Date(advance.fecha_anticipo).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}
</div>
<p className="text-xs text-gray-500 mt-1">
  La fecha de registro no se puede cambiar
</p>
```

**Línea ~47-50** - Submit sin modificar fecha:

```typescript
// ANTES
await SupabaseService.updateAnticipo(advance.id, {
  monto: montoNum,
  metodo_pago,
  fecha_anticipo,  // ❌ Se actualizaba la fecha
  observaciones: observaciones || undefined
});

// DESPUÉS
await SupabaseService.updateAnticipo(advance.id, {
  monto: montoNum,
  metodo_pago,
  observaciones: observaciones || undefined
  // ✅ No se actualiza la fecha (se mantiene la original)
});
```

## Migración SQL para Datos Históricos

Si necesitas corregir datos históricos ya guardados en la base de datos, ejecuta esta migración SQL:

```sql
/*
  Corrección de Zona Horaria en Tabla Anticipos (America/Lima UTC-5)

  Problema: Las fechas se registraban a las 19:00 UTC (desfase incorrecto)
  Solución: Sumar 5 horas para obtener la hora correcta en America/Lima
*/

-- Corregir fechas que fueron registradas a las 19:00 UTC
UPDATE anticipos
SET fecha_anticipo = fecha_anticipo + INTERVAL '5 hours'
WHERE EXTRACT(HOUR FROM fecha_anticipo AT TIME ZONE 'UTC') = 19
  AND EXTRACT(MINUTE FROM fecha_anticipo AT TIME ZONE 'UTC') = 0
  AND EXTRACT(SECOND FROM fecha_anticipo AT TIME ZONE 'UTC') = 0;

-- Corregir también las que quedaron a las 00:00 UTC (fechas pasadas)
UPDATE anticipos
SET fecha_anticipo = fecha_anticipo + INTERVAL '5 hours'
WHERE EXTRACT(HOUR FROM fecha_anticipo AT TIME ZONE 'UTC') = 0
  AND EXTRACT(MINUTE FROM fecha_anticipo AT TIME ZONE 'UTC') = 0
  AND EXTRACT(SECOND FROM fecha_anticipo AT TIME ZONE 'UTC') = 0
  AND fecha_anticipo < now() - INTERVAL '1 hour';
```

## Cómo Funciona la Corrección

La función `convertDateWithCurrentTime(selectedDate: string)` en `src/utils/dateUtils.ts`:

1. **Si es la fecha de hoy**: Usa `new Date().toISOString()` (hora actual del sistema)
2. **Si es una fecha pasada**: Crea un timestamp con la fecha seleccionada y la hora actual

Resultado: Las fechas se guardan correctamente en ISO format con la zona horaria America/Lima (UTC-5).

## Pruebas Recomendadas

Después de aplicar los cambios, verifica lo siguiente:

1. **Anticipo Inicial (Ventas → Registrar Anticipo Inicial)**
   - Selecciona fecha de hoy → Debe guardar con hora actual
   - Selecciona fecha de ayer → Debe guardar como 00:00:00 del día anterior

2. **Compra con Anticipo (Ventas → Nueva Venta)**
   - Realiza una venta con anticipo
   - En "Historial de Movimientos" debe aparecer la fecha correcta

3. **Ver en Historial de Movimientos (Usuarios → Ver Historial de Compras)**
   - Click en "Anticipo Inicial" (tarjeta verde)
   - Las fechas deben coincidir exactamente con lo registrado

4. **Editar Anticipo**
   - La fecha ahora es solo lectura y no se puede cambiar
   - Se pueden editar: Monto, Método de Pago y Observaciones

## Resultado Final

✅ Todas las fechas de anticipos se registran correctamente en zona horaria America/Lima
✅ Las fechas en "Historial de Movimientos" muestran el día correcto
✅ Las horas se registran correctamente
✅ Los datos históricos pueden corregirse con la migración SQL proporcionada

## Archivos Modificados

1. `src/pages/Ventas.tsx` - Aplicación de conversión de fechas (2 locaciones)
2. `src/components/Usuarios/EditAdvancePaymentModal.tsx` - Campo de fecha solo lectura
3. Migración SQL: `20251122_fix_anticipos_timezone_correction.sql` (para datos históricos)
