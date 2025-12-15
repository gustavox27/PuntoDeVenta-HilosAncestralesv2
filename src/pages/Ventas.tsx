import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, User, Package, Receipt, Search, X, Filter, ShoppingBag, Eraser, DollarSign, Calendar, Edit2 } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { ExportUtils } from '../utils/exportUtils';
import { Usuario, Producto, CarritoItem, Venta } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import AnticipoForm, { AnticipoData } from '../components/Ventas/AnticipoForm';
import AnticipoInicialModal from '../components/Ventas/AnticipoInicialModal';
import AnticipoConfirmModal from '../components/Ventas/AnticipoConfirmModal';
import EditPriceModal from '../components/Ventas/EditPriceModal';
import DebtDetectionModal from '../components/Ventas/DebtDetectionModal';
import DebtPaymentSummaryModal from '../components/Ventas/DebtPaymentSummaryModal';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { convertDateWithCurrentTime, getTodayDateString } from '../utils/dateUtils';

interface VentasProps {
  currentUser: Usuario | null;
}

const Ventas: React.FC<VentasProps> = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoTemporal, setCarritoTemporal] = useState<CarritoItem[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalPurpose, setModalPurpose] = useState<'venta' | 'anticipo'>('venta');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [newUserData, setNewUserData] = useState({
    nombre: '',
    telefono: '',
    dni: '',
    direccion: '',
    perfil: 'Cliente' as 'Cliente'
  });
  const [anticipoData, setAnticipoData] = useState<AnticipoData | null>(null);
  const [descuentoCarrito, setDescuentoCarrito] = useState<number>(0);
  const [numeroGuia, setNumeroGuia] = useState<string>('');
  const [showGuiaWarning, setShowGuiaWarning] = useState(false);
  const [showAnticipoInicialModal, setShowAnticipoInicialModal] = useState(false);
  const [clienteParaAnticipo, setClienteParaAnticipo] = useState<Usuario | null>(null);
  const [procesandoAnticipo, setProcesandoAnticipo] = useState(false);
  const [anticiposDisponibles, setAnticiposDisponibles] = useState<{ [key: string]: number }>({});
  const [showAnticipoConfirmModal, setShowAnticipoConfirmModal] = useState(false);
  const [clienteConAnticiposPrevios, setClienteConAnticiposPrevios] = useState<Usuario | null>(null);
  const [fechaVenta, setFechaVenta] = useState<string>('');
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [productoParaEditarPrecio, setProductoParaEditarPrecio] = useState<{ productoId: string; nombre: string; precioActual: number; precioBase: number } | null>(null);
  const [tipoVenta, setTipoVenta] = useState<'completa' | 'anticipo'>('completa');
  const [showDebtDetectionModal, setShowDebtDetectionModal] = useState(false);
  const [deudasDetectadas, setDeudasDetectadas] = useState<Venta[]>([]);
  const [montoAnticipoActual, setMontoAnticipoActual] = useState(0);
  const [anticipoIdActual, setAnticipoIdActual] = useState<string>('');
  const [procesandoPagoDeudas, setProcesandoPagoDeudas] = useState(false);
  const [showDebtSummary, setShowDebtSummary] = useState(false);
  const [debtSummaryData, setDebtSummaryData] = useState({
    ventasPagadas: 0,
    ventasParcialesCount: 0,
    totalAplicado: 0,
    saldoRestante: 0
  });
  const [usarAnticipoDisponible, setUsarAnticipoDisponible] = useState(true);
  const [fechaSortOrder, setFechaSortOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (usuarioSeleccionado) {
      checkAnticiposDisponibles(usuarioSeleccionado.id);
    }
  }, [usuarioSeleccionado, deudasDetectadas]);

  useEffect(() => {
    filterUsuarios();
  }, [usuarios, searchUser]);

  useEffect(() => {
    filterProductos();
  }, [productos, searchProduct, fechaSortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, productosData] = await Promise.all([
        SupabaseService.getUsuarios(),
        SupabaseService.getProductosVendibles()
      ]);

      setUsuarios(usuariosData);
      setProductos(productosData);
      setFilteredProductos(productosData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    const clientesOnly = usuarios.filter(u => u.perfil === 'Cliente');

    if (!searchUser.trim()) {
      setFilteredUsuarios(clientesOnly);
      return;
    }

    const filtered = clientesOnly.filter(usuario =>
      usuario.nombre.toLowerCase().includes(searchUser.toLowerCase()) ||
      usuario.dni.includes(searchUser) ||
      (usuario.telefono && usuario.telefono.includes(searchUser))
    );

    setFilteredUsuarios(filtered);
  };

  const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'Fecha inválida';
    }
  };

  const filterProductos = () => {
    let filtered = productos;

    if (searchProduct.trim()) {
      filtered = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
        producto.color.toLowerCase().includes(searchProduct.toLowerCase()) ||
        producto.estado.toLowerCase().includes(searchProduct.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }

    if (fechaSortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const fechaA = new Date(a.fecha_registro || a.created_at || 0).getTime();
        const fechaB = new Date(b.fecha_registro || b.created_at || 0).getTime();
        return fechaSortOrder === 'asc' ? fechaA - fechaB : fechaB - fechaA;
      });
    }

    setFilteredProductos(filtered);
  };

  const checkAnticiposDisponibles = async (clienteId: string) => {
    try {
      const disponiblesData = await SupabaseService.getAnticiposDisponibles(clienteId);
      const totalDisponible = disponiblesData.saldoDisponible;

      if (totalDisponible > 0) {
        setAnticiposDisponibles({ [clienteId]: totalDisponible });
        toast.success(`Cliente tiene S/ ${totalDisponible.toFixed(2)} en anticipos disponibles`);
      } else {
        setAnticiposDisponibles({ [clienteId]: 0 });
      }
    } catch (error) {
      console.error('Error checking anticipos:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const nuevoUsuario = await SupabaseService.createUsuario(newUserData);
      
      setUsuarios([nuevoUsuario, ...usuarios]);
      setUsuarioSeleccionado(nuevoUsuario);

      setNewUserData({ nombre: '', telefono: '', dni: '', direccion: '', perfil: 'Cliente' });
      setShowAddUserModal(false);
      setShowUserModal(false);
      
      toast.success('Cliente creado y seleccionado correctamente');
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('duplicate key value')) {
        toast.error('Ya existe un cliente con ese DNI');
      } else {
        toast.error('Error al crear cliente');
      }
    }
  };

  const agregarAlCarritoTemporal = (producto: Producto) => {
    if (producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    const itemExistente = carritoTemporal.find(item => item.producto.id === producto.id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      
      setCarritoTemporal(carritoTemporal.map(item =>
        item.producto.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarritoTemporal([...carritoTemporal, { producto, cantidad: 1 }]);
    }
    
    toast.success('Producto agregado a la selección');
  };

  const actualizarCantidadTemporal = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarritoTemporal(productoId);
      return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (producto && nuevaCantidad > producto.stock) {
      toast.error('No hay suficiente stock');
      return;
    }

    setCarritoTemporal(carritoTemporal.map(item =>
      item.producto.id === productoId
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarritoTemporal = (productoId: string) => {
    setCarritoTemporal(carritoTemporal.filter(item => item.producto.id !== productoId));
  };

  const confirmarAgregarProductos = () => {
    if (carritoTemporal.length === 0) {
      toast.error('No hay productos seleccionados');
      return;
    }

    const nuevoCarrito = [...carrito];

    carritoTemporal.forEach(itemTemporal => {
      const itemExistente = nuevoCarrito.find(item => item.producto.id === itemTemporal.producto.id);

      if (itemExistente) {
        itemExistente.cantidad += itemTemporal.cantidad;
      } else {
        nuevoCarrito.push(itemTemporal);
      }
    });

    setCarrito(nuevoCarrito);
    setCarritoTemporal([]);
    setShowProductModal(false);
    setSearchProduct('');

    if (!fechaVenta) {
      setFechaVenta(getTodayDateString());
    }

    toast.success(`${carritoTemporal.length} producto(s) agregado(s) al carrito`);
  };

  const cancelarSeleccion = () => {
    setCarritoTemporal([]);
    setShowProductModal(false);
    setSearchProduct('');
    setFechaSortOrder(null);
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (producto && nuevaCantidad > producto.stock) {
      toast.error('No hay suficiente stock');
      return;
    }

    setCarrito(carrito.map(item =>
      item.producto.id === productoId
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter(item => item.producto.id !== productoId));
    toast.success('Producto eliminado del carrito');
  };

  const limpiarTodo = () => {
    setCarrito([]);
    setUsuarioSeleccionado(null);
    setCarritoTemporal([]);
    setAnticipoData(null);
    setDescuentoCarrito(0);
    setNumeroGuia('');
    setFechaVenta('');
    setTipoVenta('completa');
    setUsarAnticipoDisponible(true);
    toast.success('Carrito y cliente limpiados');
  };

  const obtenerPrecioUnitario = (item: CarritoItem): number => {
    return item.precioPersonalizado ?? item.producto.precio_uni;
  };

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => {
      const precio = obtenerPrecioUnitario(item);
      return total + (precio * item.cantidad);
    }, 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal - descuentoCarrito;
  };

  const calcularSaldoPendiente = () => {
    const total = calcularTotal();
    const anticipoNuevo = anticipoData?.monto || 0;
    const anticiposDisp = usuarioSeleccionado && usarAnticipoDisponible ? (anticiposDisponibles[usuarioSeleccionado.id] || 0) : 0;
    const anticipoTotal = anticipoNuevo + anticiposDisp;
    return Math.max(0, total - anticipoTotal);
  };

  const calcularTotalTemporal = () => {
    return carritoTemporal.reduce((total, item) => total + (item.producto.precio_uni * item.cantidad), 0);
  };

  const handleRegistrarAnticipoInicial = async (data: {
    monto: number;
    metodo_pago: string;
    fecha_anticipo: string;
    observaciones?: string;
  }) => {
    if (!clienteParaAnticipo) return;

    try {
      setProcesandoAnticipo(true);

      const fechaAnticipoISO = convertDateWithCurrentTime(data.fecha_anticipo);

      const anticipo = await SupabaseService.createAnticipo({
        cliente_id: clienteParaAnticipo.id,
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        fecha_anticipo: fechaAnticipoISO,
        observaciones: data.observaciones
      });

      toast.success(`Anticipo de S/ ${data.monto.toFixed(2)} registrado correctamente`);

      try {
        const deudas = await SupabaseService.obtenerDeudasCliente(clienteParaAnticipo.id);

        if (deudas && Array.isArray(deudas) && deudas.length > 0) {
          setDeudasDetectadas(deudas);
          setMontoAnticipoActual(data.monto);
          setAnticipoIdActual(anticipo.id);
          setShowAnticipoInicialModal(false);
          setShowDebtDetectionModal(true);
        } else {
          setShowAnticipoInicialModal(false);
          setDeudasDetectadas([]);
          setClienteParaAnticipo(null);
          toast.info('El cliente no tiene deudas pendientes');
        }
      } catch (debtError) {
        console.error('Error checking client debts:', debtError);
        setShowAnticipoInicialModal(false);
        setDeudasDetectadas([]);
        setClienteParaAnticipo(null);
      }
    } catch (error) {
      console.error('Error registering anticipo:', error);
      toast.error('Error al registrar el anticipo');
      setShowAnticipoInicialModal(false);
      setDeudasDetectadas([]);
    } finally {
      setProcesandoAnticipo(false);
    }
  };

  const handleAplicarDeudas = async (ventasSeleccionadas: string[]) => {
    if (!clienteParaAnticipo) return;

    try {
      setProcesandoPagoDeudas(true);

      const resultado = await SupabaseService.aplicarAnticipoADeudas(
        clienteParaAnticipo.id,
        anticipoIdActual,
        montoAnticipoActual,
        ventasSeleccionadas,
        currentUser?.nombre || 'Sistema'
      );

      if (Array.isArray(resultado) && resultado[0]) {
        const r = resultado[0];
        setDebtSummaryData({
          ventasPagadas: r.ventas_pagadas || 0,
          ventasParcialesCount: r.ventas_parciales || 0,
          totalAplicado: r.total_aplicado || 0,
          saldoRestante: r.saldo_restante || 0
        });

        setShowDebtDetectionModal(false);

        await checkAnticiposDisponibles(clienteParaAnticipo.id);

        setShowDebtSummary(true);

        toast.success('Anticipo aplicado a deudas correctamente');
      }
    } catch (error) {
      console.error('Error applying anticipo to debts:', error);
      toast.error('Error al aplicar anticipo a deudas');
    } finally {
      setProcesandoPagoDeudas(false);
    }
  };

  const handleSkipDebtPayment = () => {
    setShowDebtDetectionModal(false);
    setDeudasDetectadas([]);
    setClienteParaAnticipo(null);
  };

  const handleDebtSummaryClose = async () => {
    setShowDebtSummary(false);
    if (clienteParaAnticipo) {
      await checkAnticiposDisponibles(clienteParaAnticipo.id);
    }
    setClienteParaAnticipo(null);
  };

  const procesarVenta = async () => {
    if (!usuarioSeleccionado) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    if (carrito.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!numeroGuia.trim()) {
      setShowGuiaWarning(true);
      return;
    }

    try {
      setProcesandoVenta(true);

      const total = calcularTotal();
      let anticipoTotal = anticipoData?.monto || 0;
      const codigoQR = uuidv4();

      const anticiposDisponiblesCliente = anticiposDisponibles[usuarioSeleccionado.id] || 0;
      let saldoPendiente = 0;
      let estadoPago: 'completo' | 'pendiente' = 'completo';
      let ventaCompletada = true;

      if (tipoVenta === 'completa') {
        anticipoTotal = anticipoData?.monto || 0;
        if (anticiposDisponiblesCliente > 0 && usarAnticipoDisponible) {
          anticipoTotal += anticiposDisponiblesCliente;
        }
        saldoPendiente = 0;
        estadoPago = 'completo';
        ventaCompletada = true;
      } else {
        anticipoTotal = anticipoData?.monto || 0;
        if (anticiposDisponiblesCliente > 0 && usarAnticipoDisponible) {
          anticipoTotal += anticiposDisponiblesCliente;
        }
        saldoPendiente = Math.max(0, total - anticipoTotal);
        estadoPago = saldoPendiente > 0 ? 'pendiente' : 'completo';
        ventaCompletada = saldoPendiente === 0;
      }

      const fechaVentaISO = fechaVenta ? convertDateWithCurrentTime(fechaVenta) : new Date().toISOString();

      const venta = {
        id_usuario: usuarioSeleccionado.id,
        fecha_venta: fechaVentaISO,
        total,
        vendedor: currentUser?.nombre || 'Sistema',
        codigo_qr: codigoQR,
        anticipo_total: anticipoTotal,
        saldo_pendiente: saldoPendiente,
        descuento_total: descuentoCarrito,
        estado_pago: estadoPago,
        completada: ventaCompletada,
        numero_guia: numeroGuia.trim()
      };

      const detalles = carrito.map(item => {
        const precioUnitario = obtenerPrecioUnitario(item);
        const subtotalProducto = precioUnitario * item.cantidad;
        return {
          id_producto: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: precioUnitario,
          subtotal: subtotalProducto,
          descuento: 0
        };
      });

      const ventaCreada = await SupabaseService.createVenta(venta, detalles);

      if (anticiposDisponiblesCliente > 0 && usarAnticipoDisponible) {
        const disponiblesData = await SupabaseService.getAnticiposDisponibles(usuarioSeleccionado.id);
        const anticipoActualmenteDisponible = disponiblesData.saldoDisponible;

        let montoRestanteAPagar = total;
        if (anticipoData) {
          montoRestanteAPagar = Math.max(0, total - anticipoData.monto);
        }

        const montoAAplicar = Math.min(anticipoActualmenteDisponible, montoRestanteAPagar);

        if (montoAAplicar > 0) {
          const anticiposPrevios = disponiblesData.anticipos;
          const anticiposSinVenta = anticiposPrevios.filter(a => !a.venta_id);

          let montoAplicado = 0;

          for (const anticipo of anticiposSinVenta) {
            if (montoAplicado >= montoAAplicar) {
              break;
            }

            await SupabaseService.updateAnticipo(anticipo.id, {
              venta_id: ventaCreada.id
            });

            montoAplicado += anticipo.monto;
          }
        }
      }

      if (anticipoData) {
        const fechaAnticipoISO = convertDateWithCurrentTime(anticipoData.fecha_anticipo);
        await SupabaseService.createAnticipo({
          venta_id: ventaCreada.id,
          cliente_id: usuarioSeleccionado.id,
          monto: anticipoData.monto,
          metodo_pago: anticipoData.metodo_pago,
          fecha_anticipo: fechaAnticipoISO,
          observaciones: anticipoData.observaciones
        });
      }

      await ExportUtils.generateSalePDF(ventaCreada, usuarioSeleccionado, carrito.map(item => ({
        ...detalles.find(d => d.id_producto === item.producto.id)!,
        producto: item.producto
      })), anticipoData || undefined);

      setCarrito([]);
      setUsuarioSeleccionado(null);
      setAnticipoData(null);
      setDescuentoCarrito(0);
      setNumeroGuia('');
      setFechaVenta('');
      setAnticiposDisponibles({});
      setTipoVenta('completa');

      const productosActualizados = await SupabaseService.getProductosVendibles();
      setProductos(productosActualizados);
      setFilteredProductos(productosActualizados);

      toast.success('Venta procesada exitosamente');

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcesandoVenta(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Punto de Venta</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selección de Cliente */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Cliente
              </h3>

              {usuarioSeleccionado ? (
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium">{usuarioSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-600">DNI: {usuarioSeleccionado.dni}</p>
                  <button
                    onClick={() => {
                      setUsuarioSeleccionado(null);
                      setUsarAnticipoDisponible(true);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Cambiar cliente
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setModalPurpose('venta');
                    setShowUserModal(true);
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Seleccionar Cliente
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                N° de Guía
              </h3>
              <input
                type="text"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                placeholder="Ingrese el número de guía"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Campo obligatorio para procesar la venta
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-emerald-600" />
                Anticipo Inicial
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Registra anticipos sin venta asociada
              </p>
              <button
                onClick={() => {
                  setModalPurpose('anticipo');
                  setShowUserModal(true);
                }}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 font-medium text-sm shadow-sm"
              >
                <DollarSign size={16} />
                <span>Registrar Anticipo</span>
              </button>
            </div>

            {carrito.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                  Fecha de Registro de Venta
                </h3>
                <input
                  type="date"
                  value={fechaVenta}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = getTodayDateString();
                    if (selectedDate <= today) {
                      setFechaVenta(selectedDate);
                    } else {
                      toast.error('No puedes seleccionar una fecha futura');
                    }
                  }}
                  max={getTodayDateString()}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Fecha por defecto: hoy. Puedes cambiarla a una fecha anterior si es necesario.
                </p>
              </div>
            )}
          </div>

          {/* Carrito Principal */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Carrito de Compras ({carrito.length})
                </h3>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Agregar</span>
                  </button>
                  
                  <button
                    onClick={limpiarTodo}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Eraser size={16} />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {carrito.map(item => {
                  const precioUnitario = obtenerPrecioUnitario(item);
                  const precioBase = item.producto.precio_base;
                  const tieneDescuento = item.precioPersonalizado && item.precioPersonalizado > precioBase;

                  return (
                  <div key={item.producto.id} className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.producto.nombre}</p>
                        <p className="text-sm text-gray-600">{item.producto.color}</p>
                      </div>
                      <button
                        onClick={() => eliminarDelCarrito(item.producto.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <button
                        onClick={() => {
                          setProductoParaEditarPrecio({
                            productoId: item.producto.id,
                            nombre: item.producto.nombre,
                            precioActual: precioUnitario,
                            precioBase: precioBase
                          });
                          setShowEditPriceModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Edit2 size={14} />
                        <span>S/ {precioUnitario.toFixed(2)}</span>
                      </button>
                      {tieneDescuento && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Precio modificado
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.producto.stock}
                          value={item.cantidad}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            actualizarCantidad(item.producto.id, value);
                          }}
                          className="w-16 text-center text-base font-medium border-2 border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        S/ {(precioUnitario * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
                })}
                
                {carrito.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <ShoppingBag className="mx-auto h-12 w-12 mb-3 text-gray-300" />
                    <p className="text-lg font-medium">Carrito vacío</p>
                    <p className="text-sm">Haz clic en "Agregar" para seleccionar productos</p>
                  </div>
                )}
              </div>
              
              {carrito.length > 0 && (
                <div className="border-t pt-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Subtotal:</span>
                      <span className="text-xl font-bold text-gray-900">
                        S/ {calcularSubtotal().toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descuento (Opcional)
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">S/</span>
                        <input
                          type="number"
                          min="0"
                          max={calcularSubtotal()}
                          step="0.01"
                          value={descuentoCarrito}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value <= calcularSubtotal()) {
                              setDescuentoCarrito(value);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo: S/ {calcularSubtotal().toFixed(2)}
                      </p>
                    </div>

                    {descuentoCarrito > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span className="text-lg font-medium">Descuento:</span>
                        <span className="text-xl font-bold">
                          - S/ {descuentoCarrito.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        S/ {calcularTotal().toFixed(2)}
                      </span>
                    </div>

                    {usuarioSeleccionado && anticiposDisponibles[usuarioSeleccionado.id] > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="text-lg font-medium">Anticipo Previo:</span>
                          <span className="text-xl font-bold">
                            {usarAnticipoDisponible ? '- S/ ' : 'S/ '}{anticiposDisponibles[usuarioSeleccionado.id].toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={usarAnticipoDisponible}
                              onChange={(e) => setUsarAnticipoDisponible(e.target.checked)}
                              className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {usarAnticipoDisponible ? 'Usar anticipo disponible' : 'No usar anticipo disponible'}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {anticipoData && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="text-lg font-medium">Anticipo Actual:</span>
                        <span className="text-xl font-bold">
                          - S/ {anticipoData.monto.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {(anticipoData || (usuarioSeleccionado && anticiposDisponibles[usuarioSeleccionado.id] > 0)) && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-xl font-bold text-gray-900">Saldo Pendiente:</span>
                        <span className="text-2xl font-bold text-red-600">
                          S/ {calcularSaldoPendiente().toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {tipoVenta === 'completa' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-medium text-green-800">
                          Venta completa - El cliente pagará el total
                          {usuarioSeleccionado && anticiposDisponibles[usuarioSeleccionado.id] > 0 && (
                            <span> (incluyendo anticipos iniciales)</span>
                          )}
                        </p>
                      </div>
                      {descuentoCarrito > 0 && (
                        <p className="text-xs text-green-700 mt-1 ml-4">
                          Con descuento de S/ {descuentoCarrito.toFixed(2)} aplicado
                        </p>
                      )}
                      {usuarioSeleccionado && anticiposDisponibles[usuarioSeleccionado.id] > 0 && (
                        <p className="text-xs text-green-700 mt-1 ml-4">
                          Anticipo inicial de S/ {anticiposDisponibles[usuarioSeleccionado.id].toFixed(2)} se aplicará automáticamente
                        </p>
                      )}
                    </div>
                  )}

                  {tipoVenta === 'anticipo' && (anticipoData || (usuarioSeleccionado && anticiposDisponibles[usuarioSeleccionado.id] > 0)) && (
                    <>
                      {calcularSaldoPendiente() === 0 && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <p className="text-sm font-medium text-emerald-800">
                              Venta cubierta totalmente con anticipos
                            </p>
                          </div>
                        </div>
                      )}

                      {calcularSaldoPendiente() > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm font-medium text-blue-800">
                              Venta con anticipo - Saldo pendiente de S/ {calcularSaldoPendiente().toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Tipo de Venta</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {tipoVenta === 'completa'
                            ? 'El cliente pagará el total completo'
                            : 'El cliente pagará el saldo posteriormente'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${tipoVenta === 'completa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          Completa
                        </span>
                        <div className="relative w-12 h-6 bg-gray-300 rounded-full transition-colors" style={{backgroundColor: tipoVenta === 'completa' ? '#10b981' : '#3b82f6'}}>
                          <button
                            onClick={() => setTipoVenta(tipoVenta === 'completa' ? 'anticipo' : 'completa')}
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${tipoVenta === 'completa' ? 'left-1' : 'right-1'}`}
                            type="button"
                          />
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${tipoVenta === 'anticipo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          Pendiente
                        </span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={procesarVenta}
                    disabled={!usuarioSeleccionado || procesandoVenta}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-semibold"
                  >
                    {procesandoVenta ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="h-5 w-5" />
                        <span>Procesar Venta</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {carrito.length > 0 && usuarioSeleccionado && (
        <AnticipoForm
          totalVenta={calcularTotal()}
          onAnticipoChange={setAnticipoData}
        />
      )}

      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSearchUser('');
        }}
        title="Seleccionar Cliente"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nuevo</span>
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredUsuarios.map(usuario => (
              <div
                key={usuario.id}
                onClick={async () => {
                  if (modalPurpose === 'anticipo') {
                    try {
                      const disponiblesData = await SupabaseService.getAnticiposDisponibles(usuario.id);
                      const totalDisponible = disponiblesData.saldoDisponible;

                      if (totalDisponible > 0) {
                        const anticipos = disponiblesData.anticipos;
                        const anticiposSinVenta = anticipos.filter(a => !a.venta_id);
                        const ultimoAnticipo = anticiposSinVenta.length > 0 ? anticiposSinVenta[0] : null;
                        const montoUltimoAnticipo = ultimoAnticipo ? ultimoAnticipo.monto : 0;

                        setAnticiposDisponibles(prev => ({
                          ...prev,
                          [usuario.id]: totalDisponible
                        }));
                        setClienteConAnticiposPrevios(usuario);
                        sessionStorage.setItem(`ultimoAnticipo_${usuario.id}`, montoUltimoAnticipo.toString());
                        setShowAnticipoConfirmModal(true);
                        return;
                      }

                      setClienteParaAnticipo(usuario);
                      setShowUserModal(false);
                      setShowAnticipoInicialModal(true);
                    } catch (error) {
                      console.error('Error checking anticipos:', error);
                      toast.error('Error al verificar anticipos previos');
                    }
                  } else {
                    setUsuarioSeleccionado(usuario);
                    setShowUserModal(false);
                  }
                  setSearchUser('');
                }}
                className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <p className="font-medium">{usuario.nombre}</p>
                <p className="text-sm text-gray-600">DNI: {usuario.dni}</p>
                {usuario.telefono && (
                  <p className="text-sm text-gray-600">Tel: {usuario.telefono}</p>
                )}
              </div>
            ))}
            
            {filteredUsuarios.length === 0 && searchUser && (
              <div className="text-center py-8">
                <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No se encontraron clientes</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setNewUserData({ nombre: '', telefono: '', dni: '', direccion: '', perfil: 'Cliente' });
        }}
        title="Nuevo Usuario"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Razón Social</label>
            <input
              type="text"
              required
              value={newUserData.nombre}
              onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre o razón social"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI/RUC</label>
            <input
              type="text"
              required
              maxLength={11}
              value={newUserData.dni}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setNewUserData({ ...newUserData, dni: value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="DNI: 12345678 o RUC: 12345678901"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={newUserData.direccion}
              onChange={(e) => setNewUserData({ ...newUserData, direccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la dirección"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nro. de Contacto</label>
            <input
              type="text"
              value={newUserData.telefono}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setNewUserData({ ...newUserData, telefono: value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="987654321"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddUserModal(false);
                setNewUserData({ nombre: '', telefono: '', dni: '', direccion: '', perfil: 'Cliente' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Productos Disponibles */}
      <Modal
        isOpen={showProductModal}
        onClose={cancelarSeleccion}
        title="Productos Disponibles"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Filtro de búsqueda y ordenamiento */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, color, estado o descripción..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (fechaSortOrder === 'asc') {
                    setFechaSortOrder('desc');
                  } else if (fechaSortOrder === 'desc') {
                    setFechaSortOrder(null);
                  } else {
                    setFechaSortOrder('asc');
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                  fechaSortOrder === null
                    ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    : fechaSortOrder === 'asc'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
                title={fechaSortOrder === 'asc' ? 'Más antiguo primero' : fechaSortOrder === 'desc' ? 'Más reciente primero' : 'Sin ordenamiento'}
              >
                <Calendar size={16} />
                <span>Fecha</span>
                {fechaSortOrder === 'asc' && <span className="text-xs ml-1">↑</span>}
                {fechaSortOrder === 'desc' && <span className="text-xs ml-1">↓</span>}
              </button>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            {filteredProductos.map(producto => (
              <div key={producto.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{producto.nombre}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        {formatearFecha(producto.fecha_registro || producto.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{producto.color}</p>
                    <p className="text-xs text-gray-500">{producto.estado}</p>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-400 mt-1">{producto.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-blue-600">S/ {producto.precio_uni.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Stock: {producto.stock}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => agregarAlCarritoTemporal(producto)}
                  disabled={producto.stock <= 0}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {producto.stock <= 0 ? 'Sin Stock' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>

          {filteredProductos.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}

          {/* Vista previa de productos seleccionados */}
          {carritoTemporal.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Productos Seleccionados ({carritoTemporal.length})</h4>
              
              <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                {carritoTemporal.map(item => (
                  <div key={item.producto.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-600">{item.producto.color}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => actualizarCantidadTemporal(item.producto.id, item.cantidad - 1)}
                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.producto.stock}
                        value={item.cantidad}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          actualizarCantidadTemporal(item.producto.id, value);
                        }}
                        className="w-16 text-center text-base font-medium border-2 border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => actualizarCantidadTemporal(item.producto.id, item.cantidad + 1)}
                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold">S/ {(item.producto.precio_uni * item.cantidad).toFixed(2)}</p>
                    </div>
                    
                    <button
                      onClick={() => eliminarDelCarritoTemporal(item.producto.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-semibold text-gray-900">Total Seleccionado:</span>
                <span className="text-xl font-bold text-blue-600">
                  S/ {calcularTotalTemporal().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={cancelarSeleccion}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarAgregarProductos}
              disabled={carritoTemporal.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Agregar Productos al Carrito ({carritoTemporal.length})
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showGuiaWarning}
        onClose={() => setShowGuiaWarning(false)}
        title="N° de Guía Requerido"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Debe ingresar el número de guía
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                El número de guía es un campo obligatorio para procesar la venta. Por favor, ingrese el número de guía antes de continuar.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowGuiaWarning(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      <AnticipoInicialModal
        isOpen={showAnticipoInicialModal}
        onClose={() => {
          setShowAnticipoInicialModal(false);
          setClienteParaAnticipo(null);
        }}
        clienteNombre={clienteParaAnticipo?.nombre || ''}
        onSubmit={handleRegistrarAnticipoInicial}
        loading={procesandoAnticipo}
      />

      <AnticipoConfirmModal
        isOpen={showAnticipoConfirmModal}
        onClose={() => {
          setShowAnticipoConfirmModal(false);
          setClienteConAnticiposPrevios(null);
        }}
        onConfirm={() => {
          if (clienteConAnticiposPrevios) {
            setClienteParaAnticipo(clienteConAnticiposPrevios);
            setShowUserModal(false);
            setShowAnticipoConfirmModal(false);
            setShowAnticipoInicialModal(true);
            setClienteConAnticiposPrevios(null);
          }
        }}
        clienteNombre={clienteConAnticiposPrevios?.nombre || ''}
        clienteId={clienteConAnticiposPrevios?.id}
        montoDisponible={clienteConAnticiposPrevios ? (anticiposDisponibles[clienteConAnticiposPrevios.id] || 0) : 0}
      />

      {productoParaEditarPrecio && (
        <EditPriceModal
          isOpen={showEditPriceModal}
          onClose={() => {
            setShowEditPriceModal(false);
            setProductoParaEditarPrecio(null);
          }}
          onConfirm={(newPrice) => {
            setCarrito(carrito.map(item =>
              item.producto.id === productoParaEditarPrecio.productoId
                ? { ...item, precioPersonalizado: newPrice }
                : item
            ));
            setShowEditPriceModal(false);
            setProductoParaEditarPrecio(null);
          }}
          productName={productoParaEditarPrecio.nombre}
          currentPrice={productoParaEditarPrecio.precioActual}
          basePrice={productoParaEditarPrecio.precioBase}
        />
      )}

      <DebtDetectionModal
        isOpen={showDebtDetectionModal}
        onClose={() => {
          setShowDebtDetectionModal(false);
          setClienteParaAnticipo(null);
        }}
        cliente={clienteParaAnticipo}
        deudas={deudasDetectadas}
        montoAnticipo={montoAnticipoActual}
        onConfirm={handleAplicarDeudas}
        onSkip={handleSkipDebtPayment}
        loading={procesandoPagoDeudas}
      />

      <DebtPaymentSummaryModal
        isOpen={showDebtSummary}
        onClose={handleDebtSummaryClose}
        ventasPagadas={debtSummaryData.ventasPagadas}
        ventasParcialesCount={debtSummaryData.ventasParcialesCount}
        totalAplicado={debtSummaryData.totalAplicado}
        saldoRestante={debtSummaryData.saldoRestante}
        clienteNombre={clienteParaAnticipo?.nombre || ''}
      />
    </div>
  );
};

export default Ventas;
