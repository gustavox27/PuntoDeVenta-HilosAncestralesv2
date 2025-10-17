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
    <div className={`shadow-sm border-b px-6 py-4 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className={`flex items-center space-x-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span className="capitalize">{currentDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>{currentTime}</span>
            </div>
          </div>

          {currentUser && (
            <div className={`flex items-center space-x-3 pl-6 border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="text-sm">
                  <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{currentUser.nombre}</p>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPerfilColor(currentUser.perfil)}`}>
                    {currentUser.perfil}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-950'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
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