import React, { useState, useEffect } from 'react';
import { DollarSign, X, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface AnticipoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clienteNombre: string;
  montoDisponible: number;
  clienteId?: string;
}

const AnticipoConfirmModal: React.FC<AnticipoConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clienteNombre,
  montoDisponible,
  clienteId
}) => {
  const [montoUltimoAnticipo, setMontoUltimoAnticipo] = useState(0);

  useEffect(() => {
    if (isOpen && clienteId) {
      const ultimoAnticipoStored = sessionStorage.getItem(`ultimoAnticipo_${clienteId}`);
      if (ultimoAnticipoStored) {
        setMontoUltimoAnticipo(parseFloat(ultimoAnticipoStored));
      }
    }
  }, [isOpen, clienteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-[95vw] sm:max-w-lg p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl sm:rounded-2xl">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-emerald-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 sm:space-x-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-emerald-100">
                  <AlertCircle className="text-emerald-600" size={20} />
                </div>

                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                    Anticipo Previo Detectado
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Cliente: <span className="font-semibold">{clienteNombre}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border-2 border-emerald-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600">Último Anticipo Agregado</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600 ml-10">
                  S/ {montoUltimoAnticipo.toFixed(2)}
                </p>
                <div className="mt-2 ml-10">
                  <p className="text-xs text-gray-600 flex items-start space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Monto del último anticipo inicial registrado</span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600">Saldo Disponible</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600 ml-10">
                  S/ {montoDisponible.toFixed(2)}
                </p>
                <div className="mt-2 ml-10">
                  <p className="text-xs text-gray-600 flex items-start space-x-1">
                    <CheckCircle className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Total de anticipos disponibles para usar</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    ¿Desea registrar un anticipo adicional?
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Si continúa, se registrará un nuevo anticipo adicional al monto ya disponible.
                    Ambos anticipos se aplicarán automáticamente cuando el cliente realice una compra.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Los anticipos se aplican automáticamente al procesar ventas y se mantienen disponibles hasta ser utilizados completamente.
              </p>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-5 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnticipoConfirmModal;
