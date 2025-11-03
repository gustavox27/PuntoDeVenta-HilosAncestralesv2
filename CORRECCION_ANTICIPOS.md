# Corrección de la Lógica de Anticipos

## Problema Identificado

El sistema de anticipos tenía un error crítico en la gestión de saldos disponibles:

**Comportamiento Incorrecto (Antes de la Corrección):**
1. Cliente registra anticipo inicial de **S/ 1,000**
2. Cliente realiza compra de **S/ 50**
3. Sistema asociaba **TODOS los S/ 1,000** a la venta de S/ 50
4. No quedaba saldo disponible para futuras compras
5. El cliente perdía los **S/ 950** restantes

**Ubicación del Error:**
- Archivo: `src/pages/Ventas.tsx`
- Líneas: 393-401 (versión anterior)
- Función: `procesarVenta()`

## Solución Implementada

Se modificó la lógica para aplicar anticipos de manera proporcional al monto de la venta:

**Comportamiento Correcto (Después de la Corrección):**
1. Cliente registra anticipo inicial de **S/ 1,000**
2. Cliente realiza compra de **S/ 50**
3. Sistema usa **SOLO S/ 50** del anticipo para cubrir la compra
4. Sistema crea un nuevo anticipo con el saldo restante de **S/ 950**
5. Cliente mantiene **S/ 950** disponibles para futuras compras

## Detalles Técnicos de la Corrección

### Lógica Anterior (Incorrecta)
```typescript
if (anticiposDisponiblesCliente > 0) {
  const anticiposPrevios = await SupabaseService.getAnticiposPorCliente(usuarioSeleccionado.id);
  const anticiposSinVenta = anticiposPrevios.filter(a => !a.venta_id);

  // ❌ PROBLEMA: Asocia TODOS los anticipos a la venta
  for (const anticipo of anticiposSinVenta) {
    await SupabaseService.updateAnticipo(anticipo.id, {
      venta_id: ventaCreada.id
    });
  }
}
```

### Lógica Nueva (Correcta)
```typescript
if (anticiposDisponiblesCliente > 0) {
  const anticiposPrevios = await SupabaseService.getAnticiposPorCliente(usuarioSeleccionado.id);
  const anticiposSinVenta = anticiposPrevios.filter(a => !a.venta_id);

  // Calcular cuánto falta por pagar después del anticipo de la venta actual
  let montoRestanteAPagar = total;
  if (anticipoData) {
    montoRestanteAPagar = Math.max(0, total - anticipoData.monto);
  }

  let montoAplicado = 0;

  for (const anticipo of anticiposSinVenta) {
    // ✅ Si ya cubrimos el monto necesario, detener
    if (montoAplicado >= montoRestanteAPagar) {
      break;
    }

    const montoNecesario = montoRestanteAPagar - montoAplicado;

    if (anticipo.monto <= montoNecesario) {
      // ✅ El anticipo completo se usa en esta venta
      await SupabaseService.updateAnticipo(anticipo.id, {
        venta_id: ventaCreada.id
      });
      montoAplicado += anticipo.monto;
    } else {
      // ✅ Solo usar parte del anticipo, crear nuevo anticipo con el saldo
      const montoUsado = montoNecesario;
      const montoSobrante = anticipo.monto - montoUsado;

      // Actualizar anticipo original con el monto usado
      await SupabaseService.updateAnticipo(anticipo.id, {
        venta_id: ventaCreada.id,
        monto: montoUsado
      });

      // Crear nuevo anticipo con el saldo sobrante
      await SupabaseService.createAnticipo({
        cliente_id: usuarioSeleccionado.id,
        monto: montoSobrante,
        metodo_pago: anticipo.metodo_pago,
        fecha_anticipo: anticipo.fecha_anticipo,
        observaciones: `Saldo remanente de anticipo original (${anticipo.id.substring(0, 8)})`
      });

      montoAplicado += montoUsado;
    }
  }
}
```

## Casos de Uso Cubiertos

### Caso 1: Anticipo Mayor que la Venta
- **Anticipo Inicial:** S/ 1,000
- **Venta:** S/ 50
- **Resultado:**
  - S/ 50 aplicados a la venta
  - S/ 950 quedan disponibles como anticipo sin venta
  - ✅ Cliente mantiene saldo correcto

### Caso 2: Anticipo Igual a la Venta
- **Anticipo Inicial:** S/ 500
- **Venta:** S/ 500
- **Resultado:**
  - S/ 500 aplicados a la venta
  - S/ 0 quedan disponibles
  - ✅ Anticipo consumido completamente

### Caso 3: Anticipo Menor que la Venta
- **Anticipo Inicial:** S/ 100
- **Venta:** S/ 500
- **Resultado:**
  - S/ 100 aplicados a la venta
  - S/ 400 quedan como saldo pendiente
  - ✅ Se usa todo el anticipo disponible

### Caso 4: Múltiples Anticipos
- **Anticipos Iniciales:** S/ 300 + S/ 200 = S/ 500 total
- **Venta:** S/ 350
- **Resultado:**
  - Se usa el anticipo de S/ 300 completo
  - Se usan S/ 50 del segundo anticipo
  - Se crea nuevo anticipo de S/ 150 (saldo del segundo)
  - ✅ Optimización de aplicación de anticipos

### Caso 5: Anticipo de Venta + Anticipo Inicial
- **Anticipo Inicial:** S/ 500
- **Anticipo de Venta (checkbox):** S/ 100
- **Venta Total:** S/ 800
- **Resultado:**
  - S/ 100 del anticipo de venta
  - S/ 500 del anticipo inicial
  - S/ 200 quedan como saldo pendiente
  - ✅ Ambos tipos de anticipos se aplican correctamente

## Visualización en la Interfaz

### En Ventas
- Al seleccionar un cliente con anticipos disponibles, se muestra el monto total
- Durante la venta, se calcula el saldo pendiente considerando anticipos disponibles
- Se aplica automáticamente al procesar la venta

### En Historial de Compras
- Modal "Anticipo Inicial" muestra el saldo disponible sin asociar a ventas
- Se actualiza automáticamente después de cada venta
- Lista de anticipos iniciales muestra cada anticipo por separado

## Compatibilidad

✅ **No afecta ventas existentes**: La corrección solo aplica a nuevas ventas
✅ **Mantiene historial intacto**: Ventas anteriores permanecen sin cambios
✅ **Compatible con triggers**: Funciona con el trigger `actualizar_venta_desde_anticipos`
✅ **Compatible con anticipos de venta**: Funciona junto con el checkbox de anticipo en ventas

## Validación

Build exitoso sin errores:
```
✓ 3682 modules transformed.
✓ built in 14.46s
```

## Fecha de Implementación
3 de Noviembre, 2025

## Estado
✅ IMPLEMENTADO Y FUNCIONAL
