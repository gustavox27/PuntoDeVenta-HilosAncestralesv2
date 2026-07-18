-- FIX ESTRUCTURAL 1 / PASO 1
-- Cierra el call-site 2 del bug de anticipos-aplicados-y-eliminados: el
-- botón "Pagar" en MovementHistory.tsx (handlePayDebt) aplicaba el
-- saldoDisponible AGREGADO del cliente bajo un id ficticio 'sistema', sin
-- consumir anticipos reales ni dejar rastro reversible/bloqueable.
--
-- Esta función SÍ consume anticipos reales, uno por uno, FIFO por
-- fecha_anticipo, y dentro de una única invocación de función plpgsql
-- (transaccional: si algo falla a mitad de camino, Postgres revierte todo
-- lo hecho en esta invocación).
--
-- GARANTÍAS DE DISEÑO (requeridas explícitamente, ver commit message):
-- 1. NUNCA escribe anticipos.venta_id. Esta función no tiene ningún
--    UPDATE ni INSERT sobre la tabla `anticipos` — solo hace SELECT sobre
--    ella. Un anticipo aplicado a varias deudas permanece con
--    venta_id = NULL, tal como estaba.
-- 2. ventas.anticipo_total se incrementa, por cada venta, EXACTAMENTE en
--    v_monto_aplicar — el monto realmente aplicado a ESA venta
--    (LEAST(saldo_pendiente_de_la_venta, remanente_del_anticipo)), nunca
--    el monto completo del anticipo. Si un anticipo de 1000 paga 40 de una
--    venta y 20 de otra, cada venta recibe +40 y +20 respectivamente en su
--    anticipo_total — nunca +1000 en una sola.
-- 3. Como consecuencia de 1 y 2, la suma de anticipo_total de las ventas
--    de un cliente nunca puede exceder la suma de anticipos realmente
--    consumidos: v_monto_restante_anticipo se decrementa exactamente por
--    lo aplicado y el loop interno se detiene en cuanto llega a 0.
--
-- No toca aplicarAnticipoADeudasFallback() ni el call-site 1
-- (Ventas.tsx:handleAplicarDeudas) — quedan exactamente como están hoy.

CREATE OR REPLACE FUNCTION aplicar_anticipos_disponibles_a_deudas(
  p_cliente_id uuid,
  p_ventas_ids uuid[],
  p_usuario_actual text DEFAULT 'Sistema'
)
RETURNS jsonb AS $$
DECLARE
  v_anticipo RECORD;
  v_venta RECORD;
  v_venta_id uuid;
  v_monto_restante_anticipo numeric;
  v_monto_aplicar numeric;
  v_nuevo_saldo numeric;
  v_total_aplicado numeric := 0;
  v_ventas_pagadas integer;
  v_ventas_parciales integer;
  v_anticipos_usados jsonb := '[]'::jsonb;
BEGIN
  IF p_ventas_ids IS NULL OR array_length(p_ventas_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se especificaron ventas a pagar');
  END IF;

  FOR v_anticipo IN
    SELECT * FROM anticipos
    WHERE cliente_id = p_cliente_id AND venta_id IS NULL
    ORDER BY fecha_anticipo ASC, created_at ASC
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM ventas WHERE id = ANY(p_ventas_ids) AND saldo_pendiente > 0
    );

    v_monto_restante_anticipo := v_anticipo.monto;

    FOREACH v_venta_id IN ARRAY p_ventas_ids LOOP
      EXIT WHEN v_monto_restante_anticipo <= 0;

      SELECT * INTO v_venta FROM ventas
      WHERE id = v_venta_id AND id_usuario = p_cliente_id AND saldo_pendiente > 0
      FOR UPDATE;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      v_monto_aplicar := LEAST(v_venta.saldo_pendiente, v_monto_restante_anticipo);
      v_nuevo_saldo := v_venta.saldo_pendiente - v_monto_aplicar;

      UPDATE ventas SET
        saldo_pendiente = v_nuevo_saldo,
        anticipo_total = COALESCE(anticipo_total, 0) + v_monto_aplicar,
        estado_pago = CASE WHEN v_nuevo_saldo <= 0 THEN 'completo' ELSE 'pendiente' END,
        completada = (v_nuevo_saldo <= 0)
      WHERE id = v_venta_id;

      INSERT INTO eventos (tipo, descripcion, usuario, modulo, accion, entidad_id, entidad_tipo, fecha)
      VALUES (
        'Anticipo',
        'Anticipo aplicado a deuda pendiente: S/ ' || v_monto_aplicar,
        p_usuario_actual, 'Ventas', 'Aplicar Anticipo a Deuda',
        v_venta_id::text, 'venta', now()
      );

      v_total_aplicado := v_total_aplicado + v_monto_aplicar;
      v_monto_restante_anticipo := v_monto_restante_anticipo - v_monto_aplicar;
    END LOOP;

    IF v_monto_restante_anticipo < v_anticipo.monto THEN
      INSERT INTO eventos (tipo, descripcion, usuario, modulo, accion, entidad_id, entidad_tipo, fecha)
      VALUES (
        'Anticipo',
        'Anticipo aplicado automáticamente a deudas (consumo: S/ ' ||
          (v_anticipo.monto - v_monto_restante_anticipo) || ')',
        p_usuario_actual, 'Ventas', 'Aplicación Automática de Anticipo',
        v_anticipo.id::text, 'anticipo', now()
      );

      v_anticipos_usados := v_anticipos_usados || jsonb_build_object(
        'anticipo_id', v_anticipo.id,
        'monto_aplicado', v_anticipo.monto - v_monto_restante_anticipo
      );
    END IF;
  END LOOP;

  IF v_total_aplicado = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No hay anticipos disponibles reales para aplicar a las deudas seleccionadas'
    );
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE saldo_pendiente <= 0),
    COUNT(*) FILTER (WHERE saldo_pendiente > 0)
  INTO v_ventas_pagadas, v_ventas_parciales
  FROM ventas WHERE id = ANY(p_ventas_ids);

  RETURN jsonb_build_object(
    'success', true,
    'ventas_pagadas', v_ventas_pagadas,
    'ventas_parciales', v_ventas_parciales,
    'total_aplicado', v_total_aplicado,
    'anticipos_usados', v_anticipos_usados
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION aplicar_anticipos_disponibles_a_deudas(uuid, uuid[], text) TO authenticated, service_role;
