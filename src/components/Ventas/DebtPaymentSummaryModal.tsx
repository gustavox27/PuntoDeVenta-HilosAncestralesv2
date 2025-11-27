import React from 'react';
import { CheckCircle, DollarSign, TrendingUp, TrendingDown, X } from 'lucide-react';

interface DebtPaymentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventasPagadas: number;
  ventasParcialesCount: number;
  totalAplicado: number;
  saldoRestante: number;
  clienteNombre: string;
}

const DebtPaymentSummaryModal: React.FC<DebtPaymentSummaryModalProps> = ({
  isOpen,
  onClose,
  ventasPagadas,
  ventasParcialesCount,
  totalAplicado,
  saldoRestante,
  clienteNombre
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-md p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl sm:rounded-2xl">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-green-100">
                  <CheckCircle className="text-green-600" size={32} />
                </div>

                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                    Anticipo Aplicado
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Deudas del cliente <span className="font-semibold">{clienteNombre}</span> actualizadas
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

          <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Resumen de Resultados */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Ventas Completadas</h4>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">{ventasPagadas}</p>
                <p className="text-xs text-green-700">
                  {ventasPagadas === 1 ? 'venta' : 'ventas'} pasaron a "Ventas Finales"
                </p>
              </div>

              {ventasParcialesCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Ventas Parciales</h4>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 mb-1">{ventasParcialesCount}</p>
                  <p className="text-xs text-yellow-700">
                    {ventasParcialesCount === 1 ? 'venta' : 'ventas'} con saldo pendiente restante
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Monto Aplicado</h4>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  S/ {totalAplicado.toFixed(2)}
                </p>
                <p className="text-xs text-blue-700">
                  de las deudas pendientes fue cubierto
                </p>
              </div>

              {saldoRestante > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Saldo Disponible</h4>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 mb-1">
                    S/ {saldoRestante.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-700">
                    anticipo disponible para futuras compras
                  </p>
                </div>
              )}
            </div>

            {/* Próximos Pasos */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Próximos Pasos</h4>
              <ol className="space-y-2 text-xs text-gray-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Las deudas pagadas aparecerán en "Ventas Finales"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Los movimientos se registraron en el historial del cliente</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>El saldo disponible está listo para nuevas compras</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 sm:py-3 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-600/30"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtPaymentSummaryModal;
