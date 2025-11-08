# Referencia Rápida - Corrección de Fechas

## 🚀 Inicio Rápido

### Para Empezar a Probar Ahora

1. Ve a **Inventario → Nuevo Producto → Tintorería**
2. Ingresa datos y **deja la fecha en HOY**
3. Crea el producto
4. **Verifica**: La fecha mostrada debe ser HOY (no ayer)
5. **Verificar en Supabase**: SELECT * FROM productos

### Resultado Esperado

```
Fecha Ingresada:   08-11-2024 (hoy)
Fecha Registrada:  2024-11-08T14:35:22.000Z
Fecha Mostrada:    08-11-2024 ✓
```

---

## 🔧 Qué Cambió

### Tintorería (Inventario.tsx)
```typescript
// ANTES ❌
fecha_registro: new Date(tintoreriaData.fecha_registro).toISOString()

// DESPUÉS ✓
const fechaISO = convertDateWithCurrentTime(tintoreriaData.fecha_registro);
fecha_registro: fechaISO
```

### Ventas (Ventas.tsx)
```typescript
// ANTES ❌
fecha_venta: fechaVenta ? new Date(fechaVenta).toISOString() : new Date().toISOString()

// DESPUÉS ✓
const fechaVentaISO = fechaVenta ? convertDateWithCurrentTime(fechaVenta) : new Date().toISOString();
fecha_venta: fechaVentaISO
```

### Archivo Nuevo
```
src/utils/dateUtils.ts
- convertDateWithCurrentTime()
- getTodayDateString()
- formatDateWithTime()
- formatDate()
```

---

## 📋 Pruebas Rápidas (5 minutos)

### Test 1: Tintorería - Hoy ✓
1. Inventario → Nuevo Producto → Tintorería
2. Fecha: **HOY** (no toques)
3. Crear → Verificar que muestra HOY

### Test 2: Tintorería - Ayer ✓
1. Inventario → Nuevo Producto → Tintorería
2. Fecha: **AYER** (selecciona manualmente)
3. Crear → Verificar que muestra AYER (no anteayer)

### Test 3: Venta - Hoy ✓
1. Ventas → Seleccionar cliente → Agregar productos
2. Fecha: **HOY**
3. Procesar → PDF debe mostrar HOY

### Test 4: Venta - Hace 5 días ✓
1. Ventas → Seleccionar cliente → Agregar productos
2. Fecha: **Hace 5 días**
3. Procesar → PDF debe mostrar esa fecha exacta

---

## 🆘 Problemas Comunes

### "La fecha cambió de día"
**Solución**: Revisa que convertDateWithCurrentTime() se importa correctamente
```bash
grep -n "convertDateWithCurrentTime" src/pages/Inventario.tsx
```

### "La hora no es la actual"
**Solución**: Verifica zona horaria del servidor
```sql
SELECT now();  -- En Supabase SQL Editor
```

### "El PDF no muestra la fecha"
**Solución**: Revisa exportUtils.ts - podría necesitar actualización

---

## 📊 Verificación en BD (SQL)

### Verificar Productos Tintorería
```sql
SELECT
  nombre,
  color,
  fecha_registro,
  TO_CHAR(fecha_registro, 'YYYY-MM-DD HH24:mi:ss') as "Mostrado"
FROM productos
WHERE estado = 'Por Devanar'
LIMIT 5;
```

### Verificar Ventas
```sql
SELECT
  numero_guia,
  fecha_venta,
  TO_CHAR(fecha_venta, 'YYYY-MM-DD HH24:mi:ss') as "Mostrado",
  total
FROM ventas
LIMIT 5;
```

---

## 🎯 Checklist de Validación

- [ ] Tintorería con fecha HOY: Fecha correcta ✓
- [ ] Tintorería con fecha AYER: Fecha exacta (no día anterior) ✓
- [ ] Venta con fecha HOY: PDF correcto ✓
- [ ] Venta con fecha pasada: PDF correcto ✓
- [ ] Historial muestra fechas correctas ✓
- [ ] BD tiene fechas correctas ✓

---

## 📁 Archivos Importantes

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| src/utils/dateUtils.ts | 156 | NUEVO |
| src/pages/Inventario.tsx | - | +8 líneas |
| src/pages/Ventas.tsx | - | +10 líneas |

---

## 🕐 Zona Horaria

**Configurada**: America/Lima (UTC-5)
**Formato**: 2024-11-08T14:35:22.000Z
**Visualización**: 08-11-2024 14:35:22

---

## 📞 Más Información

- Detalles técnicos: IMPLEMENTACION_CORRECCION_FECHAS.md
- Pruebas completas: GUIA_PRUEBAS_FECHAS.md
- Arquitectura: ARQUITECTURA_SOLUCION_FECHAS.md
- Resumen: RESUMEN_CAMBIOS_FECHAS.txt

---

**Estado**: ✓ Listo para Usar
**Build**: ✓ Compilado sin errores
**Zona Horaria**: ✓ America/Lima (UTC-5)
