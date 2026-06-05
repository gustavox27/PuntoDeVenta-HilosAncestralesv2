import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Users, Check, AlertTriangle, Package, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseService } from '../../services/supabaseService';
import { Avance, Usuario } from '../../types';
import LoadingSpinner from '../Common/LoadingSpinner';

interface Props {
  currentUser: Usuario | null;
  onClose: () => void;
}

interface ClientePendiente {
  nota_detalle_id: string;
  cantidad_solicitada: number;
  cantidad_total: number;
  cantidad_asignada: number;
  color: string;
  cliente_id?: string;
  cliente_nombre?: string;
  nota_id?: string;
}

interface VeteadoItem {
  programacion_id: string;
  color: string;
  cantidadOriginal: number;
}

const AvanceModal: React.FC<Props> = ({ currentUser, onClose }) => {
  const [avances, setAvances] = useState<Avance[]>([]);
  const [avancesVeteados, setAvancesVeteados] = useState<VeteadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [clientesPendientes, setClientesPendientes] = useState<ClientePendiente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showAsignarConfirm, setShowAsignarConfirm] = useState<ClientePendiente | null>(null);
  const [cantidadAsignar, setCantidadAsignar] = useState('');
  const [tipoProducto, setTipoProducto] = useState<'Crudas' | 'Reteñidas'>('Crudas');
  const [descripcion, setDescripcion] = useState('');
  const [asignando, setAsignando] = useState(false);

  // Estado para envío de veteados (TICKET-05)
  const [showVeteadoConfirm, setShowVeteadoConfirm] = useState<VeteadoItem | null>(null);
  const [enviandoVeteado, setEnviandoVeteado] = useState(false);

  const loadAvances = async () => {
    try {
      setLoading(true);
      // TICKET-B / TICKET-BUG: cargar avances y mapa de cantidades pendientes en paralelo.
      // coloresPendientes: Map<color, total_solicitado_por_clientes_pendientes>
      const [data, coloresPendientes] = await Promise.all([
        SupabaseService.getAvanceDisponible(),
        SupabaseService.getColoresConClientesPendientes(),
      ]);

      // Separar veteados completados de avances regulares
      const veteados = data.filter(
        av => av.programacion?.es_veteado === true && av.programacion?.estado === 'Completado'
      );
      const regulares = data.filter(
        av => !(av.programacion?.es_veteado === true && av.programacion?.estado === 'Completado')
      );

      // Suma de avances por color, solo para colores con clientes pendientes (TICKET-B)
      const grouped = new Map<string, number>();
      regulares.forEach(av => {
        if (coloresPendientes.has(av.color)) {
          grouped.set(av.color, (grouped.get(av.color) || 0) + av.cantidad_disponible);
        }
      });

      // TICKET-BUG: cap de "Trabajadas" = min(avance_total, cantidad_pendiente_clientes).
      // Evita mostrar acumulaciones históricas cuando el avance supera la demanda real.
      const agrupado = Array.from(grouped.entries()).map(([color, avanceTotal]) => ({
        id: color,
        color,
        cantidad_disponible: Math.min(avanceTotal, coloresPendientes.get(color) ?? avanceTotal),
      } as Avance));
      setAvances(agrupado);

      // Agrupar veteados por programacion_id
      const vMap = new Map<string, VeteadoItem>();
      veteados.forEach(av => {
        if (!av.programacion_id) return;
        if (vMap.has(av.programacion_id)) {
          vMap.get(av.programacion_id)!.cantidadOriginal += av.cantidad_disponible;
        } else {
          vMap.set(av.programacion_id, {
            programacion_id: av.programacion_id,
            color: av.color,
            cantidadOriginal: av.cantidad_disponible,
          });
        }
      });
      setAvancesVeteados(Array.from(vMap.values()));
    } catch {
      toast.error('Error al cargar avances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAvances(); }, []);

  const handleAsignarColor = async (color: string) => {
    setSelectedColor(color);
    setLoadingClientes(true);
    try {
      const clientes = await SupabaseService.getClientesConColorPendiente(color);
      setClientesPendientes(clientes);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const openConfirmAsignar = (cp: ClientePendiente) => {
    setCantidadAsignar(String(cp.cantidad_solicitada));
    setTipoProducto('Crudas');
    setDescripcion('');
    setShowAsignarConfirm(cp);
  };

  const handleConfirmarAsignacion = async () => {
    if (!showAsignarConfirm || !cantidadAsignar || Number(cantidadAsignar) <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    const disponibleColor = avances.find(a => a.color === showAsignarConfirm.color)?.cantidad_disponible || 0;
    if (Number(cantidadAsignar) > disponibleColor) {
      toast.error(`Cantidad máxima disponible: ${disponibleColor}`);
      return;
    }
    if (Number(cantidadAsignar) > showAsignarConfirm.cantidad_solicitada) {
      toast.error(`Cantidad máxima para este cliente: ${showAsignarConfirm.cantidad_solicitada}`);
      return;
    }

    setAsignando(true);
    try {
      await SupabaseService.asignarAvanceACliente({
        color: showAsignarConfirm.color,
        cantidad: Number(cantidadAsignar),
        nota_detalle_id: showAsignarConfirm.nota_detalle_id,
        tipo_producto: tipoProducto,
        descripcion,
        asignado_por_id: currentUser?.id
      });
      toast.success('Producto enviado al inventario');
      setShowAsignarConfirm(null);
      setSelectedColor(null);
      await loadAvances();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar');
    } finally {
      setAsignando(false);
    }
  };

  // TICKET-05 — envío directo de veteados al inventario
  const handleConfirmarVeteado = async () => {
    if (!showVeteadoConfirm) return;
    setEnviandoVeteado(true);
    try {
      await SupabaseService.enviarVeteadoAInventario({
        color: showVeteadoConfirm.color,
        cantidadOriginal: showVeteadoConfirm.cantidadOriginal,
        programacionId: showVeteadoConfirm.programacion_id,
      });
      toast.success(`Conos veteados enviados: ${showVeteadoConfirm.cantidadOriginal * 2} uds de ${showVeteadoConfirm.color}`);
      setShowVeteadoConfirm(null);
      await loadAvances();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar al inventario');
    } finally {
      setEnviandoVeteado(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Avance</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inventario de productos trabajados</p>
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
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : (
              <>
                {/* Banner de veteados pendientes (TICKET-05) */}
                {avancesVeteados.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Conos veteados procesados — pendientes de envío al inventario
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-purple-200 dark:border-purple-700">
                          <th className="text-left pb-2 font-medium text-purple-600 dark:text-purple-400">Color</th>
                          <th className="text-right pb-2 font-medium text-purple-600 dark:text-purple-400">Cant. orig.</th>
                          <th className="text-right pb-2 font-medium text-purple-600 dark:text-purple-400">→ Inventario</th>
                          <th className="text-center pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {avancesVeteados.map(v => (
                          <tr key={v.programacion_id} className="border-b border-purple-100 dark:border-purple-800">
                            <td className="py-2 font-medium text-gray-900 dark:text-white">{v.color}</td>
                            <td className="py-2 text-right text-gray-700 dark:text-gray-300">{v.cantidadOriginal}</td>
                            <td className="py-2 text-right font-bold text-purple-700 dark:text-purple-300">{v.cantidadOriginal * 2}</td>
                            <td className="py-2 text-center">
                              <button
                                onClick={() => setShowVeteadoConfirm(v)}
                                disabled={enviandoVeteado}
                                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mx-auto"
                              >
                                <Package size={12} /> Enviar a Inventario
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Avances regulares */}
                {avances.length === 0 && avancesVeteados.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Sin avances disponibles</p>
                    <p className="text-xs text-gray-400 mt-1">Los trabajadores deben registrar avances en el módulo Procesos</p>
                  </div>
                ) : avances.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">Color</th>
                        <th className="text-right pb-2 font-medium text-gray-500 dark:text-gray-400">Trabajadas</th>
                        <th className="text-right pb-2 font-medium text-green-600 dark:text-green-400">→ Inventario (×2)</th>
                        <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {avances.map(av => (
                        <tr key={av.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="py-3 text-gray-900 dark:text-white font-medium">{av.color}</td>
                          <td className="py-3 text-right text-gray-600 dark:text-gray-400">{av.cantidad_disponible}</td>
                          <td className="py-3 text-right font-bold text-green-700 dark:text-green-400 text-base">{av.cantidad_disponible * 2}</td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleAsignarColor(av.color)}
                              disabled={asignando}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mx-auto"
                            >
                              <Users size={12} /> Asignar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button onClick={onClose} className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Clientes pendientes modal */}
      {selectedColor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Clientes - Color {selectedColor}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Selecciona a quién asignar</p>
                </div>
                <button onClick={() => setSelectedColor(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingClientes ? (
                <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
              ) : clientesPendientes.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay clientes con este color pendiente</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                      <th className="text-right pb-2 font-medium text-gray-500 dark:text-gray-400">Pendiente</th>
                      <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesPendientes.map(cp => (
                      <tr key={cp.nota_detalle_id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 text-gray-900 dark:text-white font-medium">{cp.cliente_nombre}</td>
                        <td className="py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{cp.cantidad_solicitada}</td>
                        <td className="py-3 text-center">
                          {/* TICKET-04: disabled mientras hay una operación en curso */}
                          <button
                            onClick={() => openConfirmAsignar(cp)}
                            disabled={asignando}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Asignar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button onClick={() => setSelectedColor(null)} className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Asignar */}
      {showAsignarConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 300 }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Confirmar Asignación</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cliente: {showAsignarConfirm.cliente_nombre}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Color: <span className="font-bold text-gray-900 dark:text-white">{showAsignarConfirm.color}</span>
              {' · '}Disponible: <span className="font-bold text-gray-900 dark:text-white">
                {avances.find(a => a.color === showAsignarConfirm.color)?.cantidad_disponible || 0}
              </span>
            </p>

            {/* Preview cantidad × 2 */}
            {cantidadAsignar && Number(cantidadAsignar) > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                <span className="text-xs text-green-700 dark:text-green-400">Madejas que llegarán al inventario:</span>
                <span className="font-bold text-green-700 dark:text-green-400">{Number(cantidadAsignar) * 2} (×2)</span>
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cantidad a asignar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={cantidadAsignar}
                  onChange={e => setCantidadAsignar(e.target.value)}
                  min={1}
                  max={Math.min(
                    showAsignarConfirm.cantidad_solicitada,
                    avances.find(a => a.color === showAsignarConfirm.color)?.cantidad_disponible || 0
                  )}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo de producto</label>
                <select
                  value={tipoProducto}
                  onChange={e => setTipoProducto(e.target.value as 'Crudas' | 'Reteñidas')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Crudas">Madejas Crudas</option>
                  <option value="Reteñidas">Madejas Reteñidas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción (opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  rows={2}
                  placeholder="Observaciones..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAsignarConfirm(null)}
                disabled={asignando}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAsignacion}
                disabled={asignando}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                {asignando ? 'Asignando...' : (<><Check size={14} /> Confirmar</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Veteado — TICKET-05 */}
      {showVeteadoConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 300 }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Enviar Veteado a Inventario</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Color: {showVeteadoConfirm.color}</p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cantidad procesada:</span>
                <span className="font-bold text-gray-900 dark:text-white">{showVeteadoConfirm.cantidadOriginal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">Cantidad en inventario (× 2):</span>
                <span className="font-bold text-xl text-purple-700 dark:text-purple-300">{showVeteadoConfirm.cantidadOriginal * 2}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Se creará un producto <strong>Madejas Reteñidas</strong> con estado <strong>Por Devanar</strong> y <strong>{showVeteadoConfirm.cantidadOriginal * 2} madejas</strong>.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowVeteadoConfirm(null)}
                disabled={enviandoVeteado}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarVeteado}
                disabled={enviandoVeteado}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                {enviandoVeteado ? 'Enviando...' : (<><Check size={14} /> Confirmar</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvanceModal;
