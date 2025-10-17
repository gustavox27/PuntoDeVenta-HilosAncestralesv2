import React, { useState, useEffect } from 'react';
import { History, Download, Search, Calendar, Eye, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { ExportUtils } from '../utils/exportUtils';
import { Venta } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import TabsContainer from '../components/Historial/TabsContainer';
import AnticipoManager from '../components/Historial/AnticipoManager';
import toast from 'react-hot-toast';

const Historial: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventasCompletas, setVentasCompletas] = useState<Venta[]>([]);
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'completas' | 'pendientes'>('completas');
  const [detailTab, setDetailTab] = useState<'productos' | 'anticipos'>('productos');

  useEffect(() => {
    loadVentas();
  }, []);

  useEffect(() => {
    organizarVentas();
  }, [ventas]);

  useEffect(() => {
    filterVentas();
  }, [ventasCompletas, ventasPendientes, searchTerm, fechaInicio, fechaFin, activeTab]);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getVentas();
      setVentas(data);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const organizarVentas = () => {
    const completas = ventas.filter(v =>
      (v.saldo_pendiente === 0 || v.saldo_pendiente === null || v.completada === true)
    );
    const pendientes = ventas.filter(v =>
      v.saldo_pendiente && v.saldo_pendiente > 0 && v.completada !== true
    );

    setVentasCompletas(completas);
    setVentasPendientes(pendientes);
  };

  const filterVentas = () => {
    const ventasActuales = activeTab === 'completas' ? ventasCompletas : ventasPendientes;
    let filtered = [...ventasActuales];

    if (searchTerm) {
      filtered = filtered.filter(venta =>
        venta.usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.usuario?.dni.includes(searchTerm) ||
        venta.vendedor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fechaInicio) {
      filtered = filtered.filter(venta =>
        new Date(venta.fecha_venta) >= new Date(fechaInicio)
      );
    }

    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(venta =>
        new Date(venta.fecha_venta) <= fechaFinDate
      );
    }

    setFilteredVentas(filtered);
  };

  const handleExportPDF = async () => {
    try {
      const exportData = filteredVentas.map(venta => ({
        'Fecha': new Date(venta.fecha_venta).toLocaleDateString('es-ES'),
        'Cliente': venta.usuario?.nombre || 'N/A',
        'DNI': venta.usuario?.dni || 'N/A',
        'Total': `S/ ${venta.total.toFixed(2)}`,
        'Descuento': venta.descuento_total ? `S/ ${venta.descuento_total.toFixed(2)}` : 'S/ 0.00',
        'Vendedor': venta.vendedor
      }));

      await ExportUtils.exportToPDF(
        exportData,
        ['Fecha', 'Cliente', 'DNI', 'Total', 'Descuento', 'Vendedor'],
        `historial-ventas-${activeTab}`,
        `Historial de Ventas ${activeTab === 'completas' ? 'Finales' : 'Pendientes'} - HILOSdeCALIDAD`
      );

      toast.success('Reporte PDF generado correctamente');
    } catch (error) {
      toast.error('Error al generar el reporte PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredVentas.map(venta => ({
        'Fecha': new Date(venta.fecha_venta).toLocaleDateString('es-ES'),
        'Cliente': venta.usuario?.nombre || 'N/A',
        'DNI': venta.usuario?.dni || 'N/A',
        'Teléfono': venta.usuario?.telefono || 'N/A',
        'Total': venta.total,
        'Descuento': venta.descuento_total || 0,
        'Anticipo': venta.anticipo_total || 0,
        'Saldo': venta.saldo_pendiente || 0,
        'Vendedor': venta.vendedor,
        'Productos': venta.detalles?.map(d => d.producto?.nombre).join(', ') || ''
      }));

      ExportUtils.exportToExcel(exportData, `historial-ventas-${activeTab}`, 'Ventas');
      toast.success('Reporte Excel generado correctamente');
    } catch (error) {
      toast.error('Error al generar el reporte Excel');
    }
  };

  const handleViewDetail = async (venta: Venta) => {
    try {
      const anticipos = await SupabaseService.getAnticiposPorVenta(venta.id);
      setSelectedVenta({ ...venta, anticipos });
      setDetailTab('productos');
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading anticipos:', error);
      toast.error('Error al cargar detalles');
    }
  };

  const handleGenerateBoleta = async (venta: Venta) => {
    try {
      if (!venta.usuario || !venta.detalles) {
        toast.error('Datos incompletos para generar la boleta');
        return;
      }

      const anticipoData = venta.anticipo_total && venta.anticipo_total > 0
        ? {
            monto: venta.anticipo_total,
            metodo_pago: 'Registrado',
            fecha_anticipo: venta.fecha_venta,
            observaciones: ''
          }
        : undefined;

      await ExportUtils.generateSalePDF(venta, venta.usuario, venta.detalles, anticipoData);
      toast.success('Boleta regenerada correctamente');
    } catch (error) {
      console.error('Error generating boleta:', error);
      toast.error('Error al generar la boleta');
    }
  };

  const handleAnticipoAdded = async () => {
    setShowDetailModal(false);
    await loadVentas();
    toast.success('Venta actualizada');
  };

  const totalVentas = filteredVentas.reduce((acc, venta) => acc + venta.total, 0);
  const totalDescuentos = filteredVentas.reduce((acc, venta) => acc + (venta.descuento_total || 0), 0);
  const promedioVenta = filteredVentas.length > 0 ? totalVentas / filteredVentas.length : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Ventas</h2>
          <p className="text-gray-600">Gestión completa de ventas finales y pagos pendientes</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Ventas</h3>
              <p className="text-2xl font-bold text-gray-900">S/ {totalVentas.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Promedio por Venta</h3>
              <p className="text-2xl font-bold text-gray-900">S/ {promedioVenta.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <History className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Descuentos</h3>
              <p className="text-2xl font-bold text-gray-900">S/ {totalDescuentos.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              placeholder="Fecha inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              placeholder="Fecha fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setFechaInicio('');
              setFechaFin('');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <TabsContainer
            tabs={[
              { id: 'completas', label: 'Ventas Finales', count: ventasCompletas.length },
              { id: 'pendientes', label: 'Pagos Pendientes', count: ventasPendientes.length }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'completas' | 'pendientes')}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                {activeTab === 'pendientes' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anticipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVentas.map(venta => {
                const subtotalProductos = venta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0;
                const totalFinal = subtotalProductos - (venta.descuento_total || 0);
                return (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(venta.fecha_venta).toLocaleDateString('es-ES')}
                      <div className="text-xs text-gray-500">
                        {new Date(venta.fecha_venta).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {venta.usuario?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {venta.detalles?.map(d => d.producto?.nombre).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {venta.detalles?.reduce((sum, d) => sum + d.cantidad, 0) || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      S/ {subtotalProductos.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold">
                      {venta.descuento_total ? `- S/ ${venta.descuento_total.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                      S/ {totalFinal.toFixed(2)}
                    </td>
                  {activeTab === 'pendientes' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                        S/ {(venta.anticipo_total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        S/ {(venta.saldo_pendiente || 0).toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(venta)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleGenerateBoleta(venta)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="Descargar boleta"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>

          {filteredVentas.length === 0 && (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron ventas</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle de Venta"
        size="xl"
      >
        {selectedVenta && (
          <div className="space-y-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setDetailTab('productos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'productos'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Detalles de Venta
                </button>
                <button
                  onClick={() => setDetailTab('anticipos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'anticipos'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Historial de Anticipos
                  {selectedVenta.anticipos && selectedVenta.anticipos.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                      {selectedVenta.anticipos.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {detailTab === 'productos' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información de la Venta</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Fecha:</span> {new Date(selectedVenta.fecha_venta).toLocaleDateString('es-ES')}</p>
                      <p><span className="font-medium">Hora:</span> {new Date(selectedVenta.fecha_venta).toLocaleTimeString('es-ES')}</p>
                      <p><span className="font-medium">Vendedor:</span> {selectedVenta.vendedor}</p>
                      <p><span className="font-medium">Subtotal:</span> <span className="text-gray-900 font-semibold">S/ {(selectedVenta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0).toFixed(2)}</span></p>
                      {selectedVenta.descuento_total && selectedVenta.descuento_total > 0 && (
                        <p><span className="font-medium">Descuento:</span> <span className="text-emerald-600 font-semibold">- S/ {selectedVenta.descuento_total.toFixed(2)}</span></p>
                      )}
                      <p><span className="font-medium">Total Final:</span> <span className="text-blue-600 font-bold">S/ {((selectedVenta.detalles?.reduce((sum, d) => sum + (d.precio_unitario * d.cantidad), 0) || 0) - (selectedVenta.descuento_total || 0)).toFixed(2)}</span></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información del Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nombre:</span> {selectedVenta.usuario?.nombre || 'N/A'}</p>
                      <p><span className="font-medium">DNI:</span> {selectedVenta.usuario?.dni || 'N/A'}</p>
                      <p><span className="font-medium">Teléfono:</span> {selectedVenta.usuario?.telefono || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Productos Vendidos</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">P. Unitario</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedVenta.detalles?.map((detalle, index) => (
                          <tr key={detalle.id || index}>
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
              </>
            )}

            {detailTab === 'anticipos' && (
              <div className="space-y-6">
                {selectedVenta.saldo_pendiente && selectedVenta.saldo_pendiente > 0 && selectedVenta.usuario && (
                  <AnticipoManager
                    ventaId={selectedVenta.id}
                    clienteId={selectedVenta.usuario.id}
                    saldoPendiente={selectedVenta.saldo_pendiente}
                    onAnticipoAdded={handleAnticipoAdded}
                  />
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    Historial de Pagos
                  </h4>

                  {selectedVenta.anticipos && selectedVenta.anticipos.length > 0 ? (
                    <div className="space-y-3">
                      {selectedVenta.anticipos.map((anticipo, index) => (
                        <div key={anticipo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-gray-900">
                                  Anticipo #{index + 1}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <p><span className="text-gray-600">Fecha:</span> <span className="font-medium">{new Date(anticipo.fecha_anticipo).toLocaleDateString('es-ES')}</span></p>
                                <p><span className="text-gray-600">Método:</span> <span className="font-medium">{anticipo.metodo_pago}</span></p>
                                {anticipo.observaciones && (
                                  <p className="col-span-2"><span className="text-gray-600">Observaciones:</span> <span className="font-medium">{anticipo.observaciones}</span></p>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-blue-600">
                                S/ {anticipo.monto.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">No hay anticipos registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Historial;
