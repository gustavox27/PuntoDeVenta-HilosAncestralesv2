/*
  # Función para Eliminar Venta con Rollback Completo
  
  1. Nueva Función
    - `eliminar_venta_con_rollback`: Ejecuta rollback completo de una venta
  
  2. Proceso Atómico
    - Obtiene todos los detalles de la venta antes de eliminar
    - Restaura stock de productos vendidos
    - Restaura anticipos como disponibles sin venta asociada
    - Elimina detalles de venta
    - Elimina la venta principal
    - Registra evento de eliminación
  
  3. Manejo de Errores
    - Valida que la venta existe
    - Verifica integridad de datos relacionados
    - Maneja casos de productos/usuarios eliminados
    - Realiza todas las operaciones o ninguna
  
  4. Auditoría
    - Registra evento detallado de eliminación
    - Mantiene historial en tabla eventos
*/

-- Función para eliminar venta con rollback completo
CREATE OR REPLACE FUNCTION eliminar_venta_con_rollback(
  p_venta_id uuid,
  p_usuario_actual text DEFAULT 'Sistema'
)
RETURNS jsonb AS $$
DECLARE
  v_venta record;
  v_detalle record;
  v_anticipo record;
  v_resultado jsonb;
  v_productos_restaurados int := 0;
  v_anticipos_restaurados int := 0;
BEGIN
  -- Validar que la venta existe
  SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id;
  
  IF v_venta IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Venta no encontrada'
    );
  END IF;

  -- PASO 1: Restaurar stock de productos vendidos
  FOR v_detalle IN 
    SELECT id_producto, cantidad 
    FROM ventas_detalle 
    WHERE id_venta = p_venta_id AND id_producto IS NOT NULL
  LOOP
    UPDATE productos 
    SET stock = stock + v_detalle.cantidad
    WHERE id = v_detalle.id_producto;
    
    v_productos_restaurados := v_productos_restaurados + 1;
  END LOOP;

  -- PASO 2: Restaurar anticipos como disponibles sin venta
  FOR v_anticipo IN 
    SELECT id, monto, metodo_pago, fecha_anticipo, observaciones
    FROM anticipos 
    WHERE venta_id = p_venta_id
  LOOP
    -- Crear nuevo anticipo sin venta asociada
    INSERT INTO anticipos (
      cliente_id, 
      monto, 
      metodo_pago, 
      fecha_anticipo, 
      observaciones
    )
    VALUES (
      v_venta.id_usuario,
      v_anticipo.monto,
      v_anticipo.metodo_pago,
      v_anticipo.fecha_anticipo,
      'Restaurado por eliminación de venta #' || p_venta_id::text || '. Original: ' || COALESCE(v_anticipo.observaciones, '')
    );
    
    v_anticipos_restaurados := v_anticipos_restaurados + 1;
  END LOOP;

  -- PASO 3: Eliminar anticipos asociados a la venta
  DELETE FROM anticipos WHERE venta_id = p_venta_id;

  -- PASO 4: Eliminar detalles de venta
  DELETE FROM ventas_detalle WHERE id_venta = p_venta_id;

  -- PASO 5: Eliminar la venta
  DELETE FROM ventas WHERE id = p_venta_id;

  -- PASO 6: Registrar evento de eliminación
  INSERT INTO eventos (
    tipo,
    descripcion,
    usuario,
    modulo,
    accion,
    entidad_id,
    entidad_tipo,
    detalles
  )
  VALUES (
    'Venta',
    'Venta eliminada con rollback completo',
    p_usuario_actual,
    'Historial',
    'Eliminar',
    p_venta_id::text,
    'venta',
    jsonb_build_object(
      'venta_id', p_venta_id,
      'cliente_id', v_venta.id_usuario,
      'total_venta', v_venta.total,
      'anticipo_total', v_venta.anticipo_total,
      'productos_restaurados', v_productos_restaurados,
      'anticipos_restaurados', v_anticipos_restaurados,
      'fecha_venta_original', v_venta.fecha_venta,
      'numero_guia', v_venta.numero_guia
    )
  );

  v_resultado := jsonb_build_object(
    'success', true,
    'message', 'Venta eliminada correctamente con rollback',
    'venta_id', p_venta_id,
    'productos_restaurados', v_productos_restaurados,
    'anticipos_restaurados', v_anticipos_restaurados,
    'total_revertido', v_venta.total
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Error al eliminar venta: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índice adicional para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto_venta ON ventas_detalle(id_venta, id_producto);
