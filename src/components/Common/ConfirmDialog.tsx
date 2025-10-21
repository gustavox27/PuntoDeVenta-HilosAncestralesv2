import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const currentStyle = typeStyles[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:rounded-2xl">
          <div className="flex items-start space-x-2 sm:space-x-4">
            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${currentStyle.iconBg}`}>
              <AlertTriangle className={currentStyle.icon} size={20} />
            </div>

            <div className="flex-1 pt-0.5 sm:pt-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex justify-end space-x-2 sm:space-x-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${currentStyle.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
