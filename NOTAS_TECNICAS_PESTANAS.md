# Notas Técnicas: Sistema de Pestañas Tintorería/Hilandería

## Arquitectura de la Solución

### Componentes Principales

```
Inventario.tsx (Componente Principal)
├── Estado Global
│   ├── activeTab: 'tintoreria' | 'hilanderia'
│   ├── highlightedProductId: string | null
│   ├── productos: Producto[]
│   └── filteredProductos: Producto[]
├── Funciones de Filtrado
│   └── filterProductos() ← Dinamica según pestaña
├── Handlers de Formulario
│   ├── handleTintoreriaSubmit()
│   └── handleHilanderiaSubmit()
└── UI
    ├── Tabs Container
    ├── Products Table
    └── Modals
```

### Flujo de Datos

```
Usuario interactúa
        │
        ├─→ handleTintoreriaSubmit()
        │       └─→ Crea producto (estado: 'Por Devanar')
        │       └─→ setActiveTab('tintoreria')
        │       └─→ setHighlightedProductId()
        │       └─→ setTimeout(..., 3000) ← Limpia highlight
        │
        ├─→ handleHilanderiaSubmit()
        │       └─→ Calcula cantidad procesada
        │       └─→ Crea fecha_registro = now()
        │       └─→ Crea producto (estado: 'Conos Devanados'/'Conos Veteados')
        │       └─→ Actualiza producto original (cantidad = 0 o reducida)
        │       └─→ setActiveTab('hilanderia')
        │       └─→ setHighlightedProductId()
        │
        └─→ setActiveTab(newTab)
                └─→ filterProductos() se ejecuta en useEffect
                        └─→ setFilteredProductos()
                                └─→ UI re-renderiza
```

---

## Implementación del Sistema de Pestañas

### Estados Utilizados

```typescript
const [activeTab, setActiveTab] = useState<'tintoreria' | 'hilanderia'>('tintoreria');
const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
```

### Lógica de Filtrado Actualizada

```typescript
const filterProductos = () => {
  let filtered = productos;

  // Filtrar por pestaña activa
  if (activeTab === 'tintoreria') {
    filtered = productos.filter(p => p.estado === 'Por Devanar');
  } else {
    filtered = productos.filter(p =>
      p.estado === 'Conos Devanados' || p.estado === 'Conos Veteados'
    );
  }

  // Aplicar búsqueda
  if (searchTerm) {
    filtered = filtered.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  setFilteredProductos(filtered);
};
```

### useEffect Modificado

```typescript
useEffect(() => {
  filterProductos();
}, [productos, searchTerm, activeTab]);  // ← activeTab agregado
```

---

## Navegación Automática entre Pestañas

### Tintorería

```typescript
const handleTintoreriaSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // ... validaciones y creación del producto

    const newProduct = await SupabaseService.createProducto(productoData);
    toast.success('Producto de tintorería creado correctamente');

    // Cargar productos actualizados
    loadProductos();
    setShowTintoreriaModal(false);
    resetForm();

    // Navegación automática
    setActiveTab('tintoreria');
    setHighlightedProductId(newProduct.id);
    setTimeout(() => setHighlightedProductId(null), 3000);
  } catch (error) {
    // ... manejo de error
  }
};
```

### Hilandería

```typescript
const handleHilanderiaSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedProduct) return;

  try {
    // ... validaciones

    const fechaActual = new Date().toISOString();  // ← CLAVE: fecha actual
    let nuevoProductoId: string | null = null;

    if (cantidadProcesada === cantidadOriginal) {
      // Caso: procesar TODO el stock
      const nuevoProducto = {
        nombre: 'Cono',
        color: selectedProduct.color,
        descripcion: selectedProduct.descripcion,
        estado: hilanderiaData.estado,
        precio_base: parseFloat(hilanderiaData.precio_base),
        precio_uni: parseFloat(hilanderiaData.precio_uni),
        stock: parseInt(hilanderiaData.stock),
        cantidad: cantidadProcesada,
        fecha_ingreso: fechaActual,      // ← Fecha actual
        fecha_registro: fechaActual      // ← Fecha actual
      };

      const newProduct = await SupabaseService.createProducto(nuevoProducto);
      nuevoProductoId = newProduct.id;

      // Mantener producto original con cantidad = 0
      await SupabaseService.updateProducto(selectedProduct.id, {
        cantidad: 0
      });

      toast.success('Producto procesado completamente');
    } else {
      // Caso: procesar PARTE del stock
      const nuevoProducto = {
        nombre: 'Cono',
        color: selectedProduct.color,
        descripcion: selectedProduct.descripcion,
        estado: hilanderiaData.estado,
        precio_base: parseFloat(hilanderiaData.precio_base),
        precio_uni: parseFloat(hilanderiaData.precio_uni),
        stock: parseInt(hilanderiaData.stock),
        cantidad: cantidadProcesada,
        fecha_ingreso: fechaActual,      // ← Fecha actual
        fecha_registro: fechaActual      // ← Fecha actual
      };

      const newProduct = await SupabaseService.createProducto(nuevoProducto);
      nuevoProductoId = newProduct.id;

      // Actualizar cantidad del original
      await SupabaseService.updateProducto(selectedProduct.id, {
        cantidad: cantidadOriginal - cantidadProcesada
      });

      toast.success('Conos creados correctamente. Cantidad restante actualizada.');
      setShowContinueModal(true);
    }

    loadProductos();
    setShowHilanderiaDetailModal(false);
    resetForm();

    // Navegación automática
    if (nuevoProductoId) {
      setActiveTab('hilanderia');
      setHighlightedProductId(nuevoProductoId);
      setTimeout(() => setHighlightedProductId(null), 3000);
    }
  } catch (error) {
    // ... manejo de error
  }
};
```

---

## Sistema de Animación

### CSS Keyframes

```css
@keyframes pulse-highlight {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(34, 197, 94, 0.15);  /* Verde suave */
  }
}

.highlight-pulse {
  animation: pulse-highlight 0.6s ease-in-out infinite;
}
```

### Aplicación en JSX

```tsx
<tr
  className={`hover:bg-gray-50 transition-colors ${
    highlightedProductId === producto.id ? 'highlight-pulse' : ''
  }`}
>
  {/* contenido de la fila */}
</tr>
```

### Temporización

```typescript
// Al crear un producto
setHighlightedProductId(newProduct.id);  // Inicia animación

// Después de 3 segundos
setTimeout(() => setHighlightedProductId(null), 3000);  // Termina animación

// Cálculo:
// Duración de keyframe: 0.6s
// Ciclos en 3 segundos: 3000ms / 600ms = 5 ciclos completos
// Efecto visual: parpadeo suave durante 3 segundos
```

---

## Corrección de Persistencia de Datos

### Lógica Anterior (INCORRECTA)

```typescript
// ❌ El producto se eliminaba cuando se procesaba todo
if (cantidadProcesada === cantidadOriginal) {
  // Solo actualizar con nuevo nombre y estado
  await SupabaseService.updateProducto(selectedProduct.id, {
    nombre: 'Cono',
    estado: hilanderiaData.estado,
    precio_base: parseFloat(hilanderiaData.precio_base),
    precio_uni: parseFloat(hilanderiaData.precio_uni),
    stock: parseInt(hilanderiaData.stock)
  });
  // Problema: El producto desaparece de Tintorería
}
```

### Lógica Nueva (CORRECTA)

```typescript
// ✓ Se crea producto nuevo y se mantiene el original
if (cantidadProcesada === cantidadOriginal) {
  // Crear nuevo producto en Hilandería
  const nuevoProducto = {
    nombre: 'Cono',
    estado: hilanderiaData.estado,
    // ... otros campos
  };
  const newProduct = await SupabaseService.createProducto(nuevoProducto);

  // Mantener producto original en Tintorería con cantidad = 0
  await SupabaseService.updateProducto(selectedProduct.id, {
    cantidad: 0
  });
  // Ventajas:
  // - Producto sigue visible en Tintorería (historial)
  // - Se puede auditar qué se procesó
  // - Rastro completo de la operación
}
```

---

## Corrección de Fecha de Registro

### Problema Anterior

```typescript
// ❌ Heredaba fecha del original
fecha_registro: selectedProduct.fecha_registro
// Resultado: Cono mostraba fecha del Madeja original, no la de procesamiento
```

### Solución Implementada

```typescript
// ✓ Genera fecha actual al procesar
const fechaActual = new Date().toISOString();

const nuevoProducto = {
  // ...
  fecha_ingreso: fechaActual,       // Timestamp exacto
  fecha_registro: fechaActual       // Timestamp exacto
};
```

### Ventajas

- Cada producto tiene su fecha exacta de creación
- Los Conos muestran cuándo se procesaron realmente
- Base de datos auditables y precisas
- Reportes temporales son fiables

---

## Interfaz de Pestañas

### HTML/CSS Structure

```tsx
<div className="border-b border-gray-200">
  <div className="flex">
    {/* Tab 1: Tintorería */}
    <button
      onClick={() => setActiveTab('tintoreria')}
      className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
        activeTab === 'tintoreria'
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        <Package size={18} />
        <span>Tintorería</span>
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          {productos.filter(p => p.estado === 'Por Devanar').length}
        </span>
      </div>
    </button>

    {/* Tab 2: Hilandería */}
    <button
      onClick={() => setActiveTab('hilanderia')}
      className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
        activeTab === 'hilanderia'
          ? 'border-b-2 border-green-600 text-green-600'
          : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        <BarChart3 size={18} />
        <span>Hilandería</span>
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          {productos.filter(p =>
            p.estado === 'Conos Devanados' || p.estado === 'Conos Veteados'
          ).length}
        </span>
      </div>
    </button>
  </div>
</div>
```

### Características

- ✓ Contadores dinámicos (se actualizan en tiempo real)
- ✓ Indicadores visuales (colores: azul/verde)
- ✓ Iconos descriptivos (Package/BarChart3)
- ✓ Transiciones suaves (transition-all)
- ✓ Responsive (flex layout)

---

## Estados de Productos en Base de Datos

```sql
CHECK (estado IN ('Por Hilandar', 'Por Devanar', 'Conos Devanados', 'Conos Veteados'))
```

### Mapeo a Pestañas

```
┌─────────────────────────────────────────┐
│         ESTADO EN BD        │   PESTAÑA   │
├─────────────────────────────────────────┤
│ Por Devanar                 │ Tintorería  │
│ Conos Devanados            │ Hilandería  │
│ Conos Veteados             │ Hilandería  │
│ Por Hilandar (obsoleto)    │ (oculto)    │
└─────────────────────────────────────────┘
```

---

## Índices de Base de Datos

El índice crítico para este sistema es:

```sql
CREATE INDEX idx_productos_estado ON productos(estado);
```

Este índice optimiza las consultas de filtrado que ocurren cada vez que:
- Se cambia de pestaña
- Se busca un producto
- Se carga la página

---

## Performance Considerations

### Rendimiento

1. **Filtrado**: O(n) - itera todos los productos
   - Aceptable para < 10,000 productos
   - Si crece, considerar paginación

2. **Animación**: GPU-acelerada (background-color)
   - No causa jank
   - Suave y eficiente

3. **Re-renders**: Solo cuando:
   - activeTab cambia
   - productos cambia
   - searchTerm cambia

### Optimizaciones Futuras

Si hay problemas de performance:

```typescript
// Opción 1: Memoizar componentes
const TableRow = React.memo(({ producto, isHighlighted }) => {...})

// Opción 2: Usar useMemo para filtrado
const filteredProductos = useMemo(() => {
  return filterProductos();
}, [productos, searchTerm, activeTab]);

// Opción 3: Paginación
const PAGE_SIZE = 50;
const paginatedProducts = filteredProductos.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);
```

---

## Testing Checklist

```
Funcionalidad:
☐ Registrar producto en Tintorería
☐ Registrar producto en Hilandería
☐ Ver producto en pestaña correcta
☐ Ver animación verde (3 segundos)
☐ Cambio automático de pestaña
☐ Búsqueda funciona en ambas pestañas
☐ Contadores se actualizan
☐ Editar y eliminar funcionan
☐ Productos antiguos se mantienen (no se eliminan)
☐ Fechas registradas correctamente

Visual:
☐ Pestañas visibles y seleccionables
☐ Colores diferenciados (azul/verde)
☐ Iconos visibles
☐ Contadores muestran números correctos
☐ Tabla vacía muestra mensaje apropiado
☐ Animación verde es notoria pero suave

Browser:
☐ Desktop (Chrome, Firefox, Safari, Edge)
☐ Mobile (iOS Safari, Chrome Mobile)
☐ Tablet (iPad, Android tablets)
```

---

## Debugging Tips

### Ver estados actuales

```typescript
// En componente Inventario.tsx
useEffect(() => {
  console.log('activeTab:', activeTab);
  console.log('filteredProductos:', filteredProductos);
  console.log('highlightedProductId:', highlightedProductId);
}, [activeTab, filteredProductos, highlightedProductId]);
```

### Inspeccionar filtros

```typescript
// Agregar en filterProductos()
console.log('Filtrando por pestaña:', activeTab);
console.log('Productos originales:', productos.length);
console.log('Productos filtrados:', filtered.length);
```

### Verificar animación

```css
/* En index.css - hacerla más evidente temporalmente */
.highlight-pulse {
  animation: pulse-highlight 0.3s ease-in-out infinite; /* Más rápido */
  background-color: rgba(34, 197, 94, 0.3); /* Más opaco */
}
```

---

## Notas Importantes para el Mantenimiento

1. **activeTab**: Siempre debe ser 'tintoreria' o 'hilanderia'
2. **highlightedProductId**: Se auto-limpia después de 3 segundos
3. **Estados de productos**: No cambiar sin actualizar filtros
4. **Fechas**: Siempre usar `new Date().toISOString()` para timestamps
5. **Persistencia**: Nunca eliminar productos originales (solo marcar con cantidad=0)

---

## Próximas Mejoras Potenciales

```typescript
// 1. Guardar pestaña preferida del usuario
localStorage.setItem('preferredTab', activeTab);
const saved = localStorage.getItem('preferredTab');

// 2. Animación más sofisticada
const transitionClasses = {
  enter: 'animate-fadeInScale',
  exit: 'animate-fadeOutScale'
};

// 3. Sincronización en tiempo real
supabase
  .from('productos')
  .on('INSERT', payload => {
    if (payload.new.estado === 'Por Devanar') {
      setHighlightedProductId(payload.new.id);
    }
  })
  .subscribe();

// 4. Estadísticas por pestaña
const stats = {
  tintoreria: {
    total: productos.filter(p => p.estado === 'Por Devanar').length,
    stock: productos
      .filter(p => p.estado === 'Por Devanar')
      .reduce((sum, p) => sum + (p.cantidad || 0), 0)
  }
};
```

---

**Última actualización**: 10 de noviembre de 2025
**Versión**: 1.0
**Estado**: Producción ✓
