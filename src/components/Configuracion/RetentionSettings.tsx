import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, TrendingUp, Trash2 } from 'lucide-react';
import { AuditRetentionService } from '../../services/auditRetentionService';
import { AuditCleanupService } from '../../services/auditCleanupService';
import toast from 'react-hot-toast';

interface RetentionSettingsProps {
  userId: string;
}

const RetentionSettings: React.FC<RetentionSettingsProps> = ({ userId }) => {
  const [retentionMonths, setRetentionMonths] = useState(3);
  const [alertDaysBefore, setAlertDaysBefore] = useState(15);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalEventsCount: 0,
    deletedEventsCount: 0,
    markedForDeletionCount: 0,
    totalDeletions: 0,
    totalDeletedEvents: 0
  });

  useEffect(() => {
    loadConfiguration();
    loadStats();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const config = await AuditRetentionService.getRetentionConfig();
      setRetentionMonths(config.retention_months);
      setAlertDaysBefore(config.alert_days_before);
      setAutoDeleteEnabled(config.auto_delete_enabled);
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const deletionStats = await AuditCleanupService.getDeletionStats();
      const deletedCount = await AuditCleanupService.getDeletedEventsCount();
      const markedCount = await AuditCleanupService.getMarkedForDeletionCount();
      const { data: totalEventsResult } = await fetch('').then(() => ({ data: null }));

      setStats({
        totalEventsCount: 0,
        deletedEventsCount: deletedCount,
        markedForDeletionCount: markedCount,
        totalDeletions: deletionStats.totalDeletions,
        totalDeletedEvents: deletionStats.totalDeletedEvents
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await AuditRetentionService.updateRetentionConfig(
        retentionMonths,
        alertDaysBefore,
        autoDeleteEnabled,
        userId
      );
      toast.success('Configuración actualizada correctamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Configuración de Retención de Auditoría</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Período de retención de registros (meses)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max="36"
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600">
                Los registros serán elegibles para eliminación después de {retentionMonths} meses
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Días de alerta anticipada
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max="60"
                value={alertDaysBefore}
                onChange={(e) => setAlertDaysBefore(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600">
                Se enviará alerta {alertDaysBefore} días antes de la eliminación
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDeleteEnabled}
                onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900">Habilitar eliminación automática</p>
                <p className="text-sm text-gray-600">
                  {autoDeleteEnabled
                    ? 'Los registros vencidos serán eliminados automáticamente después de la exportación'
                    : 'Requiere confirmación manual para eliminar registros'}
                </p>
              </div>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Información importante</p>
              <p className="mt-1">
                Antes de que se eliminen registros, recibirás una alerta para exportarlos. La eliminación solo
                ocurrirá después de que confirmes la exportación.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar configuración'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-600">Eliminaciones realizadas</h4>
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDeletions}</p>
          <p className="text-xs text-gray-600 mt-2">
            {stats.totalDeletedEvents} registros eliminados en total
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-600">Registros marcados</h4>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.markedForDeletionCount}</p>
          <p className="text-xs text-gray-600 mt-2">
            Próximos a ser eliminados
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-600">Registros eliminados</h4>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.deletedEventsCount}</p>
          <p className="text-xs text-gray-600 mt-2">
            En la base de datos (soft delete)
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetentionSettings;
