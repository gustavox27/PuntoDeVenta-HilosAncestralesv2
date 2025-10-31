import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader, Trash2, User, ShoppingBag, DollarSign, Package } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface UserDataSummary {
  ventas: number;
  totalVentas: number;
  anticipos: number;
  totalAnticipos: number;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteRelated: boolean) => void;
  isDeleting: boolean;
  userName: string;
  userDataSummary: UserDataSummary | null;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  userName,
  userDataSummary,
  onConfirm,
  isDeleting,
}) => {
  const [deleteOption, setDeleteOption] = useState<'user-only' | 'all' | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    if (!isOpen) {
      setDeleteOption(null);
      setShowFinalConfirm(false);
    }
  }, [isOpen]);

  const hasRelatedData = userDataSummary && (userDataSummary.ventas > 0 || userDataSummary.anticipos > 0);

  const handleContinue = () => {
    if (!deleteOption) return;

    if (deleteOption === 'all') {
      setShowFinalConfirm(true);
    } else {
      onConfirm(false);
    }
  };

  const handleFinalConfirm = () => {
    onConfirm(true);
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
                <h4 className={`font-bold text-base mb-3 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                  Se eliminarán los siguientes datos:
                </h4>
                <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-red-700'}`}>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <span className="text-sm">Usuario:</span>
                    <span className="font-bold">{userName}</span>
                  </div>
                  {userDataSummary && (
                    <>
                      {userDataSummary.ventas > 0 && (
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-sm">Ventas:</span>
                          <span className="font-bold">{userDataSummary.ventas} registros (S/ {userDataSummary.totalVentas.toFixed(2)})</span>
                        </div>
                      )}
                      {userDataSummary.anticipos > 0 && (
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-sm">Anticipos:</span>
                          <span className="font-bold">{userDataSummary.anticipos} registros (S/ {userDataSummary.totalAnticipos.toFixed(2)})</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                ¿Está completamente seguro de eliminar toda esta información?
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
                    Eliminar Todo
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
          className={`inline-block w-full max-w-[95vw] sm:max-w-2xl p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform ${
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
                    Eliminar Usuario
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {userName}
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
                        Este usuario tiene información registrada
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                        Seleccione una opción para continuar
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userDataSummary.ventas > 0 && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag className="w-4 h-4 text-purple-600" />
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ventas</span>
                        </div>
                        <p className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {userDataSummary.ventas}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: S/ {userDataSummary.totalVentas.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {userDataSummary.anticipos > 0 && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Anticipos</span>
                        </div>
                        <p className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {userDataSummary.anticipos}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: S/ {userDataSummary.totalAnticipos.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      deleteOption === 'user-only'
                        ? isDark
                          ? 'border-blue-600 bg-blue-950/30'
                          : 'border-blue-600 bg-blue-50'
                        : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-option"
                      value="user-only"
                      checked={deleteOption === 'user-only'}
                      onChange={() => setDeleteOption('user-only')}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          Solo el Usuario
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Eliminar solo la información del usuario. Las ventas y anticipos se conservarán pero quedarán sin cliente asociado.
                      </p>
                      <div className={`mt-2 p-2 rounded text-xs ${isDark ? 'bg-yellow-950/30 text-yellow-400' : 'bg-yellow-50 text-yellow-800'}`}>
                        <strong>Advertencia:</strong> Los datos históricos quedarán huérfanos
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      deleteOption === 'all'
                        ? isDark
                          ? 'border-red-600 bg-red-950/30'
                          : 'border-red-600 bg-red-50'
                        : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-option"
                      value="all"
                      checked={deleteOption === 'all'}
                      onChange={() => setDeleteOption('all')}
                      className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          Eliminar Todo
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Eliminar el usuario y TODOS sus datos relacionados (ventas, detalles de ventas, anticipos).
                      </p>
                      <div className={`mt-2 p-2 rounded text-xs ${isDark ? 'bg-red-950/30 text-red-400' : 'bg-red-50 text-red-800'}`}>
                        <strong>Peligro:</strong> Esta acción NO se puede deshacer
                      </div>
                    </div>
                  </label>
                </div>
              </>
            ) : (
              <div className={`rounded-lg border p-4 mb-6 ${
                isDark ? 'bg-green-950/30 border-green-900' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <User className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm mb-2 ${isDark ? 'text-green-400' : 'text-green-800'}`}>
                      Usuario sin datos relacionados
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-green-700'}`}>
                      Este usuario no tiene ventas ni anticipos registrados. Se puede eliminar de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {hasRelatedData
                ? '¿Desea continuar con la eliminación?'
                : '¿Está seguro de que desea eliminar este usuario?'
              }
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
              disabled={hasRelatedData ? !deleteOption : false}
              className={`flex-1 px-5 py-3 text-sm font-bold text-white rounded-xl transition-all ${
                (hasRelatedData && !deleteOption)
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : deleteOption === 'all'
                  ? 'bg-red-600 hover:bg-red-700 active:scale-95'
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

export default DeleteUserModal;
