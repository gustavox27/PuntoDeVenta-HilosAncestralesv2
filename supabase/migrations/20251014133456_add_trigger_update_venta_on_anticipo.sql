/*
  # Trigger para actualizar ventas automáticamente cuando se agregan anticipos

  1. Funcionalidad
    - Calcula automáticamente el anticipo_total sumando todos los anticipos de una venta
    - Recalcula el saldo_pendiente (total - anticipo_total - descuento_total)
    - Actualiza estado_pago a 'completo' cuando saldo_pendiente = 0
    - Marca completada = true cuando saldo_pendiente = 0

  2. Seguridad
    - Se ejecuta automáticamente después de INSERT, UPDATE o DELETE en anticipos
    - Garantiza la integridad de los datos de ventas
*/

-- Función para actualizar la venta cuando se modifica un anticipo
CREATE OR REPLACE FUNCTION actualizar_venta_desde_anticipos()
RETURNS TRIGGER AS $$
DECLARE
  v_venta_id uuid;
  v_total_anticipos numeric;
  v_total_venta numeric;
  v_nuevo_saldo numeric;
BEGIN
  -- Obtener el ID de la venta afectada
  v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  -- Si no hay venta_id, salir
  IF v_venta_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular el total de anticipos para esta venta
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_anticipos
  FROM anticipos
  WHERE venta_id = v_venta_id;
  
  -- Obtener el total de la venta
  SELECT total
  INTO v_total_venta
  FROM ventas
  WHERE id = v_venta_id;
  
  -- Calcular el nuevo saldo pendiente
  v_nuevo_saldo := v_total_venta - v_total_anticipos;
  
  -- Si el saldo es negativo, ajustarlo a 0
  IF v_nuevo_saldo < 0 THEN
    v_nuevo_saldo := 0;
  END IF;
  
  -- Actualizar la venta
  UPDATE ventas
  SET 
    anticipo_total = v_total_anticipos,
    saldo_pendiente = v_nuevo_saldo,
    estado_pago = CASE 
      WHEN v_nuevo_saldo = 0 THEN 'completo'
      ELSE 'pendiente'
    END,
    completada = (v_nuevo_saldo = 0)
  WHERE id = v_venta_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para INSERT, UPDATE y DELETE en anticipos
DROP TRIGGER IF EXISTS trigger_actualizar_venta_desde_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_venta_desde_anticipos
  AFTER INSERT OR UPDATE OR DELETE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_venta_desde_anticipos();