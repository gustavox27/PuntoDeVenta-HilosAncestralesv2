/*
  # Fix RLS policies for new tables — allow anon role

  ## Problem
  All new tables (notas_pedido, notas_pedido_detalle, notas_pedido_orden,
  programacion, programacion_origen, avance, avance_asignaciones) were created
  with RLS policies restricted to the `authenticated` role.

  The application uses a custom authentication system (not Supabase Auth) and
  connects via the anon key, so all operations were being blocked by RLS.

  ## Solution
  Replace the existing policies with open `USING (true)` policies that allow
  all operations for `anon` — the same pattern used by the existing tables
  (anticipos, usuarios, productos, etc.) that work correctly.

  ## Changes
  - Drop all `authenticated`-only policies on the 7 new tables
  - Create new policies allowing anon + authenticated full access
*/

-- ── notas_pedido ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select notas_pedido" ON notas_pedido;
DROP POLICY IF EXISTS "Authenticated users can insert notas_pedido" ON notas_pedido;
DROP POLICY IF EXISTS "Authenticated users can update notas_pedido" ON notas_pedido;
DROP POLICY IF EXISTS "Authenticated users can delete notas_pedido" ON notas_pedido;

CREATE POLICY "Allow all operations on notas_pedido"
  ON notas_pedido FOR ALL
  USING (true) WITH CHECK (true);

-- ── notas_pedido_detalle ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select notas_pedido_detalle" ON notas_pedido_detalle;
DROP POLICY IF EXISTS "Authenticated users can insert notas_pedido_detalle" ON notas_pedido_detalle;
DROP POLICY IF EXISTS "Authenticated users can update notas_pedido_detalle" ON notas_pedido_detalle;
DROP POLICY IF EXISTS "Authenticated users can delete notas_pedido_detalle" ON notas_pedido_detalle;

CREATE POLICY "Allow all operations on notas_pedido_detalle"
  ON notas_pedido_detalle FOR ALL
  USING (true) WITH CHECK (true);

-- ── notas_pedido_orden ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select notas_pedido_orden" ON notas_pedido_orden;
DROP POLICY IF EXISTS "Authenticated users can insert notas_pedido_orden" ON notas_pedido_orden;
DROP POLICY IF EXISTS "Authenticated users can update notas_pedido_orden" ON notas_pedido_orden;
DROP POLICY IF EXISTS "Authenticated users can delete notas_pedido_orden" ON notas_pedido_orden;

CREATE POLICY "Allow all operations on notas_pedido_orden"
  ON notas_pedido_orden FOR ALL
  USING (true) WITH CHECK (true);

-- ── programacion ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select programacion" ON programacion;
DROP POLICY IF EXISTS "Authenticated users can insert programacion" ON programacion;
DROP POLICY IF EXISTS "Authenticated users can update programacion" ON programacion;
DROP POLICY IF EXISTS "Authenticated users can delete programacion" ON programacion;

CREATE POLICY "Allow all operations on programacion"
  ON programacion FOR ALL
  USING (true) WITH CHECK (true);

-- ── programacion_origen ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select programacion_origen" ON programacion_origen;
DROP POLICY IF EXISTS "Authenticated users can insert programacion_origen" ON programacion_origen;
DROP POLICY IF EXISTS "Authenticated users can update programacion_origen" ON programacion_origen;
DROP POLICY IF EXISTS "Authenticated users can delete programacion_origen" ON programacion_origen;

CREATE POLICY "Allow all operations on programacion_origen"
  ON programacion_origen FOR ALL
  USING (true) WITH CHECK (true);

-- ── avance ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select avance" ON avance;
DROP POLICY IF EXISTS "Authenticated users can insert avance" ON avance;
DROP POLICY IF EXISTS "Authenticated users can update avance" ON avance;
DROP POLICY IF EXISTS "Authenticated users can delete avance" ON avance;

CREATE POLICY "Allow all operations on avance"
  ON avance FOR ALL
  USING (true) WITH CHECK (true);

-- ── avance_asignaciones ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can select avance_asignaciones" ON avance_asignaciones;
DROP POLICY IF EXISTS "Authenticated users can insert avance_asignaciones" ON avance_asignaciones;
DROP POLICY IF EXISTS "Authenticated users can update avance_asignaciones" ON avance_asignaciones;
DROP POLICY IF EXISTS "Authenticated users can delete avance_asignaciones" ON avance_asignaciones;

CREATE POLICY "Allow all operations on avance_asignaciones"
  ON avance_asignaciones FOR ALL
  USING (true) WITH CHECK (true);
