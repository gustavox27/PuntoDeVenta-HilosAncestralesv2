/*
  # Cambiar constraints de eliminación para usuarios y productos

  1. Cambios
    - Cambiar ventas.id_usuario de ON DELETE RESTRICT a ON DELETE SET NULL
    - Cambiar ventas_detalle.id_producto de ON DELETE RESTRICT a ON DELETE SET NULL
    - Permitir NULL en ambas columnas para soportar entidades eliminadas
    
  2. Notas
    - Permite eliminar usuarios y productos sin eliminar el historial
    - Los datos históricos se marcarán con campos especiales (usuario_eliminado, producto_eliminado)
*/

-- Primero, eliminar el constraint existente de id_usuario en ventas
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_usuario_fkey;

-- Permitir NULL en id_usuario
ALTER TABLE ventas ALTER COLUMN id_usuario DROP NOT NULL;

-- Recrear el constraint con ON DELETE SET NULL
ALTER TABLE ventas 
  ADD CONSTRAINT ventas_id_usuario_fkey 
  FOREIGN KEY (id_usuario) 
  REFERENCES usuarios(id) 
  ON DELETE SET NULL;

-- Hacer lo mismo para id_producto en ventas_detalle
ALTER TABLE ventas_detalle DROP CONSTRAINT IF EXISTS ventas_detalle_id_producto_fkey;

-- Permitir NULL en id_producto
ALTER TABLE ventas_detalle ALTER COLUMN id_producto DROP NOT NULL;

-- Recrear el constraint con ON DELETE SET NULL
ALTER TABLE ventas_detalle 
  ADD CONSTRAINT ventas_detalle_id_producto_fkey 
  FOREIGN KEY (id_producto) 
  REFERENCES productos(id) 
  ON DELETE SET NULL;