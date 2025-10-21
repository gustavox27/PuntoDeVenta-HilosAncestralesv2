import React from 'react';
import { Calendar, Clock, LogOut, User } from 'lucide-react';
import { Usuario } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  currentUser?: Usuario;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentUser, onLogout }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getPerfilColor = (perfil: string) => {
    if (isDark) {
      switch (perfil) {
        case 'Administrador':
          return 'bg-red-900 text-red-200';
        case 'Vendedor':
          return 'bg-blue-900 text-blue-200';
        case 'Almacenero':
          return 'bg-green-900 text-green-200';
        default:
          return 'bg-gray-700 text-gray-200';
      }
    } else {
      switch (perfil) {
        case 'Administrador':
          return 'bg-red-100 text-red-800';
        case 'Vendedor':
          return 'bg-blue-100 text-blue-800';
        case 'Almacenero':
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <div className={`shadow-sm border-b px-3 sm:px-4 md:px-6 py-3 md:py-4 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
        <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-6">
          <div className={`flex items-center space-x-3 sm:space-x-4 md:space-x-6 text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Calendar size={14} className="sm:w-4 sm:h-4" />
              <span className="capitalize hidden md:inline">{currentDate}</span>
              <span className="capitalize md:hidden">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Clock size={14} className="sm:w-4 sm:h-4" />
              <span>{currentTime}</span>
            </div>
          </div>

          {currentUser && (
            <div className={`flex items-center space-x-2 sm:space-x-3 pl-3 sm:pl-4 md:pl-6 border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-white sm:w-4 sm:h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <p className={`font-semibold truncate max-w-[100px] sm:max-w-none ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{currentUser.nombre}</p>
                  <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${getPerfilColor(currentUser.perfil)}`}>
                    {currentUser.perfil}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-950'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Cerrar sesión"
                >
                  <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;