import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const APP_NAME = 'HILOSdeCALIDAD';
const SCHEMA_VERSION = '1.0.0';

export interface BackupData {
  metadata: {
    version: string;
    appName: string;
    exportDate: string;
    timestamp: number;
    schemaVersion: string;
  };
  data: {
    usuarios: any[];
    productos: any[];
    ventas: any[];
    ventas_detalle: any[];
    eventos: any[];
    anticipos: any[];
    colores: any[];
  };
}

export interface TableStats {
  tableName: string;
  count: number;
  label: string;
}

export const dataExportService = {
  async getTableStats(): Promise<TableStats[]> {
    try {
      const tables = [
        { name: 'usuarios', label: 'Usuarios' },
        { name: 'productos', label: 'Productos' },
        { name: 'ventas', label: 'Ventas' },
        { name: 'ventas_detalle', label: 'Detalles de Ventas' },
        { name: 'eventos', label: 'Eventos' },
        { name: 'anticipos', label: 'Anticipos' },
        { name: 'colores', label: 'Colores' },
      ];

      const stats = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.error(`Error counting ${table.name}:`, error);
            return { tableName: table.name, count: 0, label: table.label };
          }

          return { tableName: table.name, count: count || 0, label: table.label };
        })
      );

      return stats;
    } catch (error) {
      console.error('Error getting table stats:', error);
      throw new Error('No se pudieron obtener las estadísticas de las tablas');
    }
  },

  async exportAllData(): Promise<BackupData> {
    try {
      const [usuarios, productos, ventas, ventas_detalle, eventos, anticipos, colores] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('ventas').select('*'),
        supabase.from('ventas_detalle').select('*'),
        supabase.from('eventos').select('*'),
        supabase.from('anticipos').select('*'),
        supabase.from('colores').select('*'),
      ]);

      if (usuarios.error) throw usuarios.error;
      if (productos.error) throw productos.error;
      if (ventas.error) throw ventas.error;
      if (ventas_detalle.error) throw ventas_detalle.error;
      if (eventos.error) throw eventos.error;
      if (anticipos.error) throw anticipos.error;
      if (colores.error) throw colores.error;

      const backupData: BackupData = {
        metadata: {
          version: SCHEMA_VERSION,
          appName: APP_NAME,
          exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          timestamp: Date.now(),
          schemaVersion: SCHEMA_VERSION,
        },
        data: {
          usuarios: usuarios.data || [],
          productos: productos.data || [],
          ventas: ventas.data || [],
          ventas_detalle: ventas_detalle.data || [],
          eventos: eventos.data || [],
          anticipos: anticipos.data || [],
          colores: colores.data || [],
        },
      };

      return backupData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('No se pudieron exportar los datos');
    }
  },

  async downloadBackup(): Promise<void> {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Este método solo puede ejecutarse en un navegador');
    }

    try {
      const backupData = await this.exportAllData();
      const fileName = `backup-${APP_NAME}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      if (!link) {
        throw new Error('No se pudo crear el elemento de descarga');
      }

      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      const body = document.body;
      if (!body) {
        URL.revokeObjectURL(url);
        throw new Error('No se pudo acceder al body del documento');
      }

      body.appendChild(link);

      try {
        link.click();
      } finally {
        if (link.parentNode === body) {
          body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('No se pudo descargar el backup');
    }
  },
};
