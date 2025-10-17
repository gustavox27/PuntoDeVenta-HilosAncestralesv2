import { supabase } from '../lib/supabase';
import { BackupData } from './dataExportService';
import { dataValidationService, ValidationResult } from './dataValidationService';

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
  success: boolean;
  validation: ValidationResult;
  imported: {
    usuarios: number;
    productos: number;
    ventas: number;
    ventas_detalle: number;
    eventos: number;
    anticipos: number;
    colores: number;
  };
  skipped: {
    usuarios: number;
    productos: number;
    ventas: number;
    ventas_detalle: number;
    eventos: number;
    anticipos: number;
    colores: number;
  };
  errors: string[];
}

const TABLE_ORDER = [
  'usuarios',
  'productos',
  'colores',
  'ventas',
  'ventas_detalle',
  'anticipos',
  'eventos',
];

export const dataImportService = {
  async clearAllData(): Promise<void> {
    try {
      const deleteOrder = [...TABLE_ORDER].reverse();

      for (const table of deleteOrder) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error(`Error clearing ${table}:`, error);
          throw new Error(`No se pudo limpiar la tabla ${table}`);
        }
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  async importData(
    backupData: BackupData,
    mode: ImportMode,
    skipValidation: boolean = false
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        recordCounts: {
          usuarios: 0,
          productos: 0,
          ventas: 0,
          ventas_detalle: 0,
          eventos: 0,
          anticipos: 0,
          colores: 0,
        },
      },
      imported: {
        usuarios: 0,
        productos: 0,
        ventas: 0,
        ventas_detalle: 0,
        eventos: 0,
        anticipos: 0,
        colores: 0,
      },
      skipped: {
        usuarios: 0,
        productos: 0,
        ventas: 0,
        ventas_detalle: 0,
        eventos: 0,
        anticipos: 0,
        colores: 0,
      },
      errors: [],
    };

    try {
      if (!skipValidation) {
        const structureValidation = dataValidationService.validateBackupStructure(backupData);
        if (!structureValidation.isValid) {
          result.validation = structureValidation;
          result.errors.push(...structureValidation.errors);
          return result;
        }

        const integrityValidation = dataValidationService.validateDataIntegrity(backupData);
        result.validation = integrityValidation;

        if (integrityValidation.warnings.length > 0) {
          console.warn('Advertencias de integridad:', integrityValidation.warnings);
        }
      }

      if (mode === 'replace') {
        await this.clearAllData();
      }

      for (const table of TABLE_ORDER) {
        try {
          const records = backupData.data[table as keyof typeof backupData.data];

          if (!records || records.length === 0) {
            continue;
          }

          if (mode === 'merge') {
            const existingIds = new Set();
            const { data: existing } = await supabase.from(table).select('id');

            if (existing) {
              existing.forEach((record: any) => existingIds.add(record.id));
            }

            const newRecords = records.filter((record: any) => !existingIds.has(record.id));
            const skippedCount = records.length - newRecords.length;

            result.skipped[table as keyof typeof result.skipped] = skippedCount;

            if (newRecords.length > 0) {
              const { error } = await supabase.from(table).insert(newRecords);

              if (error) {
                result.errors.push(`Error importando ${table}: ${error.message}`);
                console.error(`Error importing ${table}:`, error);
              } else {
                result.imported[table as keyof typeof result.imported] = newRecords.length;
              }
            }
          } else {
            const { error } = await supabase.from(table).insert(records);

            if (error) {
              result.errors.push(`Error importando ${table}: ${error.message}`);
              console.error(`Error importing ${table}:`, error);
            } else {
              result.imported[table as keyof typeof result.imported] = records.length;
            }
          }
        } catch (error: any) {
          result.errors.push(`Error procesando ${table}: ${error.message}`);
          console.error(`Error processing ${table}:`, error);
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push(`Error general: ${error.message}`);
      console.error('Error during import:', error);
      return result;
    }
  },

  async readBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          resolve(data);
        } catch (error) {
          reject(new Error('El archivo no es un JSON válido'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file);
    });
  },
};
