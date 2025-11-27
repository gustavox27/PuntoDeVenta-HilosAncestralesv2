import React, { useState } from 'react';
import { AlertTriangle, DollarSign, Calendar, CreditCard, Trash2, X } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import Portal from '../Common/Portal';
import toast from 'react-hot-toast';

interface DeleteAdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  advance: {
    id: string;
    monto: number;
    metodo_pago?: string;
    fecha_anticipo: string;
    observaciones?: string;
  };
  onSuccess: () => void;
  currentBalance: number;
}

const DeleteAdvancePaymentModal: React.FC<DeleteAdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  advance,
  onSuccess,
  currentBalance
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleConfirmDelete = async () => {
    setLoading(true);

    try {
      await SupabaseService.deleteAnticipo(advance.id);
      toast.success('Anticipo eliminado correctamente');
      onSuccess();
    } catch (err: any) {
      console.error('Error deleting advance:', err);
      const errorMessage = err?.message || 'Error al eliminar el anticipo';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const newBalance = currentBalance - advance.monto;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      ></div>

      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b border-red-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Eliminar Anticipo</h3>
              <p className="text-xs text-gray-600 mt-1">Esta acción no se puede deshacer</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 text-sm">Confirmar Eliminación</h4>
                <p className="text-sm text-red-700 mt-1">
                  Está a punto de eliminar un anticipo. El saldo disponible se reducirá inmediatamente.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto del Anticipo:</span>
              <span className="font-semibold text-gray-900">S/ {advance.monto.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha:
              </span>
              <span className="text-sm text-gray-900">
                {new Date(advance.fecha_anticipo).toLocaleDateString('es-ES')}
              </span>
            </div>

            {advance.metodo_pago && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Método:
                </span>
                <span className="text-sm text-gray-900 capitalize">{advance.metodo_pago}</span>
              </div>
            )}

            {advance.observaciones && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                <p className="text-sm text-gray-900 italic">"{advance.observaciones}"</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Saldo Disponible Actual:</span>
                <span className="font-semibold text-blue-900">S/ {currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <span className="text-sm font-medium text-blue-700">Saldo Después de Eliminar:</span>
                <span className={`font-bold ${newBalance >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                  S/ {newBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 font-medium text-sm"
            >
              Entiendo, Eliminar Anticipo
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700 font-medium">
                  ¿Está seguro? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </Portal>
  );
};

export default DeleteAdvancePaymentModal;
