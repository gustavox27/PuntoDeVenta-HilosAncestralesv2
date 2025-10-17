import React, { useState } from 'react';
import { DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

interface AnticipoManagerProps {
  ventaId: string;
  clienteId: string;
  saldoPendiente: number;
  onAnticipoAdded: () => void;
}

const AnticipoManager: React.FC<AnticipoManagerProps> = ({
  ventaId,
  clienteId,
  saldoPendiente,
  onAnticipoAdded
}) => {
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    if (montoNum > saldoPendiente) {
      toast.error('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    setLoading(true);

    try {
      // Registrar el anticipo en la base de datos
      await SupabaseService.createAnticipo({
        venta_id: ventaId,
        cliente_id: clienteId,
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_anticipo: new Date().toISOString(),
        observaciones: observaciones || undefined
      });

      setMonto('');
      setObservaciones('');

      toast.success('Anticipo registrado correctamente');

      // Llamar al callback para refrescar los datos
      onAnticipoAdded();
    } catch (error) {
      console.error('Error registering anticipo:', error);
      toast.error('Error al registrar el anticipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
        Registrar Nuevo Anticipo
      </h4>

      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Saldo Pendiente:</span>
          <span className="text-2xl font-bold text-blue-600">
            S/ {saldoPendiente.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <DollarSign className="mr-1 h-4 w-4" />
            Monto del Anticipo
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">S/</span>
            <input
              type="number"
              required
              min="0.01"
              max={saldoPendiente}
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Máximo: S/ {saldoPendiente.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CreditCard className="mr-1 h-4 w-4" />
            Método de Pago
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Yape">Yape</option>
            <option value="Plin">Plin</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FileText className="mr-1 h-4 w-4" />
            Observaciones (Opcional)
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Notas adicionales sobre el anticipo..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <DollarSign className="h-5 w-5" />
              <span>Registrar Anticipo</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AnticipoManager;
