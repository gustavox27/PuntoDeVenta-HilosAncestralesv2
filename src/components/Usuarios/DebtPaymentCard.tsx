import React from 'react';
import { AlertCircle, DollarSign, HandCoins } from 'lucide-react';

interface DebtPaymentCardProps {
  deudaPendiente: number;
  saldoDisponible: number;
  onPayDebt: () => void;
  onShowDebtModal: () => void;
}

const DebtPaymentCard: React.FC<DebtPaymentCardProps> = ({
  deudaPendiente,
  saldoDisponible,
  onPayDebt,
  onShowDebtModal
}) => {
  const canPayDebt = saldoDisponible > 0;

  return (
    <div className="flex items-stretch gap-4">
      {deudaPendiente > 0 && (
        <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Deuda Pendiente</p>
                <p className="text-sm text-red-500 font-medium">Por Cobrar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-red-600">
                S/ {deudaPendiente.toFixed(2)}
              </p>
              <p className="text-xs text-red-500 mt-1 font-medium">Saldo negativo</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-xs text-red-700 font-medium mb-2">Estado: Pendiente de pago</p>
            <div className="flex items-center gap-2 text-xs text-red-600">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Anticipo disponible: S/ {saldoDisponible.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {deudaPendiente > 0 && canPayDebt && (
        <button
          onClick={onPayDebt}
          className="flex items-center justify-center gap-3 px-6 py-6 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
          title="Pagar deuda pendiente"
        >
          <HandCoins className="h-6 w-6" />
          <span className="text-center">
            Pagar
            <br />
            Deuda
          </span>
        </button>
      )}

      {deudaPendiente > 0 && !canPayDebt && (
        <div className="flex items-center justify-center px-6 py-6 bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 rounded-xl font-bold text-lg shadow-md border border-gray-200 opacity-60">
          <div className="text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <span className="text-sm">Sin saldo para pagar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtPaymentCard;
