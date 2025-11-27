import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';

interface AuditFiltersPanelProps {
  onFiltersChange: (filters: {
    fechaInicio?: string;
    fechaFin?: string;
    tipos?: string[];
    modulos?: string[];
    usuarios?: string[];
    acciones?: string[];
    palabraClave?: string;
  }) => void;
  onSearch: (keyword: string) => void;
}

const AuditFiltersPanel: React.FC<AuditFiltersPanelProps> = ({ onFiltersChange, onSearch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipos: [] as string[],
    modulos: [] as string[],
    usuarios: [] as string[],
    acciones: [] as string[],
    palabraClave: ''
  });

  const tiposEventos = ['Usuario', 'Producto', 'Venta', 'Anticipo', 'Color', 'Deuda', 'Pago'];
  const modulos = ['Usuarios', 'Inventario', 'Ventas', 'Historial', 'Anticipos', 'Dashboard'];
  const acciones = ['Crear', 'Actualizar', 'Eliminar', 'Aplicar', 'Crear Lote', 'Actualizar Stock', 'Aplicación Automática'];

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const usuariosData = await SupabaseService.getUsuarios();
      const nombres = usuariosData?.map(u => u.nombre) || [];
      setUsuarios(nombres);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultiSelect = (key: keyof typeof filters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(key, updated);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleFilterChange('palabraClave', value);
    onSearch(value);
  };

  const clearFilters = () => {
    const emptyFilters = {
      fechaInicio: '',
      fechaFin: '',
      tipos: [],
      modulos: [],
      usuarios: [],
      acciones: [],
      palabraClave: ''
    };
    setFilters(emptyFilters);
    setSearchTerm('');
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v !== '')
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por palabra clave..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Filter size={16} />
          <span className="text-sm font-medium">Filtros</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Tipo de Evento</label>
            <div className="flex flex-wrap gap-2">
              {tiposEventos.map(tipo => (
                <button
                  key={tipo}
                  onClick={() => handleMultiSelect('tipos', tipo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.tipos.includes(tipo)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Módulo</label>
            <div className="flex flex-wrap gap-2">
              {modulos.map(modulo => (
                <button
                  key={modulo}
                  onClick={() => handleMultiSelect('modulos', modulo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.modulos.includes(modulo)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {modulo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Acción</label>
            <div className="flex flex-wrap gap-2">
              {acciones.map(accion => (
                <button
                  key={accion}
                  onClick={() => handleMultiSelect('acciones', accion)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.acciones.includes(accion)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {accion}
                </button>
              ))}
            </div>
          </div>

          {!loadingUsers && (
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">Usuario</label>
              <div className="flex flex-wrap gap-2">
                {usuarios.map(usuario => (
                  <button
                    key={usuario}
                    onClick={() => handleMultiSelect('usuarios', usuario)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.usuarios.includes(usuario)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {usuario}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditFiltersPanel;
