import React, { useState } from 'react';
import { LogIn, User, CreditCard, Lock } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { Usuario } from '../types';
import toast from 'react-hot-toast';

interface LoginProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    dni: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.dni.trim()) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      return;
    }

    setLoading(true);

    try {
      const usuarios = await SupabaseService.getUsuarios();

      const usuario = usuarios.find(
        u => u.nombre === formData.nombre && u.dni === formData.dni
      );

      if (!usuario) {
        toast.error('Credenciales incorrectas');
        setLoading(false);
        return;
      }

      if (!['Administrador', 'Vendedor', 'Almacenero'].includes(usuario.perfil)) {
        toast.error('No tiene permisos para acceder al sistema');
        setLoading(false);
        return;
      }

      toast.success(`Bienvenido, ${usuario.nombre}`);
      onLoginSuccess(usuario);

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Error al iniciar sesión. Intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-3 sm:px-4 py-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-8 py-6 sm:py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-5"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Lock className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">HILOS ANCESTRALES</h1>
              <p className="text-blue-100 text-xs sm:text-sm">Sistema de Gestión de Ventas</p>
            </div>
          </div>

          <div className="px-4 sm:px-8 py-6 sm:py-10">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Ingrese sus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ingrese su nombre"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  DNI
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={formData.dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, dni: value });
                    }}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="12345678"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-blue-800 text-center">
                  Acceso exclusivo para personal autorizado: Administradores, Vendedores y Almaceneros
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6 px-2">
          <p className="text-xs sm:text-sm text-gray-600">
            © 2025 HILOS ANCESTRALES - Todos los derechos reservados - Gustavo Corrales
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
