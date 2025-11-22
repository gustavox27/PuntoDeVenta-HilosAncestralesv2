import { supabase } from '../lib/supabase';
import { Usuario, Producto, Venta, VentaDetalle, Evento, Anticipo } from '../types';

export class SupabaseService {
  private static currentUser: string | null = null;

  static setCurrentUser(userName: string | null) {
    this.currentUser = userName;
  }
  // USUARIOS
  static async getUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createUsuario(usuario: Omit<Usuario, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Usuario',
      descripcion: `Usuario creado: ${usuario.nombre} (DNI: ${usuario.dni})`,
      modulo: 'Usuarios',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'usuario'
    });

    return data;
  }

  static async updateUsuario(id: string, updates: Partial<Usuario>) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Usuario',
      descripcion: `Usuario actualizado: ${data.nombre}`,
      modulo: 'Usuarios',
      accion: 'Actualizar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'usuario'
    });

    return data;
  }

  static async getUserDataSummary(userId: string) {
    const [ventasResult, anticiposResult] = await Promise.all([
      supabase
        .from('ventas')
        .select('total')
        .eq('id_usuario', userId),
      supabase
        .from('anticipos')
        .select('monto')
        .eq('cliente_id', userId)
    ]);

    const ventas = ventasResult.data || [];
    const anticipos = anticiposResult.data || [];

    return {
      ventas: ventas.length,
      totalVentas: ventas.reduce((sum, v) => sum + Number(v.total), 0),
      anticipos: anticipos.length,
      totalAnticipos: anticipos.reduce((sum, a) => sum + Number(a.monto), 0)
    };
  }

  static async deleteUsuario(id: string, deleteRelatedData: boolean = false) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', id)
      .single();

    if (deleteRelatedData) {
      const { data: ventas } = await supabase
        .from('ventas')
        .select('id')
        .eq('id_usuario', id);

      if (ventas && ventas.length > 0) {
        const ventaIds = ventas.map(v => v.id);

        await supabase
          .from('ventas_detalle')
          .delete()
          .in('id_venta', ventaIds);

        await supabase
          .from('anticipos')
          .delete()
          .in('venta_id', ventaIds);
      }

      await supabase
        .from('anticipos')
        .delete()
        .eq('cliente_id', id)
        .is('venta_id', null);

      await supabase
        .from('ventas')
        .delete()
        .eq('id_usuario', id);
    }

    // El trigger marcar_ventas_usuario_eliminado se encargará de marcar las ventas automáticamente
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await this.createEvento({
      tipo: 'Usuario',
      descripcion: `Usuario eliminado: ${usuario?.nombre || 'Desconocido'}${deleteRelatedData ? ' (con datos relacionados)' : ''}`,
      modulo: 'Usuarios',
      accion: 'Eliminar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'usuario'
    });
  }

  // PRODUCTOS
  static async getProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getProductosDisponibles() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .gt('stock', 0)
      .order('nombre');
    
    if (error) throw error;
    return data;
  }

  static async getProductosVendibles() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('estado', 'Conos Devanados')
      .gt('stock', 0)
      .order('nombre');
    
    if (error) throw error;
    return data;
  }

  static async createProducto(producto: Omit<Producto, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('productos')
      .insert([producto])
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Producto',
      descripcion: `Producto creado: ${producto.nombre} - ${producto.color} (Stock: ${producto.stock})`,
      modulo: 'Inventario',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'producto'
    });

    return data;
  }

  static async createProductos(productos: Omit<Producto, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('productos')
      .insert(productos)
      .select();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Producto',
      descripcion: `${productos.length} productos creados en lote`,
      modulo: 'Inventario',
      accion: 'Crear Lote',
      usuario: this.currentUser || 'Sistema',
      entidad_tipo: 'producto'
    });

    return data;
  }

  static async updateProducto(id: string, updates: Partial<Producto>) {
    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Producto',
      descripcion: `Producto actualizado: ${data.nombre} - ${data.color}`,
      modulo: 'Inventario',
      accion: 'Actualizar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'producto'
    });

    return data;
  }

  static async getProductDataSummary(productId: string) {
    const { data: ventasDetalle } = await supabase
      .from('ventas_detalle')
      .select('cantidad')
      .eq('id_producto', productId);

    const ventas = ventasDetalle?.length || 0;
    const totalVendido = ventasDetalle?.reduce((sum, d) => sum + d.cantidad, 0) || 0;

    return {
      ventas,
      totalVendido
    };
  }

  static async getVentasPorProducto(productId: string) {
    const { data, error } = await supabase
      .from('ventas_detalle')
      .select(`
        id,
        cantidad,
        precio_unitario,
        subtotal,
        venta:ventas(
          id,
          fecha_venta,
          numero_guia,
          vendedor,
          usuario:usuarios(
            id,
            nombre
          ),
          usuario_eliminado,
          usuario_eliminado_nombre
        )
      `)
      .eq('id_producto', productId)
      .order('venta(fecha_venta)', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async deleteProducto(id: string) {
    const { data: producto } = await supabase
      .from('productos')
      .select('nombre, color')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.createEvento({
      tipo: 'Producto',
      descripcion: `Producto eliminado: ${producto?.nombre || 'Desconocido'} - ${producto?.color || ''}`,
      modulo: 'Inventario',
      accion: 'Eliminar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'producto'
    });
  }

  static async actualizarStock(id: string, nuevoStock: number) {
    const { data, error } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Producto',
      descripcion: `Stock actualizado: ${data.nombre} - Nuevo stock: ${nuevoStock}`,
      modulo: 'Inventario',
      accion: 'Actualizar Stock',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'producto'
    });

    return data;
  }

  // VENTAS
  static async getVentas() {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        usuario:usuarios(*),
        detalles:ventas_detalle(
          *,
          producto:productos(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getVentasPorFecha(fechaInicio: string, fechaFin: string) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        usuario:usuarios(*),
        detalles:ventas_detalle(
          *,
          producto:productos(*)
        )
      `)
      .gte('fecha_venta', fechaInicio)
      .lte('fecha_venta', fechaFin)
      .order('fecha_venta', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createVenta(venta: Omit<Venta, 'id' | 'created_at'>, detalles: Omit<VentaDetalle, 'id' | 'id_venta' | 'created_at'>[]) {
    try {
      // Crear la venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([venta])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Crear los detalles de la venta
      const detallesConVenta = detalles.map(detalle => ({
        ...detalle,
        id_venta: ventaData.id
      }));

      const { data: detallesData, error: detallesError } = await supabase
        .from('ventas_detalle')
        .insert(detallesConVenta)
        .select();

      if (detallesError) throw detallesError;

      // Actualizar stock de productos
      for (const detalle of detalles) {
        const { data: producto } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', detalle.id_producto)
          .single();

        if (producto) {
          await supabase
            .from('productos')
            .update({ stock: producto.stock - detalle.cantidad })
            .eq('id', detalle.id_producto);
        }
      }

      await this.createEvento({
        tipo: 'Venta',
        descripcion: `Nueva venta realizada por un total de S/ ${venta.total}`,
        modulo: 'Ventas',
        accion: 'Crear',
        usuario: this.currentUser || venta.vendedor,
        entidad_id: ventaData.id,
        entidad_tipo: 'venta'
      });

      return { ...ventaData, detalles: detallesData };
    } catch (error) {
      throw error;
    }
  }

  static async updateVenta(id: string, updates: Partial<Venta>) {
    const { data, error } = await supabase
      .from('ventas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Venta',
      descripcion: `Venta actualizada: ${updates.numero_guia ? `N° de Guía: ${updates.numero_guia}` : 'Información actualizada'}`,
      modulo: 'Historial',
      accion: 'Actualizar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'venta'
    });

    return data;
  }

  static async deleteVentaWithRollback(ventaId: string) {
    try {
      const { data, error } = await supabase
        .rpc('eliminar_venta_con_rollback', {
          p_venta_id: ventaId,
          p_usuario_actual: this.currentUser || 'Sistema'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getVentaDetailsForDelete(ventaId: string) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id,
        id_usuario,
        fecha_venta,
        total,
        descuento_total,
        anticipo_total,
        saldo_pendiente,
        numero_guia,
        vendedor,
        usuario:usuarios(
          id,
          nombre,
          dni
        ),
        detalles:ventas_detalle(
          id,
          cantidad,
          precio_unitario,
          subtotal,
          producto:productos(
            id,
            nombre,
            color,
            stock
          )
        ),
        anticipos(
          id,
          monto,
          metodo_pago,
          fecha_anticipo,
          observaciones
        )
      `)
      .eq('id', ventaId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // EVENTOS
  static async getEventos(limit = 10) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async createEvento(evento: Omit<Evento, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('eventos')
      .insert([evento])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ANTICIPOS
  static async getAnticipos() {
    const { data, error } = await supabase
      .from('anticipos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAnticiposPorCliente(clienteId: string) {
    const { data, error } = await supabase
      .from('anticipos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAnticiposDisponibles(clienteId: string) {
    try {
      const anticipos = await this.getAnticiposPorCliente(clienteId);
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('id, anticipo_total, descuento_total, total')
        .eq('id_usuario', clienteId);

      if (ventasError) throw ventasError;

      let totalAnticiposRegistrados = 0;
      let totalAnticiposConsumidos = 0;

      if (anticipos && anticipos.length > 0) {
        totalAnticiposRegistrados = anticipos.reduce((sum, a) => sum + (a.monto || 0), 0);
      }

      if (ventas && ventas.length > 0) {
        ventas.forEach(venta => {
          const anticipo_usado = Math.min(venta.anticipo_total || 0, venta.total - (venta.descuento_total || 0));
          totalAnticiposConsumidos += anticipo_usado;
        });
      }

      const saldoDisponible = Math.max(0, totalAnticiposRegistrados - totalAnticiposConsumidos);

      return {
        totalRegistrados: totalAnticiposRegistrados,
        totalConsumidos: totalAnticiposConsumidos,
        saldoDisponible,
        anticipos
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAnticiposPorVenta(ventaId: string) {
    const { data, error } = await supabase
      .from('anticipos')
      .select('*')
      .eq('venta_id', ventaId)
      .order('fecha_anticipo', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createAnticipo(anticipo: Omit<Anticipo, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('anticipos')
      .insert([anticipo])
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Anticipo',
      descripcion: `Anticipo registrado: S/ ${anticipo.monto} - Método: ${anticipo.metodo_pago}`,
      modulo: 'Ventas',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'anticipo'
    });

    return data;
  }

  static async checkAnticipoUsage(id: string) {
    const { data, error } = await supabase
      .rpc('check_anticipo_usage', {
        p_anticipo_id: id
      });

    if (error) {
      console.warn('Error checking anticipo usage:', error);
      return { is_used: false, used_in_venta: false };
    }

    return data?.[0] || { is_used: false, used_in_venta: false };
  }

  static async updateAnticipo(id: string, updates: Partial<Anticipo>) {
    const usageStatus = await this.checkAnticipoUsage(id);

    if (usageStatus.is_used) {
      throw new Error('No se puede editar un anticipo que ya ha sido utilizado en una compra o para pagar una deuda');
    }

    const { data, error } = await supabase
      .from('anticipos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Anticipo',
      descripcion: `Anticipo actualizado: S/ ${data.monto}`,
      modulo: 'Ventas',
      accion: 'Actualizar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'anticipo'
    });

    return data;
  }

  static async deleteAnticipo(id: string) {
    const usageStatus = await this.checkAnticipoUsage(id);

    if (usageStatus.is_used) {
      throw new Error('No se puede eliminar un anticipo que ya ha sido utilizado en una compra o para pagar una deuda');
    }

    const { data: anticipo } = await supabase
      .from('anticipos')
      .select('monto')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('anticipos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.createEvento({
      tipo: 'Anticipo',
      descripcion: `Anticipo eliminado: S/ ${anticipo?.monto || 0}`,
      modulo: 'Ventas',
      accion: 'Eliminar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'anticipo'
    });
  }

  // COLORES
  static async getColores() {
    const { data, error } = await supabase
      .from('colores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createColor(color: { nombre: string; codigo_color?: string; descripcion?: string }) {
    const { data, error } = await supabase
      .from('colores')
      .insert([color])
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Color',
      descripcion: `Color creado: ${color.nombre}`,
      modulo: 'Inventario',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'color'
    });

    return data;
  }

  static async updateColor(id: string, updates: Partial<{ nombre: string; codigo_color?: string; descripcion?: string }>) {
    const { data, error } = await supabase
      .from('colores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.createEvento({
      tipo: 'Color',
      descripcion: `Color actualizado: ${data.nombre}`,
      modulo: 'Inventario',
      accion: 'Actualizar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'color'
    });

    return data;
  }

  static async deleteColor(id: string) {
    const { data: color } = await supabase
      .from('colores')
      .select('nombre')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('colores')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.createEvento({
      tipo: 'Color',
      descripcion: `Color eliminado: ${color?.nombre || 'Desconocido'}`,
      modulo: 'Inventario',
      accion: 'Eliminar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: id,
      entidad_tipo: 'color'
    });
  }

  // MÉTRICAS
  static async getMetricasVentas(periodo?: string) {
    try {
      // Total de ventas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: ventasDelMes } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha_venta', inicioMes.toISOString());

      const totalVentas = ventasDelMes?.reduce((acc, venta) => acc + venta.total, 0) || 0;

      let fechaInicio = new Date();

      switch (periodo) {
        case 'day':
          fechaInicio.setHours(0, 0, 0, 0);
          break;
        case 'week':
          fechaInicio.setDate(fechaInicio.getDate() - 7);
          break;
        case 'month':
          fechaInicio.setMonth(fechaInicio.getMonth() - 1);
          break;
        case 'year':
          fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
          break;
        default:
          fechaInicio.setDate(fechaInicio.getDate() - 7);
      }

      const { data: ventasSemana } = await supabase
        .from('ventas')
        .select('fecha_venta, total')
        .gte('fecha_venta', fechaInicio.toISOString())
        .order('fecha_venta');

      // Productos más vendidos
      const { data: productosVendidos } = await supabase
        .from('ventas_detalle')
        .select(`
          cantidad,
          producto:productos(nombre)
        `);

      const productosPopulares = productosVendidos
        ?.reduce((acc: any[], detalle: any) => {
          const nombreProducto = detalle.producto?.nombre || 'Desconocido';
          const existente = acc.find(p => p.nombre === nombreProducto);

          if (existente) {
            existente.cantidad += detalle.cantidad;
          } else {
            acc.push({ nombre: nombreProducto, cantidad: detalle.cantidad });
          }

          return acc;
        }, [])
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5) || [];

      // Estado de stock
      const { data: productos } = await supabase
        .from('productos')
        .select('estado, stock');

      const estadoStock = productos
        ?.reduce((acc: any[], producto) => {
          const existente = acc.find(e => e.estado === producto.estado);

          if (existente) {
            existente.cantidad += producto.stock;
          } else {
            acc.push({ estado: producto.estado, cantidad: producto.stock });
          }

          return acc;
        }, []) || [];

      const estadoCantidad = productos
        ?.reduce((acc: any[], producto) => {
          const existente = acc.find(e => e.estado === producto.estado);

          if (existente) {
            existente.cantidad += 1;
          } else {
            acc.push({ estado: producto.estado, cantidad: 1 });
          }

          return acc;
        }, []) || [];

      const { data: totalClientes, count: countClientes } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact' })
        .eq('perfil', 'Cliente');

      const clientesActivos = countClientes || 0;

      const { data: coloresVendidos } = await supabase
        .from('ventas_detalle')
        .select(`
          cantidad,
          producto:productos(color)
        `);

      const coloresPopulares = coloresVendidos
        ?.reduce((acc: any[], detalle: any) => {
          const color = detalle.producto?.color || 'Desconocido';
          const existente = acc.find(c => c.nombre === color);

          if (existente) {
            existente.cantidad += detalle.cantidad;
          } else {
            acc.push({ nombre: color, cantidad: detalle.cantidad });
          }

          return acc;
        }, [])
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5) || [];

      return {
        totalVentas,
        ventasPorPeriodo: ventasSemana || [],
        productosPopulares,
        estadoStock,
        estadoCantidad,
        clientesActivos,
        coloresPopulares
      };
    } catch (error) {
      throw error;
    }
  }

  static async getMovementHistory(clienteId: string) {
    try {
      const anticipos = await this.getAnticiposPorCliente(clienteId);

      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          id,
          fecha_venta,
          total,
          anticipo_total,
          descuento_total,
          estado_pago,
          completada,
          saldo_pendiente,
          detalles:ventas_detalle(
            id,
            producto:productos(nombre)
          )
        `)
        .eq('id_usuario', clienteId)
        .order('fecha_venta', { ascending: false });

      if (ventasError) throw ventasError;

      const movements: any[] = [];
      let totalAnticiposRegistrados = 0;
      let totalComprasCompletas = 0;
      let totalDeudasPendientes = 0;

      anticipos?.forEach(anticipo => {
        const isUsed = anticipo.venta_id !== null && anticipo.venta_id !== undefined;
        movements.push({
          id: anticipo.id,
          type: 'ingreso',
          fecha: anticipo.fecha_anticipo,
          monto: anticipo.monto,
          metodo_pago: anticipo.metodo_pago,
          observaciones: anticipo.observaciones,
          descripcion: 'Anticipo Inicial',
          venta_id: anticipo.venta_id,
          subtype: 'anticipo',
          is_anticipo_used: isUsed
        });
        totalAnticiposRegistrados += anticipo.monto || 0;
      });

      ventas?.forEach(venta => {
        const montoFinal = venta.total - (venta.descuento_total || 0);
        const saldoPendiente = venta.saldo_pendiente || 0;
        const montoPagado = montoFinal - saldoPendiente;

        let descripcion = `Compra - ${venta.detalles?.map((d: any) => d.producto?.nombre).join(', ') || 'Productos'}`;
        if (saldoPendiente > 0) {
          descripcion += ` (Saldo pendiente S/ ${saldoPendiente.toFixed(2)})`;
        }

        movements.push({
          id: venta.id,
          type: 'egreso',
          fecha: venta.fecha_venta,
          monto: montoPagado,
          descripcion: descripcion,
          total_venta: venta.total,
          descuento: venta.descuento_total || 0,
          estado_pago: venta.estado_pago,
          completada: venta.completada,
          saldo_pendiente: venta.saldo_pendiente,
          subtype: 'compra'
        });

        if (venta.completada) {
          totalComprasCompletas += montoFinal;
          const pagoAdicional = montoFinal - (venta.anticipo_total || 0);
          if (pagoAdicional > 0) {
            movements.push({
              id: `pago_${venta.id}`,
              type: 'ingreso',
              fecha: venta.fecha_venta,
              monto: pagoAdicional,
              descripcion: 'Pago en Efectivo',
              metodo_pago: 'efectivo',
              venta_id: venta.id,
              subtype: 'pago_efectivo'
            });
          }
        } else if (venta.saldo_pendiente && venta.saldo_pendiente > 0) {
          totalDeudasPendientes += venta.saldo_pendiente;
        }
      });

      movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      const totalIngreso = movements
        .filter(m => m.type === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);

      const totalEgreso = movements
        .filter(m => m.type === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);

      const saldoDisponible = Math.max(0, totalIngreso - totalEgreso);
      const deudaPendiente = totalDeudasPendientes;

      return {
        movements,
        saldoDisponible,
        deudaPendiente,
        totalIngreso,
        totalEgreso,
        totalAnticiposRegistrados,
        totalComprasCompletas,
        totalDeudasPendientes
      };
    } catch (error) {
      throw error;
    }
  }

  // DEUDAS Y PAGOS AUTOMÁTICOS
  static async obtenerDeudasCliente(clienteId: string) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('id_usuario', clienteId)
        .gt('saldo_pendiente', 0)
        .neq('completada', true)
        .neq('usuario_eliminado', true)
        .order('fecha_venta', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  }

  static async calcularTotalDeuda(clienteId: string) {
    try {
      const deudas = await this.obtenerDeudasCliente(clienteId);
      const totalDeuda = deudas.reduce((sum, venta) => sum + (venta.saldo_pendiente || 0), 0);
      return totalDeuda;
    } catch (error) {
      throw error;
    }
  }

  static async aplicarAnticipoADeudas(
    clienteId: string,
    anticipoId: string,
    montoAnticipo: number,
    ventasIds: string[],
    usuarioActual: string = 'Sistema'
  ) {
    try {
      const { data, error } = await supabase
        .rpc('aplicar_anticipo_a_deudas', {
          p_cliente_id: clienteId,
          p_anticipo_id: anticipoId,
          p_monto_anticipo: montoAnticipo,
          p_ventas_ids: ventasIds,
          p_usuario_actual: usuarioActual
        });

      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback si la función no existe: implementar lógica en frontend
      console.warn('RPC function not available, using fallback logic', error);
      return await this.aplicarAnticipoADeudasFallback(
        clienteId,
        anticipoId,
        montoAnticipo,
        ventasIds,
        usuarioActual
      );
    }
  }

  private static async aplicarAnticipoADeudasFallback(
    clienteId: string,
    anticipoId: string,
    montoAnticipo: number,
    ventasIds: string[],
    usuarioActual: string
  ) {
    let montoRestante = montoAnticipo;
    let ventasPagadas = 0;
    let ventasParcialesCount = 0;
    let totalAplicado = 0;

    for (const ventaId of ventasIds) {
      const { data: venta } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', ventaId)
        .eq('id_usuario', clienteId)
        .gt('saldo_pendiente', 0)
        .maybeSingle();

      if (!venta || venta.saldo_pendiente <= 0) continue;

      const montoAplicar = Math.min(venta.saldo_pendiente, montoRestante);
      const nuevoSaldoPendiente = venta.saldo_pendiente - montoAplicar;

      await supabase
        .from('ventas')
        .update({
          saldo_pendiente: nuevoSaldoPendiente,
          anticipo_total: (venta.anticipo_total || 0) + montoAplicar,
          estado_pago: nuevoSaldoPendiente <= 0 ? 'completo' : 'pendiente',
          completada: nuevoSaldoPendiente <= 0
        })
        .eq('id', ventaId);

      await this.createEvento({
        tipo: 'Anticipo',
        descripcion: `Anticipo aplicado a deuda pendiente: S/ ${montoAplicar}`,
        modulo: 'Ventas',
        accion: 'Aplicar Anticipo a Deuda',
        usuario: usuarioActual,
        entidad_id: ventaId,
        entidad_tipo: 'venta'
      });

      totalAplicado += montoAplicar;
      montoRestante -= montoAplicar;

      if (venta.saldo_pendiente === montoAplicar) {
        ventasPagadas++;
      } else {
        ventasParcialesCount++;
      }

      if (montoRestante <= 0) break;
    }

    if (totalAplicado > 0) {
      await this.createEvento({
        tipo: 'Anticipo',
        descripcion: `Anticipo inicial aplicado a ${ventasPagadas} venta(s) y ${ventasParcialesCount} parcial(es)`,
        modulo: 'Ventas',
        accion: 'Aplicación Automática de Anticipo',
        usuario: usuarioActual,
        entidad_id: anticipoId,
        entidad_tipo: 'anticipo'
      });
    }

    return [
      {
        exito: true,
        mensaje: 'Anticipo aplicado exitosamente',
        ventas_pagadas: ventasPagadas,
        ventas_parciales: ventasParcialesCount,
        total_aplicado: totalAplicado,
        saldo_restante: montoRestante
      }
    ];
  }
}