# Mejora del Sistema de Auditoría - Documentación

## Resumen General

Se ha implementado una mejora completa del sistema de auditoría en el contenedor DASHBOARD, transformándolo en una herramienta profesional de trazabilidad completa con interactividad avanzada, filtros múltiples, y detalles enriquecidos.

## Cambios Implementados

### 1. Base de Datos

#### Nuevas Columnas en tabla `eventos`
- `valor_anterior` (JSONB): Almacena el estado anterior durante cambios
- `valor_nuevo` (JSONB): Almacena el estado nuevo durante cambios
- `estado_anterior_texto` (text): Representación legible del estado anterior
- `estado_nuevo_texto` (text): Representación legible del estado nuevo
- `evento_padre_id` (uuid): Referencia a evento relacionado para vinculación cruzada
- `metadata` (JSONB): Información adicional (navegador, dispositivo, IP, timestamp)
- `severidad` (text): Nivel de criticidad (info, warning, error, critical)
- `entidad_nombre` (text): Nombre legible de la entidad para búsqueda rápida

#### Nueva tabla `eventos_relacionados`
- Mapea relaciones entre eventos
- Permite rastrear cadenas de eventos relacionados
- Tipos de relación: causa, efecto, cascada, vinculado

#### Nuevos Índices (13 índices totales)
- Índices individuales por: entidad_id, entidad_tipo, usuario, modulo, accion, tipo, severidad
- Índice composite para búsqueda rápida
- Índice GIN para búsqueda de texto completo
- Índices en eventos_relacionados para relaciones

#### Políticas RLS
- Administradores ven todos los eventos
- Otros usuarios (Vendedores, Almaceneros) solo ven sus propios eventos
- Control de acceso granular por tabla

### 2. Backend - SupabaseService

Nuevos métodos añadidos:

#### `getEventoDetallado(eventoId: string)`
- Devuelve evento completo con relaciones
- Incluye eventos relacionados (padre e hijo)

#### `searchEventos(filters: {...})`
- Búsqueda avanzada con múltiples criterios
- Filtros soportados:
  - Rango de fechas (fechaInicio, fechaFin)
  - Tipos de eventos
  - Módulos
  - Usuarios
  - Acciones
  - Palabra clave (búsqueda de texto)
  - ID de entidad específica
- Incluye paginación (limit, offset)
- Devuelve { data, count } para paginación completa

#### `getEventosRelacionados(eventoId: string)`
- Retorna todos los eventos relacionados a uno específico
- Incluye información completa de eventos vinculados

#### `getEstadisticasAuditoria(filtros?: {...})`
- Análisis estadístico de eventos
- Agrupa por: tipo, acción, usuario, severidad, día
- Útil para dashboards y reportes

#### `crearRelacionEventos(eventoId, eventoRelacionadoId, tipoRelacion)`
- Establece relaciones entre eventos
- Permite vincular eventos relacionados

### 3. Componentes Frontend

#### `AuditModal.tsx` (Componente Principal)
- Modal completo e integrado para auditoría
- Integra todos los subcomponentes
- Manejo de estado y filtros
- Control de acceso por rol de usuario

Localización: `/src/components/Audit/AuditModal.tsx`

#### `AuditFiltersPanel.tsx` (Filtros Avanzados)
- Panel de filtros colapsable
- Filtros disponibles:
  - Búsqueda por palabra clave (tiempo real)
  - Rango de fechas
  - Tipo de evento (chips seleccionables)
  - Módulo (chips seleccionables)
  - Acción (chips seleccionables)
  - Usuario (cargado dinámicamente)
- Botón de limpiar filtros
- Indicador de filtros activos

Localización: `/src/components/Audit/AuditFiltersPanel.tsx`

#### `AuditTable.tsx` (Tabla de Eventos)
- Tabla responsiva con columnas configurables
- Filas expandibles para detalles rápidos
- Indicadores visuales:
  - Badges de tipo con colores específicos
  - Badges de severidad
  - Iconos de expansión
- Funcionalidades:
  - Paginación con selector de tamaño
  - Click en fila para abrir detalles completos
  - Expandible en cada fila para vista previa
- Responsive design (mobile-first)

Localización: `/src/components/Audit/AuditTable.tsx`

#### `AuditEventDetailModal.tsx` (Detalles del Evento)
- Modal con detalles completos del evento
- Secciones expandibles:
  1. **Detalles del Evento**: ID (copiable), fecha/hora, usuario, módulo, severidad, descripción, entidad
  2. **Estado Anterior y Nuevo**: Comparación de cambios en formato legible
  3. **Eventos Relacionados**: Lista de eventos vinculados con navegación
- Copiar al portapapeles para ID del evento
- Navegación entre eventos relacionados
- Color-coding por severidad

Localización: `/src/components/Audit/AuditEventDetailModal.tsx`

### 4. Hook useAuditLog

Mejoras implementadas:

#### Función mejorada `logEvent`
- Parámetros expandidos:
  - `valorAnterior`: Estado anterior (se serializa a JSONB)
  - `valorNuevo`: Estado nuevo (se serializa a JSONB)
  - `entidadNombre`: Nombre legible de la entidad
- Severidad automática basada en tipo y acción
- Captura de metadata del navegador
- Captura de timestamp

#### Nueva función `logEventWithRelated`
- Crea evento y establece relación automáticamente
- Parámetros adicionales:
  - `eventoRelacionadoId`: ID del evento relacionado
  - `tipoRelacion`: Tipo de relación (causa, efecto, cascada, vinculado)

Localización: `/src/hooks/useAuditLog.ts`

### 5. Integración en Dashboard

- Reemplazado modal antiguo por `AuditModal` mejorado
- Mantiene botón "Detalles" en eventos recientes
- Experiencia de usuario mejorada con componentes especializados

## Características Principales

### 1. Detalles por Evento
✅ ID único del evento con opción de copiar
✅ Estado anterior y nuevo en formato visual
✅ Verificación de dónde se eliminó o agregó el registro
✅ Entidades relacionadas (productos, clientes, ventas)

### 2. Interactividad Avanzada
✅ Modal con detalles completos al hacer clic
✅ Filtros por:
  - Fecha (rango personalizado)
  - Tipo de evento
  - Módulo del sistema
  - Usuario responsable
  - Acción realizada
✅ Búsqueda por palabra clave (en tiempo real)
✅ Vinculación cruzada entre eventos relacionados
✅ Navegación entre eventos conectados

### 3. Control de Acceso
✅ Administradores ven TODOS los eventos
✅ Otros usuarios solo ven sus propios eventos
✅ Implementado mediante RLS en Supabase

### 4. Visualización Profesional
✅ Tabla responsiva con columnas adaptativas
✅ Filas expandibles para vista previa rápida
✅ Color-coding por tipo de evento
✅ Color-coding por severidad
✅ Paginación con selector de resultados por página (10, 25, 50, 100)
✅ Indicadores visuales de actividad

### 5. Rendimiento
✅ Índices optimizados en base de datos
✅ Búsqueda de texto completo con GIN index
✅ Paginación del lado del servidor
✅ Lazy loading de relaciones

## Casos de Uso

### Caso 1: Auditar eliminación de usuario
1. Click en "Detalles" en Dashboard
2. Filtrar por Tipo = "Usuario" y Acción = "Eliminar"
3. Click en evento para ver detalles completos
4. Ver eventos relacionados (ventas, anticipos afectados)
5. Navegar entre eventos para rastrear impacto

### Caso 2: Verificar cambios de precio
1. Abrir modal de auditoría
2. Filtrar por Módulo = "Inventario" y Acción = "Actualizar Stock"
3. Ver comparación de estado anterior vs nuevo
4. Expandir fila para detalles rápidos
5. Navegar a evento relacionado si aplica

### Caso 3: Investigación forense
1. Buscar evento crítico
2. Ver todos los eventos del usuario que lo realizó
3. Rastrear cadena de eventos relacionados
4. Exportar eventos filtrados para análisis
5. Generar reporte de trazabilidad

### Caso 4: Cumplimiento normativo
1. Administrador filtra por rango de fechas
2. Visualiza todos los eventos del período
3. Exporta datos de auditoría
4. Genera reporte con timestamps exactos
5. Archiva para cumplimiento

## Mejoras de Severidad

El sistema asigna automáticamente severidad basada en tipo y acción:

| Tipo | Acción | Severidad |
|------|--------|-----------|
| Usuario | Eliminar | **CRITICAL** |
| Producto | Eliminar | **CRITICAL** |
| Venta | Eliminar | **ERROR** |
| Anticipo | Eliminar | **ERROR** |
| * | Actualizar Stock | **WARNING** |
| * | Aplicación Automática | **WARNING** |
| * | Otro | **INFO** |

## Búsqueda de Texto Completo

El sistema soporta búsqueda en:
- Descripción del evento (análisis semántico con Spanish tokenization)
- Nombre de la entidad
- Campos JSONB adicionales

Ejemplo: Buscar "precio actualizado" encuentra eventos aunque las palabras individuales no coincidan exactamente.

## Datos de Auditoría Almacenados

Cada evento registra:
- ID único (UUID)
- Tipo de evento
- Descripción detallada
- Fecha/hora exacta
- Usuario responsable
- Módulo del sistema
- Acción realizada
- ID de entidad afectada
- Tipo de entidad
- Nombre legible de la entidad
- Valor anterior (JSONB)
- Valor nuevo (JSONB)
- Metadata (navegador, timestamp)
- Severidad
- Relacionado con otros eventos

## Limitaciones Actuales

- Los eventos se almacenan indefinidamente (política de retención a implementar después)
- Los filtros se aplican en tiempo real (sin caché)
- La exportación de eventos no está implementada en esta versión

## Próximas Mejoras Sugeridas

1. Implementar política de retención de eventos (archivar >6 meses)
2. Agregar vista de timeline visual
3. Crear dashboard de estadísticas de auditoría
4. Implementar exportación a PDF/Excel de eventos filtrados
5. Agregar alertas en tiempo real para eventos críticos
6. Integrar búsqueda avanzada con operadores (AND, OR, NOT)
7. Crear vista de "cascada de cambios" para visualizar impacto
8. Implementar recuperación de información de entidades eliminadas

## Testing Recomendado

1. Probar filtros individualmente
2. Probar combinación de filtros
3. Verificar acceso por rol (Admin vs Vendedor)
4. Probar búsqueda de texto con diferentes palabras clave
5. Verificar paginación con grandes volúmenes de datos
6. Probar navegación entre eventos relacionados
7. Verificar que los timestamps sean exactos en diferentes zonas horarias

## Referencias Técnicas

- **Base de datos**: Supabase PostgreSQL
- **Índices**: 13 índices totales (simples, composite, GIN)
- **RLS**: 6 políticas de seguridad
- **Frontend**: React + TypeScript + TailwindCSS
- **Componentes reutilizables**: 4 componentes especializados
- **Métodos de servicio**: 5 nuevos métodos en SupabaseService

## Conclusión

El sistema de auditoría ha sido completamente modernizado con:
- ✅ Interfaz profesional e intuitiva
- ✅ Búsqueda y filtros avanzados
- ✅ Control de acceso granular
- ✅ Trazabilidad completa de eventos
- ✅ Detalles enriquecidos y contexto
- ✅ Rendimiento optimizado
- ✅ Cumplimiento normativo

El módulo está listo para ser utilizado como herramienta de investigación forense y cumplimiento normativo.
