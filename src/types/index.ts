export interface Usuario {
  id: string;
  nombre: string;
  telefono?: string;
  dni: string;
  direccion?: string;
  perfil: 'Administrador' | 'Vendedor' | 'Almacenero' | 'Cliente';
  created_at?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  color: string;
  descripcion?: string;
  estado: 'Por Hilandar' | 'Por Devanar' | 'Conos Devanados' | 'Conos Veteados';
  precio_base: number;
  precio_uni: number;
  stock: number;
  cantidad?: number;
  fecha_ingreso: string;
  fecha_registro?: string;
  created_at?: string;
}

export interface Venta {
  id: string;
  id_usuario: string;
  fecha_venta: string;
  total: number;
  vendedor: string;
  codigo_qr?: string;
  numero_guia?: string;
  anticipo_total?: number;
  saldo_pendiente?: number;
  descuento_total?: number;
  estado_pago?: 'completo' | 'pendiente';
  completada?: boolean;
  usuario_eliminado_nombre?: string;
  usuario_eliminado?: boolean;
  created_at?: string;
  usuario?: Usuario;
  detalles?: VentaDetalle[];
  anticipos?: Anticipo[];
}

export interface VentaDetalle {
  id: string;
  id_venta: string;
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento?: number;
  producto_eliminado_nombre?: string;
  producto_eliminado_color?: string;
  producto_eliminado?: boolean;
  created_at?: string;
  producto?: Producto;
}

export interface Evento {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario?: string;
  modulo?: string;
  accion?: string;
  entidad_id?: string;
  entidad_tipo?: string;
  ip_address?: string;
  detalles?: string;
  created_at?: string;
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}

export interface Anticipo {
  id: string;
  venta_id?: string;
  cliente_id: string;
  monto: number;
  metodo_pago: string;
  fecha_anticipo: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MetricasVentas {
  totalVentas: number;
  ventasPorPeriodo: Array<{ fecha: string; ventas: number }>;
  productosPopulares: Array<{ nombre: string; cantidad: number }>;
  estadoStock: Array<{ estado: string; cantidad: number }>;
}