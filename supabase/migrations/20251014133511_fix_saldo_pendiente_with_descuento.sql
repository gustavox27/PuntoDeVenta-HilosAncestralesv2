/*
  # Corrección del trigger para calcular correctamente el saldo pendiente con descuentos

  1. Problema
    - El trigger actualizar_venta_desde_anticipos no consideraba el descuento_total al calcular el saldo_pendiente
    - Esto causaba que el saldo no reflejara el descuento aplicado en la venta

  2. Solución
    - Modificar la función para incluir descuento_total en el cálculo del saldo
    - Fórmula correcta: saldo_pendiente = (total - descuento_total) - anticipo_total

  3. Ejemplo
    - Total: S/ 12.00
    - Descuento: S/ 6.00
    - Anticipo: S/ 5.00
    - Saldo correcto: (12 - 6) - 5 = S/ 1.00
*/

-- Función corregida para actualizar la venta cuando se modifica un anticipo
CREATE OR REPLACE FUNCTION actualizar_venta_desde_anticipos()
RETURNS TRIGGER AS $$
DECLARE
  v_venta_id uuid;
  v_total_anticipos numeric;
  v_total_venta numeric;
  v_descuento_total numeric;
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
  
  -- Obtener el total y descuento de la venta
  SELECT total, COALESCE(descuento_total, 0)
  INTO v_total_venta, v_descuento_total
  FROM ventas
  WHERE id = v_venta_id;
  
  -- Calcular el nuevo saldo pendiente
  -- Fórmula: saldo = (total - descuento) - anticipos
  v_nuevo_saldo := (v_total_venta - v_descuento_total) - v_total_anticipos;
  
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

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_venta_desde_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_venta_desde_anticipos
  AFTER INSERT OR UPDATE OR DELETE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_venta_desde_anticipos();