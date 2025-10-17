import React, { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, DollarSign, Package, X, Eye } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { Venta } from '../../types';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

interface HistorialComprasModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string;
  usuarioNombre: string;
}

const HistorialComprasModal: React.FC<HistorialComprasModalProps> = ({
  isOpen,
  onClose,
  usuarioId,
  usuarioNombre
}) => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isOpen && usuarioId) {
      loadVentas();
    }
  }, [isOpen, usuarioId]);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const allVentas = await SupabaseService.getVentas();
      const ventasUsuario = allVentas.filter(v => v.id_usuario === usuarioId);
      setVentas(ventasUsuario);
    } catch (error) {
      console.error('Error loading ventas:', error);
      toast.error('Error al cargar el historial de compras');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (venta: Venta) => {
    setSelectedVenta(venta);
    setShowDetailModal(true);
  };

  const totalCompras = ventas.reduce((acc, v) => {
    const subtotal = v.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0;
    return acc + (subtotal - (v.descuento_total || 0));
  }, 0);
  const totalDescuentos = ventas.reduce((acc, v) => acc + (v.descuento_total || 0), 0);
  const saldoPendienteTotal = ventas.reduce((acc, v) => acc + (v.saldo_pendiente || 0), 0);
  const ventasCompletas = ventas.filter(v => v.completada || v.saldo_pendiente === 0).length;
  const ventasPendientes = ventas.filter(v => !v.completada && v.saldo_pendiente && v.saldo_pendiente > 0).length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Historial de Compras - ${usuarioNombre}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Compras</p>
                  <p className="text-lg font-bold text-blue-900">{ventas.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700">Total Gastado</p>
                  <p className="text-lg font-bold text-green-900">S/ {totalCompras.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700">Descuentos</p>
                  <p className="text-lg font-bold text-purple-900">S/ {totalDescuentos.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-orange-900">S/ {saldoPendienteTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Completadas: {ventasCompletas}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Pendientes: {ventasPendientes}</span>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : ventas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventas.map((venta) => {
                    const subtotal = venta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0;
                    const totalFinal = subtotal - (venta.descuento_total || 0);
                    return (
                      <tr key={venta.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                          <div className="text-xs text-gray-500">
                            {new Date(venta.fecha_venta).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {venta.detalles?.map(d => d.producto?.nombre).join(', ') || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {venta.detalles?.reduce((sum, d) => sum + d.cantidad, 0) || 0} unidades
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          S/ {subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-600 font-semibold">
                          {venta.descuento_total ? `- S/ ${venta.descuento_total.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-bold">
                          S/ {totalFinal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {venta.completada || venta.saldo_pendiente === 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completada
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="block px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Pendiente
                              </span>
                              <span className="text-xs text-gray-600">
                                Saldo: S/ {(venta.saldo_pendiente || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetail(venta)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">Este cliente no tiene compras registradas</p>
              <p className="text-sm text-gray-400 mt-1">Las compras aparecerán aquí cuando el cliente realice una compra</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle de Compra"
        size="lg"
      >
        {selectedVenta && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedVenta.fecha_venta).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendedor</p>
                  <p className="font-semibold text-gray-900">{selectedVenta.vendedor}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">P. Unit.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedVenta.detalles?.map((detalle, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{detalle.producto?.nombre || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{detalle.producto?.color}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{detalle.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">S/ {detalle.precio_unitario.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-semibold">S/ {(detalle.precio_unitario * detalle.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Subtotal:</span>
                <span className="text-gray-900 font-bold">
                  S/ {(selectedVenta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0).toFixed(2)}
                </span>
              </div>
              {selectedVenta.descuento_total && selectedVenta.descuento_total > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="font-medium">Descuento:</span>
                  <span className="font-bold">- S/ {selectedVenta.descuento_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  S/ {((selectedVenta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0) - (selectedVenta.descuento_total || 0)).toFixed(2)}
                </span>
              </div>
              {selectedVenta.anticipo_total && selectedVenta.anticipo_total > 0 && (
                <>
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-medium">Anticipo:</span>
                    <span className="font-bold">- S/ {selectedVenta.anticipo_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-bold text-gray-900">Saldo Pendiente:</span>
                    <span className="text-xl font-bold text-orange-600">
                      S/ {(selectedVenta.saldo_pendiente || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default HistorialComprasModal;
