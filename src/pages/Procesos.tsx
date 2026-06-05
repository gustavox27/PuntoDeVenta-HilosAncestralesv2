import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, CheckCircle, RefreshCw, Hammer, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupabaseService } from '../services/supabaseService';
import { Programacion as ProgramacionType, Usuario } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';

interface ProcesosProps {
  currentUser: Usuario | null;
}

// ─── Asignar Modal ─────────────────────────────────────────────────────────────
const AsignarModal: React.FC<{
  prog: ProgramacionType;
  currentUser: Usuario | null;
  onDone: () => void;
  onClose: () => void;
}> = ({ prog, currentUser, onDone, onClose }) => {
  const [cantidad, setCantidad] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleAsignar = async () => {
    const cant = Number(cantidad);
    if (!cantidad || cant <= 0) { toast.error('Ingresa una cantidad válida'); return; }
    if (cant > prog.cantidad_pendiente) { toast.error(`Máximo: ${prog.cantidad_pendiente}`); return; }

    setGuardando(true);
    try {
      await SupabaseService.registrarAvanceTrabajador(prog.id, prog.color, cant, currentUser?.id || '');
      toast.success(`Avance de ${cant} ${prog.color} registrado`);
      onDone();
      onClose();
    } catch {
      toast.error('Error al registrar avance');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Hammer size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Registrar Avance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Color: <span className="font-semibold text-gray-700 dark:text-gray-300">{prog.color}</span>
              {prog.es_veteado && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  <Sparkles size={8} /> VETEADO
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">Pendiente por trabajar</span>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{prog.cantidad_pendiente}</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cantidad trabajada <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            min={1}
            max={prog.cantidad_pendiente}
            placeholder={`Máx: ${prog.cantidad_pendiente}`}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg font-bold text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 min-h-[44px] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={guardando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Completar Confirm ─────────────────────────────────────────────────────────
const CompletarConfirm: React.FC<{
  prog: ProgramacionType;
  currentUser: Usuario | null;
  onDone: () => void;
  onClose: () => void;
}> = ({ prog, currentUser, onDone, onClose }) => {
  const [guardando, setGuardando] = useState(false);

  const handleCompletar = async () => {
    setGuardando(true);
    try {
      await SupabaseService.registrarAvanceTrabajador(prog.id, prog.color, prog.cantidad_pendiente, currentUser?.id || '');
      toast.success(`¡${prog.color} completado! ${prog.cantidad_pendiente} unidades registradas.`);
      onDone();
      onClose();
    } catch {
      toast.error('Error al completar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Completar Pedido</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Color: {prog.color}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
          Se registrará que el trabajador completó las <span className="font-bold text-green-600">{prog.cantidad_pendiente} unidades</span> pendientes de color <span className="font-bold">{prog.color}</span>.
          {prog.es_veteado && (
            <span className="block mt-2 text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <Sparkles size={12} /> Este es un reproceso veteado. Al completar, aparecerá en Avance para envío especial al inventario.
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 min-h-[44px] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCompletar}
            disabled={guardando}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            {guardando ? 'Procesando...' : 'Completar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Procesos: React.FC<ProcesosProps> = ({ currentUser }) => {
  const [programacion, setProgramacion] = useState<ProgramacionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [asignandoProg, setAsignandoProg] = useState<ProgramacionType | null>(null);
  const [completandoProg, setCompletandoProg] = useState<ProgramacionType | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getProgramacion();
      const activos = data.filter(p => p.estado === 'EnProceso' || p.estado === 'Pendiente');
      setProgramacion(activos);
    } catch {
      toast.error('Error al cargar procesos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const colorDot = (color: string) => {
    const lc = color.toLowerCase();
    const map: Record<string, string> = {
      negro: '#111', blanco: '#f5f5f5', rojo: '#ef4444', azul: '#3b82f6',
      verde: '#22c55e', amarillo: '#eab308', naranja: '#f97316', rosa: '#ec4899',
      morado: '#a855f7', cafe: '#92400e', gris: '#6b7280',
    };
    for (const [key, val] of Object.entries(map)) {
      if (lc.includes(key)) return val;
    }
    return '#6b7280';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="space-y-5">
      {/* Header — TICKET-03: responsive layout ya existente */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Procesos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registra el avance de trabajo por color</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2.5 min-h-[44px] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {programacion.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Wrench size={56} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Sin trabajo pendiente</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No hay pedidos activos en programación.
          </p>
        </div>
      ) : (
        /* TICKET-03: grid responsive — 1 col mobile, 2 tablet, 3 desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programacion.map(p => {
            const pct = p.cantidad_total > 0 ? Math.round(((p.cantidad_total - p.cantidad_pendiente) / p.cantidad_total) * 100) : 0;
            const dot = colorDot(p.color);

            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Color band */}
                <div className="h-2" style={{ backgroundColor: dot }} />

                <div className="p-4 sm:p-5">
                  {/* Color indicator + veteado badge (TICKET-05) */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.color}</h3>
                        {p.es_veteado && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex-shrink-0">
                            <Sparkles size={9} /> VETEADO
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.estado === 'EnProceso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {p.estado === 'EnProceso' ? 'En Proceso' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{p.cantidad_total}</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Pendiente</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{p.cantidad_pendiente}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span>Progreso</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: dot }}
                      />
                    </div>
                  </div>

                  {/* Actions — TICKET-03: min-h-[44px] para touch-friendly */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAsignandoProg(p)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Hammer size={14} /> Asignar
                    </button>
                    <button
                      onClick={() => setCompletandoProg(p)}
                      className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Completar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {asignandoProg && (
        <AsignarModal
          prog={asignandoProg}
          currentUser={currentUser}
          onDone={loadData}
          onClose={() => setAsignandoProg(null)}
        />
      )}

      {completandoProg && (
        <CompletarConfirm
          prog={completandoProg}
          currentUser={currentUser}
          onDone={loadData}
          onClose={() => setCompletandoProg(null)}
        />
      )}
    </div>
  );
};

export default Procesos;
