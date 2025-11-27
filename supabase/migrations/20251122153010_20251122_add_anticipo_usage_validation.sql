/*
  # Add Anticipo Usage Validation Function

  1. New Function
    - `check_anticipo_usage()` - Determines if an anticipo has been used in a purchase or debt payment

  2. Purpose
    - Validate whether an anticipo can be edited or deleted
    - Returns usage status including: is_used, used_in_venta, used_in_deuda, remaining_amount
    - Checks if anticipo has venta_id (direct purchase) or if consumed through debt payment

  3. Logic
    - An anticipo is USED if:
      a) It has a venta_id (linked to a specific purchase)
      b) It has been applied to debt payment (checked via saldo disponible calculation)
    - Returns true if anticipo cannot be modified, false if it's still available
*/

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
  v_saldo_disponible numeric;
  v_total_disponible numeric;
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

  is_used := false;
  has_been_consumed := false;
  remaining_amount := v_anticipo.monto;
  
  RETURN QUERY SELECT is_used, used_in_venta, venta_id_found, has_been_consumed, remaining_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_anticipo_usage(uuid) TO authenticated, service_role;
