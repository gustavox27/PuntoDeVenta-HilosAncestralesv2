# Guía Rápida - Sistema de Auditoría Mejorado

## Acceso al Sistema

1. Ve al **Dashboard**
2. Busca el botón **"Detalles"** en la sección "Eventos Recientes" (lado derecho)
3. Se abrirá el nuevo modal de auditoría mejorado

## Panel de Filtros

### Búsqueda Rápida
- **Campo de búsqueda**: Escribe palabras clave para buscar en descripciones y nombres de entidades
- **Tiempo real**: Los resultados se filtran mientras escribes

### Filtros Avanzados
1. Click en botón **"Filtros"** para expandir panel de filtros
2. Selecciona los criterios que necesites:

#### Fecha
- **Fecha Inicio**: Selecciona la fecha de inicio del rango
- **Fecha Fin**: Selecciona la fecha final del rango

#### Tipo de Evento
Selecciona uno o varios:
- Usuario
- Producto
- Venta
- Anticipo
- Color
- Deuda
- Pago

#### Módulo
Selecciona dónde ocurrió la acción:
- Usuarios
- Inventario
- Ventas
- Historial
- Anticipos
- Dashboard

#### Acción
Selecciona qué tipo de acción:
- Crear
- Actualizar
- Eliminar
- Aplicar
- Crear Lote
- Actualizar Stock
- Aplicación Automática

#### Usuario
Selecciona quién realizó la acción (cargado dinámicamente)

### Limpiar Filtros
- Click en botón **"Limpiar"** para resetear todos los filtros

## Tabla de Eventos

### Columnas Visibles
- **Fecha/Hora**: Cuándo ocurrió el evento
- **Tipo**: (hidden en mobile) Tipo de evento con color
- **Módulo**: (hidden en tablet) Módulo afectado
- **Acción**: (hidden en tablet) Acción realizada
- **Descripción**: Descripción del evento
- **Usuario**: Quién realizó la acción
- **Severidad**: (hidden en desktop pequeño) Nivel de severidad

### Interactividad

#### Expandir Fila
- Click en **flecha** (▼/▲) de la izquierda
- Muestra detalles rápidos sin abrir modal
- Información: Tipo, Módulo, Acción, Severidad, Entidad ID, Descripción completa

#### Ver Detalles Completos
- Click en cualquier parte de la fila (excepto flecha)
- Abre modal con detalles detallados del evento

#### Badges de Tipo
Colores según tipo de evento:
- 🟣 **Usuario** - Púrpura
- 🟢 **Producto** - Verde
- 🔵 **Venta** - Azul
- 🟠 **Anticipo** - Naranja
- 🩷 **Color** - Rosa
- 🔴 **Deuda** - Rojo
- 🟢 **Pago** - Verde

#### Badges de Severidad
Niveles de criticidad:
- 🔴 **CRITICAL** - Rojo (Eliminaciones críticas)
- 🟠 **ERROR** - Naranja (Eliminaciones importantes)
- 🟡 **WARNING** - Amarillo (Cambios de stock)
- 🔵 **INFO** - Azul (Eventos normales)

### Paginación

#### Selector de Resultados
Esquina inferior izquierda:
- Selecciona cuántos eventos mostrar por página
- Opciones: 10, 25, 50, 100

#### Navegación de Páginas
Esquina inferior derecha:
- **Anterior**: Página anterior (deshabilitado en primera página)
- **Números**: Click para ir a página específica
- **Siguiente**: Página siguiente (deshabilitado en última página)

## Modal de Detalles Completos

### Secciones Expandibles

#### 1. Detalles del Evento (Expandida por defecto)
**ID del Evento**
- Número único del evento
- Click en icono 📋 para copiar al portapapeles

**Fecha/Hora**
- Hora exacta en formato: DD Mon YYYY, HH:MM:SS

**Usuario**
- Quién realizó la acción

**Módulo**
- Dónde ocurrió la acción

**Severidad**
- Nivel de criticidad con código de color

**Descripción**
- Descripción detallada del evento

**Entidad Afectada** (si aplica)
- ID de la entidad
- Tipo de entidad (usuario, producto, venta, etc.)

#### 2. Estado Anterior y Nuevo (Colapsada por defecto)
- **Estado Anterior** (fondo rojo claro)
  - Muestra qué cambió
  - Formato legible en JSON

- **Estado Nuevo** (fondo verde claro)
  - Muestra el nuevo valor
  - Formato legible en JSON

Útil para:
- Ver cambios de precio
- Comparar estados de productos
- Verificar cambios de información de usuario

#### 3. Eventos Relacionados (Colapsada por defecto)
- Muestra cadena de eventos vinculados
- Cada evento relacionado tiene:
  - Tipo de relación (causa, efecto, cascada, vinculado)
  - Descripción
  - Fecha/hora
  - Botón "Ver" para navegar

## Casos de Uso Prácticos

### Caso 1: ¿Quién eliminó un usuario?
1. Abre auditoría
2. Filtro: Tipo = "Usuario"
3. Filtro: Acción = "Eliminar"
4. Click en evento para ver detalles
5. Verás quién lo eliminó y cuándo

### Caso 2: Auditar cambios de inventario
1. Abre auditoría
2. Filtro: Módulo = "Inventario"
3. Filtro: Acción = "Actualizar Stock"
4. Click en evento y expande "Estado Anterior y Nuevo"
5. Compara stock antes/después

### Caso 3: Investigar actividad de un vendedor
1. Abre auditoría
2. Filtro: Usuario = [nombre del vendedor]
3. Rango de fechas si es necesario
4. Revisa todos los eventos del vendedor
5. Haz click en cualquier evento para detalles

### Caso 4: Encontrar cambios por palabra clave
1. Usa campo de búsqueda
2. Escribe "precio" o "stock" o cualquier palabra
3. Los resultados se filtran automáticamente
4. Click en resultado para ver detalles

## Restricciones por Rol

### Si eres ADMINISTRADOR
✅ Ves TODOS los eventos
✅ Acceso a filtro de Usuario
✅ Puedes investigar cualquier actividad
✅ Filtros sin restricciones

### Si eres VENDEDOR, ALMACENERO o CLIENTE
❌ Solo ves TUS propios eventos
❌ No puedes ver eventos de otros usuarios
❌ Filtro de usuario está limitado a ti
✅ Puedes ver detalles de tus acciones

## Consejos y Trucos

### 🎯 Búsqueda Eficiente
- Usa palabras clave específicas
- Ejemplo: "precio 599" encuentra cambios de precio específicos
- Busca por nombre de producto o cliente

### 📅 Filtros por Fecha
- **Hoy**: Hoy a hoy
- **Últimos 7 días**: 7 días atrás a hoy
- **Mes actual**: Desde el 1º del mes a hoy
- **Personalizado**: Define tu rango específico

### 🔍 Investigación en Capas
1. Filtro amplio (por módulo)
2. Añade más criterios (por acción)
3. Refina con rango de fechas
4. Usa búsqueda de palabra clave
5. Abre detalles para investigación profunda

### 💡 Traza Impacto de Cambios
- Ver evento de eliminación
- Click en eventos relacionados
- Sigue cadena de impacto
- Entiende consecuencias completas

### 📊 Ver Estadísticas
El sistema mantiene track de:
- Eventos por día
- Eventos por tipo
- Eventos por usuario
- Eventos por severidad
- Tendencias de actividad

## Acciones Rápidas

### Copiar ID del Evento
1. Abre detalles del evento
2. Click en icono 📋 junto a ID
3. ID copiado al portapapeles
4. Pégalo donde necesites

### Navegar entre Eventos Relacionados
1. Abre detalles del evento
2. Expande "Eventos Relacionados"
3. Click en "Ver" de evento relacionado
4. Se carga automáticamente el nuevo evento

### Expandir/Contraer Detalles
- Click en títulos de secciones para expandir/contraer
- Ahorra espacio de pantalla
- Foco en lo que necesitas

## Exportación (Próximamente)

Las siguientes características estarán disponibles pronto:
- Exportar eventos a PDF
- Exportar eventos a Excel
- Generar reporte de trazabilidad
- Archivar eventos

## Errores Comunes

### "No hay eventos registrados"
- ✓ Verifica rango de fechas
- ✓ Limpia todos los filtros
- ✓ Si eres vendedor, solo ves tus eventos
- ✓ Intenta con más días atrás

### "No veo eventos de otro usuario"
- ✓ Si eres admin: usa filtro Usuario
- ✓ Si no eres admin: solo ves tus eventos
- ✓ Contacta a administrador si necesitas acceso

### "La búsqueda no encuentra nada"
- ✓ Intenta con palabras clave más generales
- ✓ Verifica la ortografía
- ✓ Limpia otros filtros que puedan estar activos
- ✓ Intenta con rango de fechas más amplio

## Soporte

Si encuentras problemas:
1. Verifica que tengas acceso (admin vs no-admin)
2. Intenta limpiar filtros
3. Recarga la página
4. Contacta al administrador del sistema

## Información Técnica

- **Búsqueda**: Tiempo real, búsqueda de texto completo
- **Datos almacenados**: Indefinidamente (sin purga automática)
- **Paginación**: Lado del servidor, eficiente
- **Seguridad**: RLS en Supabase, control por rol
- **Performance**: Índices optimizados en base de datos

---

**Última actualización**: 27 de Noviembre de 2025
**Versión**: 1.0 - Sistema de Auditoría Profesional
