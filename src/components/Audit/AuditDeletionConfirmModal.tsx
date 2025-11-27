import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { AuditCleanupService } from '../../services/auditCleanupService';
import { AuditRetentionService } from '../../services/auditRetentionService';
import toast from 'react-hot-toast';

interface AuditDeletionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  userId: string;
}

const AuditDeletionConfirmModal: React.FC<AuditDeletionConfirmModalProps> = ({
  isOpen,
  onClose,
  eventCount,
  dateRangeStart,
  dateRangeEnd,
  userId
}) => {
  const [confirming, setConfirming] = useState(false);
  const [postponing, setPostponing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmDeletion = async () => {
    try {
      setConfirming(true);

      const readyEvents = await AuditCleanupService.getReadyForDeletionEvents(0);
      if (readyEvents.length === 0) {
        toast.error('No hay eventos listos para eliminar');
        return;
      }

      const eventIds = readyEvents.map(e => e.id);
      const deletion = await AuditCleanupService.deleteMarkedEvents(userId);

      toast.success(
        `${deletion.deleted_count} registros de auditoría han sido eliminados correctamente`
      );

      await AuditRetentionService.createRetentionAlert(
        userId,
        'deletion_complete',
        deletion.deleted_count,
        deletion.date_range_start || '',
        deletion.date_range_end || ''
      );

      setConfirmed(true);
      setTimeout(() => {
        onClose();
        setConfirmed(false);
      }, 2000);
    } catch (error) {
      console.error('Error confirming deletion:', error);
      toast.error('Error al eliminar registros');
    } finally {
      setConfirming(false);
    }
  };

  const handlePostpone = async () => {
    try {
      setPostponing(true);

      const readyEvents = await AuditCleanupService.getReadyForDeletionEvents(0);
      if (readyEvents.length === 0) {
        toast.error('No hay eventos para posponer');
        return;
      }

      const eventIds = readyEvents.map(e => e.id);
      await AuditCleanupService.postponeDeletion(eventIds, 7);

      toast.success('Eliminación pospuesta 7 días adicionales');
      onClose();
    } catch (error) {
      console.error('Error postponing deletion:', error);
      toast.error('Error al posponer eliminación');
    } finally {
      setPostponing(false);
    }
  };

  if (!isOpen) return null;

  if (confirmed) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Eliminación completada
              </h3>
              <p className="text-gray-600">
                Los registros de auditoría han sido eliminados correctamente
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirmar eliminación de auditoría
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold">Advertencia de eliminación permanente</p>
                  <p className="mt-1">
                    Estás a punto de eliminar permanentemente {eventCount} registros de auditoría.
                    Esta acción es irreversible.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase">Registros</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{eventCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase">Desde</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">{dateRangeStart}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase">Hasta</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">{dateRangeEnd}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Entiendo que los registros serán eliminados permanentemente
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    He exportado y guardado todos los registros que necesito conservar
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Opción de posponer</p>
                <p className="mt-1">
                  Si no estás seguro, puedes posponer la eliminación 7 días adicionales
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handlePostpone}
              disabled={postponing || confirming}
              className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Clock size={16} />
              <span>{postponing ? 'Posponiendo...' : 'Posponer 7 días'}</span>
            </button>
            <button
              onClick={onClose}
              disabled={confirming || postponing}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDeletion}
              disabled={!confirmed || confirming || postponing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              <span>{confirming ? 'Eliminando...' : 'Eliminar registros'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditDeletionConfirmModal;
