import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { SupabaseService } from '../../services/supabaseService';

interface SalesData {
  fecha_venta: string;
  total: number;
}

type PeriodType = 'day' | 'week' | 'month' | 'year';

const SalesChart: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSalesData();
  }, [period]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let fechaInicio: Date;
      let fechaFin: Date;
      let intervals: Date[];

      switch (period) {
        case 'day':
          fechaInicio = startOfDay(now);
          fechaFin = endOfDay(now);
          intervals = [fechaInicio];
          break;
        case 'week':
          fechaInicio = startOfWeek(now, { locale: es });
          fechaFin = endOfWeek(now, { locale: es });
          intervals = eachDayOfInterval({ start: fechaInicio, end: fechaFin });
          break;
        case 'month':
          fechaInicio = startOfMonth(now);
          fechaFin = endOfMonth(now);
          intervals = eachWeekOfInterval({ start: fechaInicio, end: fechaFin }, { locale: es });
          break;
        case 'year':
          fechaInicio = startOfYear(now);
          fechaFin = endOfYear(now);
          intervals = eachMonthOfInterval({ start: fechaInicio, end: fechaFin });
          break;
        default:
          fechaInicio = startOfWeek(now, { locale: es });
          fechaFin = endOfWeek(now, { locale: es });
          intervals = eachDayOfInterval({ start: fechaInicio, end: fechaFin });
      }

      const ventas = await SupabaseService.getVentasPorFecha(
        fechaInicio.toISOString(),
        fechaFin.toISOString()
      );

      const data = intervals.map(date => {
        let label: string;
        let ventasFiltradas: any[];

        switch (period) {
          case 'day':
            label = format(date, 'HH:mm', { locale: es });
            ventasFiltradas = ventas.filter(v => {
              const ventaDate = new Date(v.fecha_venta);
              return ventaDate.getHours() === date.getHours();
            });
            break;
          case 'week':
            label = format(date, 'EEEE', { locale: es });
            ventasFiltradas = ventas.filter(v => {
              const ventaDate = new Date(v.fecha_venta);
              return ventaDate.toDateString() === date.toDateString();
            });
            break;
          case 'month':
            label = `Semana ${format(date, 'w', { locale: es })}`;
            ventasFiltradas = ventas.filter(v => {
              const ventaDate = new Date(v.fecha_venta);
              return (
                ventaDate >= date &&
                ventaDate < new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
              );
            });
            break;
          case 'year':
            label = format(date, 'MMM', { locale: es });
            ventasFiltradas = ventas.filter(v => {
              const ventaDate = new Date(v.fecha_venta);
              return (
                ventaDate.getMonth() === date.getMonth() &&
                ventaDate.getFullYear() === date.getFullYear()
              );
            });
            break;
          default:
            label = format(date, 'dd MMM', { locale: es });
            ventasFiltradas = ventas;
        }

        const totalVentas = ventasFiltradas.reduce((sum, v) => sum + Number(v.total), 0);
        const cantidadVentas = ventasFiltradas.length;

        return {
          name: label,
          total: totalVentas,
          cantidad: cantidadVentas,
        };
      });

      setChartData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-blue-600">
            Total: <span className="font-bold">S/ {payload[0].value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Ventas: <span className="font-medium">{payload[0].payload.cantidad}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return 'Ventas de Hoy';
      case 'week':
        return 'Ventas de esta Semana';
      case 'month':
        return 'Ventas de este Mes';
      case 'year':
        return 'Ventas de este Año';
      default:
        return 'Ventas';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getPeriodLabel()}</h3>
          <p className="text-sm text-gray-600">
            Total: S/ {chartData.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium"
        >
          <option value="day">Hoy</option>
          <option value="week">Semanal</option>
          <option value="month">Mensual</option>
          <option value="year">Anual</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `S/ ${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              name="Total de Ventas (S/)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!loading && chartData.length === 0 && (
        <div className="flex flex-col items-center justify-center h-80 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No hay datos de ventas</p>
          <p className="text-sm">No se encontraron ventas en el periodo seleccionado</p>
        </div>
      )}
    </div>
  );
};

export default SalesChart;
