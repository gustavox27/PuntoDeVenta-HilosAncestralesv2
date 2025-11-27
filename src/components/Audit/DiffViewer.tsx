import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DiffChange, formatValue } from '../../utils/diffUtils';

interface DiffViewerProps {
  changes: Map<string, DiffChange>;
  title?: string;
  showOnlyChanged?: boolean;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ changes, title = 'Cambios Detectados', showOnlyChanged = true }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const getDiffBadgeColor = (type: DiffChange['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'removed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDiffTypeLabel = (type: DiffChange['type']) => {
    switch (type) {
      case 'added':
        return '+ Agregado';
      case 'removed':
        return '- Eliminado';
      case 'modified':
        return '↻ Modificado';
      default:
        return 'Cambio';
    }
  };

  const isValueComplex = (value: any) => {
    return typeof value === 'object' && value !== null;
  };

  if (changes.size === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">No hay cambios detectados</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold text-gray-900 px-4 py-2">{title}</h4>}
      <div className="space-y-2">
        {Array.from(changes.values()).map((change) => (
          <div key={change.path} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpanded(change.path)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getDiffBadgeColor(change.type)}`}>
                  {getDiffTypeLabel(change.type)}
                </span>
                <code className="text-sm font-mono text-gray-900">{change.path}</code>
              </div>
              {isValueComplex(change.oldValue) || isValueComplex(change.newValue) ? (
                expandedItems.has(change.path) ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )
              ) : null}
            </button>

            {expandedItems.has(change.path) && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-3">
                {change.type !== 'added' && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase mb-1">Valor Anterior</p>
                    <pre className="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-auto max-h-40 text-red-900 whitespace-pre-wrap break-words">
                      {formatValue(change.oldValue)}
                    </pre>
                  </div>
                )}

                {change.type !== 'removed' && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1">Valor Nuevo</p>
                    <pre className="text-xs bg-green-50 border border-green-200 rounded p-2 overflow-auto max-h-40 text-green-900 whitespace-pre-wrap break-words">
                      {formatValue(change.newValue)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiffViewer;
