import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';

interface AuditTableProps {
  eventos: any[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEventoClick: (evento: any) => void;
}

const AuditTable: React.FC<AuditTableProps> = ({
  eventos,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEventoClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpand = (eventoId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(eventoId)) {
      newExpanded.delete(eventoId);
    } else {
      newExpanded.add(eventoId);
    }
    setExpandedRows(newExpanded);
  };

  const getSeverityBadge = (severidad?: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      error: 'bg-orange-100 text-orange-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800'
    };
    return styles[severidad || 'info'] || styles.info;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'Usuario': 'bg-purple-100 text-purple-800',
      'Producto': 'bg-green-100 text-green-800',
      'Venta': 'bg-blue-100 text-blue-800',
      'Anticipo': 'bg-orange-100 text-orange-800',
      'Color': 'bg-pink-100 text-pink-800',
      'Deuda': 'bg-red-100 text-red-800',
      'Pago': 'bg-green-100 text-green-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha/Hora</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Módulo</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Descripción</th>
              <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Usuario</th>
              <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Severidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Cargando eventos...</span>
                  </div>
                </td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                  No hay eventos registrados
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <React.Fragment key={evento.id}>
                  <tr
                    onClick={() => onEventoClick(evento)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpand(evento.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedRows.has(evento.id) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {new Date(evento.created_at).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTipoColor(evento.tipo)}`}>
                        {evento.tipo}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {evento.modulo || '-'}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {evento.accion || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 max-w-xs sm:max-w-md truncate">
                      {evento.descripcion}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {evento.usuario || 'Sistema'}
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityBadge(evento.severidad)}`}>
                        {evento.severidad || 'info'}
                      </span>
                    </td>
                  </tr>

                  {expandedRows.has(evento.id) && (
                    <tr className="bg-gray-50 border-t border-gray-300">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase">Tipo</p>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getTipoColor(evento.tipo)}`}>
                                {evento.tipo}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase">Módulo</p>
                              <p className="text-sm text-gray-900 mt-1">{evento.modulo || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase">Acción</p>
                              <p className="text-sm text-gray-900 mt-1">{evento.accion || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase">Severidad</p>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getSeverityBadge(evento.severidad)}`}>
                                {evento.severidad || 'info'}
                              </span>
                            </div>
                          </div>

                          {evento.entidad_id && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase">Entidad ID</p>
                                <code className="text-xs bg-white border border-gray-300 px-2 py-1 rounded block mt-1 truncate">
                                  {evento.entidad_id}
                                </code>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase">Tipo de Entidad</p>
                                <p className="text-sm text-gray-900 mt-1">{evento.entidad_tipo}</p>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Descripción Completa</p>
                            <p className="text-sm text-gray-900 mt-1 p-2 bg-white border border-gray-300 rounded">
                              {evento.descripcion}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">
            de {totalCount} eventos
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Anterior
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = currentPage + i - 2 >= 0 ? currentPage + i - 2 : i;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-white'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTable;
