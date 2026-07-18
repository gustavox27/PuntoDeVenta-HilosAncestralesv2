-- FIX FLUJO D — Ventas.tsx:566-589 (crear venta nueva con "usar anticipo
-- disponible") vinculaba anticipos EXISTENTES completos vía anticipos.venta_id
-- a la venta nueva, sin importar si esa venta solo necesitaba una fracción del
-- anticipo. El trigger actualizar_venta_desde_anticipos entonces recalculaba
-- ventas.anticipo_total = SUM(anticipos.monto WHERE venta_id=esa_venta),
-- inflando ese campo al monto COMPLETO del anticipo (ej. anticipo de 1000
-- vinculado a una venta de 40 dejaba anticipo_total = 1000).
--
-- Esta función reemplaza esa vinculación. Reutiliza el mismo patrón FIFO y el
-- mismo evento protector que aplicar_anticipos_disponibles_a_deudas (Paso 1),
-- pero a propósito NO toca la tabla `ventas` en absoluto: el cálculo de
-- anticipo_total/saldo_pendiente en Ventas.tsx:487-515 ya es correcto (usa
-- SOLO el anticipo nuevo del formulario, no lo pre-mezcla con crédito
-- existente) y ExportUtils.generateSalePDF ya usa ventaCreada (capturado en
-- el INSERT) antes de que esta función corra — si esta función tocara
-- `ventas`, el PDF/boleta podría quedar desactualizado respecto de lo que
-- realmente se guardó en BD.
--
-- Su única responsabilidad: dejar un rastro estructurado en `eventos` sobre
-- cuánto de cada anticipo real se consideró consumido, para que
-- check_anticipo_usage (Paso 2) los proteja de edición/borrado — sin partir
-- filas de `anticipos` ni tocar anticipos.venta_id/monto.

CREATE OR REPLACE FUNCTION marcar_anticipos_consumidos(
  p_cliente_id uuid,
  p_monto numeric,
  p_venta_referencia_id uuid,
  p_usuario_actual text DEFAULT 'Sistema'
)
RETURNS jsonb AS $$
DECLARE
  v_anticipo RECORD;
  v_monto_restante numeric := p_monto;
  v_consumido numeric;
  v_total_marcado numeric := 0;
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RETURN jsonb_build_object('success', true, 'total_marcado', 0);
  END IF;

  FOR v_anticipo IN
    SELECT * FROM anticipos
    WHERE cliente_id = p_cliente_id AND venta_id IS NULL
    ORDER BY fecha_anticipo ASC, created_at ASC
  LOOP
    EXIT WHEN v_monto_restante <= 0;

    v_consumido := LEAST(v_anticipo.monto, v_monto_restante);

    INSERT INTO eventos (tipo, descripcion, usuario, modulo, accion, entidad_id, entidad_tipo, fecha)
    VALUES (
      'Anticipo',
      'Anticipo aplicado a nueva venta (consumo: S/ ' || v_consumido || ') - venta ' || p_venta_referencia_id,
      p_usuario_actual, 'Ventas', 'Aplicación Automática de Anticipo',
      v_anticipo.id::text, 'anticipo', now()
    );

    v_monto_restante := v_monto_restante - v_consumido;
    v_total_marcado := v_total_marcado + v_consumido;
  END LOOP;

  IF v_total_marcado < p_monto THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Crédito disponible insuficiente para marcar como consumido',
      'total_marcado', v_total_marcado,
      'solicitado', p_monto
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'total_marcado', v_total_marcado);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION marcar_anticipos_consumidos(uuid, numeric, uuid, text) TO authenticated, service_role;
