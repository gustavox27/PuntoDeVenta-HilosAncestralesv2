/*
  # Migración Unificada Completa - HILOSdeCALIDAD
  
  ## Resumen
  
  Este archivo consolida todas las migraciones previas en un único schema completo y estructurado.
  Incluye todas las tablas, índices, políticas de seguridad (RLS), triggers y funciones necesarias
  para la operación completa del sistema de gestión de inventario y ventas.
  
  ## Tablas Incluidas
  
  1. **usuarios** - Clientes, vendedores, almaceneros y administradores
  2. **productos** - Inventario de productos con estados y precios
  3. **ventas** - Registro principal de transacciones con número de guía
  4. **ventas_detalle** - Detalles de cada producto vendido
  5. **eventos** - Auditoría completa de todas las operaciones
  6. **anticipos** - Pagos anticipados de clientes
  7. **colores** - Catálogo de colores disponibles
  
  ## Cambios Aplicados
  
  - Campo numero_guia en tabla ventas (obligatorio)
  - Campos para tracking de entidades eliminadas (usuario_eliminado, producto_eliminado)
  - Constraints FK con ON DELETE CASCADE/SET NULL según corresponda
  - Triggers para actualizar totales automáticamente
  - Triggers para marcar eliminaciones sin perder datos históricos
  - Función eliminar_venta_con_rollback para eliminación segura de ventas
  - Índices optimizados para consultas frecuentes
  - Políticas RLS para control de acceso
  
  ## Seguridad
  
  - RLS habilitado en todas las tablas
  - Políticas permisivas (basadas en confianza del sistema)
  - Función eliminar_venta_con_rollback con SECURITY DEFINER
*/

-- =====================================================
-- TABLA USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  dni text UNIQUE NOT NULL,
  direccion text,
  perfil text NOT NULL DEFAULT 'Cliente' CHECK (perfil IN ('Administrador', 'Vendedor', 'Almacenero', 'Cliente')),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA PRODUCTOS
-- =====================================================
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

-- =====================================================
-- TABLA VENTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_venta timestamptz NOT NULL DEFAULT now(),
  total decimal(10,2) NOT NULL DEFAULT 0,
  vendedor text NOT NULL DEFAULT 'Sistema',
  codigo_qr text,
  numero_guia text NOT NULL DEFAULT '',
  anticipo_total decimal(10,2) DEFAULT 0,
  saldo_pendiente decimal(10,2) DEFAULT 0,
  descuento_total decimal(10,2) DEFAULT 0,
  estado_pago text CHECK (estado_pago IN ('completo', 'pendiente')),
  completada boolean DEFAULT false,
  usuario_eliminado_nombre text,
  usuario_eliminado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA VENTAS_DETALLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  id_producto uuid REFERENCES productos(id) ON DELETE SET NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  descuento decimal(10,2) DEFAULT 0,
  producto_eliminado_nombre text,
  producto_eliminado_color text,
  producto_eliminado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA EVENTOS (AUDITORÍA)
-- =====================================================
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

-- =====================================================
-- TABLA ANTICIPOS
-- =====================================================
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

-- =====================================================
-- TABLA COLORES
-- =====================================================
CREATE TABLE IF NOT EXISTS colores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  codigo_color text,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_fecha_registro ON productos(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_completada ON ventas(completada);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_guia ON ventas(numero_guia);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_eliminado ON ventas(usuario_eliminado);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON ventas_detalle(id_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto ON ventas_detalle(id_producto);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto_eliminado ON ventas_detalle(producto_eliminado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_modulo ON eventos(modulo);
CREATE INDEX IF NOT EXISTS idx_eventos_accion ON eventos(accion);
CREATE INDEX IF NOT EXISTS idx_anticipos_venta_id ON anticipos(venta_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_cliente_id ON anticipos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_fecha ON anticipos(fecha_anticipo);
CREATE INDEX IF NOT EXISTS idx_colores_nombre ON colores(nombre);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto_venta ON ventas_detalle(id_venta, id_producto);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) - HABILITACIÓN
-- =====================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colores ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================
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

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar subtotal con descuento
CREATE OR REPLACE FUNCTION actualizar_subtotal_con_descuento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = (NEW.cantidad * NEW.precio_unitario) - COALESCE(NEW.descuento, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trigger_actualizar_updated_at_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_updated_at_anticipos
  BEFORE UPDATE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- Función para actualizar venta desde anticipos
CREATE OR REPLACE FUNCTION actualizar_venta_desde_anticipos()
RETURNS TRIGGER AS $$
DECLARE
  v_venta_id uuid;
  v_total_anticipos numeric;
  v_total_venta numeric;
  v_descuento_total numeric;
  v_nuevo_saldo numeric;
  v_completada_original boolean;
BEGIN
  v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  IF v_venta_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT completada INTO v_completada_original
  FROM ventas
  WHERE id = v_venta_id;
  
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
  
  IF v_completada_original = false OR TG_OP = 'INSERT' THEN
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
  ELSE
    UPDATE ventas
    SET anticipo_total = v_total_anticipos
    WHERE id = v_venta_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_venta_desde_anticipos ON anticipos;
CREATE TRIGGER trigger_actualizar_venta_desde_anticipos
  AFTER INSERT OR UPDATE OR DELETE ON anticipos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_venta_desde_anticipos();

-- Función para marcar ventas cuando se elimina usuario
CREATE OR REPLACE FUNCTION marcar_ventas_usuario_eliminado()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ventas
  SET 
    usuario_eliminado_nombre = OLD.nombre,
    usuario_eliminado = true
  WHERE id_usuario = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marcar_ventas_usuario_eliminado ON usuarios;
CREATE TRIGGER trigger_marcar_ventas_usuario_eliminado
  BEFORE DELETE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION marcar_ventas_usuario_eliminado();

-- Función para marcar ventas_detalle cuando se elimina producto
CREATE OR REPLACE FUNCTION marcar_ventas_detalle_producto_eliminado()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ventas_detalle
  SET 
    producto_eliminado_nombre = OLD.nombre,
    producto_eliminado_color = OLD.color,
    producto_eliminado = true
  WHERE id_producto = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marcar_ventas_detalle_producto_eliminado ON productos;
CREATE TRIGGER trigger_marcar_ventas_detalle_producto_eliminado
  BEFORE DELETE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION marcar_ventas_detalle_producto_eliminado();

-- =====================================================
-- FUNCIÓN: Eliminar Venta con Rollback Completo
-- =====================================================

CREATE OR REPLACE FUNCTION eliminar_venta_con_rollback(
  p_venta_id uuid,
  p_usuario_actual text DEFAULT 'Sistema'
)
RETURNS jsonb AS $$
DECLARE
  v_venta record;
  v_detalle record;
  v_anticipo record;
  v_resultado jsonb;
  v_productos_restaurados int := 0;
  v_anticipos_restaurados int := 0;
BEGIN
  -- Validar que la venta existe
  SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id;
  
  IF v_venta IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Venta no encontrada'
    );
  END IF;

  -- PASO 1: Restaurar stock de productos vendidos
  FOR v_detalle IN 
    SELECT id_producto, cantidad 
    FROM ventas_detalle 
    WHERE id_venta = p_venta_id AND id_producto IS NOT NULL
  LOOP
    UPDATE productos 
    SET stock = stock + v_detalle.cantidad
    WHERE id = v_detalle.id_producto;
    
    v_productos_restaurados := v_productos_restaurados + 1;
  END LOOP;

  -- PASO 2: Restaurar anticipos como disponibles sin venta
  FOR v_anticipo IN 
    SELECT id, monto, metodo_pago, fecha_anticipo, observaciones
    FROM anticipos 
    WHERE venta_id = p_venta_id
  LOOP
    INSERT INTO anticipos (
      cliente_id, 
      monto, 
      metodo_pago, 
      fecha_anticipo, 
      observaciones
    )
    VALUES (
      v_venta.id_usuario,
      v_anticipo.monto,
      v_anticipo.metodo_pago,
      v_anticipo.fecha_anticipo,
      'Restaurado por eliminación de venta #' || p_venta_id::text || '. Original: ' || COALESCE(v_anticipo.observaciones, '')
    );
    
    v_anticipos_restaurados := v_anticipos_restaurados + 1;
  END LOOP;

  -- PASO 3: Eliminar anticipos asociados a la venta
  DELETE FROM anticipos WHERE venta_id = p_venta_id;

  -- PASO 4: Eliminar detalles de venta
  DELETE FROM ventas_detalle WHERE id_venta = p_venta_id;

  -- PASO 5: Eliminar la venta
  DELETE FROM ventas WHERE id = p_venta_id;

  -- PASO 6: Registrar evento de eliminación
  INSERT INTO eventos (
    tipo,
    descripcion,
    usuario,
    modulo,
    accion,
    entidad_id,
    entidad_tipo,
    detalles
  )
  VALUES (
    'Venta',
    'Venta eliminada con rollback completo',
    p_usuario_actual,
    'Historial',
    'Eliminar',
    p_venta_id::text,
    'venta',
    jsonb_build_object(
      'venta_id', p_venta_id,
      'cliente_id', v_venta.id_usuario,
      'total_venta', v_venta.total,
      'anticipo_total', v_venta.anticipo_total,
      'productos_restaurados', v_productos_restaurados,
      'anticipos_restaurados', v_anticipos_restaurados,
      'fecha_venta_original', v_venta.fecha_venta,
      'numero_guia', v_venta.numero_guia
    )
  );

  v_resultado := jsonb_build_object(
    'success', true,
    'message', 'Venta eliminada correctamente con rollback',
    'venta_id', p_venta_id,
    'productos_restaurados', v_productos_restaurados,
    'anticipos_restaurados', v_anticipos_restaurados,
    'total_revertido', v_venta.total
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Error al eliminar venta: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;