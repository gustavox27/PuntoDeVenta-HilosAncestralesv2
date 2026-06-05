import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, Package, CalendarClock, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseService } from '../../services/supabaseService';
import { NotaPedido } from '../../types';
import LoadingSpinner from '../Common/LoadingSpinner';

interface Props {
  nota: NotaPedido;
  onClose: () => void;
  onDeleted: () => void;
}

const ESTADO_LABEL: Record<string, string> = {
  Pendiente: 'Pendiente',
  EnProceso: 'En Proceso',
  Completado: 'Completado',
  Cancelado: 'Cancelado',
};

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EnProceso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Cancelado: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const DeleteNotaModal: React.FC<Props> = ({ nota, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await SupabaseService.getNotaDeletePreview(nota.id);
        setPreview(data);
      } catch {
        toast.error('Error al cargar información de la nota');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nota.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await SupabaseService.deleteNotaPedido(nota.id);
      toast.success('Nota de pedido eliminada correctamente');
      onDeleted();
      onClose();
    } catch {
      toast.error('Error al eliminar la nota de pedido');
    } finally {
      setDeleting(false);
    }
  };

  const clienteNombre = nota.cliente?.nombre || 'Cliente eliminado';
  const fechaFormato = nota.fecha_pedido
    ? new Date(nota.fecha_pedido + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" style={{ zIndex: 300 }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Eliminar Nota de Pedido</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {clienteNombre} &middot; {fechaFormato}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10"><LoadingSpinner /></div>
          ) : !preview ? null : preview.hasImpact ? (
            <>
              {/* Warning */}
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Esta nota tiene productos en proceso</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Al eliminar esta nota se removerán los productos de los módulos de
                    <strong> Notas de Pedido</strong>, <strong>Programación</strong> y <strong>Procesos</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <Package size={18} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Productos</p>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{preview.detalles.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <CalendarClock size={18} className="text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Programaciones</p>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{preview.programaciones.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <Wrench size={18} className="text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avances</p>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{preview.avances.length}</p>
                </div>
              </div>

              {/* Expandable detail */}
              {preview.programaciones.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>Ver detalle de programaciones afectadas</span>
                    {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showDetails && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Color</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Total</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Pendiente</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.programaciones.map((prog: any) => (
                            <tr key={prog.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="px-4 py-2.5 text-gray-900 dark:text-white font-medium">{prog.color}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">{prog.cantidad_total}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">{prog.cantidad_pendiente}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[prog.estado] || ESTADO_COLOR.Pendiente}`}>
                                  {ESTADO_LABEL[prog.estado] || prog.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Simple warning — no downstream impact */
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Confirmar eliminación</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Esta nota no tiene productos enviados a Programación. Se eliminará únicamente del módulo de Notas de Pedido. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {deleting ? (
                'Eliminando...'
              ) : (
                <><Trash2 size={15} /> {preview?.hasImpact ? 'Eliminar de los 3 módulos' : 'Eliminar nota'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteNotaModal;
