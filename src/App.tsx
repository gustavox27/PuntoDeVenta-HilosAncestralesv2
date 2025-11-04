import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import Inventario from './pages/Inventario';
import Historial from './pages/Historial';
import UsuariosPage from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import { Usuario } from './types';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SupabaseService } from './services/supabaseService';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        SupabaseService.setCurrentUser(user.nombre);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLoginSuccess = (usuario: Usuario) => {
    setCurrentUser(usuario);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    SupabaseService.setCurrentUser(usuario.nombre);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    setCurrentPage('dashboard');
    SupabaseService.setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#4AED50',
                secondary: '#FFFAEE',
              },
            },
          }}
        />
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      ventas: 'Punto de Venta',
      inventario: 'Inventario',
      historial: 'Historial de Ventas',
      usuarios: 'Gestión de Usuarios',
      configuracion: 'Configuración del Sistema'
    };
    return titles[currentPage] || 'HILOSdeCALIDAD';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'ventas':
        return <Ventas currentUser={currentUser} />;
      case 'inventario':
        return <Inventario />;
      case 'historial':
        return <Historial />;
      case 'usuarios':
        return <UsuariosPage />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <UserProvider currentUser={currentUser}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#4AED50',
                  secondary: '#FFFAEE',
                },
              },
            }}
          />

          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title={getPageTitle()} currentUser={currentUser} onLogout={handleLogout} />

            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-7xl mx-auto">
                {renderPage()}
              </div>
            </main>
          </div>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;