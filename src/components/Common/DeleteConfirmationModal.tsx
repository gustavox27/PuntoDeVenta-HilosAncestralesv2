import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader, Trash2, Lock, Unlock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  confirmationText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  confirmationText = 'ELIMINAR TODO',
}) => {
  const [inputValue, setInputValue] = useState('');
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const isValid = inputValue === confirmationText;

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isValid && !isDeleting) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isDeleting) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

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
                    Eliminación Permanente
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Acción irreversible
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
            <div className={`rounded-lg sm:rounded-xl border-2 p-3 sm:p-5 mb-4 sm:mb-6 ${
              isDark ? 'bg-red-950/30 border-red-900' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className={`font-bold text-sm sm:text-base mb-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                    Se eliminarán TODOS los datos
                  </h4>
                  <ul className={`text-xs sm:text-sm space-y-1.5 sm:space-y-2 ${isDark ? 'text-gray-300' : 'text-red-700'}`}>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Todos los usuarios y clientes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Todo el inventario de productos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Todas las ventas y anticipos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Todo el historial y eventos
                    </li>
                  </ul>
                  <p className={`mt-3 text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                    Esta acción NO se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-2 sm:mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Para confirmar, escribe: <span className="text-red-600 block sm:inline">{confirmationText}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isDeleting}
                  placeholder={confirmationText}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border-2 font-mono text-center text-sm sm:text-lg font-bold transition-all focus:outline-none ${
                    isDeleting
                      ? isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : isValid
                      ? isDark
                        ? 'bg-green-950 border-green-700 text-green-400 focus:ring-4 focus:ring-green-900'
                        : 'bg-green-50 border-green-500 text-green-700 focus:ring-4 focus:ring-green-100'
                      : inputValue.length > 0
                      ? isDark
                        ? 'bg-red-950 border-red-700 text-red-400 focus:ring-4 focus:ring-red-900'
                        : 'bg-red-50 border-red-400 text-red-700 focus:ring-4 focus:ring-red-100'
                      : isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-300 focus:ring-4 focus:ring-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-4 focus:ring-gray-100'
                  }`}
                  autoFocus
                />
                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  )}
                </div>
              </div>
              {inputValue.length > 0 && !isValid && (
                <p className="mt-2 text-[10px] sm:text-xs text-red-600 font-medium">
                  El texto no coincide. Debes escribir exactamente "{confirmationText}"
                </p>
              )}
            </div>
          </div>

          <div className={`px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className={`flex-1 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all ${
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
              onClick={handleConfirm}
              disabled={!isValid || isDeleting}
              className={`flex-1 px-5 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
                !isValid || isDeleting
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
                  Eliminar Todo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
