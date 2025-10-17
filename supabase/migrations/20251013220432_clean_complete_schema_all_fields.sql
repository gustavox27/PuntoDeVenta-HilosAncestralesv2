/*
  # Esquema completo HILOSdeCALIDAD con todos los campos necesarios

  1. Nuevas Tablas
    - `usuarios` - Gestión de clientes y usuarios del sistema
    - `productos` - Inventario de hilos con control de estados y fechas
    - `ventas` - Registro de transacciones con anticipos, descuentos y estados
    - `ventas_detalle` - Detalles de ventas con descuentos por producto
    - `eventos` - Log de actividades del sistema
    - `anticipos` - Gestión de anticipos de pago por venta
    - `colores` - Catálogo de colores disponibles

  2. Campos Principales
    - productos.fecha_registro - Timestamp automático al crear producto
    - productos.cantidad - Cantidad de madejas/conos disponibles
    - ventas_detalle.descuento - Monto de descuento por producto
    - ventas.anticipo_total - Total de anticipos aplicados
    - ventas.saldo_pendiente - Saldo pendiente de pago
    - ventas.descuento_total - Descuento aplicado al total de la venta
    - ventas.estado_pago - Estado del pago (completo/pendiente)
    - ventas.completada - Indica si la venta está finalizada

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso permisivas (ajustables según necesidad)
    
  4. Automatización
    - Triggers para calcular subtotales con descuentos
    - Triggers para actualizar totales de venta automáticamente
    - Triggers para actualizar timestamps de modificación
    - Índices optimizados para consultas frecuentes
*/

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  dni text UNIQUE NOT NULL,
  perfil text NOT NULL DEFAULT 'Cliente' CHECK (perfil IN ('Administrador', 'Vendedor', 'Almacenero', 'Cliente')),
  created_at timestamptz DEFAULT now()
);

-- Tabla productos con fecha_registro y cantidad
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  color text NOT NULL,
  descripcion text,
  estado text NOT NULL CHECK (estado IN ('Por Hilandar', 'Por Devanar', 'Conos Devanados', 'Conos Veteados')),
  precio_base decimal(10,2) DEFAULT 0,
  precio_uni decimal(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  cantidad integer,
  fecha_ingreso timestamptz DEFAULT now(),
  fecha_registro timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabla ventas con todos los campos necesarios
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_venta timestamptz NOT NULL DEFAULT now(),
  total decimal(10,2) NOT NULL DEFAULT 0,
  vendedor text NOT NULL DEFAULT 'Sistema',
  codigo_qr text,
  anticipo_total decimal(10,2) DEFAULT 0,
  saldo_pendiente decimal(10,2) DEFAULT 0,
  descuento_total decimal(10,2) DEFAULT 0,
  estado_pago text CHECK (estado_pago IN ('completo', 'pendiente')),
  completada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabla ventas_detalle con descuento
CREATE TABLE IF NOT EXISTS ventas_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  id_producto uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  descuento decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla eventos
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descripcion text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  usuario text,
  created_at timestamptz DEFAULT now()
);

-- Tabla anticipos
CREATE TABLE IF NOT EXISTS anticipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  monto numeric(10, 2) NOT NULL CHECK (monto > 0),
  metodo_pago text NOT NULL,
  fecha_anticipo timestamptz NOT NULL DEFAULT now(),
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla colores
CREATE TABLE IF NOT EXISTS colores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  codigo_color text,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_fecha_registro ON productos(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_completada ON ventas(completada);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON ventas_detalle(id_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto ON ventas_detalle(id_producto);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_anticipos_venta_id ON anticipos(venta_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_cliente_id ON anticipos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_fecha ON anticipos(fecha_anticipo);
CREATE INDEX IF NOT EXISTS idx_colores_nombre ON colores(nombre);

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colores ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permisivas para desarrollo)
CREATE POLICY "Permitir todas las operaciones en usuarios" ON usuarios
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en productos" ON productos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en ventas" ON ventas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en ventas_detalle" ON ventas_detalle
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en eventos" ON eventos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en anticipos" ON anticipos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en colores" ON colores
  FOR ALL USING (true) WITH CHECK (true);

-- Función para actualizar subtotal con descuento
CREATE OR REPLACE FUNCTION actualizar_subtotal_con_descuento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = (NEW.cantidad * NEW.precio_unitario) - COALESCE(NEW.descuento, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular subtotal con descuento
DROP TRIGGER IF EXISTS trigger_actualizar_subtotal_con_descuento ON ventas_detalle;
CREATE TRIGGER trigger_actualizar_subtotal_con_descuento
  BEFORE INSERT OR UPDATE ON ventas_detalle
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_subtotal_con_descuento();

-- Función para actualizar total de venta
CREATE OR REPLACE FUNCTION actualizar_total_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ventas 
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM ventas_detalle 
    WHERE id_venta = COALESCE(NEW.id_venta, OLD.id_venta)
  )
  WHERE id = COALESCE(NEW.id_venta, OLD.id_venta);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar total de venta
DROP TRIGGER IF EXISTS trigger_actualizar_total_venta ON ventas_detalle;
CREATE TRIGGER trigger_actualizar_total_venta
  AFTER INSERT OR UPDATE OR DELETE ON ventas_detalle
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_venta();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en anticipos
DROP TRIGGER IF EXISTS trigger_actualizar_updated_at_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_updated_at_anticipos
  BEFORE UPDATE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- Insertar datos iniciales
INSERT INTO usuarios (nombre, telefono, dni, perfil) VALUES
  ('Gustavo_Corrales', '960950894', '70471912', 'Administrador'),
  ('Juan Pérez García', '987654321', '12345678', 'Cliente'),
  ('María González López', '876543210', '87654321', 'Cliente')
ON CONFLICT (dni) DO NOTHING;

INSERT INTO colores (nombre, codigo_color, descripcion) VALUES
  ('Rojo', '#FF0000', 'Color rojo básico'),
  ('Azul', '#0000FF', 'Color azul básico'),
  ('Verde', '#00FF00', 'Color verde básico'),
  ('Amarillo', '#FFFF00', 'Color amarillo básico'),
  ('Blanco', '#FFFFFF', 'Color blanco básico'),
  ('Negro', '#000000', 'Color negro básico'),
  ('Marrón', '#A52A2A', 'Color marrón tierra'),
  ('Beige', '#F5F5DC', 'Color beige suave')
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, color, descripcion, estado, precio_base, precio_uni, stock, fecha_ingreso, fecha_registro) VALUES
  ('Hilo Algodón Premium', 'Rojo', 'Hilo de algodón 100%', 'Conos Devanados', 8.50, 12.00, 150, now(), now()),
  ('Hilo Poliéster', 'Azul', 'Hilo sintético resistente', 'Conos Devanados', 6.75, 9.50, 200, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO eventos (tipo, descripcion, usuario) VALUES
  ('Sistema', 'Base de datos inicializada con esquema completo y todos los campos necesarios', 'Sistema')
ON CONFLICT DO NOTHING;