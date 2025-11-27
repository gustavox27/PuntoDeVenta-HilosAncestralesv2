import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Info, Clock, User, Tag, Layers, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import DiffViewer from './DiffViewer';
import EntityLocationInfo from './EntityLocationInfo';
import { getDetailedDifferences, isEmptyData, parseJSON, formatValue } from '../../utils/diffUtils';
import toast from 'react-hot-toast';

interface AuditComparisonModalProps {
  eventoId: string;
  onClose: () => void;
}

const AuditComparisonModal: React.FC<AuditComparisonModalProps> = ({ eventoId, onClose }) => {
  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    header: true,
    differences: true,
    oldData: false,
    newData: false
  });

  useEffect(() => {
    loadEventoData();
  }, [eventoId]);

  const loadEventoData = async () => {
    try {
      setLoading(true);
      const eventoData = await SupabaseService.getEventoDetallado(eventoId);
      setEvento(eventoData);
    } catch (error) {
      console.error('Error cargando evento:', error);
      toast.error('Error al cargar detalles del evento');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityColor = (severidad?: string) => {
    switch (severidad) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityIcon = (severidad?: string) => {
    switch (severidad) {
      case 'critical':
      case 'error': return <AlertCircle size={14} />;
      case 'warning': return <AlertCircle size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getActionTypeBadgeColor = (tipo?: string) => {
    const tipos: Record<string, string> = {
      'Crear': 'bg-green-100 text-green-800',
      'Actualizar': 'bg-blue-100 text-blue-800',
      'Eliminar': 'bg-red-100 text-red-800',
      'Usuario': 'bg-purple-100 text-purple-800',
      'Producto': 'bg-green-100 text-green-800',
      'Venta': 'bg-blue-100 text-blue-800',
      'Anticipo': 'bg-orange-100 text-orange-800',
      'Color': 'bg-pink-100 text-pink-800',
      'Deuda': 'bg-red-100 text-red-800',
      'Pago': 'bg-green-100 text-green-800'
    };
    return tipos[tipo || ''] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
          <p className="text-center text-gray-600">Evento no encontrado</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasOldData = !isEmptyData(evento.valor_anterior);
  const hasNewData = !isEmptyData(evento.valor_nuevo);
  const differences = hasOldData && hasNewData ? getDetailedDifferences(evento.valor_anterior, evento.valor_nuevo) : new Map();

  const isCreateAction = evento.accion === 'Crear';
  const isDeleteAction = evento.accion === 'Eliminar';
  const isUpdateAction = evento.accion === 'Actualizar';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-2.5 rounded-lg ${getSeverityColor(evento.severidad)}`}>
              {getSeverityIcon(evento.severidad)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">{evento.tipo}</h3>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getActionTypeBadgeColor(evento.accion)}`}>
                  {evento.accion || '-'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{evento.descripcion}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {/* Event Details Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('header')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Layers size={16} />
                <span>Detalles del Evento</span>
              </h4>
              {expandedSections.header ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.header && (
              <div className="px-4 py-3 border-t border-gray-200 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">ID del Evento</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-900 flex-1 truncate">
                        {evento.id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(evento.id)}
                        className="p-1 hover:bg-gray-300 rounded transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Fecha/Hora</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock size={14} className="text-gray-600" />
                      <span className="text-sm text-gray-900">
                        {new Date(evento.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Usuario</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User size={14} className="text-gray-600" />
                      <span className="text-sm text-gray-900">{evento.usuario || 'Sistema'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Módulo</label>
                    <p className="text-sm text-gray-900 mt-1">{evento.modulo || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Tipo de Entidad</label>
                    <p className="text-sm text-gray-900 mt-1">{evento.entidad_tipo || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Severidad</label>
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded mt-1 ${getSeverityColor(evento.severidad)}`}>
                      {evento.severidad || 'info'}
                    </span>
                  </div>
                  {evento.entidad_id && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Entidad ID</label>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-900 block truncate mt-1">
                        {evento.entidad_id}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location Info Section */}
          {evento.entidad_tipo && (
            <EntityLocationInfo
              entityType={evento.entidad_tipo}
              entityId={evento.entidad_id}
              accion={evento.accion}
              tipo={evento.tipo}
            />
          )}

          {/* Comparison Section */}
          {(hasOldData || hasNewData) && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('differences')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Tag size={16} />
                  <span>{isCreateAction ? 'Datos Creados' : isDeleteAction ? 'Datos Eliminados' : 'Comparación: Antes vs Después'}</span>
                  {differences.size > 0 && !isCreateAction && !isDeleteAction && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {differences.size} cambio{differences.size !== 1 ? 's' : ''}
                    </span>
                  )}
                </h4>
                {expandedSections.differences ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.differences && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  {isCreateAction && hasNewData ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <p className="text-sm text-green-700 font-medium">Se creó una nueva entidad con los siguientes datos:</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-64 overflow-auto">
                        <pre className="text-xs text-green-900 whitespace-pre-wrap break-words font-mono">
                          {formatValue(parseJSON(evento.valor_nuevo))}
                        </pre>
                      </div>
                    </div>
                  ) : isDeleteAction && hasOldData ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Trash2 size={16} className="text-red-600" />
                        <p className="text-sm text-red-700 font-medium">Se eliminó la entidad con los siguientes datos:</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-auto">
                        <pre className="text-xs text-red-900 whitespace-pre-wrap break-words font-mono">
                          {formatValue(parseJSON(evento.valor_anterior))}
                        </pre>
                      </div>
                      {evento.entidad_tipo === 'venta' && evento.valor_anterior && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs font-semibold text-orange-800">
                            ⚠ Rollback Completo: Se eliminó la venta junto con todos sus detalles y anticipos asociados
                          </p>
                        </div>
                      )}
                    </div>
                  ) : differences.size > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Old Data Panel */}
                      <div className="border border-red-200 rounded-lg bg-red-50 overflow-hidden">
                        <button
                          onClick={() => toggleSection('oldData')}
                          className="w-full px-3 py-2 flex items-center justify-between bg-red-100 hover:bg-red-200 transition-colors"
                        >
                          <h5 className="font-semibold text-red-900 text-sm flex items-center space-x-1">
                            <span>Estado Anterior</span>
                          </h5>
                          {expandedSections.oldData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.oldData && (
                          <div className="p-3 max-h-48 overflow-auto">
                            <pre className="text-xs text-red-900 whitespace-pre-wrap break-words font-mono">
                              {formatValue(parseJSON(evento.valor_anterior))}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* New Data Panel */}
                      <div className="border border-green-200 rounded-lg bg-green-50 overflow-hidden">
                        <button
                          onClick={() => toggleSection('newData')}
                          className="w-full px-3 py-2 flex items-center justify-between bg-green-100 hover:bg-green-200 transition-colors"
                        >
                          <h5 className="font-semibold text-green-900 text-sm flex items-center space-x-1">
                            <span>Estado Nuevo</span>
                          </h5>
                          {expandedSections.newData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.newData && (
                          <div className="p-3 max-h-48 overflow-auto">
                            <pre className="text-xs text-green-900 whitespace-pre-wrap break-words font-mono">
                              {formatValue(parseJSON(evento.valor_nuevo))}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No hay datos de comparación disponibles</p>
                  )}

                  {/* Differences List */}
                  {differences.size > 0 && !isCreateAction && !isDeleteAction && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <DiffViewer changes={differences} title="Cambios Detectados" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasOldData && !hasNewData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Este evento no tiene datos de comparación disponibles
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Consulta la descripción del evento para conocer los detalles
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditComparisonModal;
