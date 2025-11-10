# Guía de Funcionamiento: Sistema de Pestañas Tintorería/Hilandería

## Descripción General

El sistema ahora divide automáticamente los productos registrados en dos áreas de trabajo independientes mediante un sistema de pestañas inteligente con navegación automática.

---

## Las Dos Pestañas

### 🎁 TINTORERÍA (Pestaña Azul)
**Función**: Almacena madejas crudas a procesar

- **Estado de productos**: `Por Devanar`
- **Qué ves**: Madejas crudas sin procesar
- **Stock**: Muestra "En proceso..." (no es aplicable)
- **Cantidad**: Número de madejas crudas
- **Acción**: Registrar madejas nuevas o procesar a Hilandería

### 📊 HILANDERÍA (Pestaña Verde)
**Función**: Almacena conos procesados

- **Estado de productos**: `Conos Devanados` o `Conos Veteados`
- **Qué ves**: Conos ya procesados
- **Stock**: Cantidad de conos disponibles
- **Cantidad**: Cantidad de madejas que se procesaron
- **Acción**: Vender o gestionar stock

---

## Cómo Registrar Productos

### ESCENARIO 1: Registrar Madejas en Tintorería

```
Paso 1: Haz clic en "➕ Nuevo Producto"
       ↓
Paso 2: Selecciona "Tintorería"
       ↓
Paso 3: Completa el formulario:
       - Nombre: Madejas Crudas (o Madejas Reteñidas)
       - Color: Rojo, Azul, Verde, etc.
       - Cantidad: 500 (número de madejas)
       - Fecha: La fecha de hoy
       - Descripción: Opcional
       ↓
Paso 4: Haz clic en "Crear Producto"
       ↓
RESULTADO:
✓ El sistema cambia automáticamente a la pestaña "Tintorería"
✓ El producto aparece en la tabla con una animación VERDE que parpadea por 3 segundos
✓ Vemos el número de madejas en la columna "Cantidad de Madejas"
```

**Ejemplo:**
```
Pestaña: Tintorería (5)
┌────────────────────────────────────────────┐
│ Producto  │ Color  │ Estado    │ Cantidad │
├────────────────────────────────────────────┤
│ Madejas   │ Rojo   │ Por Dev.. │ 500      │ ← Aparece aquí con animación verde
└────────────────────────────────────────────┘
```

---

### ESCENARIO 2: Procesar Madejas a Conos en Hilandería

```
Paso 1: Haz clic en la pestaña "Hilandería"
       ↓
Paso 2: Haz clic en "➕ Nuevo Producto"
       ↓
Paso 3: Selecciona "Hilandería"
       ↓
El sistema muestra los productos Por Devanar disponibles en Tintorería
       ↓
Paso 4: Haz DOBLE CLIC en el producto a procesar
       ↓
Se abre un formulario con campos:
       - Estado: Conos Devanados / Conos Veteados
       - Cantidad a Procesar: Número de madejas a convertir en conos
       - Precio Base: Precio por cono
       - Precio Unitario: Se copia automáticamente del Precio Base
       - Stock Final: Se calcula automáticamente (cantidad ÷ 2)
       ↓
Paso 5: Completa los datos y haz clic en "Agregar Productos"
       ↓
RESULTADO:
✓ Se crea un NUEVO producto en Hilandería con estado "Conos Devanados"
✓ La fecha del nuevo producto es HOY (fecha actual de procesamiento)
✓ El producto original en Tintorería se actualiza:
  - Si procesaste TODO: cantidad = 0 (pero sigue visible)
  - Si procesaste PARTE: cantidad se reduce (ej: 500 - 300 = 200)
✓ El sistema cambia automáticamente a la pestaña "Hilandería"
✓ El nuevo Cono aparece con animación VERDE que parpadea por 3 segundos
```

**Ejemplo:**
```
ANTES (Tintorería):
┌────────────────────────────────────────────┐
│ Producto  │ Color │ Estado    │ Cantidad   │
├────────────────────────────────────────────┤
│ Madejas   │ Rojo  │ Por Dev.. │ 500        │
└────────────────────────────────────────────┘

PROCESAMIENTO: 300 madejas → Conos Devanados

DESPUÉS (Tintorería):
┌────────────────────────────────────────────┐
│ Producto  │ Color │ Estado    │ Cantidad   │
├────────────────────────────────────────────┤
│ Madejas   │ Rojo  │ Por Dev.. │ 200        │ ← Cantidad reducida
└────────────────────────────────────────────┘

DESPUÉS (Hilandería):
┌────────────────────────────────────────────────┐
│ Producto │ Color │ Estado       │ Stock │      │
├────────────────────────────────────────────────┤
│ Cono     │ Rojo  │ Conos Dev.. │ 150   │ ✨ │ ← Nuevo, con animación
└────────────────────────────────────────────────┘
```

---

## Navegación Automática Inteligente

El sistema detecta automáticamente dónde estás y te navega a la pestaña correcta.

### Tabla de Comportamiento

| Usuario está en... | Registra un... | Sistema hace... | Resultado |
|-------------------|----------------|-----------------|-----------|
| Tintorería | Tintorería | Permanece en Tintorería | Ves el nuevo producto inmediatamente |
| Hilandería | Hilandería | Permanece en Hilandería | Ves el nuevo Cono inmediatamente |
| Hilandería | Tintorería | Cambia a Tintorería | Se navega automáticamente |
| Tintorería | Hilandería | Cambia a Hilandería | Se navega automáticamente |

---

## Animación Verde (3 segundos)

Cuando agregas un producto, la fila parpadea en VERDE SUAVE para que identifiques inmediatamente dónde está.

```
Parpadeo: Verde claro ↔ Transparente ↔ Verde claro ↔ ...
Duración: 3 segundos (5 ciclos de parpadeo)
Propósito: Confirmación visual de que el producto se registró correctamente
```

---

## Persistencia de Productos

### IMPORTANTE: Los productos NO se eliminan

#### Antes (Comportamiento Antiguo)
❌ Cuando procesabas TODO el stock en Hilandería:
   - El producto de Tintorería SE BORRABA
   - No quedaba rastro del procesamiento
   - Imposible auditar

#### Ahora (Comportamiento Nuevo)
✓ Cuando procesas TODO el stock en Hilandería:
   - El producto de Tintorería SE MANTIENE con cantidad = 0
   - Queda el historial completo
   - Puedes ver qué se procesó

#### Cuando procesas PARTE del stock:
✓ El producto de Tintorería se actualiza con la cantidad restante
✓ Se crea un nuevo producto en Hilandería
✓ Ambos productos quedan registrados

---

## Fechas Registradas Correctamente

### Antes (Comportamiento Antiguo)
❌ Nuevo Cono heredaba la fecha del Madeja original
   - Mostraba fecha incorrecta
   - No sabías cuándo se procesó realmente

### Ahora (Comportamiento Nuevo)
✓ Nuevo Cono tiene la fecha ACTUAL de creación
✓ Refleja cuándo se procesó realmente
✓ Cada producto tiene su fecha exacta

**Ejemplo:**
```
Madejas registradas en: 01/10/2025
Procesadas a Conos en:  10/11/2025

Antes:  Cono mostraba fecha 01/10/2025 ❌ (incorrecto)
Ahora:  Cono muestra fecha 10/11/2025 ✓ (correcto)
```

---

## Búsqueda de Productos

La búsqueda funciona en ambas pestañas independientemente.

```
Pestaña Tintorería + Buscar "rojo"
→ Muestra solo productos Por Devanar con "rojo" en nombre/color

Pestaña Hilandería + Buscar "azul"
→ Muestra solo Conos (Devanados o Veteados) con "azul" en nombre/color
```

---

## Contadores en Tiempo Real

Las pestañas muestran contadores que se actualizan automáticamente:

```
🎁 Tintorería (5)     ← Hay 5 productos Por Devanar
📊 Hilandería (8)     ← Hay 8 Conos (Devanados o Veteados)
```

---

## Acciones en la Tabla

Cada producto tiene 3 botones de acción:

| Botón | Función |
|-------|---------|
| 👁️ | Ver detalles completos del producto |
| ✏️ | Editar información (nombre, color, precio, etc.) |
| 🗑️ | Eliminar el producto |

---

## Casos de Uso Comunes

### Caso 1: Registrar madejas crudas del día
```
1. Pestaña Tintorería
2. ➕ Nuevo Producto → Tintorería
3. Llenar: Madejas Crudas, Rojo, 1000 unidades, hoy
4. Crear
→ Ves inmediatamente en Tintorería con animación verde
```

### Caso 2: Procesar 500 madejas a conos
```
1. Pestaña Hilandería
2. ➕ Nuevo Producto → Hilandería
3. Doble clic en "Madejas 1000 Rojo"
4. Cantidad: 500, Estado: Conos Devanados, Precio: 50
5. Agregar Productos
→ Cono 250 stock aparece en Hilandería con animación
→ Madejas reduce a 500 cantidad en Tintorería
```

### Caso 3: Encontrar un producto específico
```
1. Busca por color: Escribe "Azul" en búsqueda
2. O busca por nombre: Escribe "Cono"
3. Se filtra automáticamente en la pestaña actual
```

---

## Icono en la Tabla de Tintorería

En la columna "Stock En Conos", verás:

```
En Tintorería:
"En proceso..." → Porque aún no se convirtió a conos

En Hilandería:
150 (número)    → Cantidad de conos disponibles
```

---

## Flujo Diario Típico

```
MAÑANA:
1. Reciben 1000 madejas rojas
2. Van a Tintorería → Nuevo Producto → Registran 1000
3. Ven inmediatamente en pestaña Tintorería ✓

TARDE:
1. Procesan 600 madejas a conos
2. Van a Hilandería → Nuevo Producto → Hilandería
3. Procesan 600 → Conos Devanados
4. Ven inmediatamente en pestaña Hilandería ✓
5. Tintorería ahora muestra 400 madejas restantes ✓

MAÑANA SIGUIENTE:
1. Procesan las 400 restantes a conos
2. Repiten proceso
3. Tintorería muestra 0 madejas, Hilandería tiene todos los conos ✓
```

---

## Preguntas Frecuentes

**P: ¿Qué pasa si proceso TODO el stock?**
R: El producto en Tintorería se marca con cantidad = 0, pero sigue visible. Puedes ver que se procesó todo.

**P: ¿Se cambia la fecha si edito un producto?**
R: La fecha se registra al crearlo. Si lo editas después, puedes verla en "Ver detalles".

**P: ¿Puedo buscar entre ambas pestañas?**
R: No, la búsqueda es por pestaña actual. Cambia de pestaña para buscar en la otra.

**P: ¿Se pierden los datos si elimino un producto?**
R: Sí, si eliminas un producto, se borra completamente. Úsalo con cuidado.

**P: ¿Puedo cambiar el estado de un producto?**
R: Sí, en la tabla edita el producto (botón ✏️) y cambia el estado.

---

## Resumen Visual

```
                    ┌─────────────────────────┐
                    │    INVENTARIO.tsx       │
                    └─────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
            [Tintorería]              [Hilandería]
            Estado: Por Devanar       Estado: Conos Devanados
                                              o Conos Veteados
            • Madejas crudas         • Conos procesados
            • Stock = "En proceso"   • Stock = número real
            • Cantidad = madejas     • Cantidad = madejas usadas
            • Fecha = entrada        • Fecha = procesamiento
                │                           │
                └─────────────┬─────────────┘
                        Navegación
                        Automática ✓
                        Animación
                        Verde 3s ✓
```

---

**¡Listo para usar!**

El sistema está completamente funcional e integrado. Disfruta de la separación clara entre Tintorería e Hilandería con navegación automática y retroalimentación visual.
