/*
  # Agregar campo numero_guia a tabla ventas

  1. Cambios
    - Agregar columna `numero_guia` (text) a la tabla `ventas`
    - Campo requerido para identificar el número de guía de cada venta
    
  2. Notas
    - Campo de texto para permitir diferentes formatos de número de guía
    - NOT NULL para asegurar que todas las ventas tengan número de guía
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'numero_guia'
  ) THEN
    ALTER TABLE ventas ADD COLUMN numero_guia text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Crear índice para búsquedas por número de guía
CREATE INDEX IF NOT EXISTS idx_ventas_numero_guia ON ventas(numero_guia);