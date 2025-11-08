import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPrice: number) => void;
  productName: string;
  currentPrice: number;
  basePrice: number;
}

const EditPriceModal: React.FC<EditPriceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  currentPrice,
  basePrice
}) => {
  const [newPrice, setNewPrice] = useState<string>(currentPrice.toString());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setNewPrice(currentPrice.toString());
      setError('');
    }
  }, [isOpen, currentPrice]);

  const handlePriceChange = (value: string) => {
    setNewPrice(value);
    setError('');

    if (value === '') {
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('Ingresa un valor numérico válido');
    } else if (numValue < basePrice) {
      setError(`El precio no puede ser menor a S/ ${basePrice.toFixed(2)}`);
    } else if (numValue <= 0) {
      setError('El precio debe ser mayor a cero');
    }
  };

  const handleConfirm = () => {
    if (newPrice === '') {
      setError('Ingresa un precio');
      return;
    }

    const numValue = parseFloat(newPrice);

    if (isNaN(numValue)) {
      setError('Ingresa un valor numérico válido');
      return;
    }

    if (numValue < basePrice) {
      setError(`El precio no puede ser menor a S/ ${basePrice.toFixed(2)}`);
      return;
    }

    if (numValue <= 0) {
      setError('El precio debe ser mayor a cero');
      return;
    }

    onConfirm(numValue);
    onClose();
    toast.success('Precio actualizado correctamente');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modificar Precio del Producto"
      size="md"
    >
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Producto:</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{productName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base (Mínimo)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                S/
              </span>
              <input
                type="number"
                value={basePrice.toFixed(2)}
                disabled
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Actual
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                S/
              </span>
              <input
                type="number"
                value={currentPrice.toFixed(2)}
                disabled
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nuevo Precio <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              S/
            </span>
            <input
              type="number"
              step="0.01"
              min={basePrice}
              value={newPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={`w-full pl-8 pr-3 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                error
                  ? 'border-red-500 focus:ring-red-200 focus:border-red-600'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'
              }`}
              placeholder="Ingresa el nuevo precio"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-start space-x-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Nota:</strong> El precio mínimo es S/ {basePrice.toFixed(2)}. Este cambio solo afectará esta venta.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!!error || newPrice === ''}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
          >
            <DollarSign size={16} />
            <span>Actualizar Precio</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditPriceModal;
