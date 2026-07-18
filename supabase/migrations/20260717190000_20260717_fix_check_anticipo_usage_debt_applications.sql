-- FIX ESTRUCTURAL 1 / PASO 2
-- Problema: check_anticipo_usage solo consideraba "usado" un anticipo si
-- anticipos.venta_id IS NOT NULL. Los anticipos aplicados a deudas pasadas
-- vía aplicarAnticipoADeudasFallback (supabaseService.ts) nunca setean
-- venta_id, por lo que quedaban editables/eliminables sin advertencia aunque
-- ya hubieran reducido saldo_pendiente de una o más ventas. Esto causó un
-- descuadre financiero real (caso MICHAEL APAZA CAJMA, investigado y
-- corregido en datos por separado).
--
-- Fix: check_anticipo_usage ahora también considera "usado" un anticipo si
-- existe un evento estructurado eventos(entidad_tipo='anticipo',
-- entidad_id=<id>, accion='Aplicación Automática de Anticipo') — el evento
-- resumen que aplicarAnticipoADeudasFallback ya crea hoy con el ID real del
-- anticipo. No requiere parsear texto de descripcion.

CREATE OR REPLACE FUNCTION check_anticipo_usage(p_anticipo_id uuid)
RETURNS TABLE (
  is_used boolean,
  used_in_venta boolean,
  venta_id_found uuid,
  has_been_consumed boolean,
  remaining_amount numeric
) AS $$
DECLARE
  v_anticipo RECORD;
  v_aplicado_a_deuda boolean;
BEGIN
  SELECT * INTO v_anticipo FROM anticipos WHERE id = p_anticipo_id;

  IF v_anticipo IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::uuid, false, 0::numeric;
    RETURN;
  END IF;

  used_in_venta := v_anticipo.venta_id IS NOT NULL;
  venta_id_found := v_anticipo.venta_id;

  IF used_in_venta THEN
    is_used := true;
    has_been_consumed := true;
    remaining_amount := 0;
    RETURN QUERY SELECT is_used, used_in_venta, venta_id_found, has_been_consumed, remaining_amount;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM eventos
    WHERE entidad_tipo = 'anticipo'
      AND entidad_id = p_anticipo_id::text
      AND accion = 'Aplicación Automática de Anticipo'
  ) INTO v_aplicado_a_deuda;

  IF v_aplicado_a_deuda THEN
    is_used := true;
    has_been_consumed := true;
    remaining_amount := 0;
    RETURN QUERY SELECT is_used, used_in_venta, venta_id_found, has_been_consumed, remaining_amount;
    RETURN;
  END IF;

  is_used := false;
  has_been_consumed := false;
  remaining_amount := v_anticipo.monto;

  RETURN QUERY SELECT is_used, used_in_venta, venta_id_found, has_been_consumed, remaining_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_anticipo_usage(uuid) TO authenticated, service_role;
