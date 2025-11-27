# Guía Rápida de Pruebas - Sistema de Anticipos V2

## ⚡ 5 Minutos para Validar Todo

### Preparativos
1. Asegúrate que el sistema está corriendo
2. Accede al módulo de **Usuarios**

---

## Test Rápido (Script)

### Fase 1: Registrar Anticipos (1 min)
```
1. Busca "Gustavo1" (o crea si no existe)
2. Click en botón "+" de anticipos
3. Registra 3 anticipos:
   - Anticipo 1: $100 | Efectivo
   - Anticipo 2: $200 | Transferencia
   - Anticipo 3: $300 | Yape
4. Verifica que aparezca "Total: $600.00"
```

### Fase 2: Procesar Venta (1.5 min)
```
1. Ir a VENTAS
2. Seleccionar "Gustavo1"
3. Agregar productos por $209.50
4. Click en PROCESAR VENTA
5. Verificar que dice "Venta procesada exitosamente"
6. NO debe haber modal de anticipo de venta
```

### Fase 3: Verificar Historial (2.5 min)
```
1. Volver a USUARIOS
2. Buscar "Gustavo1" → Click en ojo
3. Click en el cuadro de "Anticipo Inicial" ($600)
4. Abrirá modal "Historial de Movimientos"
```

---

## ✅ Validaciones Clave (Marcar mientras pruebas)

### En el Modal "Historial de Movimientos":

**Sección Superior:**
- [ ] Saldo Disponible = **S/ 390.50** exacto
- [ ] Muestra nombre del cliente: "Gustavo1"

**Lista de Movimientos:**
- [ ] **4 movimientos exactos** (no 5, no 3)
  - [ ] Anticipo $100 (verde, con botones [✎][🗑])
  - [ ] Anticipo $200 (verde, con botones [✎][🗑])
  - [ ] Anticipo $300 (verde, con botones [✎][🗑])
  - [ ] Compra $209.50 (rojo, SIN botones)

**Información Visible:**
- [ ] Cada movimiento en **1 LÍNEA** (no 2, no 3)
- [ ] Método de pago visible (Efectivo, Transferencia, Yape)
- [ ] Fecha y hora visibles
- [ ] Monto correcto en cada línea

**Sección Inferior (Totales):**
- [ ] Total Ingresos = **S/ 600.00**
- [ ] Total Egresos = **S/ 209.50**
- [ ] Total Movimientos = **4**

---

## 🔧 Prueba Adicional: Edit Button (1 min)

```
1. En el modal, click en botón [✎] del primer anticipo ($100)
2. Abrirá formulario de edición
3. Cambia $100 → $150
4. Click en "Guardar"
5. Verifica que:
   - [ ] El anticipo cambió a $150
   - [ ] Saldo Disponible recalculó: 550 - 209.50 = 340.50
   - NO hay duplicados de "Saldo remanente"
```

---

## 🔧 Prueba Adicional: Delete Button (1 min)

```
1. En el modal, click en botón [🗑] del segundo anticipo ($200)
2. Abrirá modal de confirmación roja
3. Lee las advertencias
4. Verifica impacto en saldo
5. Click en "Entiendo, Eliminar Anticipo"
6. Confirma nuevamente
7. Verifica que:
   - [ ] Anticipo se eliminó
   - [ ] Total Movimientos ahora = 3
   - [ ] Saldo Disponible recalculó: 350 - 209.50 = 140.50
```

---

## ❌ Problemas Comunes & Soluciones

| Problema | Solución |
|----------|----------|
| Ver 5+ movimientos | Hay registros "Saldo remanente" antiguos en BD. Contactar admin para limpiar. |
| Saldo incorrecto | Recargar página (F5). Si persiste, revisar BD. |
| Botones no aparecen | Si hay botones en todos los movimientos, revisar `venta_id` en BD. |
| Múltiples líneas | Si ves cada movimiento en 2+ líneas, revisar CSS de MovementHistory.tsx |
| Edit/Delete no funciona | Revisar consola del navegador (F12) para errores. |
| Saldo en ROJO | Es normal si hay más egresos que ingresos. Saldo puede ser negativo. |

---

## 📊 Resultado Esperado (Checklist Final)

```
✅ Sistema registra anticipos iniciales sin modificarlos
✅ Venta procesa automáticamente usando anticipos
✅ Historial muestra EXACTAMENTE 4 movimientos
✅ Saldo disponible = Ingresos - Egresos
✅ Interface compacta (1 línea por movimiento)
✅ Botones Edit y Delete funcionan correctamente
✅ NO aparecen registros duplicados de "Saldo remanente"
✅ Build exitoso sin errores
```

---

## 🎯 ÉXITO

Si todos los items arriba están marcados ✅, **el sistema está funcionando correctamente**.

---

## 📞 Troubleshooting Avanzado

### Si Saldo Disponible es Incorrecto:

```sql
-- Verificar en BD que todos los anticipos de Gustavo1 existan:
SELECT id, monto, venta_id FROM anticipos
WHERE cliente_id = (SELECT id FROM usuarios WHERE nombre = 'Gustavo1')
ORDER BY fecha_anticipo DESC;

-- Debería retornar 4 anticipos (después de 3 iniciales + 1 usado)
```

### Si Aparecen 5+ Movimientos:

```sql
-- Buscar "Saldo remanente" entries
SELECT * FROM anticipos
WHERE observaciones LIKE '%Saldo remanente%';

-- Estas son registros antiguos del sistema anterior
-- Pueden ser eliminadas o ignoradas
```

### Si Edit/Delete no funcionan:

```
1. Abre DevTools: F12
2. Mira la pestaña "Console"
3. Busca errores en rojo
4. Reporta el error específico
```

---

## ⏱️ Tiempo Total Estimado

- Preparación: 2 min
- Test Rápido (Fases 1-3): 4.5 min
- Pruebas Adicionales (Edit + Delete): 2 min
- **TOTAL: 8.5 minutos máximo**

---

## 📝 Template de Reporte

Si encuentras un problema, usa este template:

```
PROBLEMA: [Descripción corta]

PASOS PARA REPRODUCIR:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

RESULTADO ESPERADO:
[Lo que debería pasar]

RESULTADO ACTUAL:
[Lo que pasó]

CLIENTE DE PRUEBA:
[Nombre]

FECHA/HORA:
[Cuándo pasó]

SCREENSHOT:
[Adjunta si es posible]
```

---

**¡Gracias por probar el sistema! 🙏**
