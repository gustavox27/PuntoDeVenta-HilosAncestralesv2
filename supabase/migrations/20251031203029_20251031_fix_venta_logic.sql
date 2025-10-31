/*
  # Corregir lógica de ventas sin checkbox de anticipo marcado

  1. Cambios
    - Modificar función actualizar_venta_desde_anticipos para NO sobrescribir valores cuando la venta es completa
    - Las ventas sin checkbox de anticipo (solo con anticipos iniciales) deben ir a "Ventas Finales"
    
  2. Lógica
    - Si completada = true ANTES de actualizar, NO modificar el estado
    - Solo actualizar automáticamente cuando hay anticipos posteriores que cambian el saldo
*/

-- Modificar la función para respetar ventas completas sin checkbox de anticipo
CREATE OR REPLACE FUNCTION actualizar_venta_desde_anticipos()
RETURNS TRIGGER AS $$
DECLARE
  v_venta_id uuid;
  v_total_anticipos numeric;
  v_total_venta numeric;
  v_descuento_total numeric;
  v_nuevo_saldo numeric;
  v_completada_original boolean;
BEGIN
  v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  IF v_venta_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Obtener el estado original de completada
  SELECT completada INTO v_completada_original
  FROM ventas
  WHERE id = v_venta_id;
  
  -- Calcular total de anticipos
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_anticipos
  FROM anticipos
  WHERE venta_id = v_venta_id;
  
  -- Obtener total de venta y descuento
  SELECT total, COALESCE(descuento_total, 0)
  INTO v_total_venta, v_descuento_total
  FROM ventas
  WHERE id = v_venta_id;
  
  -- Calcular nuevo saldo
  v_nuevo_saldo := (v_total_venta - v_descuento_total) - v_total_anticipos;
  
  IF v_nuevo_saldo < 0 THEN
    v_nuevo_saldo := 0;
  END IF;
  
  -- SOLO actualizar si la venta NO estaba marcada como completada originalmente
  -- O si hay un cambio real en los anticipos que requiere actualización
  IF v_completada_original = false OR TG_OP = 'INSERT' THEN
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
  ELSE
    -- Solo actualizar el anticipo_total sin cambiar el estado
    UPDATE ventas
    SET anticipo_total = v_total_anticipos
    WHERE id = v_venta_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_venta_desde_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_venta_desde_anticipos
  AFTER INSERT OR UPDATE OR DELETE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_venta_desde_anticipos();