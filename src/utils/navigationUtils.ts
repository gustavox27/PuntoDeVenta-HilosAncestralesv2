export interface EntityLocation {
  modulo: string;
  contenedor: string;
  modal: string;
  descripcion: string;
}

const entityLocationMap: Record<string, EntityLocation> = {
  usuario: {
    modulo: 'Usuarios',
    contenedor: 'Lista de Usuarios',
    modal: 'Modal de Gestión de Usuario',
    descripcion: 'Módulo de Usuarios → Tabla de Usuarios → Detalles/Edición'
  },
  producto: {
    modulo: 'Inventario',
    contenedor: 'Catálogo de Productos',
    modal: 'Modal de Gestión de Producto',
    descripcion: 'Inventario → Tabla de Productos → Detalles/Edición'
  },
  venta: {
    modulo: 'Historial',
    contenedor: 'Registro de Ventas',
    modal: 'Modal de Detalles de Venta',
    descripcion: 'Historial → Tabla de Ventas → Detalles/Edición'
  },
  anticipos: {
    modulo: 'Ventas',
    contenedor: 'Gestión de Anticipos',
    modal: 'Modal de Anticipo',
    descripcion: 'Ventas → Sección de Anticipos → Detalles/Edición'
  },
  anticipo: {
    modulo: 'Ventas',
    contenedor: 'Gestión de Anticipos',
    modal: 'Modal de Anticipo',
    descripcion: 'Ventas → Sección de Anticipos → Detalles/Edición'
  },
  color: {
    modulo: 'Inventario',
    contenedor: 'Gestión de Colores',
    modal: 'Modal de Color',
    descripcion: 'Inventario → Gestión de Colores → Detalles/Edición'
  }
};

export const getEntityLocation = (entityType: string): EntityLocation => {
  const normalized = entityType.toLowerCase();
  return entityLocationMap[normalized] || {
    modulo: 'Sistema',
    contenedor: 'Desconocido',
    modal: 'Modal Genérico',
    descripcion: `Ubicación no mapeada para: ${entityType}`
  };
};

export const getEntityDisplayName = (entityType: string): string => {
  const names: Record<string, string> = {
    usuario: 'Usuario',
    producto: 'Producto',
    venta: 'Venta',
    anticipos: 'Anticipo',
    anticipo: 'Anticipo',
    color: 'Color',
    deuda: 'Deuda',
    pago: 'Pago'
  };

  return names[entityType.toLowerCase()] || entityType;
};

export const getRollbackHierarchy = () => ({
  venta: {
    label: 'Venta',
    children: ['detalles', 'anticipos'],
    icon: 'ShoppingCart'
  },
  detalles: {
    label: 'Detalles de Venta',
    parent: 'venta',
    icon: 'Package'
  },
  anticipos: {
    label: 'Anticipos Asociados',
    parent: 'venta',
    icon: 'DollarSign'
  }
});

export const getNavigationUrl = (entityType: string, entityId?: string): string => {
  const baseUrl = '/';
  const location = getEntityLocation(entityType);

  const moduleUrls: Record<string, string> = {
    'Usuarios': 'usuarios',
    'Inventario': 'inventario',
    'Historial': 'historial',
    'Ventas': 'ventas',
    'Dashboard': 'dashboard'
  };

  const moduleUrl = moduleUrls[location.modulo] || location.modulo.toLowerCase();
  return entityId ? `${baseUrl}${moduleUrl}?entity=${entityId}` : `${baseUrl}${moduleUrl}`;
};

export const getActionContext = (tipo: string, accion: string): { icon: string; color: string; bgColor: string } => {
  if (accion === 'Crear') {
    return {
      icon: 'CheckCircle',
      color: 'text-green-700',
      bgColor: 'bg-green-50'
    };
  }

  if (accion === 'Eliminar') {
    return {
      icon: 'Trash2',
      color: 'text-red-700',
      bgColor: 'bg-red-50'
    };
  }

  if (accion === 'Actualizar') {
    return {
      icon: 'Edit2',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    };
  }

  return {
    icon: 'Info',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50'
  };
};
