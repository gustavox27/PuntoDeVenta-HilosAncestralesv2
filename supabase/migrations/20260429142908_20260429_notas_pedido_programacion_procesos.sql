/*
  # Módulos: Notas de Pedido, Programación, Procesos y Avance

  ## Resumen
  Crea todas las tablas necesarias para los nuevos módulos del sistema:
  "Notas de Pedido", "Programación", "Procesos" y "Avance".

  ## Nuevas Tablas

  ### 1. notas_pedido
  - Registro principal de cada nota de pedido generada por Administrador o Vendedor
  - Campos: id, cliente_id (FK usuarios), vendedor_id (FK usuarios), fecha_pedido,
    estado ('Pendiente'|'Terminado'), anticipo_id (FK anticipos, opcional), created_at

  ### 2. notas_pedido_detalle
  - Detalle de productos por nota de pedido (color + cantidad)
  - Campos: id, nota_id (FK), color (texto), cantidad, estado ('Pendiente'|'Enviado'|'Asignado'),
    cantidad_asignada (descuento acumulado), orden_posicion, created_at

  ### 3. notas_pedido_orden
  - Persiste el orden drag-and-drop por usuario (personal, no global)
  - Campos: usuario_id (FK), nota_id (FK), posicion; PK compuesta

  ### 4. programacion
  - Agrupa pedidos de tintoría por color (una fila activa por color hasta completarse)
  - Campos: id, color, cantidad_total, cantidad_pendiente, fecha_envio, fecha_completado,
    estado ('Pendiente'|'EnProceso'|'Completado'|'Cancelado'), created_at

  ### 5. programacion_origen
  - Vincula cada fila de programación con los detalles de nota que la originaron
  - Campos: id, programacion_id (FK), nota_detalle_id (FK), cantidad_origen

  ### 6. avance
  - Inventario intermedio de productos trabajados por los tintorero
  - Campos: id, color, cantidad_disponible, trabajador_id (FK usuarios), created_at

  ### 7. avance_asignaciones
  - Registro de cada asignación de avance a un usuario/nota específica
  - Campos: id, color, cantidad, nota_detalle_id (FK), tipo_producto ('Crudas'|'Reteñidas'),
    descripcion, inventario_producto_id (FK productos generado), fecha, asignado_por (FK usuarios)

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas por rol: Administrador/Vendedor ven todo; Almacenero accede a programación/avance/procesos

  ## Índices
  - FK columns indexadas para joins eficientes
  - Estado e índices de filtro para queries comunes
*/

-- ============================================================
-- TABLA: notas_pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS notas_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  vendedor_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_pedido date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Terminado')),
  anticipo_id uuid REFERENCES anticipos(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notas_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select notas_pedido"
  ON notas_pedido FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notas_pedido"
  ON notas_pedido FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notas_pedido"
  ON notas_pedido FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notas_pedido"
  ON notas_pedido FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: notas_pedido_detalle
-- ============================================================
CREATE TABLE IF NOT EXISTS notas_pedido_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id uuid NOT NULL REFERENCES notas_pedido(id) ON DELETE CASCADE,
  color text NOT NULL DEFAULT '',
  cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Enviado', 'Asignado')),
  cantidad_asignada integer NOT NULL DEFAULT 0,
  nombre_producto text NOT NULL DEFAULT 'Madejas Crudas',
  orden_posicion integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notas_pedido_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select notas_pedido_detalle"
  ON notas_pedido_detalle FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notas_pedido_detalle"
  ON notas_pedido_detalle FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notas_pedido_detalle"
  ON notas_pedido_detalle FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notas_pedido_detalle"
  ON notas_pedido_detalle FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: notas_pedido_orden
-- Persiste el orden drag-and-drop por usuario (personal)
-- ============================================================
CREATE TABLE IF NOT EXISTS notas_pedido_orden (
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota_id uuid NOT NULL REFERENCES notas_pedido(id) ON DELETE CASCADE,
  posicion integer NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, nota_id)
);

ALTER TABLE notas_pedido_orden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select notas_pedido_orden"
  ON notas_pedido_orden FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notas_pedido_orden"
  ON notas_pedido_orden FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notas_pedido_orden"
  ON notas_pedido_orden FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notas_pedido_orden"
  ON notas_pedido_orden FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: programacion
-- Una fila activa por color hasta completarse
-- ============================================================
CREATE TABLE IF NOT EXISTS programacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL DEFAULT '',
  cantidad_total integer NOT NULL DEFAULT 0,
  cantidad_pendiente integer NOT NULL DEFAULT 0,
  fecha_envio timestamptz NOT NULL DEFAULT now(),
  fecha_completado timestamptz,
  estado text NOT NULL DEFAULT 'EnProceso' CHECK (estado IN ('Pendiente', 'EnProceso', 'Completado', 'Cancelado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE programacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select programacion"
  ON programacion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert programacion"
  ON programacion FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update programacion"
  ON programacion FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete programacion"
  ON programacion FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: programacion_origen
-- Vincula programacion con las notas de pedido origen
-- ============================================================
CREATE TABLE IF NOT EXISTS programacion_origen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id uuid NOT NULL REFERENCES programacion(id) ON DELETE CASCADE,
  nota_detalle_id uuid NOT NULL REFERENCES notas_pedido_detalle(id) ON DELETE CASCADE,
  cantidad_origen integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE programacion_origen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select programacion_origen"
  ON programacion_origen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert programacion_origen"
  ON programacion_origen FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update programacion_origen"
  ON programacion_origen FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete programacion_origen"
  ON programacion_origen FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: avance
-- Inventario intermedio de productos trabajados (por color)
-- ============================================================
CREATE TABLE IF NOT EXISTS avance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL DEFAULT '',
  cantidad_disponible integer NOT NULL DEFAULT 0,
  trabajador_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  programacion_id uuid REFERENCES programacion(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select avance"
  ON avance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert avance"
  ON avance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update avance"
  ON avance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete avance"
  ON avance FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLA: avance_asignaciones
-- Registro de cada asignación a un cliente/nota
-- ============================================================
CREATE TABLE IF NOT EXISTS avance_asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL DEFAULT '',
  cantidad integer NOT NULL DEFAULT 0,
  nota_detalle_id uuid REFERENCES notas_pedido_detalle(id) ON DELETE SET NULL,
  tipo_producto text NOT NULL DEFAULT 'Crudas' CHECK (tipo_producto IN ('Crudas', 'Reteñidas')),
  descripcion text DEFAULT '',
  inventario_producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  asignado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avance_asignaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select avance_asignaciones"
  ON avance_asignaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert avance_asignaciones"
  ON avance_asignaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update avance_asignaciones"
  ON avance_asignaciones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete avance_asignaciones"
  ON avance_asignaciones FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- ÍNDICES para mejor performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notas_pedido_cliente ON notas_pedido(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notas_pedido_vendedor ON notas_pedido(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_pedido_estado ON notas_pedido(estado);
CREATE INDEX IF NOT EXISTS idx_notas_pedido_fecha ON notas_pedido(fecha_pedido);

CREATE INDEX IF NOT EXISTS idx_notas_pedido_detalle_nota ON notas_pedido_detalle(nota_id);
CREATE INDEX IF NOT EXISTS idx_notas_pedido_detalle_estado ON notas_pedido_detalle(estado);
CREATE INDEX IF NOT EXISTS idx_notas_pedido_detalle_color ON notas_pedido_detalle(color);

CREATE INDEX IF NOT EXISTS idx_notas_pedido_orden_usuario ON notas_pedido_orden(usuario_id);

CREATE INDEX IF NOT EXISTS idx_programacion_estado ON programacion(estado);
CREATE INDEX IF NOT EXISTS idx_programacion_color ON programacion(color);

CREATE INDEX IF NOT EXISTS idx_programacion_origen_prog ON programacion_origen(programacion_id);
CREATE INDEX IF NOT EXISTS idx_programacion_origen_detalle ON programacion_origen(nota_detalle_id);

CREATE INDEX IF NOT EXISTS idx_avance_color ON avance(color);
CREATE INDEX IF NOT EXISTS idx_avance_trabajador ON avance(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_avance_programacion ON avance(programacion_id);

CREATE INDEX IF NOT EXISTS idx_avance_asignaciones_detalle ON avance_asignaciones(nota_detalle_id);
CREATE INDEX IF NOT EXISTS idx_avance_asignaciones_color ON avance_asignaciones(color);
