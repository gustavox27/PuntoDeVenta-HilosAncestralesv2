import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, TrendingUp, Search, X, User, Calendar, Package, Check, CreditCard as Edit2, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle, Eye, Filter, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { SupabaseService } from '../services/supabaseService';
import { NotaPedido, NotaPedidoDetalle, Usuario, Anticipo } from '../types';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AnticipoInicialModal from '../components/Ventas/AnticipoInicialModal';
import AnticipoConfirmModal from '../components/Ventas/AnticipoConfirmModal';
// Note: These anticipo modals are reused from Ventas with their original signatures
import ResumenNotaModal from '../components/NotasPedido/ResumenNotaModal';
import AvanceModal from '../components/NotasPedido/AvanceModal';
import DeleteNotaModal from '../components/NotasPedido/DeleteNotaModal';

interface NotasPedidoProps {
  currentUser: Usuario | null;
}

// ─── Sortable Card ───────────────────────────────────────────────────────────
interface SortableCardProps {
  nota: NotaPedido;
  onCardClick: (nota: NotaPedido) => void;
  onDeleteClick: (nota: NotaPedido) => void;
  isDragging?: boolean;
  canManage: boolean;
}

const NotaCard: React.FC<{ nota: NotaPedido; onCardClick: (nota: NotaPedido) => void; onDeleteClick: (nota: NotaPedido) => void; isDragging?: boolean; canManage: boolean }> = ({ nota, onCardClick, onDeleteClick, isDragging, canManage }) => {
  const totalCantidad = nota.detalles?.reduce((s, d) => s + d.cantidad, 0) || 0;
  const pendientes = nota.detalles?.filter(d => d.estado === 'Pendiente').length || 0;
  const enviados = nota.detalles?.filter(d => d.estado === 'Enviado').length || 0;
  const asignados = nota.detalles?.filter(d => d.estado === 'Asignado').length || 0;
  const total = nota.detalles?.length || 0;

  const fechaFormato = nota.fecha_pedido
    ? new Date(nota.fecha_pedido + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div
      onClick={() => !isDragging && onCardClick(nota)}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 cursor-pointer
        hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600
        transition-all duration-200 select-none
        ${isDragging ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
            {nota.cliente?.nombre || 'Cliente eliminado'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Vendedor: {nota.vendedor?.nombre || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            nota.estado === 'Terminado'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {nota.estado}
          </span>
          {canManage && (
            <button
              onClick={e => { e.stopPropagation(); onDeleteClick(nota); }}
              className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-0.5 rounded"
              title="Eliminar nota"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
          <Package size={14} className="text-blue-500" />
          <span className="font-medium">{totalCantidad}</span>
          <span className="text-gray-400">unidades</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
          <Calendar size={14} className="text-green-500" />
          <span>{fechaFormato}</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {pendientes > 0 && (
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
            {pendientes} pendiente{pendientes > 1 ? 's' : ''}
          </span>
        )}
        {enviados > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
            {enviados} en proceso
          </span>
        )}
        {asignados > 0 && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
            {asignados}/{total} completado{asignados > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: total > 0 ? `${(asignados / total) * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
};

const SortableNotaCard: React.FC<SortableCardProps> = ({ nota, onCardClick, onDeleteClick, canManage }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: nota.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NotaCard nota={nota} onCardClick={onCardClick} onDeleteClick={onDeleteClick} isDragging={isDragging} canManage={canManage} />
    </div>
  );
};

// ─── Agregar Producto Modal ───────────────────────────────────────────────────
interface ProductoTemp { color: string; cantidad: number }

const AgregarProductosModal: React.FC<{
  onConfirm: (productos: ProductoTemp[]) => void;
  onClose: () => void;
}> = ({ onConfirm, onClose }) => {
  const [color, setColor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [lista, setLista] = useState<ProductoTemp[]>([]);

  const handleAgregar = () => {
    if (!color.trim() || !cantidad || Number(cantidad) <= 0) {
      toast.error('Ingresa color y cantidad válidos');
      return;
    }
    setLista(prev => [...prev, { color: color.trim(), cantidad: Number(cantidad) }]);
    setColor('');
    setCantidad('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agregar Productos</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Color"
              value={color}
              onChange={e => setColor(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleAgregar()}
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              min={1}
              className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleAgregar()}
            />
            <button
              onClick={handleAgregar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>

          {lista.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Color</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Cantidad</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{item.color}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">{item.cantidad}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setLista(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => {
                if (lista.length === 0) { toast.error('Agrega al menos un producto'); return; }
                onConfirm(lista);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Finalizar ({lista.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Seleccionar Cliente Modal ────────────────────────────────────────────────
const SeleccionarClienteModal: React.FC<{
  usuarios: Usuario[];
  onSelect: (u: Usuario) => void;
  onClose: () => void;
}> = ({ usuarios, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const clientes = usuarios.filter(u => u.perfil === 'Cliente' &&
    (u.nombre.toLowerCase().includes(search.toLowerCase()) || u.dni.includes(search))
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Seleccionar Cliente</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {clientes.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No se encontraron clientes</p>
          ) : (
            clientes.map(u => (
              <div
                key={u.id}
                onDoubleClick={() => { onSelect(u); onClose(); }}
                onClick={() => { onSelect(u); onClose(); }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{u.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">DNI: {u.dni}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Generar Nota Modal ───────────────────────────────────────────────────────
const GenerarNotaModal: React.FC<{
  usuarios: Usuario[];
  currentUser: Usuario | null;
  onCreated: () => void;
  onClose: () => void;
}> = ({ usuarios, currentUser, onCreated, onClose }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split('T')[0]);
  const [productosLista, setProductosLista] = useState<{ color: string; cantidad: number }[]>([]);
  const [showSeleccionarCliente, setShowSeleccionarCliente] = useState(false);
  const [showAgregarProductos, setShowAgregarProductos] = useState(false);
  const [showAnticipoInicial, setShowAnticipoInicial] = useState(false);
  const [showAnticipoConfirm, setShowAnticipoConfirm] = useState(false);
  const [anticipoVinculado, setAnticipoVinculado] = useState<Anticipo | null>(null);
  const [montoDisponibleCliente, setMontoDisponibleCliente] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const handleAnticipoLupa = async () => {
    if (!clienteSeleccionado) { toast.error('Selecciona un cliente primero'); return; }
    try {
      const historyData = await SupabaseService.getMovementHistory(clienteSeleccionado.id);
      const totalDisponible = historyData.saldoDisponible;

      if (totalDisponible > 0) {
        // Get the last unused anticipo amount — same logic as Ventas module
        const anticiposSinVenta = historyData.movements.filter(
          (m: any) => m.subtype === 'anticipo' && !m.is_anticipo_used
        );
        const ultimoAnticipo = anticiposSinVenta.length > 0 ? anticiposSinVenta[0] : null;
        const montoUltimoAnticipo = ultimoAnticipo ? ultimoAnticipo.monto : 0;

        // Store with the key AnticipoConfirmModal expects
        sessionStorage.setItem(`ultimoAnticipo_${clienteSeleccionado.id}`, String(montoUltimoAnticipo));
        setMontoDisponibleCliente(totalDisponible);
        setShowAnticipoConfirm(true);
      } else {
        setShowAnticipoInicial(true);
      }
    } catch {
      toast.error('Error al verificar anticipos');
    }
  };

  const handleAnticipoRegistrado = async (data: { monto: number; metodo_pago: string; fecha_anticipo: string; observaciones?: string }) => {
    if (!clienteSeleccionado) return;
    try {
      const anticipo = await SupabaseService.createAnticipo({
        cliente_id: clienteSeleccionado.id,
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        fecha_anticipo: data.fecha_anticipo,
        observaciones: data.observaciones
      });
      setAnticipoVinculado(anticipo);
      setShowAnticipoInicial(false);
      toast.success(`Anticipo de S/ ${data.monto} registrado`);
    } catch {
      toast.error('Error al registrar anticipo');
    }
  };

  const handleGenerarNota = async () => {
    if (!clienteSeleccionado) { toast.error('Selecciona un cliente'); return; }
    if (productosLista.length === 0) { toast.error('Agrega al menos un producto'); return; }

    setGuardando(true);
    try {
      await SupabaseService.createNotaPedido(
        {
          cliente_id: clienteSeleccionado.id,
          vendedor_id: currentUser?.id,
          fecha_pedido: fechaPedido,
          anticipo_id: anticipoVinculado?.id
        },
        productosLista
      );
      toast.success('Nota de pedido creada exitosamente');
      onCreated();
      onClose();
    } catch {
      toast.error('Error al crear la nota de pedido');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Nota de Pedido</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Cliente */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre del Cliente
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={clienteSeleccionado?.nombre || ''}
                  placeholder="Seleccionar cliente..."
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                />
                <button
                  onClick={() => setShowSeleccionarCliente(true)}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2.5 rounded-lg transition-colors"
                  title="Seleccionar cliente"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Fecha */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fecha de Pedido
              </label>
              <input
                type="date"
                value={fechaPedido}
                onChange={e => setFechaPedido(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Productos */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Productos
                </label>
                <button
                  onClick={() => setShowAgregarProductos(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus size={13} /> Agregar
                </button>
              </div>

              {productosLista.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Color</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Cantidad</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosLista.map((p, i) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="px-3 py-2 text-gray-900 dark:text-white">{p.color}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{p.cantidad}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => setProductosLista(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-6 text-center">
                  <Package size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sin productos</p>
                </div>
              )}
            </div>

            {/* Anticipo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Anticipo
              </label>
              <div className="flex gap-2 items-center">
                {anticipoVinculado ? (
                  <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <Check size={14} /> S/ {anticipoVinculado.monto} registrado
                  </div>
                ) : (
                  <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-400 bg-gray-50 dark:bg-gray-700">
                    Sin anticipo registrado
                  </div>
                )}
                <button
                  onClick={handleAnticipoLupa}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2.5 rounded-lg transition-colors"
                  title="Gestionar anticipo"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                Cancelar
              </button>
              <button
                onClick={handleGenerarNota}
                disabled={guardando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
              >
                {guardando ? 'Generando...' : 'Generar Nota'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSeleccionarCliente && (
        <SeleccionarClienteModal
          usuarios={usuarios}
          onSelect={u => { setClienteSeleccionado(u); setAnticipoVinculado(null); }}
          onClose={() => setShowSeleccionarCliente(false)}
        />
      )}

      {showAgregarProductos && (
        <AgregarProductosModal
          onConfirm={items => { setProductosLista(prev => [...prev, ...items]); setShowAgregarProductos(false); }}
          onClose={() => setShowAgregarProductos(false)}
        />
      )}

      {showAnticipoInicial && clienteSeleccionado && (
        <AnticipoInicialModal
          isOpen={showAnticipoInicial}
          clienteNombre={clienteSeleccionado.nombre}
          onSubmit={handleAnticipoRegistrado}
          onClose={() => setShowAnticipoInicial(false)}
        />
      )}

      {showAnticipoConfirm && clienteSeleccionado && (
        <AnticipoConfirmModal
          isOpen={showAnticipoConfirm}
          clienteNombre={clienteSeleccionado.nombre}
          montoDisponible={montoDisponibleCliente}
          clienteId={clienteSeleccionado.id}
          onConfirm={() => { setShowAnticipoConfirm(false); setShowAnticipoInicial(true); }}
          onClose={() => setShowAnticipoConfirm(false)}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NotasPedido: React.FC<NotasPedidoProps> = ({ currentUser }) => {
  const [notas, setNotas] = useState<NotaPedido[]>([]);
  const [notasOrdenadas, setNotasOrdenadas] = useState<NotaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pendientes' | 'Terminados'>('Pendientes');
  const [searchText, setSearchText] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  const [showGenerarNota, setShowGenerarNota] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaPedido | null>(null);
  const [showResumen, setShowResumen] = useState(false);
  const [showAvance, setShowAvance] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [notaToDelete, setNotaToDelete] = useState<NotaPedido | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canManage = currentUser?.perfil === 'Administrador' || currentUser?.perfil === 'Vendedor';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notasData, usuariosData] = await Promise.all([
        SupabaseService.getNotasPedido(),
        SupabaseService.getUsuarios()
      ]);
      setNotas(notasData);
      setUsuarios(usuariosData);

      if (currentUser) {
        const orden = await SupabaseService.getOrdenNotasPedido(currentUser.id);
        if (orden.length > 0) {
          const ordenMap = new Map(orden.map(o => [o.nota_id, o.posicion]));
          const sorted = [...notasData].sort((a, b) => {
            const posA = ordenMap.has(a.id) ? ordenMap.get(a.id)! : 9999;
            const posB = ordenMap.has(b.id) ? ordenMap.get(b.id)! : 9999;
            return posA - posB;
          });
          setNotasOrdenadas(sorted);
        } else {
          setNotasOrdenadas(notasData);
        }
      } else {
        setNotasOrdenadas(notasData);
      }
    } catch (err) {
      toast.error('Error al cargar notas de pedido');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const estadoParaTab = activeTab === 'Pendientes' ? 'Pendiente' : 'Terminado';

  const filteredNotas = notasOrdenadas.filter(n => {
    if (n.estado !== estadoParaTab) return false;
    const clienteNombre = n.cliente?.nombre?.toLowerCase() || '';
    if (searchText && !clienteNombre.includes(searchText.toLowerCase())) return false;
    if (filtroCliente && !clienteNombre.includes(filtroCliente.toLowerCase())) return false;
    if (filtroFechaDesde && n.fecha_pedido < filtroFechaDesde) return false;
    if (filtroFechaHasta && n.fecha_pedido > filtroFechaHasta) return false;
    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentFiltered = filteredNotas;
    const oldIdx = currentFiltered.findIndex(n => n.id === active.id);
    const newIdx = currentFiltered.findIndex(n => n.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(currentFiltered, oldIdx, newIdx);
    const otherNotas = notasOrdenadas.filter(n => !filteredNotas.find(f => f.id === n.id));
    const newOrdenadas = [...otherNotas, ...reordered];
    setNotasOrdenadas(newOrdenadas);

    if (currentUser) {
      try {
        await SupabaseService.saveOrdenNotasPedido(currentUser.id, newOrdenadas.map(n => n.id));
      } catch {
        toast.error('Error al guardar orden');
      }
    }
  };

  const activeNota = activeId ? notasOrdenadas.find(n => n.id === activeId) : null;

  const handleCardClick = (nota: NotaPedido) => {
    setNotaSeleccionada(nota);
    setShowResumen(true);
  };

  const limpiarFiltros = () => {
    setSearchText('');
    setFiltroCliente('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  const pendientesCount = notas.filter(n => n.estado === 'Pendientes').length;
  const terminadosCount = notas.filter(n => n.estado === 'Terminado').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nota de Pedidos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{notas.length} nota{notas.length !== 1 ? 's' : ''} registrada{notas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && (
            <button
              onClick={() => setShowAvance(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm"
            >
              <TrendingUp size={16} /> Avance
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowGenerarNota(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm"
            >
              <Plus size={16} /> Generar Nota Pedido
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-1.5 border px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFiltros
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={14} /> Filtros
            {showFiltros ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {(filtroCliente || filtroFechaDesde || filtroFechaHasta) && (
            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        {showFiltros && (
          <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-700">
            <input
              type="text"
              placeholder="Filtrar por cliente..."
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={e => setFiltroFechaDesde(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 self-center text-sm">—</span>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={e => setFiltroFechaHasta(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['Pendientes', 'Terminados'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
            <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
              activeTab === tab ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            }`}>
              {notas.filter(n => n.estado === (tab === 'Pendientes' ? 'Pendiente' : 'Terminado')).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid with DnD */}
      {filteredNotas.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No hay notas {activeTab === 'Pendientes' ? 'pendientes' : 'terminadas'}</p>
          {canManage && activeTab === 'Pendientes' && (
            <p className="text-sm text-gray-400 mt-1">Haz clic en "Generar Nota Pedido" para comenzar</p>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredNotas.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotas.map(nota => (
                <SortableNotaCard key={nota.id} nota={nota} onCardClick={handleCardClick} onDeleteClick={setNotaToDelete} canManage={canManage} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeNota && (
              <div className="rotate-2 scale-105 opacity-90 shadow-2xl">
                <NotaCard nota={activeNota} onCardClick={() => {}} onDeleteClick={() => {}} isDragging canManage={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      {showGenerarNota && (
        <GenerarNotaModal
          usuarios={usuarios}
          currentUser={currentUser}
          onCreated={loadData}
          onClose={() => setShowGenerarNota(false)}
        />
      )}

      {showResumen && notaSeleccionada && (
        <ResumenNotaModal
          nota={notaSeleccionada}
          currentUser={currentUser}
          onClose={() => { setShowResumen(false); setNotaSeleccionada(null); loadData(); }}
          onUpdated={loadData}
        />
      )}

      {showAvance && (
        <AvanceModal
          currentUser={currentUser}
          onClose={() => { setShowAvance(false); loadData(); }}
        />
      )}

      {notaToDelete && (
        <DeleteNotaModal
          nota={notaToDelete}
          onClose={() => setNotaToDelete(null)}
          onDeleted={loadData}
        />
      )}
    </div>
  );
};

export default NotasPedido;
