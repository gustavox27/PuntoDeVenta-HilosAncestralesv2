import React from 'react';
import { MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import { getEntityLocation, getNavigationUrl, getActionContext } from '../../utils/navigationUtils';

interface EntityLocationInfoProps {
  entityType?: string;
  entityId?: string;
  accion?: string;
  tipo?: string;
  onNavigate?: () => void;
}

const EntityLocationInfo: React.FC<EntityLocationInfoProps> = ({
  entityType,
  entityId,
  accion,
  tipo,
  onNavigate
}) => {
  if (!entityType) {
    return null;
  }

  const location = getEntityLocation(entityType);
  const context = accion && tipo ? getActionContext(tipo, accion) : null;
  const navigationUrl = getNavigationUrl(entityType, entityId);

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${context?.bgColor || 'bg-blue-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <MapPin size={18} className={`flex-shrink-0 mt-0.5 ${context?.color || 'text-blue-700'}`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-1">
              <span>Ubicación en el Sistema</span>
            </h4>

            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="px-2.5 py-1 bg-white rounded border border-gray-200 text-xs font-medium truncate max-w-xs">
                  {location.modulo}
                </span>
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                <span className="px-2.5 py-1 bg-white rounded border border-gray-200 text-xs font-medium truncate max-w-xs">
                  {location.contenedor}
                </span>
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                <span className="px-2.5 py-1 bg-white rounded border border-gray-200 text-xs font-medium truncate max-w-xs">
                  {location.modal}
                </span>
              </div>

              <p className={`text-xs mt-2 ${context?.color || 'text-blue-700'}`}>
                {location.descripcion}
              </p>
            </div>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={onNavigate}
            className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors flex items-center space-x-1 flex-shrink-0"
            title={`Navegar a ${location.modulo}`}
          >
            <span>Ir</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EntityLocationInfo;
