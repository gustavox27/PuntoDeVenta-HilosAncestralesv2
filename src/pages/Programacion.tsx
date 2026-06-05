import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Filter, X, Users, CheckCircle, Clock, AlertCircle, XCircle, RefreshCw, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseService } from '../services/supabaseService';
import { Programacion as ProgramacionType } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ESTADO_CONFIG = {
  Completado: { label: 'Completado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', rowBg: 'bg-green-50/50 dark:bg-green-900/10' },
  EnProceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500', rowBg: '' },
  Pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', rowBg: 'bg-amber-50/50 dark:bg-amber-900/10' },
  Cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', rowBg: 'bg-red-50/50 dark:bg-red-900/10' },
} as const;

const EstadoBadge: React.FC<{ estado: ProgramacionType['estado'] }> = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.EnProceso;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Modal Procesar Producto (Conos Veteados) ────────────────────────────────
const ProcesarProductoModal: React.FC<{
  onCreated: () => void;
  onClose: () => void;
}> = ({ onCreated, onClose }) => {
  const [color, setColor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!color.trim() || !cantidad || Number(cantidad) <= 0) {
      toast.error('Color y cantidad son requeridos');
      return;
    }
    setGuardando(true);
    try {
      await SupabaseService.createReprocesoProgramacion({
        color: color.trim(),
        cantidad: Number(cantidad),
        descripcion: descripcion.trim() || undefined,
      });
      toast.success(`Reproceso veteado creado: ${cantidad} uds de ${color}`);
      onCreated();
      onClose();
    } catch {
      toast.error('Error al crear el reproceso');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Procesar Producto</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Reproceso — Conos Veteados</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={color}
              onChange={e => setColor(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              placeholder="Ej. NEGRO, AZUL..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="Cantidad a procesar"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Observaciones del reproceso..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {guardando ? 'Creando...' : 'Crear Reproceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Programacion: React.FC = () => {
  const [programacion, setProgramacion] = useState<ProgramacionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroColor, setFiltroColor] = useState('');
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [showProcesarModal, setShowProcesarModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getProgramacionConUsuarios();
      setProgramacion(data);
    } catch {
      toast.error('Error al cargar programación');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCambiarEstado = async (id: string, estado: ProgramacionType['estado']) => {
    setActualizandoId(id);
    try {
      await SupabaseService.updateProgramacionEstado(id, estado);
      toast.success(`Estado actualizado a: ${ESTADO_CONFIG[estado].label}`);
      await loadData();
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setActualizandoId(null);
    }
  };

  const filtered = programacion.filter(p => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (filtroColor && !p.color.toLowerCase().includes(filtroColor.toLowerCase())) return false;
    return true;
  });

  const formatFecha = (f?: string) => {
    if (!f) return 'No registrado';
    return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const progresoPct = (p: ProgramacionType) => {
    if (p.cantidad_total === 0) return 0;
    return Math.round(((p.cantidad_total - p.cantidad_pendiente) / p.cantidad_total) * 100);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <CalendarClock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programación</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pedidos de tintorería agrupados por color</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* TICKET-05: botón Procesar Producto */}
          <button
            onClick={() => setShowProcesarModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Sparkles size={15} /> Procesar Producto
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ESTADO_CONFIG).map(([estado, cfg]) => {
          const count = programacion.filter(p => p.estado === estado).length;
          return (
            <button
              key={estado}
              onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
              className={`bg-white dark:bg-gray-800 border rounded-xl p-4 text-left transition-all hover:shadow-md ${
                filtroEstado === estado
                  ? 'border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${cfg.color.split(' ')[1]}`}>{cfg.label}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por color..."
              value={filtroColor}
              onChange={e => setFiltroColor(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="EnProceso">En Proceso</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          {(filtroColor || filtroEstado) && (
            <button
              onClick={() => { setFiltroColor(''); setFiltroEstado(''); }}
              className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 px-2"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CalendarClock size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Sin registros en programación</p>
          <p className="text-sm text-gray-400 mt-1">Los pedidos aparecen aquí cuando se procesan desde "Notas de Pedido"</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Color</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Pendiente</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Progreso</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Usuarios</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Fecha Envío</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Fecha Completado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Cambiar Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.EnProceso;
                  const pct = progresoPct(p);
                  return (
                    <tr key={p.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${cfg.rowBg}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{p.color}</span>
                          {/* TICKET-05: badge veteado */}
                          {p.es_veteado && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              <Sparkles size={9} /> VETEADO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {p.cantidad_total}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={p.cantidad_pendiente > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                          {p.cantidad_pendiente}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                          <Users size={13} />
                          <span>{p.usuarios_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {formatFecha(p.fecha_envio)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={p.fecha_completado ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {formatFecha(p.fecha_completado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <EstadoBadge estado={p.estado} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {actualizandoId === p.id ? (
                          <div className="flex justify-center"><LoadingSpinner /></div>
                        ) : (
                          <select
                            value={p.estado}
                            onChange={e => handleCambiarEstado(p.id, e.target.value as ProgramacionType['estado'])}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="EnProceso">En Proceso</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showProcesarModal && (
        <ProcesarProductoModal
          onCreated={loadData}
          onClose={() => setShowProcesarModal(false)}
        />
      )}
    </div>
  );
};

export default Programacion;
