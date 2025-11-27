# Test Guide: Anticipo Detection Fix

## Summary of Changes

The anticipo detection system has been updated to correctly identify and display the **most recently added anticipo** when registering a new anticipo for a client.

### What Was Fixed

**Previous Issue:** The modal "Anticipo Previo Detectado" was always showing the first anticipo (oldest), not the last one (newest).

**Root Cause:** The database query ordered anticipos by `fecha_anticipo` (the date entered by the user), which is unreliable when multiple anticipos are created on the same date.

**Solution:** Changed the database query in `getAnticiposPorCliente()` to order by `created_at` (the actual insertion timestamp) in descending order, with a secondary sort by `id`. This ensures the most recently added anticipo always appears first.

### Technical Changes

1. **File:** `src/services/supabaseService.ts`
   - Changed ordering from `.order('fecha_anticipo', { ascending: false })` 
   - To: `.order('created_at', { ascending: false }).order('id', { ascending: false })`
   - This uses the database's actual insertion timestamp instead of user-entered date

2. **File:** `src/pages/Ventas.tsx`
   - Updated comment on line 1037 for clarity
   - The logic already correctly retrieves `anticiposSinVenta[0]` which is now the truly latest anticipo

## Testing Procedures

### Test 1: Baseline - Single Anticipo
1. Go to "Ventas" section
2. Click "Registrar Anticipo" button
3. Select a client that has NO anticipos yet
4. Enter anticipo details:
   - Amount: S/ 50.00
   - Date: Today
   - Payment method: Efectivo
   - Notes: "Test anticipo 1"
5. Click "Registrar Anticipo"
6. The modal should NOT appear (no previous anticipos)
7. Close "Registrar Anticipo Inicial" modal
8. Click "Registrar Anticipo" again
9. Select the same client
10. **EXPECTED:** Modal "Anticipo Previo Detectado" appears showing:
    - "Último Anticipo Agregado": S/ 50.00
    - "Saldo Disponible": S/ 50.00
11. Click "Continuar" to register another anticipo

### Test 2: Multiple Anticipos - Verify Latest is Detected
1. Continue from Test 1 (same client now has 2 anticipos of S/ 50.00 each)
2. In the "Registrar Anticipo Inicial" modal, enter:
   - Amount: S/ 75.00
   - Date: Today
   - Payment method: Transferencia
3. Click "Registrar Anticipo"
4. Close the debt detection modal if it appears
5. Click "Registrar Anticipo" again
6. Select the same client
7. **EXPECTED:** Modal appears showing:
    - "Último Anticipo Agregado": S/ 75.00 (NOT S/ 50.00)
    - "Saldo Disponible": S/ 175.00 (50 + 50 + 75)
8. Click "Continuar"

### Test 3: Multiple Anticipos on Same Date
1. Continue from Test 2
2. Click "Registrar Anticipo"
3. Select the same client
4. In "Registrar Anticipo Inicial" modal, enter:
   - Amount: S/ 100.00
   - Date: Today (same date as Test 2)
   - Payment method: Tarjeta
5. Click "Registrar Anticipo"
6. Close debt modal if appears
7. Click "Registrar Anticipo" again
8. Select the same client
9. In "Registrar Anticipo Inicial" modal, enter:
   - Amount: S/ 60.00
   - Date: Today (same date again)
   - Payment method: Yape
10. Click "Registrar Anticipo"
11. Close debt modal if appears
12. Click "Registrar Anticipo" again
13. Select the same client
14. **EXPECTED:** Modal appears showing:
    - "Último Anticipo Agregado": S/ 60.00 (most recent, even though same date)
    - "Saldo Disponible": S/ 435.00 (50 + 50 + 75 + 100 + 60)

### Test 4: Anticipo with Past Date
1. Continue with same client
2. Click "Registrar Anticipo"
3. Select the same client
4. In "Registrar Anticipo Inicial" modal, enter:
   - Amount: S/ 25.00
   - Date: Yesterday (use date picker)
   - Payment method: Efectivo
5. Click "Registrar Anticipo"
6. Close debt modal if appears
7. Click "Registrar Anticipo" again
8. Select the same client
9. **EXPECTED:** Modal appears showing:
    - "Último Anticipo Agregado": S/ 25.00 (most recently CREATED, even though dated yesterday)
    - "Saldo Disponible": S/ 460.00
10. This confirms the system uses `created_at` not `fecha_anticipo`

### Test 5: Refresh and Verify Persistence
1. After completing Test 4, refresh the page (F5)
2. Click "Registrar Anticipo"
3. Select the same client
4. **EXPECTED:** Modal still shows:
    - "Último Anticipo Agregado": S/ 25.00
    - "Saldo Disponible": S/ 460.00
5. Confirms data is correctly persisted in database

## Expected Behavior Summary

| Test | Scenario | Expected "Último Anticipo" |
|------|----------|---------------------------|
| 1 | First anticipo (S/ 50) | S/ 50.00 |
| 2 | Add second (S/ 75), total S/ 125 | S/ 75.00 |
| 3a | Add third (S/ 100), total S/ 225 | S/ 100.00 |
| 3b | Add fourth (S/ 60), total S/ 285 | S/ 60.00 |
| 4 | Add fifth dated yesterday (S/ 25) | S/ 25.00 |
| 5 | After refresh | S/ 25.00 |

## Verification Checklist

- [ ] Build completes successfully: `npm run build`
- [ ] Test 1: Single anticipo shows correctly
- [ ] Test 2: Second anticipo with different amount shows as latest
- [ ] Test 3a: Third anticipo shows as latest
- [ ] Test 3b: Fourth anticipo on same date shows as latest
- [ ] Test 4: Anticipo with past date shows as latest (based on creation time)
- [ ] Test 5: Data persists after page refresh
- [ ] No console errors during any test
- [ ] Modal displays correct amounts for both "Último Anticipo" and "Saldo Disponible"

## Key Points

✓ The system now correctly identifies the most recently CREATED anticipo, not the oldest  
✓ Works correctly even when multiple anticipos have the same `fecha_anticipo`  
✓ Uses database `created_at` timestamp which is set automatically at insertion  
✓ Secondary sort by `id` ensures deterministic ordering in edge cases  
✓ No breaking changes to existing functionality  
✓ All business logic remains the same, only query ordering improved  

