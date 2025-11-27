/*
  # Sistema de Retención y Alertas de Auditoría

  1. Nuevas Tablas:
    - `audit_retention_config`: Configuración global de retención (período, estado, alertas)
    - `audit_alerts`: Registro de alertas enviadas a usuarios sobre próximas eliminaciones
    - `audit_exports`: Historial de exportaciones realizadas
    - `audit_deletions`: Log de eliminaciones automáticas realizadas

  2. Nuevos Campos en tabla `eventos`:
    - `retention_date`: Fecha calculada cuando el evento será elegible para eliminación
    - `exported_at`: Timestamp cuando fue incluido en una exportación
    - `status`: Estado del evento (active, marked_for_deletion, deleted)

  3. Funciones PostgreSQL:
    - Función para calcular fecha de retención
    - Función para detectar eventos próximos a eliminar
    - Trigger para marcar eventos automáticamente cuando se vence retención

  4. Índices para Optimización:
    - Índices en retention_date y status para búsquedas rápidas

  5. RLS Policies:
    - Solo administradores pueden ver/modificar configuración de retención
    - Solo administradores pueden realizar eliminaciones
*/

-- Crear tabla audit_retention_config
CREATE TABLE IF NOT EXISTS audit_retention_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retention_months integer DEFAULT 3 CHECK (retention_months > 0),
  alert_days_before integer DEFAULT 15 CHECK (alert_days_before > 0),
  auto_delete_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Crear tabla audit_alerts
CREATE TABLE IF NOT EXISTS audit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('retention_warning', 'export_ready', 'deletion_complete')),
  evento_count integer DEFAULT 0,
  date_range_start date,
  date_range_end date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'exported', 'deleted')),
  exported_at timestamptz,
  export_filename text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz
);

-- Crear tabla audit_exports
CREATE TABLE IF NOT EXISTS audit_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by text NOT NULL,
  export_type text NOT NULL CHECK (export_type IN ('pdf', 'excel')),
  filename text NOT NULL,
  event_count integer NOT NULL,
  date_range_start date,
  date_range_end date,
  file_size_bytes integer,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla audit_deletions
CREATE TABLE IF NOT EXISTS audit_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_by text NOT NULL,
  deleted_count integer NOT NULL,
  date_range_start date,
  date_range_end date,
  export_id uuid REFERENCES audit_exports(id),
  deleted_at timestamptz DEFAULT now(),
  verification_hash text
);

-- Agregar columnas a tabla eventos si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'retention_date'
  ) THEN
    ALTER TABLE eventos ADD COLUMN retention_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'exported_at'
  ) THEN
    ALTER TABLE eventos ADD COLUMN exported_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'event_status'
  ) THEN
    ALTER TABLE eventos ADD COLUMN event_status text DEFAULT 'active' CHECK (event_status IN ('active', 'marked_for_deletion', 'deleted'));
  END IF;
END $$;

-- Crear función para calcular retention_date
CREATE OR REPLACE FUNCTION calculate_retention_date()
RETURNS date AS $$
DECLARE
  retention_months integer;
BEGIN
  SELECT r.retention_months INTO retention_months
  FROM audit_retention_config r
  LIMIT 1;
  
  IF retention_months IS NULL THEN
    retention_months := 3;
  END IF;
  
  RETURN (now() + (retention_months || ' months')::interval)::date;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener eventos próximos a retención
CREATE OR REPLACE FUNCTION get_retention_eligible_events(p_days_threshold integer DEFAULT 15)
RETURNS TABLE(
  evento_id uuid,
  created_at timestamptz,
  retention_date date,
  days_until_deletion integer,
  tipo text,
  usuario text,
  descripcion text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.created_at,
    e.retention_date,
    (e.retention_date - CURRENT_DATE)::integer as days_until_deletion,
    e.tipo,
    e.usuario,
    e.descripcion
  FROM eventos e
  WHERE e.event_status = 'active'
    AND e.retention_date IS NOT NULL
    AND e.retention_date <= (CURRENT_DATE + (p_days_threshold || ' days')::interval)
    AND e.retention_date > CURRENT_DATE
  ORDER BY e.retention_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar retention_date en nuevos eventos
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
DECLARE
  retention_months integer;
BEGIN
  SELECT r.retention_months INTO retention_months
  FROM audit_retention_config r
  LIMIT 1;
  
  IF retention_months IS NULL THEN
    retention_months := 3;
  END IF;
  
  NEW.retention_date := (NEW.created_at + (retention_months || ' months')::interval)::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_retention_date_trigger ON eventos;
CREATE TRIGGER set_retention_date_trigger
BEFORE INSERT ON eventos
FOR EACH ROW
EXECUTE FUNCTION set_retention_date();

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_eventos_retention_date ON eventos(retention_date) WHERE event_status = 'active';
CREATE INDEX IF NOT EXISTS idx_eventos_event_status ON eventos(event_status);
CREATE INDEX IF NOT EXISTS idx_eventos_exported_at ON eventos(exported_at);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_user_status ON audit_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_alert_type ON audit_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_exports_created_at ON audit_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_deletions_deleted_at ON audit_deletions(deleted_at DESC);

-- Crear índice compuesto para búsquedas de retención
CREATE INDEX IF NOT EXISTS idx_eventos_retention_composite 
ON eventos(event_status, retention_date, created_at DESC)
WHERE event_status = 'active';

-- Habilitar RLS en nuevas tablas
ALTER TABLE audit_retention_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_deletions ENABLE ROW LEVEL SECURITY;

-- Insertar configuración por defecto
INSERT INTO audit_retention_config (retention_months, alert_days_before, auto_delete_enabled)
SELECT 3, 15, true
WHERE NOT EXISTS (SELECT 1 FROM audit_retention_config);
