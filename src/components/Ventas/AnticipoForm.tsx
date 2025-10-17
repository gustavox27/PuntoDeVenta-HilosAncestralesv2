import { useState } from 'react';
import { DollarSign, Calendar, CreditCard, FileText, X } from 'lucide-react';

interface AnticipoFormProps {
  totalVenta: number;
  onAnticipoChange: (anticipo: AnticipoData | null) => void;
}

export interface AnticipoData {
  monto: number;
  metodo_pago: string;
  fecha_anticipo: string;
  observaciones?: string;
}

const metodoPagoOpciones = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'yape', label: 'Yape', icon: '📱' },
  { value: 'plin', label: 'Plin', icon: '📲' }
];

export default function AnticipoForm({ totalVenta, onAnticipoChange }: AnticipoFormProps) {
  const [habilitado, setHabilitado] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [fechaAnticipo, setFechaAnticipo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  const handleHabilitarChange = (checked: boolean) => {
    setHabilitado(checked);
    if (!checked) {
      setMonto('');
      setObservaciones('');
      setError('');
      onAnticipoChange(null);
    }
  };

  const handleMontoChange = (value: string) => {
    setMonto(value);
    setError('');

    const montoNum = parseFloat(value);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      onAnticipoChange(null);
      return;
    }

    if (montoNum > totalVenta) {
      setError('El anticipo no puede ser mayor al total de la venta');
      onAnticipoChange(null);
      return;
    }

    onAnticipoChange({
      monto: montoNum,
      metodo_pago: metodoPago,
      fecha_anticipo: fechaAnticipo,
      observaciones: observaciones || undefined
    });
  };

  const handleMetodoPagoChange = (value: string) => {
    setMetodoPago(value);
    if (monto && parseFloat(monto) > 0 && parseFloat(monto) <= totalVenta) {
      onAnticipoChange({
        monto: parseFloat(monto),
        metodo_pago: value,
        fecha_anticipo: fechaAnticipo,
        observaciones: observaciones || undefined
      });
    }
  };

  const handleFechaChange = (value: string) => {
    setFechaAnticipo(value);
    if (monto && parseFloat(monto) > 0 && parseFloat(monto) <= totalVenta) {
      onAnticipoChange({
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
        fecha_anticipo: value,
        observaciones: observaciones || undefined
      });
    }
  };

  const handleObservacionesChange = (value: string) => {
    setObservaciones(value);
    if (monto && parseFloat(monto) > 0 && parseFloat(monto) <= totalVenta) {
      onAnticipoChange({
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
        fecha_anticipo: fechaAnticipo,
        observaciones: value || undefined
      });
    }
  };

  const saldoPendiente = totalVenta - (parseFloat(monto) || 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Anticipo de Pago</h3>
              <p className="text-sm text-gray-600">Registra el anticipo del cliente</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={habilitado}
              onChange={(e) => handleHabilitarChange(e.target.checked)}
              className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {habilitado ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </label>
        </div>
      </div>

      {habilitado && (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monto del Anticipo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalVenta}
                  value={monto}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha del Anticipo
              </label>
              <input
                type="date"
                value={fechaAnticipo}
                onChange={(e) => handleFechaChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Método de Pago
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {metodoPagoOpciones.map((opcion) => (
                <label
                  key={opcion.value}
                  className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    metodoPago === opcion.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo_pago"
                    value={opcion.value}
                    checked={metodoPago === opcion.value}
                    onChange={(e) => handleMetodoPagoChange(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">{opcion.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {opcion.label}
                  </span>
                  {metodoPago === opcion.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Observaciones (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => handleObservacionesChange(e.target.value)}
              placeholder="Añade notas adicionales sobre el anticipo..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          {monto && !error && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total de la Venta:</span>
                <span className="text-lg font-bold text-gray-900">
                  S/ {totalVenta.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Anticipo:</span>
                <span className="text-lg font-bold text-emerald-600">
                  - S/ {parseFloat(monto).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Saldo Pendiente:</span>
                  <span className="text-xl font-bold text-blue-600">
                    S/ {saldoPendiente.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
