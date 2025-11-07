# Guía: Eliminación de Ventas con Rollback Completo

## ¿Qué se implementó?

Se agregó la funcionalidad **"Eliminar Venta"** que permite eliminar una venta completamente y revierte todos los cambios asociados de forma automática:

- **Stock de Productos**: Se restauran las cantidades vendidas
- **Anticipos del Cliente**: Se devuelven como anticipos disponibles
- **Registros**: Se elimina completamente de la venta del historial
- **Auditoría**: Se registra en el sistema quién y cuándo eliminó la venta

## Cómo Usar la Función

### Paso 1: Ir al Historial de Ventas

1. Haz clic en "Historial" en el menú lateral
2. Verás la lista de todas las ventas (finales y pendientes)

### Paso 2: Localizar la Venta a Eliminar

En la tabla de ventas, busca la venta que deseas eliminar usando:
- Filtro por cliente
- Filtro por rango de fechas
- Búsqueda por nombre, DNI o N° de guía

### Paso 3: Abrir el Modal de Eliminación

En la columna "Acciones" (a la derecha de cada venta), encontrarás 4 botones:

| Icono | Descripción |
|-------|-------------|
| 👁️ | Ver detalles de la venta |
| ✏️ | Editar número de guía |
| 📥 | Descargar boleta |
| 🗑️ | **Eliminar venta** |

Haz clic en el icono de papelera (🗑️) para abrir el modal de eliminación.

### Paso 4: Revisar la Información (Primera Pantalla)

El modal te mostrará un resumen completo de la eliminación:

**Secciones que verás:**

1. **Información de la Venta**
   - Fecha y hora exacta
   - Número de guía
   - Vendedor que realizó la venta

2. **Cliente**
   - Nombre del cliente
   - DNI (si está disponible)

3. **Resumen Financiero**
   - Subtotal de productos
   - Descuentos aplicados
   - Total de venta

4. **Productos Restaurados**
   - Lista completa de productos
   - Cantidades que serán restauradas al stock
   - Colores y descripción de productos

5. **Anticipos Restaurados** (si aplica)
   - Monto de cada anticipo
   - Método de pago
   - Se devolverán al cliente como disponibles

6. **Información Importante**
   - Advertencias sobre la operación
   - Que esta acción es irreversible

### Paso 5: Confirmar Eliminación (Segunda Pantalla)

Después de revisar, haz clic en **"Continuar con Eliminación"**

Se abrirá una segunda pantalla de confirmación final que muestra:
- Resumen de cambios que ocurrirán
- Último recordatorio de que esto no se puede deshacer
- Monto total que será eliminado

### Paso 6: Eliminar

Para completar la eliminación, haz clic en **"Eliminar Venta Permanentemente"**

El sistema:
1. Eliminará la venta
2. Restaurará el stock de todos los productos
3. Devolverá los anticipos al cliente
4. Registrará la acción en el historial de auditoría
5. Mostrará un mensaje de confirmación

## Ejemplos de Uso

### Ejemplo 1: Corregir Error de Venta

**Situación:** Se registró una venta por error al cliente equivocado.

**Solución:**
1. Busca la venta incorrecta en el historial
2. Haz clic en eliminar
3. El stock vuelve, los anticipos se restauran
4. Crea la venta correcta

### Ejemplo 2: Devolver Venta Completa

**Situación:** El cliente quiere devolver todos los productos comprados.

**Solución:**
1. Encuentra la venta en el historial
2. Haz clic en eliminar
3. Todo vuelve a la normalidad
4. Si el cliente pagó, registra un nuevo anticipo

### Ejemplo 3: Corregir Anticipos Mal Asignados

**Situación:** Se asignaron anticipos incorrectamente a una venta.

**Solución:**
1. Elimina la venta (anticipos se restauran)
2. Crea la venta nuevamente con los anticipos correctos

## Qué Sucede Cuando Eliminas una Venta

| Elemento | Antes | Después |
|----------|-------|---------|
| **Stock** | Disminuido | Restaurado completamente |
| **Anticipos** | Vinculados a venta | Disponibles para cliente |
| **Historial** | Venta existente | Venta eliminada |
| **Auditoría** | No hay registro | Evento registrado |
| **Otras Ventas** | N/A | No se afectan |

## Información Importante

⚠️ **ADVERTENCIAS:**

1. **Irreversible**: Una vez eliminada, la venta no se puede recuperar
2. **Completa**: Se elimina toda la información de la venta
3. **Instantánea**: El cambio es inmediato en todo el sistema
4. **Auditable**: Queda registro de quién eliminó la venta

✓ **VENTAJAS:**

1. **Segura**: Requiere confirmación en dos pasos
2. **Intuitiva**: Modal muestra toda la información necesaria
3. **Atómica**: Todas las operaciones se hacen juntas (todo o nada)
4. **Completa**: Restaura stock y anticipos automáticamente

## Preguntas Frecuentes

**P: ¿Puedo deshacer una eliminación?**
R: No. Una vez eliminada, la venta desaparece permanentemente. Es importante revisar bien antes de confirmar.

**P: ¿Qué ocurre con los anticipos cuando elimino una venta?**
R: Se convierten en anticipos disponibles sin venta asociada, listos para usar en una nueva venta.

**P: ¿Se eliminan los detalles de la venta también?**
R: Sí. Todo asociado a la venta se elimina: detalles, anticipos vinculados, etc.

**P: ¿Se afectan otras ventas del cliente?**
R: No. Solo se elimina la venta que seleccionaste. Las demás se mantienen igual.

**P: ¿Se registra quién eliminó la venta?**
R: Sí. Se guarda en el historial de eventos junto con la fecha y hora exacta.

**P: ¿Hay restricción de tiempo para eliminar?**
R: No. Puedes eliminar ventas antiguas o recientes sin limitación.

**P: ¿Qué pasa si el producto ya no existe?**
R: El stock se restaura de todas formas. El sistema maneja productos eliminados automáticamente.

## Restricciones Futuras (Configurables)

Por ahora, todos los usuarios pueden eliminar ventas. En el futuro se pueden configurar:
- Solo administradores pueden eliminar
- Solo ventas del mismo día
- Requiere aprobación de supervisor
- Historial de eliminaciones archivadas

## Contacto

Si tienes preguntas sobre esta funcionalidad, consulta con tu administrador del sistema.

---

**Última actualización**: 7 de Noviembre de 2024
**Versión**: 1.0
