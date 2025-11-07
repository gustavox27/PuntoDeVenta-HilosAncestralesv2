import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, DollarSign, Package, User, Calendar, Trash2, X, RotateCcw } from 'lucide-react';
import { Venta } from '../../types';
import { SupabaseService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

interface DeleteVentaModalProps {
  isOpen: boolean;
  venta: Venta | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteVentaModal: React.FC<DeleteVentaModalProps> = ({
  isOpen,
  venta,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [step, setStep] = useState<'preview' | 'confirm'>('preview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    productos: boolean;
    anticipos: boolean;
  }>({
    productos: true,
    anticipos: true
  });

  if (!isOpen || !venta) return null;

  const handleExpandSection = (section: 'productos' | 'anticipos') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await SupabaseService.deleteVentaWithRollback(venta.id);
      toast.success('Venta eliminada correctamente');
      onConfirm();
      onClose();
      setStep('preview');
    } catch (error: any) {
      console.error('Error deleting venta:', error);
      toast.error(error.message || 'Error al eliminar la venta');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalProductos = venta.detalles?.length || 0;
  const totalAnticipos = venta.anticipos?.length || 0;
  const subtotal = venta.detalles?.reduce((sum, d) => sum + d.subtotal, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 px-6 py-4 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'preview' ? 'Revisión de Eliminación' : 'Confirmar Eliminación'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'preview'
                  ? 'Revisa los cambios que se realizarán al eliminar esta venta'
                  : 'Esta acción no se puede deshacer. Verifica todos los datos antes de continuar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'preview' ? (
            <>
              {/* Información de la Venta */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  Información de la Venta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Venta</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hora</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(venta.fecha_venta).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Número de Guía</p>
                    <p className="font-semibold text-gray-900">{venta.numero_guia || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vendedor</p>
                    <p className="font-semibold text-gray-900">{venta.vendedor}</p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-600" />
                  Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  {venta.usuario_eliminado ? (
                    <>
                      <p>
                        <span className="text-gray-600">Nombre:</span>{' '}
                        <span className="font-semibold text-red-600">
                          {venta.usuario_eliminado_nombre || 'Usuario Eliminado'}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="text-gray-600">Nombre:</span>{' '}
                        <span className="font-semibold text-gray-900">{venta.usuario?.nombre}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">DNI:</span>{' '}
                        <span className="font-semibold text-gray-900">{venta.usuario?.dni}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Detalles Financieros */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-emerald-600" />
                  Resumen Financiero
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">S/ {subtotal.toFixed(2)}</span>
                  </div>
                  {venta.descuento_total && venta.descuento_total > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Descuento</span>
                      <span className="font-semibold text-emerald-600">- S/ {venta.descuento_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total de Venta</span>
                    <span className="text-lg font-bold text-emerald-600">S/ {venta.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Productos Vendidos - Expandible */}
              <div className="border rounded-lg">
                <button
                  onClick={() => handleExpandSection('productos')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-gray-900">
                      Productos que Serán Restaurados ({totalProductos})
                    </span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform ${
                      expandedSections.productos ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSections.productos && (
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    {venta.detalles && venta.detalles.length > 0 ? (
                      venta.detalles.map((detalle, idx) => (
                        <div
                          key={detalle.id || idx}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {detalle.producto?.nombre || detalle.producto_eliminado_nombre || 'Producto'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {detalle.producto?.color || detalle.producto_eliminado_color || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              Cantidad: {detalle.cantidad}
                            </p>
                            <p className="text-xs text-orange-600">
                              Será restaurado al stock
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No hay productos en esta venta</p>
                    )}
                  </div>
                )}
              </div>

              {/* Anticipos - Expandible */}
              {totalAnticipos > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => handleExpandSection('anticipos')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        Anticipos que Serán Restaurados ({totalAnticipos})
                      </span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        expandedSections.anticipos ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedSections.anticipos && (
                    <div className="p-4 border-t border-gray-200 space-y-3">
                      {venta.anticipos && venta.anticipos.length > 0 ? (
                        <>
                          {venta.anticipos.map((anticipo, idx) => (
                            <div
                              key={anticipo.id || idx}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Anticipo {idx + 1}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Método: {anticipo.metodo_pago}
                                </p>
                                {anticipo.observaciones && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {anticipo.observaciones}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-blue-600">
                                  S/ {anticipo.monto.toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600">
                                  Disponible sin venta
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                            <p className="text-sm font-semibold text-blue-900">
                              Total a Restaurar: S/{' '}
                              {(venta.anticipos.reduce((sum, a) => sum + a.monto, 0)).toFixed(2)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">No hay anticipos registrados</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Información Importante */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">
                      Información Importante
                    </p>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>El stock de los productos será restaurado completamente</li>
                      <li>Los anticipos registrados volverán al cliente como disponibles</li>
                      <li>La venta desaparecerá del historial</li>
                      <li>Esta acción se registrará en el auditar del sistema</li>
                      <li>No se puede deshacer esta operación</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones - Paso 1 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <AlertTriangle size={16} />
                  Continuar con Eliminación
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmación Final */}
              <div className="space-y-6">
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-red-900 text-lg mb-2">
                        Última Oportunidad para Cancelar
                      </p>
                      <p className="text-red-800 text-sm leading-relaxed">
                        Estás a punto de eliminar permanentemente la venta de{' '}
                        <span className="font-semibold">
                          {venta.usuario?.nombre || venta.usuario_eliminado_nombre || 'Cliente'}
                        </span>{' '}
                        por un total de{' '}
                        <span className="font-semibold">S/ {venta.total.toFixed(2)}</span>.
                        Esta acción eliminará toda la información de la venta y restaurará el stock
                        de productos. Esta operación no puede deshacerse.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Resumen de Cambios:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                    <p className="text-sm">
                      <span className="font-semibold text-orange-600">
                        {totalProductos} Producto(s)
                      </span>
                      {' - Se restaurará el stock completamente'}
                    </p>
                    {totalAnticipos > 0 && (
                      <p className="text-sm">
                        <span className="font-semibold text-blue-600">
                          {totalAnticipos} Anticipo(s)
                        </span>
                        {' - Se devolverá al cliente como disponibles'}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold text-red-600">
                        S/ {venta.total.toFixed(2)}
                      </span>
                      {' - Total de venta que será eliminado'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep('preview')}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Volver Atrás
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-700 rounded-lg hover:bg-red-800 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-700/30"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Eliminar Venta Permanentemente
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteVentaModal;
