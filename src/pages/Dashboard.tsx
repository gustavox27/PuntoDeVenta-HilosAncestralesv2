import React, { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, Download, FileText, Eye } from 'lucide-react';
import MetricCard from '../components/Dashboard/MetricCard';
import ChartCard from '../components/Dashboard/ChartCard';
import SalesChart from '../components/Dashboard/SalesChart';
import { SupabaseService } from '../services/supabaseService';
import { ExportUtils } from '../utils/exportUtils';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('week');
  const [salesPeriod, setSalesPeriod] = useState('week');
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dateFilter, salesPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, eventosData] = await Promise.all([
        SupabaseService.getMetricasVentas(salesPeriod),
        SupabaseService.getEventos(100)
      ]);

      setMetrics(metricsData);
      setEventos(eventosData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!metrics) return;

      const reportData = [
        ['Métrica', 'Valor'],
        ['Total Ventas del Mes', `S/ ${metrics.totalVentas.toFixed(2)}`],
        ['Productos en Stock', metrics.estadoStock.reduce((acc: number, item: any) => acc + item.cantidad, 0)],
        ['Eventos Registrados', eventos.length],
      ];

      await ExportUtils.exportToPDF(
        reportData.slice(1),
        ['Métrica', 'Valor'],
        'reporte-dashboard',
        'Reporte Dashboard - HILOS ANCESTRALES'
      );

      toast.success('Reporte PDF generado correctamente');
    } catch (error) {
      toast.error('Error al generar el reporte PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      if (!metrics) return;

      const reportData = [
        {
          metrica: 'Total Ventas del Mes',
          valor: metrics.totalVentas.toFixed(2)
        },
        {
          metrica: 'Productos en Stock',
          valor: metrics.estadoStock.reduce((acc: number, item: any) => acc + item.cantidad, 0)
        },
        {
          metrica: 'Eventos Registrados',
          valor: eventos.length
        }
      ];

      ExportUtils.exportToExcel(reportData, 'reporte-dashboard', 'Dashboard');
      toast.success('Reporte Excel generado correctamente');
    } catch (error) {
      toast.error('Error al generar el reporte Excel');
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = metrics?.ventasPorPeriodo?.map((item: any, index: number) => ({
    name: `Día ${index + 1}`,
    value: item.total || 0
  })) || [];

  const pieData = metrics?.estadoCantidad?.map((item: any) => ({
    name: item.estado,
    value: item.cantidad
  })) || [];

  const popularProductsData = metrics?.productosPopulares?.map((item: any) => ({
    name: item.nombre,
    value: item.cantidad
  })) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with filters and export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">Métricas clave del sistema de ventas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">

          <button
            onClick={handleExportPDF}
            className="px-3 sm:px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1.5 sm:space-x-2"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1.5 sm:space-x-2"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          title="Ventas del Mes"
          value={`S/ ${metrics?.totalVentas?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="bg-green-500"
          trend="+12% vs mes anterior"
        />
        <MetricCard
          title="Productos en Stock"
          value={metrics?.estadoStock?.reduce((acc: number, item: any) => acc + item.cantidad, 0)?.toString() || '0'}
          icon={Package}
          color="bg-blue-500"
        />
        <MetricCard
          title="Ventas Realizadas"
          value={metrics?.ventasPorPeriodo?.length?.toString() || '0'}
          icon={ShoppingCart}
          color="bg-purple-500"
        />
        <MetricCard
          title="Clientes Activos"
          value={metrics?.clientesActivos?.toString() || '0'}
          icon={Users}
          color="bg-orange-500"
          trend="+5% esta semana"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SalesChart />
        <ChartCard
          title="Cantidad por Estado"
          data={pieData}
          type="pie"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Colores Más Vendidos"
            data={metrics?.coloresPopulares?.map((item: any) => ({
              name: item.nombre,
              value: item.cantidad
            })) || []}
            type="bar"
            colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']}
          />
        </div>
        
        {/* Event Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Eventos Recientes</h3>
            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
              title="Ver detalles completos"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs font-medium">Detalles</span>
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
            {eventos.slice(0, 10).map((evento, index) => (
              <div key={evento.id || index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{evento.tipo}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">{evento.descripcion}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    {new Date(evento.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <h3 className="text-base sm:text-xl font-semibold text-gray-900">Registro de Auditoría</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <span className="text-xl sm:text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                      <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                      <th className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventos.map((evento, index) => (
                      <tr key={evento.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-900">
                          {new Date(evento.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {evento.tipo}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-600">
                          {evento.modulo || '-'}
                        </td>
                        <td className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-600">
                          {evento.accion || '-'}
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-[10px] sm:text-sm text-gray-900 max-w-[150px] sm:max-w-md truncate" title={evento.descripcion}>
                          {evento.descripcion}
                        </td>
                        <td className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-600">
                          {evento.usuario || 'Sistema'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-3 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;