# Guía Rápida - Sistema de Detección de Deudas

## ¿Qué se implementó?

Un sistema automático que detecta deudas pendientes cuando registras un anticipo inicial a un cliente, permitiéndote aplicar el anticipo a esas deudas de forma ordenada y controlada.

## Flujo Principal (5 pasos)

### 1️⃣ Registrar Anticipo
```
Punto de Venta → Registrar Anticipo → Seleccionar Cliente →
Ingresar Monto → Confirmar
```

### 2️⃣ Sistema Detecta Deudas
- Automáticamente busca si el cliente tiene pagos pendientes
- Si tiene deudas → Abre modal con lista

### 3️⃣ Seleccionar Deudas a Pagar
- Ver todas las deudas del cliente
- Checkboxes para seleccionar/deseleccionar
- Flechas para reordenar prioridad
- Ver cuánto anticipo se aplicará a cada una

### 4️⃣ Confirmar Aplicación
- Botón "Confirmar Aplicar" → Aplica el anticipo
- Botón "Dejar Como Anticipo" → Cancela (mantiene anticipo como saldo)

### 5️⃣ Ver Resumen
- Modal muestra qué ventas se completaron
- Cuáles quedaron con saldo pendiente
- Cuánto sobrante queda disponible

## Archivos Modificados/Creados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/services/supabaseService.ts` | ✏️ Modificado | Métodos para obtener/aplicar deudas |
| `src/pages/Ventas.tsx` | ✏️ Modificado | Integración del flujo de deudas |
| `src/components/Ventas/DebtDetectionModal.tsx` | ✨ Nuevo | Modal para seleccionar deudas |
| `src/components/Ventas/DebtPaymentSummaryModal.tsx` | ✨ Nuevo | Modal de resumen de pagos |

## Nuevos Métodos en SupabaseService

```typescript
// Obtiene deudas pendientes del cliente (ordenadas por fecha FIFO)
await SupabaseService.obtenerDeudasCliente(clienteId: string)
→ Venta[]

// Calcula total de deuda activa
await SupabaseService.calcularTotalDeuda(clienteId: string)
→ number

// Aplica anticipo a deudas seleccionadas
await SupabaseService.aplicarAnticipoADeudas(
  clienteId: string,
  anticipoId: string,
  montoAnticipo: number,
  ventasIds: string[],
  usuarioActual: string
)
→ { exito, mensaje, ventas_pagadas, ventas_parciales, total_aplicado, saldo_restante }
```

## Casos de Uso

### Caso 1: Cliente sin Deudas
```
1. Registra anticipo → Sistema detecta "sin deudas" →
2. Modal NO se abre → Anticipo guardado como disponible ✓
```

### Caso 2: Anticipo Cubre Todas las Deudas
```
Cliente debe: $100
Anticipo: $120

1. Registra anticipo de $120
2. Modal muestra: "Deuda total $100, anticipo $120, sobrante $20"
3. Confirma aplicación
4. Resultado: Venta marcada completa, $20 disponible para futuras compras ✓
```

### Caso 3: Anticipo Parcial
```
Cliente debe: $100 en venta A, $50 en venta B
Anticipo: $80

1. Registra anticipo de $80
2. Modal muestra ambas deudas, puede reordenar
3. Confirma aplicación → Se aplica $80 a Venta A (queda $20 saldo)
4. Venta A sigue en "Pagos Pendientes" con $20 pendiente
5. Venta B no se toca ($50 pendiente)
✓
```

### Caso 4: Usuario Decide NO Aplicar
```
1. Registra anticipo
2. Modal se abre con deudas
3. Clickea "Dejar Como Anticipo"
4. Modal cierra, anticipo guardado como saldo disponible (sin tocar deudas) ✓
```

### Caso 5: Reordenar Prioridad
```
Cliente debe: V1=$30, V2=$50, V3=$20
Anticipo: $60

1. Abre modal, ve: V1→V2→V3 (orden por fecha)
2. Usuario quiere pagar V3 primero → Usa flechas para reordenar
3. Nuevo orden: V3→V1→V2
4. Confirma: Se aplica $20 a V3 (completa), $30 a V1 (completa), $10 a V2 (parcial)
5. V3 y V1 → "Ventas Finales", V2 queda con $40 pendiente
✓
```

## Estados de la UI

### Modal de Deudas - Elementos Principales

```
┌─────────────────────────────────────────┐
│  Deudas Pendientes Detectadas           │
│  Cliente: Juan Pérez                    │
├─────────────────────────────────────────┤
│                                         │
│  [Totales: 2 deudas | 1 completa | ... │
│                                         │
│  ☑ 2024-01-15 | $100 | Saldo: $50  ↑↓ │
│     → Se aplicarán: $50 / Quedarán: 0  │
│                                         │
│  ☑ 2024-02-20 | $80  | Saldo: $30  ↑↓ │
│     → Se aplicarán: $30 / Quedarán: 0  │
│                                         │
├─────────────────────────────────────────┤
│ [Dejar Como Anticipo] [Confirmar ▶]    │
└─────────────────────────────────────────┘
```

### Modal de Resumen - Resultado

```
┌──────────────────────────────────────┐
│  ✓ Anticipo Aplicado                 │
│  Juan Pérez                          │
├──────────────────────────────────────┤
│  Ventas Completadas: 2               │
│  Ventas Parciales: 0                 │
│  Monto Aplicado: S/ 80.00            │
│  Saldo Disponible: S/ 0.00           │
├──────────────────────────────────────┤
│ Próximos Pasos:                      │
│ 1. Las deudas pagadas aparecerán...  │
│ 2. Los movimientos se registraron... │
│ 3. El saldo está listo para...       │
├──────────────────────────────────────┤
│ [Entendido]                          │
└──────────────────────────────────────┘
```

## Verificar que Funciona

### En Historial → Ventas Finales
- ✅ Deberías ver ventas que antes estaban en "Pagos Pendientes"
- ✅ Ahora están marcadas como completadas

### En Historial → Pagos Pendientes
- ✅ Solo aparecen ventas con saldo restante > 0
- ✅ El saldo se redujo en el monto aplicado

### En Usuarios → Historial de Movimientos
- ✅ Aparecen registros de anticipos aplicados
- ✅ Cada movimiento tiene detalles de qué venta se pagó

## Configuración Adicional (Opcional)

### Para aplicar funciones PostgreSQL (más eficiente):

1. Ir a Supabase Console → SQL Editor
2. Copiar funciones de: `supabase/migrations/20251120_add_debt_detection_functions.sql`
3. Ejecutar en la base de datos

Esto hace que las operaciones sean más rápidas, pero **el sistema funciona sin esto** (usa fallback en JavaScript).

## Preguntas Frecuentes

**P: ¿Qué pasa si el cliente no tiene deudas?**
R: El modal de deudas NO se abre, el anticipo se guarda como disponible. Simple y claro.

**P: ¿Puedo cambiar de opinión después de confirmar?**
R: No se puede deshacer, pero puedes registrar otro anticipo después para compensar si es necesario.

**P: ¿Dónde veo el historial de qué se pagó?**
R: En Usuarios → Historial de Movimientos, o en Historial → cada venta tiene pestaña "Historial de Anticipos"

**P: ¿El sobrante se pierde?**
R: No. Queda como "saldo disponible" para futuras compras del cliente.

**P: ¿Funciona con múltiples monedas?**
R: Actualmente solo funciona con S/ (soles). Usa siempre la misma moneda.

## Comandos Útiles

```bash
# Compilar y verificar sin errores
npm run build

# Ver en desarrollo
npm run dev
```

## Soporte

Si algo no funciona como se espera, revisa:

1. ✅ El cliente tiene deudas reales (no completadas)
2. ✅ El anticipo es un número positivo
3. ✅ Las deudas son de ventas del mismo cliente
4. ✅ En consola del navegador (F12) no hay errores rojo

---

**Versión:** 1.0 | **Fecha:** Noviembre 2024 | **Estado:** Producción ✅
