import { BackupData } from './dataExportService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCounts: {
    usuarios: number;
    productos: number;
    ventas: number;
    ventas_detalle: number;
    eventos: number;
    anticipos: number;
    colores: number;
  };
}

const REQUIRED_TABLES = [
  'usuarios',
  'productos',
  'ventas',
  'ventas_detalle',
  'eventos',
  'anticipos',
  'colores',
];

export const dataValidationService = {
  validateBackupStructure(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recordCounts = {
      usuarios: 0,
      productos: 0,
      ventas: 0,
      ventas_detalle: 0,
      eventos: 0,
      anticipos: 0,
      colores: 0,
    };

    if (!data.metadata) {
      errors.push('Falta el campo metadata');
    } else {
      if (!data.metadata.version) warnings.push('Falta la versión del backup');
      if (!data.metadata.schemaVersion) warnings.push('Falta la versión del schema');
      if (!data.metadata.exportDate) warnings.push('Falta la fecha de exportación');
    }

    if (!data.data) {
      errors.push('Falta el campo data');
      return {
        isValid: false,
        errors,
        warnings,
        recordCounts,
      };
    }

    for (const table of REQUIRED_TABLES) {
      if (!data.data[table]) {
        errors.push(`Falta la tabla: ${table}`);
      } else if (!Array.isArray(data.data[table])) {
        errors.push(`La tabla ${table} no es un array`);
      } else {
        recordCounts[table as keyof typeof recordCounts] = data.data[table].length;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCounts,
    };
  },

  validateDataIntegrity(data: BackupData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recordCounts = {
      usuarios: data.data.usuarios?.length || 0,
      productos: data.data.productos?.length || 0,
      ventas: data.data.ventas?.length || 0,
      ventas_detalle: data.data.ventas_detalle?.length || 0,
      eventos: data.data.eventos?.length || 0,
      anticipos: data.data.anticipos?.length || 0,
      colores: data.data.colores?.length || 0,
    };

    if (data.data.usuarios) {
      const usuariosIds = new Set(data.data.usuarios.map((u: any) => u.id));

      if (data.data.ventas) {
        data.data.ventas.forEach((venta: any, index: number) => {
          if (venta.id_usuario && !usuariosIds.has(venta.id_usuario)) {
            warnings.push(`Venta #${index + 1} referencia a un usuario inexistente`);
          }
        });
      }

      if (data.data.anticipos) {
        data.data.anticipos.forEach((anticipo: any, index: number) => {
          if (anticipo.cliente_id && !usuariosIds.has(anticipo.cliente_id)) {
            warnings.push(`Anticipo #${index + 1} referencia a un cliente inexistente`);
          }
        });
      }
    }

    if (data.data.productos) {
      const productosIds = new Set(data.data.productos.map((p: any) => p.id));

      if (data.data.ventas_detalle) {
        data.data.ventas_detalle.forEach((detalle: any, index: number) => {
          if (detalle.id_producto && !productosIds.has(detalle.id_producto)) {
            warnings.push(`Detalle de venta #${index + 1} referencia a un producto inexistente`);
          }
        });
      }
    }

    if (data.data.ventas) {
      const ventasIds = new Set(data.data.ventas.map((v: any) => v.id));

      if (data.data.ventas_detalle) {
        data.data.ventas_detalle.forEach((detalle: any, index: number) => {
          if (detalle.id_venta && !ventasIds.has(detalle.id_venta)) {
            warnings.push(`Detalle de venta #${index + 1} referencia a una venta inexistente`);
          }
        });
      }

      if (data.data.anticipos) {
        data.data.anticipos.forEach((anticipo: any, index: number) => {
          if (anticipo.venta_id && !ventasIds.has(anticipo.venta_id)) {
            warnings.push(`Anticipo #${index + 1} referencia a una venta inexistente`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCounts,
    };
  },
};
