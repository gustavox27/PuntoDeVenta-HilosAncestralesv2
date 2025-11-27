# Sistema de Retención, Alertas y Exportación de Auditoría

## Resumen General

Se ha implementado un sistema completo de gestión del ciclo de vida para registros de auditoría que garantiza:

- **Retención configurable** de registros de 3 meses o más
- **Alertas proactivas** al usuario antes de la eliminación automática
- **Exportación sin límites** en Excel y PDF con todos los detalles
- **Eliminación segura** posterior a la exportación con registro de auditoría
- **Control administrativo** centralizado en la página de Configuración

## Componentes Implementados

### 1. Base de Datos

#### Migración: `20251127_audit_retention_system_fix`

**Nuevas Tablas:**

1. **audit_retention_config**
   - Configuración global de retención (3 meses por defecto)
   - Período de alerta anticipada (15 días)
   - Control de activación/desactivación de eliminación automática
   - Auditoría de cambios de configuración

2. **audit_alerts**
   - Registro de alertas enviadas a usuarios
   - Estados: pending, acknowledged, exported, deleted
   - Detalles del rango de fechas y cantidad de eventos
   - Historial de exportaciones y eliminaciones

3. **audit_exports**
   - Historial completo de exportaciones (PDF y Excel)
   - Metadatos: usuario, fecha, cantidad de registros, tamaño
   - Vinculación con eliminaciones realizadas

4. **audit_deletions**
   - Log inmutable de eliminaciones automáticas
   - Vinculación con archivo de exportación
   - Hash de verificación de integridad
   - Información del usuario que autorizó

**Columnas Nuevas en `eventos`:**

- `retention_date`: Fecha calculada de elegibilidad para eliminación
- `exported_at`: Timestamp cuando fue exportado
- `event_status`: Estado (active, marked_for_deletion, deleted)

**Funciones PostgreSQL:**

- `calculate_retention_date()`: Calcula automáticamente fecha de retención
- `get_retention_eligible_events()`: Obtiene eventos próximos a eliminar
- `set_retention_date_trigger()`: Trigger para nuevos eventos

**Índices de Optimización:**

- Índice en `retention_date` para búsquedas rápidas
- Índice compuesto para consultas de retención
- Índices en `event_status` y `exported_at`

**Políticas RLS:**

- Solo administradores pueden ver/modificar configuración
- Solo administradores pueden realizar eliminaciones
- Users pueden ver sus propias alertas
- Sistema puede crear registros de auditoría

### 2. Servicios Backend

#### AuditRetentionService (`src/services/auditRetentionService.ts`)

**Métodos Principales:**

- `getRetentionConfig()`: Obtiene configuración actual
- `updateRetentionConfig()`: Actualiza parámetros de retención
- `getRetentionEligibleEvents()`: Lista eventos próximos a eliminar
- `getRetentionSummary()`: Resumen de estado de retención
- `createRetentionAlert()`: Crea alerta para usuario
- `acknowledgeAlert()`: Marca alerta como reconocida
- `markAlertAsExported()`: Registra exportación exitosa
- `markAlertAsDeleted()`: Registra eliminación completada
- `getPendingAlerts()`: Obtiene alertas pendientes de usuario
- `recordExport()`: Registra exportación en historial
- `markEventsAsExported()`: Marca eventos como exportados

#### AuditCleanupService (`src/services/auditCleanupService.ts`)

**Métodos Principales:**

- `getReadyForDeletionEvents()`: Obtiene eventos elegibles para eliminar
- `markEventsForDeletion()`: Marca eventos con status "marked_for_deletion"
- `deleteMarkedEvents()`: Elimina eventos marcados (soft delete)
- `getDeletionHistory()`: Historial de eliminaciones
- `getDeletionStats()`: Estadísticas de eliminaciones
- `postponeDeletion()`: Pospone eliminación 7 días adicionales
- `verifyIntegrity()`: Verifica hash de eliminación
- `softDeleteEvent()` / `hardDeleteEvent()`: Métodos de eliminación segura

**Características de Seguridad:**

- Eliminación en lotes para evitar sobrecarga
- Validación de integridad referencial
- Hash de verificación para auditoría
- Logs inmutables de todas las operaciones

### 3. Utilidades de Exportación Mejoradas

#### ExportUtils (`src/utils/exportUtils.ts`)

**Nuevos Métodos de Exportación Completa (Sin Límites):**

1. **exportAuditToExcel()**
   - Múltiples hojas: Resumen, por tipo, por usuario, críticos, todos
   - Datos expandidos: Todos los campos incluyendo JSON
   - Formato condicional basado en severidad
   - Incluye metadatos de exportación
   - Sin límites de cantidad de registros

2. **exportAuditToPDF()**
   - Formato profesional multi-página
   - Página de portada con estadísticas generales
   - Tabla de resumen por tipo de evento
   - Listado detallado con paginación automática
   - Numeración de páginas
   - Soporte para grandes volúmenes de datos

**Métodos Auxiliares:**

- `generateAuditSummary()`: Estadísticas de eventos
- `groupEventosByType()`: Agrupa por tipo
- `groupEventosByUser()`: Agrupa por usuario
- `flattenEventoForExcel()`: Formatea datos para Excel

### 4. Componentes UI

#### AuditRetentionAlert (`src/components/Audit/AuditRetentionAlert.tsx`)

**Características:**

- Banner persistente en Dashboard cuando hay eventos próximos a expirar
- Indicador visual de criticidad (rojo si <= 7 días)
- Contador de eventos críticos
- Botón directo "Exportar"
- Se actualiza cada 60 segundos
- Cerrable con opción de re-mostrar

#### AuditRetentionModal (`src/components/Audit/AuditRetentionModal.tsx`)

**Características:**

- Muestra estadísticas detalladas de retención
- Selector de formato (Excel o PDF)
- Descripción de contenido de cada formato
- Información sobre cantidad total de eventos
- Botón de exportación con progreso
- Registro automático en historial de exportaciones

#### AuditDeletionConfirmModal (`src/components/Audit/AuditDeletionConfirmModal.tsx`)

**Características:**

- Confirmación explícita de eliminación irreversible
- Checkbox de confirmación obligatorio
- Muestra detalles: cantidad, rango de fechas
- Opción de posponer 7 días adicionales
- Verificación de integridad
- Confirmación visual de éxito

#### RetentionSettings (`src/components/Configuracion/RetentionSettings.tsx`)

**Características:**

- Accesible solo para Administradores
- Configuración de período de retención (1-36 meses)
- Configuración de días de alerta anticipada
- Toggle para activar/desactivar eliminación automática
- Estadísticas en tiempo real:
  - Eliminaciones realizadas
  - Registros marcados para deletear
  - Registros eliminados (soft delete)
- Botón guardar configuración

### 5. Integración en Componentes Existentes

#### Dashboard (`src/pages/Dashboard.tsx`)

- Importa `AuditRetentionAlert` del usuario actual
- Muestra alerta si existen eventos próximos a expirar
- Se actualiza automáticamente

#### AuditModal (`src/components/Audit/AuditModal.tsx`)

- Nuevo botón "Excel" para exportar a Excel sin límites
- Nuevo botón "PDF" para exportar a PDF sin límites
- Registra exportaciones en historial
- Deshabilita botones durante exportación
- Muestra notificaciones de éxito

#### Configuracion (`src/pages/Configuracion.tsx`)

- Importa `RetentionSettings`
- Visible solo para Administrador
- Posicionado al final de la página

## Flujo de Funcionamiento

### Ciclo de Vida de un Registro de Auditoría

```
1. CREACIÓN
   ├─ Evento se crea en tabla eventos
   ├─ Trigger calcula retention_date (created_at + retención_months)
   └─ event_status = 'active'

2. RETENCIÓN
   ├─ Pasa el tiempo (retención_months)
   └─ Evento permanece activo y accesible

3. ALERTA ANTICIPADA
   ├─ alert_days_before días antes de retention_date
   ├─ Sistema detecta evento próximo a expirar
   ├─ Se crea alerta en audit_alerts (status: pending)
   ├─ Banner aparece en Dashboard
   └─ Usuario notificado

4. RECONOCIMIENTO
   ├─ Usuario visualiza alerta
   └─ Alert status → 'acknowledged'

5. EXPORTACIÓN
   ├─ Usuario elige formato (Excel o PDF)
   ├─ Se exportan TODOS los registros sin límites
   ├─ Se crea registro en audit_exports
   ├─ Alert status → 'exported'
   ├─ exported_at se marca en eventos
   └─ Notificación de éxito

6. AUTORIZACIÓN DE ELIMINACIÓN
   ├─ Se muestra modal de confirmación
   ├─ Usuario confirma (checkbox obligatorio)
   └─ Puede posponer 7 días adicionales

7. ELIMINACIÓN (Soft Delete)
   ├─ event_status → 'marked_for_deletion'
   ├─ event_status → 'deleted'
   ├─ Se crea registro en audit_deletions
   ├─ Hash de verificación se genera
   ├─ Alert status → 'deleted'
   └─ Registro permanece en DB (auditoría)

8. ELIMINACIÓN FÍSICA (Opcional)
   ├─ Comando administrativo manual
   ├─ DELETE desde eventos
   └─ Elimina registros relacionados
```

## Características de Seguridad

### 1. Protección de Datos

- **Soft Delete**: Registros marcados como deleted pero no eliminados físicamente
- **Auditoría Inmutable**: Log completo de eliminaciones en audit_deletions
- **Hash de Verificación**: Verificación de integridad de eliminaciones
- **Respaldo Implícito**: Exportación obligatoria antes de eliminar

### 2. Control de Acceso (RLS)

- **Administrador**: Acceso completo a configuración y eliminaciones
- **Usuario Regular**: Solo puede ver sus propias alertas
- **Sistema**: Puede crear registros de auditoría

### 3. Validación y Confirmación

- **Confirmación Explícita**: Checkbox obligatorio para autorizar eliminación
- **Prevención de Accidentes**: Opción de posponer 7 días
- **Período de Gracia**: alert_days_before (por defecto 15 días)

### 4. Trazabilidad

- Registro de:
  - Quién exportó (usuario, timestamp)
  - Qué se exportó (cantidad, formato, rango de fechas)
  - Quién autorizó eliminación (usuario, timestamp)
  - Cuándo se eliminó (timestamp, verificación)

## Configuración Predeterminada

```
- Período de retención: 3 meses
- Días de alerta: 15 días antes de expiración
- Eliminación automática: Habilitada
- Formato de exportación: Excel (múltiples hojas) o PDF (multi-página)
```

## Uso para Administradores

### 1. Acceder a Configuración de Retención

Ir a **Configuración del Sistema** → **Configuración de Retención de Auditoría** (solo para Administradores)

### 2. Ajustar Parámetros

- Cambiar período de retención (1-36 meses)
- Cambiar días de alerta anticipada
- Habilitar/deshabilitar eliminación automática
- Guardar cambios

### 3. Monitorear Estado

Ver estadísticas en tiempo real:
- Eliminaciones realizadas
- Registros marcados para deletear
- Registros eliminados (soft delete)

## Uso para Usuarios Regulares

### 1. Recibir Alertas

Cuando hay registros próximos a expirar:
- Banner rojo/ámbar aparece en Dashboard
- Muestra cantidad de días restantes
- Muestra cantidad de eventos críticos

### 2. Exportar Registros

Opción 1: Desde alerta del Dashboard
- Click en "Exportar"
- Seleccionar formato
- Archivo se descarga

Opción 2: Desde Registro de Auditoría
- Abrir modal "Registro de Auditoría"
- Click en "Excel" o "PDF"
- Archivo se descarga sin límites de registros

### 3. Autorizar Eliminación

Después de exportar:
- Modal de confirmación aparece
- Revisar detalles de eliminación
- Confirmar con checkbox
- Opcionalmente posponer 7 días

## Archivos Creados/Modificados

### Nuevos Archivos

```
src/services/auditRetentionService.ts         (350+ líneas)
src/services/auditCleanupService.ts           (280+ líneas)
src/components/Audit/AuditRetentionAlert.tsx  (90+ líneas)
src/components/Audit/AuditRetentionModal.tsx  (200+ líneas)
src/components/Audit/AuditDeletionConfirmModal.tsx (200+ líneas)
src/components/Configuracion/RetentionSettings.tsx (230+ líneas)
```

### Archivos Modificados

```
src/utils/exportUtils.ts                      (+300 líneas)
src/components/Audit/AuditModal.tsx           (+70 líneas)
src/pages/Dashboard.tsx                       (+10 líneas)
src/pages/Configuracion.tsx                   (+5 líneas)
supabase/migrations/                          (+1 migración)
```

## Notas Importantes

### Performance

- Índices optimizados para búsquedas rápidas de retención
- Exportación en chunks para manejar grandes volúmenes
- Eliminación en lotes para evitar sobrecarga de BD
- Cache temporal durante exportación

### Compatibilidad

- Compatible con Supabase PostgreSQL
- Usa tipos de datos estándar
- Triggers y funciones PostgreSQL nativas
- RLS policies estándar de Supabase

### Mantenimiento

- Revisar audit_deletions periódicamente
- Monitorear tamaño de tabla eventos
- Ejecutar VACUUM en PostgreSQL regularmente
- Respaldar audit_exports y audit_deletions

## Estadísticas Iniciales

La migración crea:
- 4 tablas nuevas (audit_*)
- 3 columnas nuevas en eventos
- 2 funciones PostgreSQL
- 8 índices nuevos
- 4 políticas RLS
- 1 trigger

Consumo estimado: ~100-200 MB inicialmente, escalable según volumen

## Pruebas Recomendadas

1. Crear múltiples eventos de auditoría
2. Configurar retención corta (1-2 días) para testing
3. Verificar alertas aparecen en tiempo correcto
4. Probar exportación Excel con múltiples hojas
5. Probar exportación PDF multi-página
6. Verificar eliminación marca eventos como deleted
7. Comprobar RLS: usuario no ve config de admin
8. Verificar hash de integridad

## Conclusión

Sistema implementado con enfoque en:

✅ **Seguridad**: RLS, auditoría inmutable, confirmación explícita
✅ **Usabilidad**: Alertas proactivas, interfaz clara, opciones flexibles
✅ **Confiabilidad**: Validación, verificación de integridad, soft delete
✅ **Escalabilidad**: Índices optimizados, exportación en chunks
✅ **Cumplimiento**: Período de retención configurable, logs completos
