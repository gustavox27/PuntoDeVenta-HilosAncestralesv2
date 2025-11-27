import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, DollarSign, Calendar, TrendingDown, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import Portal from '../Common/Portal';
import { Venta } from '../../types';

interface DebtDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: { id: string; nombre: string } | null;
  deudas: Venta[];
  montoAnticipo: number;
  onConfirm: (ventasSeleccionadas: string[]) => void;
  onSkip: () => void;
  loading?: boolean;
}

interface DeudaSeleccionada extends Venta {
  seleccionada: boolean;
  orden: number;
}

const DebtDetectionModal: React.FC<DebtDetectionModalProps> = ({
  isOpen,
  onClose,
  cliente,
  deudas,
  montoAnticipo,
  onConfirm,
  onSkip,
  loading = false
}) => {
  const [deudasSeleccionadas, setDeudasSeleccionadas] = useState<DeudaSeleccionada[]>([]);
  const [expandidos, setExpandidos] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (deudas && deudas.length > 0) {
      setDeudasSeleccionadas(
        deudas.map((deuda, index) => ({
          ...deuda,
          seleccionada: true,
          orden: index
        }))
      );
      setExpandidos({});
    }
  }, [deudas]);

  const calcularTotales = useMemo(() => {
    const ventasSeleccionadas = deudasSeleccionadas.filter(d => d.seleccionada);
    let montoRestante = montoAnticipo;
    let totalAplicable = 0;
    let ventasCompletadas = 0;
    let ventasParciales = 0;

    ventasSeleccionadas.forEach(deuda => {
      if (montoRestante <= 0) return;
      const montoAplicar = Math.min(deuda.saldo_pendiente || 0, montoRestante);
      totalAplicable += montoAplicar;
      montoRestante -= montoAplicar;

      const saldoRestante = (deuda.saldo_pendiente || 0) - montoAplicar;
      if (saldoRestante <= 0) {
        ventasCompletadas++;
      } else {
        ventasParciales++;
      }
    });

    return {
      ventasSeleccionadas: ventasSeleccionadas.length,
      totalAplicable,
      sobrante: Math.max(0, montoAnticipo - totalAplicable),
      ventasCompletadas,
      ventasParciales
    };
  }, [deudasSeleccionadas, montoAnticipo]);

  const moverDeuda = (index: number, direccion: 'up' | 'down') => {
    const nuevasDeudas = [...deudasSeleccionadas];
    const otroIndex = direccion === 'up' ? index - 1 : index + 1;

    if (otroIndex >= 0 && otroIndex < nuevasDeudas.length) {
      [nuevasDeudas[index].orden, nuevasDeudas[otroIndex].orden] = [
        nuevasDeudas[otroIndex].orden,
        nuevasDeudas[index].orden
      ];
      nuevasDeudas.sort((a, b) => a.orden - b.orden);
      setDeudasSeleccionadas(nuevasDeudas);
    }
  };

  const toggleDeuda = (ventaId: string) => {
    setDeudasSeleccionadas(
      deudasSeleccionadas.map(d =>
        d.id === ventaId ? { ...d, seleccionada: !d.seleccionada } : d
      )
    );
  };

  const handleConfirm = () => {
    const ventasIds = deudasSeleccionadas
      .filter(d => d.seleccionada)
      .sort((a, b) => a.orden - b.orden)
      .map(d => d.id);

    onConfirm(ventasIds);
  };

  if (!isOpen || !cliente) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
        ></div>

        <div className="inline-block w-full max-w-2xl p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl sm:rounded-2xl">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-blue-100">
                  <AlertCircle className="text-blue-600" size={24} />
                </div>

                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                    Deudas Pendientes Detectadas
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    El cliente <span className="font-semibold">{cliente.nombre}</span> tiene saldos pendientes.
                    Selecciona cuáles deseas pagar con el anticipo de S/ {montoAnticipo.toFixed(2)}
                  </p>
                </div>
              </div>

              {!loading && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
            {/* Resumen de Totales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-1">Deudas Seleccionadas</p>
                <p className="text-2xl font-bold text-blue-600">{calcularTotales.ventasSeleccionadas}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{calcularTotales.ventasCompletadas}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide mb-1">Parciales</p>
                <p className="text-2xl font-bold text-yellow-600">{calcularTotales.ventasParciales}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-700 font-medium uppercase tracking-wide mb-1">Sobrante</p>
                <p className="text-2xl font-bold text-purple-600">S/ {calcularTotales.sobrante.toFixed(2)}</p>
              </div>
            </div>

            {/* Barra de Aplicación */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Monto a Aplicar</p>
              <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (calcularTotales.totalAplicable / montoAnticipo) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-600">
                  S/ {calcularTotales.totalAplicable.toFixed(2)} aplicados
                </span>
                <span className="text-gray-600">
                  de S/ {montoAnticipo.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de Deudas */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {deudasSeleccionadas && deudasSeleccionadas.length > 0 ? (
              deudasSeleccionadas.map((deuda, index) => {
                const isExpanded = expandidos[deuda.id];
                const montoRestante = deudasSeleccionadas
                  .filter((d, i) => i < index && d.seleccionada)
                  .reduce((sum, d) => sum - Math.min(d.saldo_pendiente || 0, sum), montoAnticipo);
                const montoAplicarEstaDeuda = deuda.seleccionada
                  ? Math.min(deuda.saldo_pendiente || 0, Math.max(0, montoRestante))
                  : 0;
                const saldoNuevo = Math.max(0, (deuda.saldo_pendiente || 0) - montoAplicarEstaDeuda);

                return (
                  <div
                    key={deuda.id}
                    className={`border rounded-lg transition-all ${
                      deuda.seleccionada
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleDeuda(deuda.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            deuda.seleccionada
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 bg-white hover:border-blue-500'
                          }`}
                        >
                          {deuda.seleccionada && <Check size={14} className="text-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {new Date(deuda.fecha_venta).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <button
                              onClick={() => setExpandidos({
                                ...expandidos,
                                [deuda.id]: !isExpanded
                              })}
                              className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div>
                              <p className="text-gray-600">Total</p>
                              <p className="font-semibold text-gray-900">S/ {deuda.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Saldo</p>
                              <p className="font-semibold text-red-600">S/ {(deuda.saldo_pendiente || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Aplicar</p>
                              <p className={`font-semibold ${deuda.seleccionada ? 'text-blue-600' : 'text-gray-400'}`}>
                                S/ {montoAplicarEstaDeuda.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-white rounded p-2 text-xs space-y-1 border border-gray-200 mb-2">
                              <p className="text-gray-600">
                                <span className="font-medium">Guía:</span> {deuda.numero_guia || 'N/A'}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Anticipo:</span> S/ {(deuda.anticipo_total || 0).toFixed(2)}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Descuento:</span> S/ {(deuda.descuento_total || 0).toFixed(2)}
                              </p>
                              {saldoNuevo > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                  <p className="text-yellow-800">
                                    <span className="font-medium">Saldo después:</span> S/ {saldoNuevo.toFixed(2)}
                                  </p>
                                </div>
                              )}
                              {saldoNuevo <= 0 && deuda.seleccionada && (
                                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                  <p className="text-green-800 font-medium flex items-center gap-1">
                                    <Check size={12} /> Esta venta será completada
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {deuda.seleccionada && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => moverDeuda(index, 'up')}
                              disabled={index === 0 || !deudasSeleccionadas.slice(0, index).some(d => d.seleccionada)}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover arriba"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => moverDeuda(index, 'down')}
                              disabled={index === deudasSeleccionadas.length - 1 || !deudasSeleccionadas.slice(index + 1).some(d => d.seleccionada)}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover abajo"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-sm font-medium">No hay deudas pendientes para mostrar</p>
                </div>
              )}
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-800 font-medium mb-1">Información importante</p>
                  <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                    <li>El anticipo se aplicará en el orden que especifiques</li>
                    <li>Las ventas completadas pasarán a "Ventas Finales"</li>
                    <li>El sobrante quedará como anticipo disponible</li>
                    <li>Se registrará un movimiento en el historial de cada aplicación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dejar Como Anticipo
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || calcularTotales.ventasSeleccionadas === 0}
              className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Aplicando...
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  Confirmar Aplicar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </Portal>
  );
};

export default DebtDetectionModal;
