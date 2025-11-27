import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { AuditRetentionService, RetentionEligibleEvent } from '../../services/auditRetentionService';
import { ExportUtils } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

interface AuditRetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingEvents: RetentionEligibleEvent[];
  userId: string;
}

const AuditRetentionModal: React.FC<AuditRetentionModalProps> = ({
  isOpen,
  onClose,
  pendingEvents,
  userId
}) => {
  const [allEventos, setAllEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  useEffect(() => {
    if (isOpen) {
      loadAllEventos();
    }
  }, [isOpen]);

  const loadAllEventos = async () => {
    try {
      setLoading(true);
      const result = await SupabaseService.searchEventos({
        limit: 10000,
        offset: 0
      });
      setAllEventos(result.data);
    } catch (error) {
      console.error('Error loading eventos:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const dateRangeStart = pendingEvents.length > 0
        ? new Date(pendingEvents[pendingEvents.length - 1].created_at).toLocaleDateString('es-ES')
        : '';
      const dateRangeEnd = pendingEvents.length > 0
        ? new Date(pendingEvents[0].created_at).toLocaleDateString('es-ES')
        : '';

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

      if (exportFormat === 'excel') {
        ExportUtils.exportAuditToExcel(
          allEventos,
          `audit-retention-${timestamp}`,
          {
            startDate: dateRangeStart,
            endDate: dateRangeEnd,
            exportedBy: userId
          }
        );
      } else {
        await ExportUtils.exportAuditToPDF(
          allEventos,
          `audit-retention-${timestamp}`,
          {
            startDate: dateRangeStart,
            endDate: dateRangeEnd,
            exportedBy: userId
          }
        );
      }

      await AuditRetentionService.recordExport(
        userId,
        exportFormat,
        `audit-retention-${timestamp}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`,
        allEventos.length,
        dateRangeStart,
        dateRangeEnd
      );

      toast.success(`Auditoría exportada correctamente a ${exportFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Error exporting audit:', error);
      toast.error('Error al exportar auditoría');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const criticalCount = pendingEvents.filter(e => e.days_until_deletion <= 7).length;
  const minDaysUntilDeletion = pendingEvents.length > 0
    ? Math.min(...pendingEvents.map(e => e.days_until_deletion))
    : 0;

  const eventsByType = pendingEvents.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Registros Próximos a Expiración
                </h3>
                <p className="text-sm text-gray-600">
                  {pendingEvents.length} evento{pendingEvents.length !== 1 ? 's' : ''} por expirar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className={`rounded-lg p-4 border ${
              minDaysUntilDeletion <= 7
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Total de eventos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{pendingEvents.length}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Críticos</p>
                  <p className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {criticalCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Días hasta eliminación</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    minDaysUntilDeletion <= 7 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {minDaysUntilDeletion}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Registros totales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allEventos.length}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Eventos por tipo</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(eventsByType).map(([tipo, count]) => (
                  <div key={tipo} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{tipo}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Formato de exportación</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Excel (.xlsx)</p>
                    <p className="text-sm text-gray-600">
                      Múltiples hojas: resumen, por tipo, por usuario, críticos
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">PDF</p>
                    <p className="text-sm text-gray-600">
                      Reporte profesional multi-página con estadísticas
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex space-x-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Información importante</p>
                  <p className="mt-1">
                    La exportación incluirá TODOS los {allEventos.length} registros de auditoría sin límites.
                    Una vez exportados, podrás autorizar la eliminación automática de los registros vencidos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>
                {exporting ? 'Exportando...' : `Exportar a ${exportFormat.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditRetentionModal;
