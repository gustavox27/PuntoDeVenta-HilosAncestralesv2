import React, { useState } from 'react';
import { X, CreditCard as Edit2, CheckSquare, Square, Send, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseService } from '../../services/supabaseService';
import { NotaPedido, NotaPedidoDetalle, Usuario } from '../../types';

interface Props {
  nota: NotaPedido;
  currentUser: Usuario | null;
  onClose: () => void;
  onUpdated: () => void;
}

const estadoColor = (estado: string) => {
  if (estado === 'Asignado') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (estado === 'Enviado') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
};

const ResumenNotaModal: React.FC<Props> = ({ nota, currentUser, onClose, onUpdated }) => {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editColor, setEditColor] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [showConfirmProcesar, setShowConfirmProcesar] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const canManage = currentUser?.perfil === 'Administrador' || currentUser?.perfil === 'Vendedor';

  const detalles = nota.detalles || [];
  const pendientes = detalles.filter(d => d.estado === 'Pendiente');
  const enviados = detalles.filter(d => d.estado === 'Enviado' || d.estado === 'Asignado');

  const ordenados = [...pendientes, ...enviados];

  const toggleSeleccion = (id: string, estado: string) => {
    if (estado !== 'Pendiente') return;
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    const selectables = pendientes.map(d => d.id);
    if (seleccionados.size === selectables.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(selectables));
    }
  };

  const handleProcesar = async () => {
    if (seleccionados.size === 0) return;
    setProcesando(true);
    try {
      await SupabaseService.procesarDetallesAProgramacion(Array.from(seleccionados));
      toast.success(`${seleccionados.size} producto(s) enviados a Programación`);
      setSeleccionados(new Set());
      setShowConfirmProcesar(false);
      onUpdated();
      onClose();
    } catch {
      toast.error('Error al procesar');
    } finally {
      setProcesando(false);
    }
  };

  const iniciarEdicion = (d: NotaPedidoDetalle) => {
    setEditandoId(d.id);
    setEditColor(d.color);
    setEditCantidad(String(d.cantidad));
  };

  const guardarEdicion = async () => {
    if (!editandoId) return;
    if (!editColor.trim() || !editCantidad || Number(editCantidad) <= 0) {
      toast.error('Ingresa datos válidos');
      return;
    }
    setGuardandoEdit(true);
    try {
      await SupabaseService.updateNotaPedidoDetalle(editandoId, {
        color: editColor.trim(),
        cantidad: Number(editCantidad)
      });
      toast.success('Producto actualizado');
      setEditandoId(null);
      onUpdated();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setGuardandoEdit(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resumen de Nota</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Cliente: <span className="font-medium text-gray-700 dark:text-gray-300">{nota.cliente?.nombre || '—'}</span>
                  {' · '}
                  Fecha: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {nota.fecha_pedido ? new Date(nota.fecha_pedido + 'T12:00:00').toLocaleDateString('es-PE') : '—'}
                  </span>
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-4">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-5">
            {detalles.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">Sin productos en esta nota</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400 w-8">
                      {canManage && pendientes.length > 0 && (
                        <button onClick={toggleTodos} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {seleccionados.size === pendientes.length && pendientes.length > 0
                            ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
                            : <Square size={16} />
                          }
                        </button>
                      )}
                    </th>
                    <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400 pl-2">ID</th>
                    <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                    <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">Color</th>
                    <th className="text-right pb-2 font-medium text-gray-500 dark:text-gray-400">Cantidad</th>
                    <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                    <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400 w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenados.map((d, idx) => {
                    const isPendiente = d.estado === 'Pendiente';
                    const isGris = !isPendiente;
                    const isEditing = editandoId === d.id;
                    const isSelected = seleccionados.has(d.id);

                    return (
                      <tr
                        key={d.id}
                        className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${
                          isGris ? 'opacity-50' : isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                      >
                        <td className="py-2.5 w-8">
                          {canManage && isPendiente && (
                            <button onClick={() => toggleSeleccion(d.id, d.estado)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              {isSelected ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" /> : <Square size={16} />}
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 pl-2 text-gray-400 dark:text-gray-500 text-xs font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 text-gray-700 dark:text-gray-300">
                          {d.nombre_producto}
                        </td>
                        <td className="py-2.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editColor}
                              onChange={e => setEditColor(e.target.value)}
                              className="border border-blue-300 rounded px-2 py-1 text-xs w-24 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white font-medium">{d.color}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editCantidad}
                              onChange={e => setEditCantidad(e.target.value)}
                              min={1}
                              className="border border-blue-300 rounded px-2 py-1 text-xs w-20 text-right bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white font-medium">{d.cantidad}</span>
                          )}
                          {d.cantidad_asignada > 0 && !isEditing && (
                            <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                              ({d.cantidad_asignada} asig.)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(d.estado)}`}>
                            {d.estado}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          {canManage && isPendiente && (
                            isEditing ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={guardarEdicion}
                                  disabled={guardandoEdit}
                                  className="text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                  title="Guardar"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={() => setEditandoId(null)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => iniciarEdicion(d)}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button onClick={onClose} className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Floating Procesar Button */}
      {seleccionados.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setShowConfirmProcesar(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Send size={18} />
            Procesar {seleccionados.size} producto{seleccionados.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Confirm Procesar */}
      {showConfirmProcesar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Confirmar Envío</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción enviará los productos a Programación</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
              Se enviarán <span className="font-bold text-blue-600">{seleccionados.size} producto(s)</span> seleccionados al módulo de Programación. Los productos se marcarán como "Enviado" y no podrán editarse hasta ser asignados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmProcesar(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcesar}
                disabled={procesando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {procesando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResumenNotaModal;
