import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader, Trash2, Package, ShoppingBag } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProductDataSummary {
  ventas: number;
  totalVendido: number;
}

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  productName: string;
  productDataSummary: ProductDataSummary | null;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  productName,
  productDataSummary,
  onConfirm,
  isDeleting,
}) => {
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    if (!isOpen) {
      setShowFinalConfirm(false);
    }
  }, [isOpen]);

  const hasRelatedData = productDataSummary && productDataSummary.ventas > 0;

  const handleContinue = () => {
    if (hasRelatedData) {
      setShowFinalConfirm(true);
    } else {
      onConfirm();
    }
  };

  const handleFinalConfirm = () => {
    onConfirm();
  };

  if (!isOpen) return null;

  if (showFinalConfirm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={!isDeleting ? () => setShowFinalConfirm(false) : undefined}
          ></div>

          <div
            className={`inline-block w-full max-w-[95vw] sm:max-w-lg p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl rounded-xl sm:rounded-2xl`}
          >
            <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${isDark ? 'border-gray-700 bg-red-950' : 'border-red-100 bg-red-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 sm:space-x-4">
                  <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl ${
                    isDark ? 'bg-red-900/50' : 'bg-red-100'
                  }`}>
                    <AlertTriangle className="text-red-600" size={20} />
                  </div>

                  <div className="flex-1 pt-0.5 sm:pt-1">
                    <h3 className={`text-base sm:text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-0.5 sm:mb-1`}>
                      Confirmación Final
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Esta acción es irreversible
                    </p>
                  </div>
                </div>

                {!isDeleting && (
                  <button
                    onClick={() => setShowFinalConfirm(false)}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <div className={`rounded-lg border-2 p-4 mb-6 ${
                isDark ? 'bg-red-950/30 border-red-900' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm sm:text-base mb-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                      Se eliminará el producto y sus referencias
                    </h4>
                    <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-red-700'}`}>
                      <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <span className="text-sm">Producto:</span>
                        <span className="font-bold">{productName}</span>
                      </div>
                      {productDataSummary && (
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-sm">Ventas asociadas:</span>
                          <span className="font-bold">{productDataSummary.ventas} registros</span>
                        </div>
                      )}
                    </div>
                    <p className={`mt-3 text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                      ADVERTENCIA: Las ventas seguirán existiendo pero sin referencia al producto eliminado.
                    </p>
                  </div>
                </div>
              </div>

              <p className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                ¿Está completamente seguro de eliminar este producto?
              </p>
              <p className={`text-xs text-center font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Esta acción NO se puede deshacer
              </p>
            </div>

            <div className={`px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
              <button
                type="button"
                onClick={() => setShowFinalConfirm(false)}
                disabled={isDeleting}
                className={`flex-1 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  isDeleting
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-95'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 active:scale-95'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isDeleting}
                className={`flex-1 px-5 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isDeleting
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/30'
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Eliminar Producto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={!isDeleting ? onClose : undefined}
        ></div>

        <div
          className={`inline-block w-full max-w-[95vw] sm:max-w-lg p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl rounded-xl sm:rounded-2xl`}
        >
          <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 sm:space-x-4">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl ${
                  isDark ? 'bg-orange-900/50' : 'bg-orange-100'
                }`}>
                  <AlertTriangle className="text-orange-600" size={20} />
                </div>

                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className={`text-base sm:text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-0.5 sm:mb-1`}>
                    Eliminar Producto
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {productName}
                  </p>
                </div>
              </div>

              {!isDeleting && (
                <button
                  onClick={onClose}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {hasRelatedData ? (
              <>
                <div className={`rounded-lg border p-4 mb-6 ${
                  isDark ? 'bg-blue-950/30 border-blue-900' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className={`font-bold text-sm mb-2 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                        Este producto tiene ventas registradas
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                        El producto será eliminado pero las ventas permanecerán en el sistema
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ventas</span>
                      </div>
                      <p className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {productDataSummary.ventas}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cantidad vendida: {productDataSummary.totalVendido}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg border-2 p-4 mb-4 ${
                  isDark ? 'bg-yellow-950/30 border-yellow-900' : 'bg-yellow-50 border-yellow-400'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'} mb-1`}>
                        Consecuencias de la eliminación:
                      </p>
                      <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-yellow-700'}`}>
                        <li>• El producto será eliminado permanentemente</li>
                        <li>• Las ventas mantendrán la información histórica del producto</li>
                        <li>• No se podrá recuperar el producto después de eliminarlo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={`rounded-lg border p-4 mb-6 ${
                isDark ? 'bg-green-950/30 border-green-900' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Package className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm mb-2 ${isDark ? 'text-green-400' : 'text-green-800'}`}>
                      Producto sin ventas registradas
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-green-700'}`}>
                      Este producto no tiene ventas asociadas. Se puede eliminar de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Está seguro de que desea eliminar este producto?
            </p>
          </div>

          <div className={`px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className={`flex-1 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                isDeleting
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-95'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 active:scale-95'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isDeleting}
              className={`flex-1 px-5 py-3 text-sm font-bold text-white rounded-xl transition-all ${
                isDeleting
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;
