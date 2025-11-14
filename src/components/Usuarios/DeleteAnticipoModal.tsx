import React, { useState } from 'react';
import { AlertTriangle, DollarSign, Calendar, CreditCard, Trash2, X } from 'lucide-react';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

interface DeleteAnticipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  anticipo: any;
  clienteName: string;
  nuevoSaldoDisponible: number;
  isDeleting: boolean;
}

const DeleteAnticipoModal: React.FC<DeleteAnticipoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  anticipo,
  clienteName,
  nuevoSaldoDisponible,
  isDeleting
}) => {
  const [confirmText, setConfirmText] = useState('');
  const confirmationRequired = `Eliminar S/ ${anticipo?.monto.toFixed(2)}`;

  const handleConfirm = async () => {
    if (confirmText !== confirmationRequired) {
      toast.error('Confirmación incorrecta');
      return;
    }

    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Error deleting anticipo:', error);
      toast.error('Error al eliminar el anticipo');
    }
  };

  if (!anticipo) return null;

  const fechaFormato = new Date(anticipo.fecha_anticipo).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Anticipo Inicial"
      size="md"
    >
      <div className="space-y-5">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg mb-1">Acción Irreversible</h3>
              <p className="text-sm text-red-800">
                Este anticipo será eliminado permanentemente del sistema. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span>Detalles del Anticipo</span>
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-900">{clienteName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="font-bold text-lg text-blue-600">S/ {anticipo.monto.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <span className="text-sm text-gray-600 flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Fecha:</span>
              </span>
              <span className="font-medium text-gray-900">{fechaFormato}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center space-x-1">
                <CreditCard className="h-4 w-4" />
                <span>Método de Pago:</span>
              </span>
              <span className="font-medium text-gray-900 capitalize">{anticipo.metodo_pago}</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Impacto en Saldo Disponible</p>
              <p className="text-sm text-orange-800 mb-2">
                Al eliminar este anticipo, el saldo disponible del cliente será:
              </p>
              <div className="bg-white rounded-lg p-3 border border-orange-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Nuevo Saldo Disponible:</span>
                  <span className="text-lg font-bold text-orange-600">S/ {nuevoSaldoDisponible.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Confirma el Monto para Continuar
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Escribe exactamente "{confirmationRequired}" para confirmar la eliminación:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder={`Ej: ${confirmationRequired}`}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {confirmText === confirmationRequired ? (
              <span className="text-green-600 font-medium">✓ Confirmación correcta</span>
            ) : confirmText.length > 0 ? (
              <span className="text-red-600">✗ No coincide con el monto</span>
            ) : (
              <span>Digite el monto exacto para confirmar</span>
            )}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>El anticipo se eliminará permanentemente</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>No será posible recuperar esta información</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>Se registrará un evento de auditoría con esta acción</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || confirmText !== confirmationRequired}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                Eliminar Anticipo
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAnticipoModal;
