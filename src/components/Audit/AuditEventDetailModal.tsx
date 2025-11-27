import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Info, Clock, User, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { Evento } from '../../types';
import toast from 'react-hot-toast';

interface AuditEventDetailModalProps {
  eventoId: string;
  onClose: () => void;
  onNavigate?: (eventoId: string) => void;
}

const AuditEventDetailModal: React.FC<AuditEventDetailModalProps> = ({ eventoId, onClose, onNavigate }) => {
  const [evento, setEvento] = useState<any>(null);
  const [relacionados, setRelacionados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    detalles: true,
    cambios: false,
    relacionados: false
  });

  useEffect(() => {
    loadEventoDetallado();
  }, [eventoId]);

  const loadEventoDetallado = async () => {
    try {
      setLoading(true);
      const [eventoData, relacionadosData] = await Promise.all([
        SupabaseService.getEventoDetallado(eventoId),
        SupabaseService.getEventosRelacionados(eventoId)
      ]);

      setEvento(eventoData);
      setRelacionados(relacionadosData);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
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
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getSeverityColor(evento.severidad)}`}>
              {getSeverityIcon(evento.severidad)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{evento.tipo}</h3>
              <p className="text-sm text-gray-600">{evento.accion}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div
            className="border border-gray-200 rounded-lg"
            onClick={() => toggleSection('detalles')}
          >
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Layers size={16} />
                <span>Detalles del Evento</span>
              </h4>
              {expandedSections.detalles ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.detalles && (
              <div className="px-4 py-3 border-t border-gray-200 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">ID del Evento</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-900 flex-1 truncate">
                        {evento.id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(evento.id)}
                        className="p-1 hover:bg-gray-300 rounded transition-colors"
                        title="Copiar ID"
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
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Usuario</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User size={14} className="text-gray-600" />
                      <span className="text-sm text-gray-900">{evento.usuario || 'Sistema'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Módulo</label>
                    <span className="text-sm text-gray-900">{evento.modulo || '-'}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Severidad</label>
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded mt-1 ${getSeverityColor(evento.severidad)}`}>
                      {evento.severidad || 'info'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Descripción</label>
                  <p className="text-sm text-gray-900 mt-1 bg-white p-3 rounded border border-gray-200">
                    {evento.descripcion}
                  </p>
                </div>

                {evento.entidad_id && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Entidad ID</label>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-900 block truncate mt-1">
                        {evento.entidad_id}
                      </code>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Tipo de Entidad</label>
                      <span className="text-sm text-gray-900 block mt-1 px-2 py-1 bg-white rounded border border-gray-200">
                        {evento.entidad_tipo}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(evento.valor_anterior || evento.valor_nuevo) && (
            <div
              className="border border-gray-200 rounded-lg"
              onClick={() => toggleSection('cambios')}
            >
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Tag size={16} />
                  <span>Estado Anterior y Nuevo</span>
                </h4>
                {expandedSections.cambios ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.cambios && (
                <div className="px-4 py-3 border-t border-gray-200 space-y-3 bg-gray-50">
                  {evento.estado_anterior_texto && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Estado Anterior</label>
                      <p className="text-sm text-gray-900 mt-1 bg-red-50 p-3 rounded border border-red-200">
                        {evento.estado_anterior_texto}
                      </p>
                    </div>
                  )}
                  {evento.estado_nuevo_texto && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Estado Nuevo</label>
                      <p className="text-sm text-gray-900 mt-1 bg-green-50 p-3 rounded border border-green-200">
                        {evento.estado_nuevo_texto}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {relacionados && relacionados.length > 0 && (
            <div
              className="border border-gray-200 rounded-lg"
              onClick={() => toggleSection('relacionados')}
            >
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Layers size={16} />
                  <span>Eventos Relacionados ({relacionados.length})</span>
                </h4>
                {expandedSections.relacionados ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.relacionados && (
                <div className="px-4 py-3 border-t border-gray-200 space-y-2 bg-gray-50">
                  {relacionados.map((rel, index) => (
                    <div key={index} className="p-3 bg-white rounded border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{rel.tipo_relacion}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {rel.evento_id === eventoId ? 'Evento relacionado' : 'Evento vinculado'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(rel.created_at).toLocaleDateString('es-ES', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(rel.evento_id === eventoId ? rel.evento_relacionado_id : rel.evento_id)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium ml-2"
                          >
                            Ver
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditEventDetailModal;
