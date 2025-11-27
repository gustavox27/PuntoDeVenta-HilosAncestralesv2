# Pruebas del Flujo de Anticipos Completo

## Objetivo
Validar que el sistema NO modifica los anticipos iniciales y que registra correctamente 4 movimientos (3 ingresos + 1 egreso) cuando se realiza una venta.

---

## PASO 1: Preparar el Cliente "Gustavo1"

1. **Ir a Módulo de Usuarios**
   - Selecciona la pestaña "Usuarios"
   - Busca o crea el cliente "Gustavo1" si no existe
   - Verifica que tenga perfil "Cliente"

---

## PASO 2: Registrar 3 Anticipos Iniciales

### Anticipo #1: S/ 100
1. En el módulo de Usuarios, busca "Gustavo1"
2. Haz clic en el botón "Registrar Anticipo" (icono de moneda)
3. En el modal:
   - **Monto**: 100
   - **Método de Pago**: Efectivo
   - **Fecha**: Hoy o una fecha pasada
   - **Observaciones**: (dejar vacío)
4. Haz clic en "Registrar Anticipo"
5. Verifica el mensaje de éxito "Anticipo registrado correctamente"

### Anticipo #2: S/ 200
Repite el proceso anterior pero con:
- **Monto**: 200
- **Método de Pago**: Transferencia

### Anticipo #3: S/ 300
Repite el proceso anterior pero con:
- **Monto**: 300
- **Método de Pago**: Yape

**RESULTADO ESPERADO DESPUÉS DE PASO 2:**
- Total Disponible: S/ 600
- Tres anticipos registrados separadamente

---

## PASO 3: Procesar una Venta para Gustavo1

1. **Ir al Módulo de Ventas**
   - Selecciona la pestaña "Ventas"

2. **Seleccionar Cliente**
   - Haz clic en "Seleccionar Cliente"
   - Busca "Gustavo1"
   - Verifica que aparezca: "Anticipo Disponible: S/ 600.00"

3. **Agregar Productos al Carrito**
   - Agrega productos hasta obtener un total de **S/ 209.50**
   - Ejemplo: Agrega 1 producto de S/ 209.50 o múltiples productos que sumen ese monto

4. **Procesar la Venta**
   - El sistema debe mostrar:
     - **Total**: S/ 209.50
     - **Anticipo Disponible**: S/ 600.00
     - **Saldo Pendiente**: S/ 0.00 (si se usa el anticipo)
   - NO debes marcar el checkbox de "Anticipo de Venta"
   - Haz clic en "Procesar Venta"
   - Verifica el mensaje de éxito

**RESULTADO ESPERADO DESPUÉS DE PASO 3:**
- La venta se procesa correctamente
- Se genera un PDF de la venta
- El sistema NO crea anticipos adicionales con nombre "Saldo remanente"

---

## PASO 4: Abrir el Modal "Historial de Movimientos"

1. **Vuelve al Módulo de Usuarios**
   - Selecciona la pestaña "Usuarios"

2. **Busca "Gustavo1"**
   - Haz clic en el botón de ver detalles (ojo)

3. **Abre el Modal de Historial de Compras**
   - En la tarjeta "Anticipo Inicial" con el monto S/ 600.00, haz clic en el icono de ojo
   - Esto abrirá el modal "Historial de Movimientos - Gustavo1"

---

## PASO 5: VALIDAR DATOS EN EL MODAL

### VALIDACIÓN #1: Saldo Disponible
```
✓ Verifica que sea: S/ 390.50
  (600 de ingresos - 209.50 de egreso = 390.50)
```

### VALIDACIÓN #2: Total de Movimientos
```
✓ Debe haber exactamente 4 movimientos en la lista:

  1. Anticipo Inicial - S/ 100.00 (INGRESO)
     - Con botones: Editar | Eliminar
     - Sin etiqueta de venta asociada

  2. Anticipo Inicial - S/ 200.00 (INGRESO)
     - Con botones: Editar | Eliminar
     - Sin etiqueta de venta asociada

  3. Anticipo Inicial - S/ 300.00 (INGRESO)
     - Con botones: Editar | Eliminar
     - Sin etiqueta de venta asociada

  4. Compra - S/ 209.50 (EGRESO)
     - SIN botones de Editar ni Eliminar
     - Etiqueta roja "Egreso"
```

### VALIDACIÓN #3: Totales Finales
Al final del modal, verifica los tres cuadrantes:

```
╔════════════════════════════════════════════╗
║  Total Ingresos: S/ 600.00                 ║
║  Total Egresos: S/ 209.50                  ║
║  Total Movimientos: 4                      ║
╚════════════════════════════════════════════╝
```

### VALIDACIÓN #4: Datos de Cada Anticipo
Para cada uno de los 3 anticipos iniciales, verifica:
- ✓ Monto correcto (100, 200, 300)
- ✓ Fecha y hora visible
- ✓ Método de pago visible (Efectivo, Transferencia, Yape)
- ✓ Botones Edit y Delete presentes
- ✓ Diseño compacto (una sola línea)

### VALIDACIÓN #5: Datos de la Compra
Para el movimiento de egreso (compra):
- ✓ Monto correcto: S/ 209.50
- ✓ Descripción: "Compra - [Nombres de productos]"
- ✓ Fecha y hora visible
- ✓ SIN botones de Edit ni Delete
- ✓ Etiqueta "Egreso" en rojo

---

## PASO 6: PRUEBAS ADICIONALES (OPCIONAL)

### Prueba de Edición de Anticipo
1. En el modal de "Historial de Movimientos", haz clic en el botón EDITAR de cualquier anticipo
2. Cambia el monto a S/ 150 (por ejemplo, en el anticipo de S/ 100)
3. Haz clic en "Guardar"
4. Verifica que:
   - El anticipo se actualice correctamente
   - El saldo disponible se recalcule: (150 + 200 + 300) - 209.50 = 440.50
   - No aparezca ningún registro duplicado de "Saldo remanente"

### Prueba de Eliminación de Anticipo
1. En el modal de "Historial de Movimientos", haz clic en el botón ELIMINAR de cualquier anticipo
2. Verifica que se muestre un modal de confirmación con:
   - Advertencia en rojo
   - Detalles del anticipo a eliminar
   - Impacto en el saldo disponible
3. Haz clic en "Eliminar"
4. Verifica que:
   - El anticipo se elimine correctamente
   - El saldo disponible se recalcule
   - Total de movimientos se reduzca a 3

---

## PASO 7: VERIFICACIÓN FINAL

En el modal de "Historial de Movimientos", verifica:

**Presencia Correcta:**
- ✓ TODOS los anticipos iniciales están presentes (no desaparecen)
- ✓ TODOS los egresos están presentes
- ✓ NO aparecen registros duplicados con "Saldo remanente"
- ✓ NO aparecen registros modificados de anticipos

**Botones Correctos:**
- ✓ SOLO los anticipos iniciales SIN venta_id tienen botones Edit/Delete
- ✓ Los anticipos usados en ventas NO tienen botones
- ✓ Los egresos NUNCA tienen botones

**Diseño UI:**
- ✓ Cada movimiento se muestra en UNA sola línea
- ✓ La información cabe sin necesidad de desplazarse horizontalmente
- ✓ Diseño compacto y profesional
- ✓ Información claramente legible

---

## RESULTADO EXITOSO

Si todas las validaciones anteriores pasan, el sistema está funcionando correctamente:

✅ Los anticipos iniciales NO se modifican
✅ Se registran exactamente 4 movimientos (3 + 1)
✅ Saldo disponible correcto: S/ 390.50
✅ Totales correctos: Ingresos S/ 600 | Egresos S/ 209.50
✅ Interfaz compacta y profesional
✅ Edit y Delete funcionan solo para anticipos sin usar

---

## TROUBLESHOOTING

Si algo no funciona como se espera:

### Problema: Aparecen 5+ movimientos
- **Causa**: Probablemente hay registros antiguos de "Saldo remanente"
- **Solución**: Verificar la base de datos y limpiar registros duplicados

### Problema: Saldo disponible incorrecto
- **Causa**: Error en el cálculo de getMovementHistory
- **Solución**: Revisar que el método incluya TODOS los anticipos

### Problema: Botones Edit/Delete no funcionan
- **Causa**: Modales no cargados correctamente
- **Solución**: Verificar que los componentes EditAdvancePaymentModal y DeleteAdvancePaymentModal estén importados

### Problema: Dos líneas en cada movimiento
- **Causa**: CSS con padding o espacio extra
- **Solución**: Verificar clases Tailwind en MovementHistory.tsx

---

## NOTAS IMPORTANTES

1. **Respuestas a Anticipos**: NO elimines anticipos que ya fueron usados en ventas. El sistema debe restricionar esta acción.

2. **Flujo Natural**: El flujo es: Registrar Anticipos → Procesar Venta → Ver Movimientos en Historial

3. **Saldo Disponible**: Se calcula como: Total de Anticipos (ingresos) - Total de Egresos en Ventas

4. **Integridad de Datos**: Los anticipos originales NUNCA deben ser modificados en sus montos, solo asociados a ventas

---

## Contacto para Problemas

Si encuentras problemas durante las pruebas:
1. Toma un screenshot de la pantalla
2. Anota exactamente qué paso falla
3. Reporta el error específico que ves en la interfaz
