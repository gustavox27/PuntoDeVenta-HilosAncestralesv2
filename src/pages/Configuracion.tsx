import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  BarChart3,
  Info,
  Palette,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dataExportService, TableStats } from '../services/dataExportService';
import { dataImportService, ImportMode, ImportResult } from '../services/dataImportService';
import { themeService, ThemeColor } from '../services/themeService';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Common/Modal';
import DeleteConfirmationModal from '../components/Common/DeleteConfirmationModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import RetentionSettings from '../components/Configuracion/RetentionSettings';

const APP_VERSION = '7.1.0';
const SCHEMA_VERSION = '2.2.0';

export default function Configuracion() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setThemeColor, toggleThemeMode } = useTheme();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [skipValidation, setSkipValidation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dataExportService.getTableStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);

    if (totalRecords === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      setIsExporting(true);
      await dataExportService.downloadBackup();
      toast.success('Backup exportado correctamente');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('El archivo debe ser un JSON');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    try {
      setIsImporting(true);
      const backupData = await dataImportService.readBackupFile(selectedFile);
      const result = await dataImportService.importData(backupData, importMode, skipValidation);

      setImportResult(result);
      setShowImportModal(false);
      setShowImportResultModal(true);

      if (result.success) {
        toast.success('Datos importados correctamente');
        await loadStats();
      } else {
        toast.error('La importación completó con errores');
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      toast.error(error.message || 'Error al importar los datos');
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      setImportMode('merge');
      setSkipValidation(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      await dataImportService.clearAllData();
      toast.success('Todos los datos han sido eliminados');
      setShowDeleteModal(false);
      await loadStats();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar los datos');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleThemeColorChange = (color: ThemeColor) => {
    setThemeColor(color);
    const colorLabel = themeService.getAvailableColors().find(c => c.value === color)?.label || color;
    toast.success(`Color cambiado a ${colorLabel}`);
  };

  const handleThemeModeChange = () => {
    toggleThemeMode();
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    toast.success(`Modo ${newMode === 'dark' ? 'oscuro' : 'claro'} activado`);
  };

  const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);

  const getColorClasses = () => {
    const isDark = theme.mode === 'dark';
    const colorMap: Record<ThemeColor, any> = {
      blue: {
        card: isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900',
        badge: isDark ? 'bg-blue-700 text-blue-100' : 'bg-blue-600 text-white',
        button: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
        border: isDark ? 'border-blue-700' : 'border-blue-200',
      },
      green: {
        card: isDark ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-900',
        badge: isDark ? 'bg-green-700 text-green-100' : 'bg-green-600 text-white',
        button: isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700',
        border: isDark ? 'border-green-700' : 'border-green-200',
      },
      red: {
        card: isDark ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-900',
        badge: isDark ? 'bg-red-700 text-red-100' : 'bg-red-600 text-white',
        button: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
        border: isDark ? 'border-red-700' : 'border-red-200',
      },
      orange: {
        card: isDark ? 'bg-orange-900 text-orange-100' : 'bg-orange-50 text-orange-900',
        badge: isDark ? 'bg-orange-700 text-orange-100' : 'bg-orange-600 text-white',
        button: isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700',
        border: isDark ? 'border-orange-700' : 'border-orange-200',
      },
      teal: {
        card: isDark ? 'bg-teal-900 text-teal-100' : 'bg-teal-50 text-teal-900',
        badge: isDark ? 'bg-teal-700 text-teal-100' : 'bg-teal-600 text-white',
        button: isDark ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-600 hover:bg-teal-700',
        border: isDark ? 'border-teal-700' : 'border-teal-200',
      },
      cyan: {
        card: isDark ? 'bg-cyan-900 text-cyan-100' : 'bg-cyan-50 text-cyan-900',
        badge: isDark ? 'bg-cyan-700 text-cyan-100' : 'bg-cyan-600 text-white',
        button: isDark ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-cyan-600 hover:bg-cyan-700',
        border: isDark ? 'border-cyan-700' : 'border-cyan-200',
      },
    };

    return colorMap[theme.color];
  };

  const colorClasses = getColorClasses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.mode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Personalización</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Color del Sistema</label>
                <div className="grid grid-cols-3 gap-3">
                  {themeService.getAvailableColors().map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleThemeColorChange(color.value)}
                      className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${theme.color === color.value
                          ? `${colorClasses.border} ${colorClasses.card}`
                          : `${theme.mode === 'dark' ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`
                        }
                      `}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.preview}`} />
                      <span className="text-sm font-medium">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Modo de Visualización</label>
                <button
                  onClick={handleThemeModeChange}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 ${colorClasses.border} ${colorClasses.card} transition-all`}
                >
                  <span className="font-medium">
                    {theme.mode === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
                  </span>
                  {theme.mode === 'light' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Información del Sistema</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Versión de la Aplicación</span>
                <span className={`px-3 py-1 rounded-full ${colorClasses.badge} text-sm font-semibold`}>
                  v{APP_VERSION}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Versión del Schema</span>
                <span className={`px-3 py-1 rounded-full ${colorClasses.badge} text-sm font-semibold`}>
                  v{SCHEMA_VERSION}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Base de Datos</span>
                <span className="text-sm">PostgreSQL (Supabase)</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-medium">Total de Registros</span>
                <span className={`text-2xl font-bold ${colorClasses.badge.includes('blue') ? 'text-blue-600' : colorClasses.badge.includes('green') ? 'text-green-600' : colorClasses.badge.includes('red') ? 'text-red-600' : colorClasses.badge.includes('orange') ? 'text-orange-600' : colorClasses.badge.includes('teal') ? 'text-teal-600' : 'text-cyan-600'}`}>
                  {totalRecords.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-8`}>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Estadísticas de Datos</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.tableName}
                className={`${colorClasses.card} rounded-lg p-4 border-2 ${colorClasses.border} transition-transform hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.count.toLocaleString()}</p>
                  </div>
                  <Database className="w-8 h-8 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Gestión de Datos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting || totalRecords === 0}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg text-white font-semibold transition-all ${colorClasses.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Exportar Datos
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              disabled={isImporting}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg text-white font-semibold transition-all ${colorClasses.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isImporting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Importar Datos
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting || totalRecords === 0}
              className="flex items-center justify-center gap-3 p-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              Eliminar Todo
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedFile(null);
          setImportMode('merge');
          setSkipValidation(false);
        }}
        title="Importar Datos"
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Seleccionar archivo JSON</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                theme.mode === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Modo de importación</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 ${theme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className="w-4 h-4"
                />
                <span>Combinar (mantener datos existentes)</span>
              </label>
              <label className={`flex items-center gap-2 ${theme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className="w-4 h-4"
                />
                <span>Reemplazar (eliminar datos existentes)</span>
              </label>
            </div>
          </div>

          <div>
            <label className={`flex items-center gap-2 ${theme.mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={skipValidation}
                onChange={(e) => setSkipValidation(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Saltar validaciones (modo avanzado)</span>
            </label>
          </div>

          {importMode === 'replace' && (
            <div className={`border rounded-lg p-4 ${
              theme.mode === 'dark'
                ? 'bg-red-950/30 border-red-900'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`font-semibold ${theme.mode === 'dark' ? 'text-red-400' : 'text-red-800'}`}>Advertencia</p>
                  <p className={`text-sm ${theme.mode === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                    Esta acción eliminará todos los datos existentes antes de importar.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
            <button
              onClick={() => {
                setShowImportModal(false);
                setSelectedFile(null);
                setImportMode('merge');
                setSkipValidation(false);
              }}
              disabled={isImporting}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                theme.mode === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportResultModal}
        onClose={() => setShowImportResultModal(false)}
        title="Resultado de la Importación"
      >
        {importResult && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {importResult.success ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <p className="font-semibold">
                {importResult.success ? 'Importación exitosa' : 'Importación con errores'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Registros importados:</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(importResult.imported).map(([table, count]) => (
                  <div key={table} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm">{table}:</span>
                    <span className="font-bold ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Errores:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.validation.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-yellow-600">Advertencias:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {importResult.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setShowImportResultModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAll}
        isDeleting={isDeleting}
      />

      {currentUser?.perfil === 'Administrador' && (
        <div className="mt-8">
          <RetentionSettings userId={currentUser.id || ''} />
        </div>
      )}
    </div>
  );
}
