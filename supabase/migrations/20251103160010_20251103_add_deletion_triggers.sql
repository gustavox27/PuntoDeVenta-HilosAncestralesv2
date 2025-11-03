/*
  # Agregar triggers para marcar entidades eliminadas

  1. Triggers
    - Trigger para marcar ventas cuando se elimina un usuario
    - Trigger para marcar ventas_detalle cuando se elimina un producto
    
  2. Funcionalidad
    - Antes de eliminar, guarda el nombre de la entidad en campos especiales
    - Marca la entidad como eliminada
    - Permite la eliminación sin perder información histórica
*/

-- Función para marcar ventas antes de eliminar usuario
CREATE OR REPLACE FUNCTION marcar_ventas_usuario_eliminado()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todas las ventas del usuario que se va a eliminar
  UPDATE ventas
  SET 
    usuario_eliminado_nombre = OLD.nombre,
    usuario_eliminado = true
  WHERE id_usuario = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar ventas antes de eliminar usuario
DROP TRIGGER IF EXISTS trigger_marcar_ventas_usuario_eliminado ON usuarios;
CREATE TRIGGER trigger_marcar_ventas_usuario_eliminado
  BEFORE DELETE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION marcar_ventas_usuario_eliminado();

-- Función para marcar ventas_detalle antes de eliminar producto
CREATE OR REPLACE FUNCTION marcar_ventas_detalle_producto_eliminado()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todos los detalles de venta del producto que se va a eliminar
  UPDATE ventas_detalle
  SET 
    producto_eliminado_nombre = OLD.nombre,
    producto_eliminado_color = OLD.color,
    producto_eliminado = true
  WHERE id_producto = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar ventas_detalle antes de eliminar producto
DROP TRIGGER IF EXISTS trigger_marcar_ventas_detalle_producto_eliminado ON productos;
CREATE TRIGGER trigger_marcar_ventas_detalle_producto_eliminado
  BEFORE DELETE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION marcar_ventas_detalle_producto_eliminado();