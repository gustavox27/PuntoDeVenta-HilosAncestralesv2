import React, { useState, useEffect } from 'react';
import { Producto } from '../../types';
import { SupabaseService } from '../../services/supabaseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Calendar, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductDetailTabsProps {
  product: Producto;
}

interface VentaDetalle {
  id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  venta: {
    id: string;
    fecha_venta: string;
    numero_guia: string;
    vendedor: string;
    usuario?: {
      id: string;
      nombre: string;
    };
    usuario_eliminado: boolean;
    usuario_eliminado_nombre?: string;
  };
}

const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<'detalles' | 'historial'>('detalles');
  const [ventasHistorial, setVentasHistorial] = useState<VentaDetalle[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistorial();
    }
  }, [activeTab]);

  const loadHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await SupabaseService.getVentasPorProducto(product.id);
      setVentasHistorial(data);
    } catch (error) {
      console.error('Error loading product sales history:', error);
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setLoadingHistorial(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('detalles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'detalles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detalles
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial
            {ventasHistorial.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                {ventasHistorial.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'detalles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre</label>
              <p className="text-gray-900 font-medium">{product.nombre}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Color</label>
              <p className="text-gray-900 font-medium">{product.color}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
              <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                product.estado === 'Por Hilandar' || product.estado === 'Por Devanar'
                  ? 'bg-yellow-100 text-yellow-800'
                  : product.estado === 'Conos Devanados'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {product.estado}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cantidad</label>
              <p className="text-gray-900 font-medium">{product.cantidad || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Precio Base</label>
              <p className="text-gray-900 font-medium">
                {(product.estado === 'Por Hilandar' || product.estado === 'Por Devanar')
                  ? 'En proceso...'
                  : `S/ ${product.precio_base.toFixed(2)}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Precio Unitario</label>
              <p className="text-gray-900 font-medium">
                {(product.estado === 'Por Hilandar' || product.estado === 'Por Devanar')
                  ? 'En proceso...'
                  : `S/ ${product.precio_uni.toFixed(2)}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Stock</label>
              <p className="text-gray-900 font-medium">
                {(product.estado === 'Por Hilandar' || product.estado === 'Por Devanar')
                  ? 'En proceso...'
                  : product.stock}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Registro</label>
              <p className="text-gray-900 font-medium">
                {product.fecha_registro
                  ? new Date(product.fecha_registro).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {product.descripcion && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{product.descripcion}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4">
          {loadingHistorial ? (
            <LoadingSpinner />
          ) : ventasHistorial.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No hay ventas registradas</p>
              <p className="text-sm text-gray-500 mt-1">Este producto no ha sido vendido aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Cliente</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 w-20">Cantidad</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 w-24">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28">N° Guía</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ventasHistorial.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 whitespace-nowrap overflow-hidden">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium">
                            {new Date(venta.venta.fecha_venta).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 break-words">
                        {venta.venta.usuario_eliminado ? (
                          <div className="flex items-start space-x-1 gap-1">
                            <span className="text-red-600 font-semibold line-clamp-2 break-words">
                              {venta.venta.usuario_eliminado_nombre || 'Usuario Eliminado'}
                            </span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">Eliminado</span>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2 gap-1">
                            <User size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-900 line-clamp-2 break-words">
                              {venta.venta.usuario?.nombre || 'N/A'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium whitespace-nowrap inline-block">
                          {venta.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-900 font-semibold whitespace-nowrap">
                          S/ {venta.subtotal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate">
                        {venta.venta.numero_guia ? (
                          <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate inline-block max-w-full">
                            {venta.venta.numero_guia}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin guía</span>
                        )}
                      </td>
                      <td className="px-4 py-3 truncate">
                        <span className="text-gray-700 truncate inline-block max-w-full">{venta.venta.vendedor}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total de ventas</p>
                    <p className="text-lg font-semibold text-gray-900">{ventasHistorial.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cantidad total vendida</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {ventasHistorial.reduce((sum, v) => sum + v.cantidad, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ingreso total</p>
                    <p className="text-lg font-semibold text-green-600">
                      S/ {ventasHistorial.reduce((sum, v) => sum + v.subtotal, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailTabs;
