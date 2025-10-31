import React, { useState } from 'react';
import { DollarSign, Calendar, CreditCard, FileText, X } from 'lucide-react';

interface AnticipoInicialModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  onSubmit: (data: {
    monto: number;
    metodo_pago: string;
    fecha_anticipo: string;
    observaciones?: string;
  }) => void;
  loading?: boolean;
}

const metodoPagoOpciones = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'yape', label: 'Yape', icon: '📱' },
  { value: 'plin', label: 'Plin', icon: '📲' }
];

const AnticipoInicialModal: React.FC<AnticipoInicialModalProps> = ({
  isOpen,
  onClose,
  clienteNombre,
  onSubmit,
  loading = false
}) => {
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [fechaAnticipo, setFechaAnticipo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  const handleMontoChange = (value: string) => {
    setMonto(value);
    setError('');

    const montoNum = parseFloat(value);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    onSubmit({
      monto: montoNum,
      metodo_pago: metodoPago,
      fecha_anticipo: fechaAnticipo,
      observaciones: observaciones || undefined
    });
  };

  const handleClose = () => {
    setMonto('');
    setMetodoPago('efectivo');
    setFechaAnticipo(new Date().toISOString().split('T')[0]);
    setObservaciones('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={!loading ? handleClose : undefined}
        ></div>

        <div className="inline-block w-full max-w-[95vw] sm:max-w-lg p-0 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl sm:rounded-2xl">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 sm:space-x-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-emerald-100">
                  <DollarSign className="text-emerald-600" size={20} />
                </div>

                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                    Registrar Anticipo Inicial
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Cliente: <span className="font-semibold">{clienteNombre}</span>
                  </p>
                </div>
              </div>

              {!loading && (
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">
                    Este anticipo se guardará sin estar asociado a una venta específica.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Se aplicará automáticamente cuando el cliente realice una compra.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="mr-1 h-4 w-4" />
                Monto del Anticipo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={monto}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  disabled={loading}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              {error && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Fecha del Anticipo
              </label>
              <input
                type="date"
                value={fechaAnticipo}
                onChange={(e) => setFechaAnticipo(e.target.value)}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CreditCard className="mr-1 h-4 w-4" />
                Método de Pago
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                {metodoPagoOpciones.map((opcion) => (
                  <label
                    key={opcion.value}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      metodoPago === opcion.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="metodo_pago"
                      value={opcion.value}
                      checked={metodoPago === opcion.value}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      disabled={loading}
                      className="sr-only"
                    />
                    <span className="text-xl sm:text-2xl mb-1">{opcion.icon}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="mr-1 h-4 w-4" />
                Observaciones (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={loading}
                placeholder="Añade notas adicionales sobre el anticipo..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !!error || !monto}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5" />
                    Registrar Anticipo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnticipoInicialModal;
