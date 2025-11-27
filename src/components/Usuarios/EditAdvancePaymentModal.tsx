import React, { useState } from 'react';
import { DollarSign, Calendar, CreditCard, FileText, Save, X } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

interface EditAdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  advance: {
    id: string;
    monto: number;
    metodo_pago?: string;
    fecha_anticipo: string;
    observaciones?: string;
  };
  onSuccess: () => void;
}

const EditAdvancePaymentModal: React.FC<EditAdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  advance,
  onSuccess
}) => {
  const [monto, setMonto] = useState(advance.monto.toString());
  const [metodo_pago, setMetodo_pago] = useState(advance.metodo_pago || 'efectivo');
  const [fecha_anticipo, setFecha_anticipo] = useState(
    advance.fecha_anticipo ? advance.fecha_anticipo.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [observaciones, setObservaciones] = useState(advance.observaciones || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await SupabaseService.updateAnticipo(advance.id, {
        monto: montoNum,
        metodo_pago,
        observaciones: observaciones || undefined
      });

      toast.success('Anticipo actualizado correctamente');
      onSuccess();
    } catch (err: any) {
      console.error('Error updating advance:', err);
      const errorMessage = err?.message || 'Error al actualizar el anticipo';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      ></div>

      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Editar Anticipo</h3>
              <p className="text-xs text-gray-600 mt-1">ID: {advance.id.substring(0, 8)}...</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  setError('');
                }}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha de Registro
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 flex items-center">
              {new Date(advance.fecha_anticipo).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              La fecha de registro no se puede cambiar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="inline h-4 w-4 mr-1" />
              Método de Pago
            </label>
            <select
              value={metodo_pago}
              onChange={(e) => setMetodo_pago(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="yape">Yape</option>
              <option value="plin">Plin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Observaciones (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={loading}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all disabled:bg-gray-100"
              placeholder="Notas sobre este anticipo..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              Los cambios se reflejarán inmediatamente en el sistema
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdvancePaymentModal;
