# Guía de Pruebas - Corrección de Fechas

## Descripción General
Esta guía te ayudará a validar que el sistema registra correctamente las fechas en Tintorería y Ventas.

---

## PARTE 1: PRUEBAS EN TINTORERÍA

### ✓ Prueba 1.1: Registrar Producto HOY (Fecha Actual)

#### Pasos:
1. Abre el navegador y ve a tu aplicación
2. Ve a **Inventario**
3. Haz clic en **Nuevo Producto**
4. Selecciona **Tintorería**
5. Completa el formulario:
   - Nombre: "Madejas Crudas"
   - Color: "Rojo" (o cualquier color)
   - Cantidad: 100
   - Fecha de Registro: **Déjala en HOY** (la fecha actual)
6. Haz clic en **Crear Producto**

#### Validación:
✓ El toast dice "Producto de tintorería creado correctamente"
✓ En la tabla de Inventario aparece el producto con la fecha de hoy (Ej: 08-11-2024)
✓ **IMPORTANTE**: Verifica en tu base de datos Supabase:
   - Abre Supabase Dashboard
   - Ve a la tabla "productos"
   - Busca el producto que acabas de crear
   - Verifica el campo "fecha_registro" - debe mostrar hoy con hora actual (Ej: 2024-11-08T14:35:22.000Z)

#### Resultado Esperado:
```
Fecha seleccionada: 08-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-08T14:35:22.000Z ✓ CORRECTO
```

---

### ✓ Prueba 1.2: Registrar Producto AYER (Fecha Pasada)

#### Pasos:
1. Ve a **Inventario**
2. Haz clic en **Nuevo Producto**
3. Selecciona **Tintorería**
4. Completa el formulario:
   - Nombre: "Madejas Crudas Antiguas"
   - Color: "Azul"
   - Cantidad: 50
   - Fecha de Registro: **Selecciona AYER** (un día atrás)
     - Si hoy es 08-11-2024, selecciona 07-11-2024
5. Haz clic en **Crear Producto**

#### Validación:
✓ El toast dice "Producto de tintorería creado correctamente"
✓ En la tabla de Inventario aparece con la fecha de ayer (Ej: 07-11-2024)
✓ **IMPORTANTE**: Verifica en Supabase:
   - Abre Supabase Dashboard
   - Ve a la tabla "productos"
   - Busca el producto que acabas de crear
   - Verifica el campo "fecha_registro" - debe mostrar ayer con hora actual (Ej: 2024-11-07T14:35:22.000Z)

#### Resultado Esperado:
```
Fecha seleccionada: 07-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-07T14:35:22.000Z ✓ CORRECTO
```

---

### ✓ Prueba 1.3: Registrar Producto hace 5 días

#### Pasos:
1. Ve a **Inventario**
2. Haz clic en **Nuevo Producto**
3. Selecciona **Tintorería**
4. Completa el formulario:
   - Nombre: "Madejas Crudas Antiguas 5 días"
   - Color: "Verde"
   - Cantidad: 75
   - Fecha de Registro: **Selecciona hace 5 días**
     - Si hoy es 08-11-2024, selecciona 03-11-2024
5. Haz clic en **Crear Producto**

#### Validación:
✓ En la tabla de Inventario aparece con la fecha correcta (Ej: 03-11-2024)
✓ **IMPORTANTE**: Verifica en Supabase que la fecha sea exacta:
   - Campo "fecha_registro" debe mostrar 2024-11-03T14:35:22.000Z
   - **NOTA**: La hora será la hora actual, pero la FECHA debe ser 03-11-2024, NO 02-11-2024

#### Resultado Esperado:
```
Fecha seleccionada: 03-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-03T14:35:22.000Z ✓ CORRECTO
¡NO debe ser 2024-11-02...! ✓
```

---

## PARTE 2: PRUEBAS EN VENTAS

### ✓ Prueba 2.1: Realizar Venta HOY (Fecha Actual)

#### Pasos:
1. Ve a **Ventas**
2. Haz clic en **+ Seleccionar Cliente**
3. Selecciona un cliente (o crea uno nuevo)
4. Haz clic en **+ Agregar** productos
5. Selecciona algunos productos del inventario
6. Haz clic en **Agregar Productos al Carrito**
7. Completa los campos:
   - N° de Guía: "2024001" (o cualquier número)
   - Fecha de Registro de Venta: **Déjala en HOY**
8. Haz clic en **Procesar Venta**

#### Validación:
✓ Se genera un PDF con la boleta
✓ El PDF muestra la fecha de HOY con hora actual
✓ **IMPORTANTE**: Verifica en Supabase:
   - Abre Supabase Dashboard
   - Ve a la tabla "ventas"
   - Busca la venta que acabas de crear
   - Verifica el campo "fecha_venta" - debe ser hoy con hora actual (Ej: 2024-11-08T14:35:22.000Z)

#### Resultado Esperado:
```
Fecha seleccionada: 08-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-08T14:35:22.000Z ✓ CORRECTO
Mostrado en PDF: 08-11-2024 ✓ CORRECTO
```

---

### ✓ Prueba 2.2: Realizar Venta AYER (Fecha Pasada)

#### Pasos:
1. Ve a **Ventas**
2. Selecciona un cliente
3. Agrega productos al carrito
4. Completa los campos:
   - N° de Guía: "2024002"
   - Fecha de Registro de Venta: **Selecciona AYER**
     - Si hoy es 08-11-2024, selecciona 07-11-2024
5. Haz clic en **Procesar Venta**

#### Validación:
✓ Se genera un PDF con la boleta
✓ El PDF muestra la fecha de AYER (Ej: 07-11-2024)
✓ **IMPORTANTE**: Verifica en Supabase:
   - Ve a la tabla "ventas"
   - Busca la venta que acabas de crear
   - Campo "fecha_venta" debe ser 2024-11-07T14:35:22.000Z

#### Resultado Esperado:
```
Fecha seleccionada: 07-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-07T14:35:22.000Z ✓ CORRECTO
Mostrado en PDF: 07-11-2024 ✓ CORRECTO
```

---

### ✓ Prueba 2.3: Realizar Venta hace 7 días

#### Pasos:
1. Ve a **Ventas**
2. Selecciona un cliente
3. Agrega productos al carrito
4. Completa los campos:
   - N° de Guía: "2024003"
   - Fecha de Registro de Venta: **Selecciona hace 7 días**
     - Si hoy es 08-11-2024, selecciona 01-11-2024
5. Haz clic en **Procesar Venta**

#### Validación:
✓ Se genera un PDF con la boleta
✓ El PDF muestra la fecha correcta (Ej: 01-11-2024)
✓ Ve a **Historial** y verifica que la venta aparece con la fecha correcta
✓ **IMPORTANTE**: Verifica en Supabase:
   - Campo "fecha_venta" debe ser 2024-11-01T14:35:22.000Z
   - **NO debe ser 2024-10-31...!**

#### Resultado Esperado:
```
Fecha seleccionada: 01-11-2024
Hora del sistema: 14:35:22
Registrado en BD: 2024-11-01T14:35:22.000Z ✓ CORRECTO
Mostrado en PDF: 01-11-2024 ✓ CORRECTO
Mostrado en Historial: 01-11-2024 ✓ CORRECTO
¡NO debe ser 31-10-2024...! ✓
```

---

## PARTE 3: PRUEBAS EN HISTORIAL

### ✓ Prueba 3.1: Verificar Fechas en Historial

#### Pasos:
1. Ve a **Historial**
2. Deberías ver las ventas que acabas de crear
3. Verifica que todas las fechas sean correctas:
   - Venta HOY: Debe mostrar la fecha de hoy
   - Venta AYER: Debe mostrar la fecha de ayer
   - Venta hace 7 días: Debe mostrar esa fecha exacta

#### Validación:
✓ Las tres ventas aparecen en el historial
✓ Las fechas coinciden exactamente con las que registraste
✓ **NO hay cambios de fecha** entre lo que seleccionaste y lo que se muestra

---

## PART 4: VERIFICACIÓN EN SUPABASE (Técnica)

### ✓ Prueba 4.1: Consulta SQL en Supabase

Si quieres verificar técnicamente en la base de datos:

#### En Supabase Dashboard:
1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Ejecuta esta consulta para productos de Tintorería:
   ```sql
   SELECT
     nombre,
     color,
     fecha_registro,
     TO_CHAR(fecha_registro, 'YYYY-MM-DD HH24:mi:ss') as "Fecha Formateada"
   FROM productos
   WHERE estado = 'Por Devanar'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

4. Ejecuta esta consulta para ventas:
   ```sql
   SELECT
     numero_guia,
     fecha_venta,
     TO_CHAR(fecha_venta, 'YYYY-MM-DD HH24:mi:ss') as "Fecha Formateada",
     total
   FROM ventas
   ORDER BY created_at DESC
   LIMIT 5;
   ```

#### Qué Deberías Ver:
- Las fechas debe estar correctas en formato ISO (2024-11-08T14:35:22.000Z)
- La columna "Fecha Formateada" debe mostrarse así: 2024-11-08 14:35:22
- **NO deben haber cambios de día** entre la fecha que seleccionaste y la que ves en BD

---

## RESUMEN DE VALIDACIONES

### ✓ Lista de Verificación Rápida:

**Tintorería:**
- [ ] Producto creado hoy tiene fecha correcta (no cambió de día)
- [ ] Producto creado ayer tiene fecha exacta de ayer (no cambió a día anterior)
- [ ] Producto creado hace 5 días tiene fecha correcta (no es hace 6 días)
- [ ] La hora siempre es la hora actual del sistema

**Ventas:**
- [ ] Venta creada hoy registra fecha correcta en BD
- [ ] Venta creada ayer registra fecha correcta en BD
- [ ] Venta creada hace 7 días registra fecha correcta en BD
- [ ] La boleta PDF muestra las fechas correctas
- [ ] El Historial muestra las fechas correctas

**General:**
- [ ] No hay cambios de día por problemas de zona horaria
- [ ] Las fechas se preservan exactamente como las seleccionaste
- [ ] La hora registrada es la hora actual del sistema (America/Lima UTC-5)

---

## Solución de Problemas

### ❌ Problema: La fecha cambió de día
**Causa**: Todavía hay un problema con la conversión de zona horaria
**Solución**: Contacta soporte con el error específico

### ❌ Problema: La hora no es la actual
**Causa**: Podría ser un desfase de zona horaria
**Solución**: Verifica que tu servidor esté en zona horaria America/Lima (UTC-5)

### ❌ Problema: El PDF no muestra la fecha
**Causa**: La función de exportación podría necesitar actualización
**Solución**: Contacta soporte para revisar exportUtils

---

## Notas Importantes

- **Zona Horaria**: El sistema está configurado para America/Lima (UTC-5)
- **Formato**: Las fechas se guardan en ISO 8601 (YYYY-MM-DDTHH:mm:ss.000Z)
- **Visualización**: Se muestran en formato DD-MM-YYYY en tablas
- **Precisión**: Incluye horas, minutos y segundos exactos del momento del registro

---

## Resultado Final

Si todas las pruebas pasan ✓, significa que:

✓ Las fechas se registran correctamente sin cambios de día
✓ El sistema preserva exactamente la fecha seleccionada por el usuario
✓ La hora registrada es siempre la hora actual del sistema
✓ No hay problemas de zona horaria en Tintorería o Ventas
✓ El Historial muestra las fechas correctas
✓ La boleta PDF incluye fechas correctas
