/*
  # Mejora del Sistema de Auditoría - Campos Enriquecidos y Relaciones

  1. Nuevos Campos en tabla eventos:
    - valor_anterior: JSONB para almacenar estado anterior de cambios
    - valor_nuevo: JSONB para almacenar estado nuevo de cambios
    - estado_anterior_texto: texto legible del estado anterior
    - estado_nuevo_texto: texto legible del estado nuevo
    - evento_padre_id: referencia a evento relacionado (para vinculación cruzada)
    - metadata: JSONB para almacenar información adicional (navegador, dispositivo, IP, etc)
    - severidad: nivel de criticidad del evento (info, warning, error, critical)
    - entidad_nombre: nombre legible de la entidad para búsqueda rápida

  2. Nueva tabla eventos_relacionados:
    - Para mapear relaciones entre eventos
    - Permite rastrear cadenas de eventos relacionados

  3. Nuevos índices para optimización de búsqueda

  4. Políticas RLS para control de acceso:
    - Administradores ven todos los eventos
    - Otros usuarios ven solo sus propios eventos
*/

-- Agregar columnas a tabla eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'valor_anterior'
  ) THEN
    ALTER TABLE eventos ADD COLUMN valor_anterior JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'valor_nuevo'
  ) THEN
    ALTER TABLE eventos ADD COLUMN valor_nuevo JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'estado_anterior_texto'
  ) THEN
    ALTER TABLE eventos ADD COLUMN estado_anterior_texto text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'estado_nuevo_texto'
  ) THEN
    ALTER TABLE eventos ADD COLUMN estado_nuevo_texto text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'evento_padre_id'
  ) THEN
    ALTER TABLE eventos ADD COLUMN evento_padre_id uuid REFERENCES eventos(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE eventos ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'severidad'
  ) THEN
    ALTER TABLE eventos ADD COLUMN severidad text DEFAULT 'info' CHECK (severidad IN ('info', 'warning', 'error', 'critical'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'entidad_nombre'
  ) THEN
    ALTER TABLE eventos ADD COLUMN entidad_nombre text;
  END IF;
END $$;

-- Crear tabla eventos_relacionados
CREATE TABLE IF NOT EXISTS eventos_relacionados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  evento_relacionado_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  tipo_relacion text NOT NULL CHECK (tipo_relacion IN ('causa', 'efecto', 'cascada', 'vinculado')),
  created_at timestamptz DEFAULT now()
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_eventos_entidad_id ON eventos(entidad_id) WHERE entidad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_entidad_tipo ON eventos(entidad_tipo) WHERE entidad_tipo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_usuario ON eventos(usuario) WHERE usuario IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_modulo ON eventos(modulo) WHERE modulo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_accion ON eventos(accion) WHERE accion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_severidad ON eventos(severidad);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_desc ON eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_evento_padre ON eventos(evento_padre_id);
CREATE INDEX IF NOT EXISTS idx_eventos_entidad_nombre ON eventos(entidad_nombre);
CREATE INDEX IF NOT EXISTS idx_eventos_descripcion_search ON eventos USING GIN(to_tsvector('spanish', descripcion));

-- Índice para búsqueda rápida por múltiples criterios
CREATE INDEX IF NOT EXISTS idx_eventos_composite_search 
ON eventos(usuario, created_at DESC, tipo) 
WHERE usuario IS NOT NULL;

-- Índices para eventos_relacionados
CREATE INDEX IF NOT EXISTS idx_eventos_relacionados_evento ON eventos_relacionados(evento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_relacionados_relacionado ON eventos_relacionados(evento_relacionado_id);

-- Habilitar RLS en eventos (si no está ya habilitado)
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "anyone_can_select_eventos" ON eventos;
DROP POLICY IF EXISTS "anyone_can_insert_eventos" ON eventos;
DROP POLICY IF EXISTS "usuarios_pueden_ver_sus_eventos" ON eventos;
DROP POLICY IF EXISTS "solo_sistema_puede_insertar_eventos" ON eventos;

-- Habilitar RLS en eventos_relacionados
ALTER TABLE eventos_relacionados ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas de eventos_relacionados
DROP POLICY IF EXISTS "usuarios_pueden_ver_relaciones" ON eventos_relacionados;
DROP POLICY IF EXISTS "solo_sistema_puede_insertar_relaciones" ON eventos_relacionados;
