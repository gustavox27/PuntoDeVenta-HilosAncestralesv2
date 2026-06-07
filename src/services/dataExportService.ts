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
    // Tablas base (siempre presentes)
    usuarios: any[];
    productos: any[];
    ventas: any[];
    ventas_detalle: any[];
    eventos: any[];
    anticipos: any[];
    colores: any[];
    // Tablas nuevas — opcionales para compatibilidad con backups anteriores
    notas_pedido?: any[];
    notas_pedido_detalle?: any[];
    programacion?: any[];
    avance?: any[];
    avance_asignaciones?: any[];
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
        { name: 'notas_pedido', label: 'Notas de Pedido' },
        { name: 'notas_pedido_detalle', label: 'Detalle Notas Pedido' },
        { name: 'programacion', label: 'Programación' },
        { name: 'avance', label: 'Avance' },
        { name: 'avance_asignaciones', label: 'Asignaciones Avance' },
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
      const [
        usuarios, productos, ventas, ventas_detalle, eventos, anticipos, colores,
        notas_pedido, notas_pedido_detalle, programacion, avance, avance_asignaciones,
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('ventas').select('*'),
        supabase.from('ventas_detalle').select('*'),
        supabase.from('eventos').select('*'),
        supabase.from('anticipos').select('*'),
        supabase.from('colores').select('*'),
        supabase.from('notas_pedido').select('*'),
        supabase.from('notas_pedido_detalle').select('*'),
        supabase.from('programacion').select('*'),
        supabase.from('avance').select('*'),
        supabase.from('avance_asignaciones').select('*'),
      ]);

      if (usuarios.error) throw usuarios.error;
      if (productos.error) throw productos.error;
      if (ventas.error) throw ventas.error;
      if (ventas_detalle.error) throw ventas_detalle.error;
      if (eventos.error) throw eventos.error;
      if (anticipos.error) throw anticipos.error;
      if (colores.error) throw colores.error;
      // Las tablas nuevas pueden no tener datos; no lanzamos error si están vacías
      // pero sí si hay un error real de acceso.
      if (notas_pedido.error) throw notas_pedido.error;
      if (notas_pedido_detalle.error) throw notas_pedido_detalle.error;
      if (programacion.error) throw programacion.error;
      if (avance.error) throw avance.error;
      if (avance_asignaciones.error) throw avance_asignaciones.error;

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
          notas_pedido: notas_pedido.data || [],
          notas_pedido_detalle: notas_pedido_detalle.data || [],
          programacion: programacion.data || [],
          avance: avance.data || [],
          avance_asignaciones: avance_asignaciones.data || [],
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

    let link: HTMLAnchorElement | null = null;
    let url: string | null = null;

    try {
      const backupData = await this.exportAllData();
      const fileName = `backup-${APP_NAME}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');

      link.href = url;
      link.download = fileName;
      link.style.position = 'fixed';
      link.style.top = '-9999px';
      link.style.left = '-9999px';

      document.body.appendChild(link);

      setTimeout(() => {
        if (link) {
          link.click();

          setTimeout(() => {
            if (link && link.parentNode) {
              link.parentNode.removeChild(link);
            }
            if (url) {
              URL.revokeObjectURL(url);
            }
          }, 100);
        }
      }, 0);

    } catch (error) {
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
      console.error('Error downloading backup:', error);
      throw new Error('No se pudo descargar el backup');
    }
  },
};
