/*
  # Agregar campos para tracking de usuarios y productos eliminados

  1. Cambios en tabla ventas
    - Agregar columna `usuario_eliminado_nombre` para guardar el nombre del usuario eliminado
    - Agregar columna `usuario_eliminado` (boolean) para marcar si el usuario fue eliminado
    
  2. Cambios en tabla ventas_detalle
    - Agregar columna `producto_eliminado_nombre` para guardar el nombre del producto eliminado
    - Agregar columna `producto_eliminado_color` para guardar el color del producto eliminado
    - Agregar columna `producto_eliminado` (boolean) para marcar si el producto fue eliminado
    
  3. Notas
    - Permite mantener información histórica cuando se eliminan usuarios o productos
    - Los nombres en rojo indicarán entidades eliminadas en la UI
*/

-- Agregar campos a tabla ventas para usuarios eliminados
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'usuario_eliminado_nombre'
  ) THEN
    ALTER TABLE ventas ADD COLUMN usuario_eliminado_nombre text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas' AND column_name = 'usuario_eliminado'
  ) THEN
    ALTER TABLE ventas ADD COLUMN usuario_eliminado boolean DEFAULT false;
  END IF;
END $$;

-- Agregar campos a tabla ventas_detalle para productos eliminados
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas_detalle' AND column_name = 'producto_eliminado_nombre'
  ) THEN
    ALTER TABLE ventas_detalle ADD COLUMN producto_eliminado_nombre text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas_detalle' AND column_name = 'producto_eliminado_color'
  ) THEN
    ALTER TABLE ventas_detalle ADD COLUMN producto_eliminado_color text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ventas_detalle' AND column_name = 'producto_eliminado'
  ) THEN
    ALTER TABLE ventas_detalle ADD COLUMN producto_eliminado boolean DEFAULT false;
  END IF;
END $$;

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_eliminado ON ventas(usuario_eliminado);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto_eliminado ON ventas_detalle(producto_eliminado);