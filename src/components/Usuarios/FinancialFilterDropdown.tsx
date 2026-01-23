import React, { useState, useRef, useEffect } from 'react';
import { Filter, Wallet, AlertTriangle, ChevronDown } from 'lucide-react';

interface FinancialFilter {
  conSaldo: boolean;
  conDeuda: boolean;
}

interface FinancialFilterDropdownProps {
  filter: FinancialFilter;
  onFilterChange: (filter: FinancialFilter) => void;
  conSaldoCount: number;
  conDeudaCount: number;
  usuariosTotalCount: number;
}

const FinancialFilterDropdown: React.FC<FinancialFilterDropdownProps> = ({
  filter,
  onFilterChange,
  conSaldoCount,
  conDeudaCount,
  usuariosTotalCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAll = () => {
    onFilterChange({ conSaldo: false, conDeuda: false });
  };

  const handleToggleSaldo = () => {
    onFilterChange({
      conSaldo: !filter.conSaldo,
      conDeuda: filter.conDeuda
    });
  };

  const handleToggleDeuda = () => {
    onFilterChange({
      conSaldo: filter.conSaldo,
      conDeuda: !filter.conDeuda
    });
  };

  const isAnyFilterActive = filter.conSaldo || filter.conDeuda;

  const getButtonText = () => {
    if (!isAnyFilterActive) return 'Filtro Financiero';
    if (filter.conSaldo && filter.conDeuda) return 'Saldo y Deuda';
    if (filter.conSaldo) return 'Saldo Disponible';
    if (filter.conDeuda) return 'Deuda Pendiente';
    return 'Filtro Financiero';
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
          isAnyFilterActive
            ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-150'
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-150'
        }`}
      >
        <Filter size={16} />
        <span className="text-sm font-medium">{getButtonText()}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {isAnyFilterActive && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full ml-1">
            {[filter.conSaldo, filter.conDeuda].filter(Boolean).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={handleSelectAll}
            >
              <input
                type="checkbox"
                checked={!isAnyFilterActive}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Todos los Usuarios</p>
                <p className="text-xs text-gray-500">Mostrar: {usuariosTotalCount}</p>
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
              onClick={handleToggleSaldo}
            >
              <input
                type="checkbox"
                checked={filter.conSaldo}
                onChange={handleToggleSaldo}
                className="w-4 h-4 text-green-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Wallet size={14} className="text-green-600" />
                  <p className="text-sm font-medium text-gray-900">Saldo Disponible</p>
                </div>
                <p className="text-xs text-gray-500">Mostrar: {conSaldoCount}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
              onClick={handleToggleDeuda}
            >
              <input
                type="checkbox"
                checked={filter.conDeuda}
                onChange={handleToggleDeuda}
                className="w-4 h-4 text-red-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={14} className="text-red-600" />
                  <p className="text-sm font-medium text-gray-900">Deuda Pendiente</p>
                </div>
                <p className="text-xs text-gray-500">Mostrar: {conDeudaCount}</p>
              </div>
            </div>
          </div>

          {isAnyFilterActive && (
            <div className="px-4 py-3 bg-blue-50 border-t border-gray-200 rounded-b-lg">
              <p className="text-xs text-blue-700 font-medium">
                {filter.conSaldo && filter.conDeuda
                  ? 'Mostrando usuarios que tienen SALDO Y DEUDA'
                  : filter.conSaldo
                  ? 'Mostrando usuarios con SALDO DISPONIBLE'
                  : 'Mostrando usuarios con DEUDA PENDIENTE'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialFilterDropdown;
