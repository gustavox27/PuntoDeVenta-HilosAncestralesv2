import React, { useState } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Package,
  History,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const colorMap: Record<string, { light: string; dark: string }> = {
    blue: { light: 'from-blue-900 to-blue-800', dark: 'from-blue-950 to-gray-900' },
    green: { light: 'from-green-900 to-green-800', dark: 'from-green-950 to-gray-900' },
    red: { light: 'from-red-900 to-red-800', dark: 'from-red-950 to-gray-900' },
    orange: { light: 'from-orange-900 to-orange-800', dark: 'from-orange-950 to-gray-900' },
    teal: { light: 'from-teal-900 to-teal-800', dark: 'from-teal-950 to-gray-900' },
    cyan: { light: 'from-cyan-900 to-cyan-800', dark: 'from-cyan-950 to-gray-900' },
  };

  const bgGradient = isDark ? colorMap[theme.color].dark : colorMap[theme.color].light;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b ${bgGradient}
        text-white transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}>
        <div className="p-6 relative">
          <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <Package className="h-8 w-8 text-blue-300 flex-shrink-0" />
            {!isCollapsed && <h1 className="text-xl font-bold">HILADOS ANCESTRALES</h1>}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute top-6 -right-3 bg-blue-700 hover:bg-blue-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    ${currentPage === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;