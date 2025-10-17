/*
  # Aplicación del esquema limpio completo de HILOSdeCALIDAD

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

-- Tabla eventos con campos adicionales para auditoría
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descripcion text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  usuario text,
  modulo text,
  accion text,
  entidad_id text,
  entidad_tipo text,
  ip_address text,
  detalles jsonb,
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
CREATE INDEX IF NOT EXISTS idx_eventos_modulo ON eventos(modulo);
CREATE INDEX IF NOT EXISTS idx_eventos_accion ON eventos(accion);
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
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Permitir todas las operaciones en usuarios') THEN
    CREATE POLICY "Permitir todas las operaciones en usuarios" ON usuarios
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'productos' AND policyname = 'Permitir todas las operaciones en productos') THEN
    CREATE POLICY "Permitir todas las operaciones en productos" ON productos
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ventas' AND policyname = 'Permitir todas las operaciones en ventas') THEN
    CREATE POLICY "Permitir todas las operaciones en ventas" ON ventas
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ventas_detalle' AND policyname = 'Permitir todas las operaciones en ventas_detalle') THEN
    CREATE POLICY "Permitir todas las operaciones en ventas_detalle" ON ventas_detalle
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eventos' AND policyname = 'Permitir todas las operaciones en eventos') THEN
    CREATE POLICY "Permitir todas las operaciones en eventos" ON eventos
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anticipos' AND policyname = 'Permitir todas las operaciones en anticipos') THEN
    CREATE POLICY "Permitir todas las operaciones en anticipos" ON anticipos
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'colores' AND policyname = 'Permitir todas las operaciones en colores') THEN
    CREATE POLICY "Permitir todas las operaciones en colores" ON colores
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

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

-- Función para actualizar la venta cuando se modifica un anticipo
CREATE OR REPLACE FUNCTION actualizar_venta_desde_anticipos()
RETURNS TRIGGER AS $$
DECLARE
  v_venta_id uuid;
  v_total_anticipos numeric;
  v_total_venta numeric;
  v_descuento_total numeric;
  v_nuevo_saldo numeric;
BEGIN
  v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  IF v_venta_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_anticipos
  FROM anticipos
  WHERE venta_id = v_venta_id;
  
  SELECT total, COALESCE(descuento_total, 0)
  INTO v_total_venta, v_descuento_total
  FROM ventas
  WHERE id = v_venta_id;
  
  v_nuevo_saldo := (v_total_venta - v_descuento_total) - v_total_anticipos;
  
  IF v_nuevo_saldo < 0 THEN
    v_nuevo_saldo := 0;
  END IF;
  
  UPDATE ventas
  SET 
    anticipo_total = v_total_anticipos,
    saldo_pendiente = v_nuevo_saldo,
    estado_pago = CASE 
      WHEN v_nuevo_saldo = 0 THEN 'completo'
      ELSE 'pendiente'
    END,
    completada = (v_nuevo_saldo = 0)
  WHERE id = v_venta_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para INSERT, UPDATE y DELETE en anticipos
DROP TRIGGER IF EXISTS trigger_actualizar_venta_desde_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_venta_desde_anticipos
  AFTER INSERT OR UPDATE OR DELETE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_venta_desde_anticipos();