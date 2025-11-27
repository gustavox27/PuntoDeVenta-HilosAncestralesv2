import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Calendar, Clock, ArrowDownLeft, ArrowUpRight, Wallet, Edit2, Trash2 } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';
import EditAdvancePaymentModal from './EditAdvancePaymentModal';
import DeleteAdvancePaymentModal from './DeleteAdvancePaymentModal';
import DebtPaymentCard from './DebtPaymentCard';
import DebtDetectionModal from '../Ventas/DebtDetectionModal';

interface MovementHistoryProps {
  usuarioId: string;
  usuarioNombre: string;
}

interface Movement {
  id: string;
  type: 'ingreso' | 'egreso';
  fecha: string;
  monto: number;
  descripcion: string;
  metodo_pago?: string;
  observaciones?: string;
  total_venta?: number;
  descuento?: number;
  venta_id?: string | null;
  subtype?: 'anticipo' | 'compra' | 'pago_efectivo';
  estado_pago?: 'completo' | 'pendiente';
  completada?: boolean;
  is_anticipo_used?: boolean;
}

interface HistoryData {
  movements: Movement[];
  saldoDisponible: number;
  deudaPendiente: number;
  totalIngreso: number;
  totalEgreso: number;
  totalAnticiposRegistrados: number;
  totalComprasCompletas: number;
  totalDeudasPendientes: number;
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ usuarioId, usuarioNombre }) => {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAdvance, setEditingAdvance] = useState<Movement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingAdvance, setDeletingAdvance] = useState<Movement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [isPayingDebt, setIsPayingDebt] = useState(false);

  useEffect(() => {
    loadMovementHistory();
  }, [usuarioId]);

  const loadMovementHistory = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getMovementHistory(usuarioId);
      setHistoryData(data);
    } catch (error) {
      console.error('Error loading movement history:', error);
      toast.error('Error al cargar el historial de movimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdvance = (movement: Movement) => {
    if (movement.type === 'ingreso' && !movement.is_anticipo_used) {
      setEditingAdvance(movement);
      setShowEditModal(true);
    }
  };

  const handleDeleteAdvance = (movement: Movement) => {
    if (movement.type === 'ingreso' && !movement.is_anticipo_used) {
      setDeletingAdvance(movement);
      setShowDeleteModal(true);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingAdvance(null);
    loadMovementHistory();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingAdvance(null);
    loadMovementHistory();
  };

  const handleOpenDebtModal = async () => {
    try {
      setLoading(true);
      const deudasCliente = await SupabaseService.obtenerDeudasCliente(usuarioId);
      setDeudas(deudasCliente);
      setShowDebtModal(true);
    } catch (error) {
      console.error('Error loading debts:', error);
      toast.error('Error al cargar las deudas');
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = async (ventasIds: string[]) => {
    if (!historyData || historyData.saldoDisponible <= 0) {
      toast.error('No hay saldo disponible para pagar deudas');
      return;
    }

    try {
      setIsPayingDebt(true);
      await SupabaseService.aplicarAnticipoADeudas(
        usuarioId,
        'sistema',
        historyData.saldoDisponible,
        ventasIds,
        'Sistema'
      );
      toast.success('Deudas pagadas correctamente');
      setShowDebtModal(false);
      await loadMovementHistory();
    } catch (error) {
      console.error('Error paying debt:', error);
      toast.error('Error al pagar las deudas');
    } finally {
      setIsPayingDebt(false);
    }
  };

  const formatLocalDateTime = (dateString: string) => {
    const date = new Date(dateString);

    const dateFormatted = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const timeFormatted = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return { dateFormatted, timeFormatted };
  };

  if (loading) return <LoadingSpinner />;

  if (!historyData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Saldo Disponible</p>
                <p className="text-sm text-blue-500 font-medium">{usuarioNombre}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                S/ {historyData.saldoDisponible.toFixed(2)}
              </p>
              <div className="flex items-center justify-end space-x-3 mt-2 text-xs font-semibold">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">+S/ {historyData.totalIngreso.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">-S/ {historyData.totalEgreso.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {historyData.deudaPendiente > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Deuda Pendiente</p>
                  <p className="text-sm text-red-500 font-medium">Por Cobrar</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-red-600">
                  S/ {historyData.deudaPendiente.toFixed(2)}
                </p>
                <button
                  onClick={handleOpenDebtModal}
                  disabled={historyData.saldoDisponible <= 0 || loading}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold transition-colors ${
                    historyData.saldoDisponible > 0
                      ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  title={historyData.saldoDisponible > 0 ? 'Pagar deuda' : 'Sin saldo disponible'}
                >
                  Pagar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Movimientos</h3>

        {historyData.movements.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <DollarSign className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">Sin movimientos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Los movimientos aparecerán aquí cuando se registren anticipos o compras</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {historyData.movements.map((movement, index) => {
              const { dateFormatted, timeFormatted } = formatLocalDateTime(movement.fecha);
              const isIngreso = movement.type === 'ingreso';
              const isPagoEfectivo = movement.subtype === 'pago_efectivo';
              const isCompra = movement.subtype === 'compra';
              const isAnticipo = movement.subtype === 'anticipo';
              const canEdit = isAnticipo && !movement.is_anticipo_used;
              const canDelete = isAnticipo && !movement.is_anticipo_used;

              let bgColor = 'bg-gray-50';
              let iconBg = 'bg-gray-100';
              let iconColor = 'text-gray-600';
              let textColor = 'text-gray-700';
              let amountColor = 'text-gray-600';

              if (isPagoEfectivo) {
                bgColor = 'bg-blue-50';
                iconBg = 'bg-blue-100';
                iconColor = 'text-blue-600';
                textColor = 'text-blue-700';
                amountColor = 'text-blue-600';
              } else if (isCompra) {
                bgColor = 'bg-red-50';
                iconBg = 'bg-red-100';
                iconColor = 'text-red-600';
                textColor = 'text-red-700';
                amountColor = 'text-red-600';
              } else if (isAnticipo) {
                bgColor = 'bg-green-50';
                iconBg = 'bg-green-100';
                iconColor = 'text-green-600';
                textColor = 'text-green-700';
                amountColor = 'text-green-600';
              }

              return (
                <div
                  key={`${movement.id}-${index}`}
                  className={`${bgColor} rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                      {isIngreso ? (
                        <ArrowUpRight className={`h-4 w-4 ${iconColor}`} />
                      ) : (
                        <ArrowDownLeft className={`h-4 w-4 ${iconColor}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${textColor}`}>
                          {isPagoEfectivo ? 'Pago Completado' : movement.descripcion}
                        </span>
                        {isCompra && movement.estado_pago === 'pendiente' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            Pendiente
                          </span>
                        )}
                        {movement.metodo_pago && !isPagoEfectivo && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {movement.metodo_pago}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {dateFormatted} {timeFormatted}
                        </span>
                      </div>
                      {movement.observaciones && !movement.observaciones.includes('Saldo remanente') && (
                        <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                          "{movement.observaciones}"
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${amountColor}`}>
                        {isIngreso ? '+' : '-'}S/ {movement.monto.toFixed(2)}
                      </p>
                    </div>

                    {isAnticipo && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditAdvance(movement)}
                          disabled={!canEdit}
                          className={`p-1.5 rounded transition-colors ${
                            canEdit
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={canEdit ? 'Editar anticipo' : 'No se puede editar: anticipo ya fue utilizado'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdvance(movement)}
                          disabled={!canDelete}
                          className={`p-1.5 rounded transition-colors ${
                            canDelete
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={canDelete ? 'Eliminar anticipo' : 'No se puede eliminar: anticipo ya fue utilizado'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600">S/ {historyData.totalIngreso.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
          <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Total Egresos</p>
          <p className="text-2xl font-bold text-red-600">S/ {historyData.totalEgreso.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Movimientos</p>
          <p className="text-2xl font-bold text-blue-600">{historyData.movements.length}</p>
        </div>
      </div>

      {editingAdvance && (
        <EditAdvancePaymentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAdvance(null);
          }}
          advance={editingAdvance}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingAdvance && (
        <DeleteAdvancePaymentModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingAdvance(null);
          }}
          advance={deletingAdvance}
          onSuccess={handleDeleteSuccess}
          currentBalance={historyData?.saldoDisponible || 0}
        />
      )}

      <DebtDetectionModal
        isOpen={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        cliente={{ id: usuarioId, nombre: usuarioNombre }}
        deudas={deudas}
        montoAnticipo={historyData?.saldoDisponible || 0}
        onConfirm={handlePayDebt}
        onSkip={() => setShowDebtModal(false)}
        loading={isPayingDebt}
      />
    </div>
  );
};

export default MovementHistory;
