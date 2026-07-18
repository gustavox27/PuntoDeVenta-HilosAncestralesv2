import { supabase } from '../lib/supabase';
import { Usuario, Producto, Venta, VentaDetalle, Evento, Anticipo, NotaPedido, NotaPedidoDetalle, Programacion, Avance, AvanceAsignacion } from '../types';

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
      entidad_tipo: 'usuario',
      valor_nuevo: data
    });

    return data;
  }

  static async updateUsuario(id: string, updates: Partial<Usuario>) {
    const { data: oldData } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'usuario',
      valor_anterior: oldData,
      valor_nuevo: data
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

  static async getUsersFinancialSummary() {
    try {
      const { data, error } = await supabase
        .rpc('get_users_financial_summary');

      if (error) throw error;

      const financialMap: Record<string, { saldoDisponible: number; deudaPendiente: number }> = {};

      data?.forEach((row: any) => {
        financialMap[row.usuario_id] = {
          saldoDisponible: Number(row.saldo_disponible),
          deudaPendiente: Number(row.deuda_pendiente)
        };
      });

      return financialMap;
    } catch (error) {
      console.error('Error getting users financial summary:', error);
      return {};
    }
  }

  static async deleteUsuario(id: string, deleteRelatedData: boolean = false) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
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
      entidad_tipo: 'usuario',
      valor_anterior: usuario
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
      entidad_tipo: 'producto',
      valor_nuevo: data
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
    const { data: oldData } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'producto',
      valor_anterior: oldData,
      valor_nuevo: data
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
      .select('*')
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
      entidad_tipo: 'producto',
      valor_anterior: producto
    });
  }

  static async actualizarStock(id: string, nuevoStock: number) {
    const { data: oldData } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'producto',
      valor_anterior: oldData,
      valor_nuevo: data
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

      const ventaCompleta = { ...ventaData, detalles: detallesData };

      await this.createEvento({
        tipo: 'Venta',
        descripcion: `Nueva venta realizada por un total de S/ ${venta.total}`,
        modulo: 'Ventas',
        accion: 'Crear',
        usuario: this.currentUser || venta.vendedor,
        entidad_id: ventaData.id,
        entidad_tipo: 'venta',
        valor_nuevo: ventaCompleta
      });

      return ventaCompleta;
    } catch (error) {
      throw error;
    }
  }

  static async updateVenta(id: string, updates: Partial<Venta>) {
    const { data: oldData } = await supabase
      .from('ventas')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'venta',
      valor_anterior: oldData,
      valor_nuevo: data
    });

    return data;
  }

  static async deleteVentaWithRollback(ventaId: string) {
    try {
      const ventaDetails = await this.getVentaDetailsForDelete(ventaId);

      const { data, error } = await supabase
        .rpc('eliminar_venta_con_rollback', {
          p_venta_id: ventaId,
          p_usuario_actual: this.currentUser || 'Sistema'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      if (ventaDetails) {
        await this.createEvento({
          tipo: 'Venta',
          descripcion: `Venta eliminada completamente (rollback): ${ventaDetails.numero_guia || ventaId} - Total: S/ ${ventaDetails.total}`,
          modulo: 'Historial',
          accion: 'Eliminar',
          usuario: this.currentUser || 'Sistema',
          entidad_id: ventaId,
          entidad_tipo: 'venta',
          valor_anterior: ventaDetails
        });
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

  static async getEventoDetallado(eventoId: string) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', eventoId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchEventos(filters: {
    fechaInicio?: string;
    fechaFin?: string;
    tipos?: string[];
    modulos?: string[];
    usuarios?: string[];
    acciones?: string[];
    palabraClave?: string;
    entidadId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('eventos')
      .select('*', { count: 'exact' });

    if (filters.fechaInicio) {
      query = query.gte('created_at', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      query = query.lte('created_at', filters.fechaFin);
    }
    if (filters.tipos && filters.tipos.length > 0) {
      query = query.in('tipo', filters.tipos);
    }
    if (filters.modulos && filters.modulos.length > 0) {
      query = query.in('modulo', filters.modulos);
    }
    if (filters.usuarios && filters.usuarios.length > 0) {
      query = query.in('usuario', filters.usuarios);
    }
    if (filters.acciones && filters.acciones.length > 0) {
      query = query.in('accion', filters.acciones);
    }
    if (filters.palabraClave) {
      query = query.or(
        `descripcion.ilike.%${filters.palabraClave}%,entidad_nombre.ilike.%${filters.palabraClave}%`
      );
    }
    if (filters.entidadId) {
      query = query.eq('entidad_id', filters.entidadId);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50)
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  static async getEventosRelacionados(eventoId: string) {
    const { data, error } = await supabase
      .from('eventos_relacionados')
      .select('*')
      .or(`evento_id.eq.${eventoId},evento_relacionado_id.eq.${eventoId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getEstadisticasAuditoria(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
  }) {
    let ventaInicio = new Date();
    ventaInicio.setHours(0, 0, 0, 0);
    let ventaFin = new Date();
    ventaFin.setHours(23, 59, 59, 999);

    if (filtros?.fechaInicio) {
      ventaInicio = new Date(filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      ventaFin = new Date(filtros.fechaFin);
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('tipo, accion, usuario, severidad, created_at')
      .gte('created_at', ventaInicio.toISOString())
      .lte('created_at', ventaFin.toISOString());

    if (error) throw error;

    const stats = {
      totalEventos: data?.length || 0,
      eventosPorTipo: {} as Record<string, number>,
      eventosPorAccion: {} as Record<string, number>,
      eventosPorUsuario: {} as Record<string, number>,
      eventosPorSeveridad: {} as Record<string, number>,
      eventosPorDia: {} as Record<string, number>
    };

    data?.forEach(evento => {
      stats.eventosPorTipo[evento.tipo] = (stats.eventosPorTipo[evento.tipo] || 0) + 1;
      stats.eventosPorAccion[evento.accion] = (stats.eventosPorAccion[evento.accion] || 0) + 1;
      stats.eventosPorUsuario[evento.usuario] = (stats.eventosPorUsuario[evento.usuario] || 0) + 1;
      stats.eventosPorSeveridad[evento.severidad] = (stats.eventosPorSeveridad[evento.severidad] || 0) + 1;

      const fecha = new Date(evento.created_at).toLocaleDateString('es-ES');
      stats.eventosPorDia[fecha] = (stats.eventosPorDia[fecha] || 0) + 1;
    });

    return stats;
  }

  static async crearRelacionEventos(
    eventoId: string,
    eventoRelacionadoId: string,
    tipoRelacion: 'causa' | 'efecto' | 'cascada' | 'vinculado'
  ) {
    const { data, error } = await supabase
      .from('eventos_relacionados')
      .insert([{
        evento_id: eventoId,
        evento_relacionado_id: eventoRelacionadoId,
        tipo_relacion: tipoRelacion
      }])
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

    this.createEvento({
      tipo: 'Anticipo',
      descripcion: `Anticipo registrado: S/ ${anticipo.monto} - Método: ${anticipo.metodo_pago}`,
      modulo: 'Ventas',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'anticipo',
      valor_nuevo: data
    }).catch(() => {});

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

    const { data: oldData } = await supabase
      .from('anticipos')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'anticipo',
      valor_anterior: oldData,
      valor_nuevo: data
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
      .select('*')
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
      entidad_tipo: 'anticipo',
      valor_anterior: anticipo
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
      entidad_tipo: 'color',
      valor_nuevo: data
    });

    return data;
  }

  static async updateColor(id: string, updates: Partial<{ nombre: string; codigo_color?: string; descripcion?: string }>) {
    const { data: oldData } = await supabase
      .from('colores')
      .select('*')
      .eq('id', id)
      .single();

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
      entidad_tipo: 'color',
      valor_anterior: oldData,
      valor_nuevo: data
    });

    return data;
  }

  static async deleteColor(id: string) {
    const { data: color } = await supabase
      .from('colores')
      .select('*')
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
      entidad_tipo: 'color',
      valor_anterior: color
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

        let descripcion = `Compra - ${venta.detalles?.map((d: any) => d.producto?.nombre).join(', ') || 'Productos'}`;
        if (saldoPendiente > 0) {
          descripcion += ` (Saldo pendiente S/ ${saldoPendiente.toFixed(2)})`;
        }

        movements.push({
          id: venta.id,
          type: 'egreso',
          fecha: venta.fecha_venta,
          monto: montoFinal,
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
        }
      });

      movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      const totalIngreso = movements
        .filter(m => m.type === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);

      const totalEgreso = movements
        .filter(m => m.type === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);

      const neto = totalIngreso - totalEgreso;
      const saldoDisponible = Math.max(0, neto);
      const deudaPendiente = Math.max(0, -neto);

      return {
        movements,
        saldoDisponible,
        deudaPendiente,
        totalIngreso,
        totalEgreso,
        totalAnticiposRegistrados,
        totalComprasCompletas,
        totalDeudasPendientes: deudaPendiente
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

  // NOTAS DE PEDIDO
  static async getNotasPedido() {
    const { data, error } = await supabase
      .from('notas_pedido')
      .select(`
        *,
        cliente:usuarios!notas_pedido_cliente_id_fkey(*),
        vendedor:usuarios!notas_pedido_vendedor_id_fkey(*),
        detalles:notas_pedido_detalle(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as NotaPedido[];
  }

  static async createNotaPedido(
    nota: { cliente_id?: string; vendedor_id?: string; fecha_pedido: string; anticipo_id?: string },
    detalles: { color: string; cantidad: number; nombre_producto?: string }[]
  ) {
    const { data: notaData, error: notaError } = await supabase
      .from('notas_pedido')
      .insert([{ ...nota, estado: 'Pendiente' }])
      .select()
      .single();
    if (notaError) throw notaError;

    const detallesConNota = detalles.map((d, i) => ({
      nota_id: notaData.id,
      color: d.color,
      cantidad: d.cantidad,
      nombre_producto: d.nombre_producto || 'Madejas Crudas',
      estado: 'Pendiente',
      cantidad_asignada: 0,
      orden_posicion: i
    }));
    const { error: detError } = await supabase
      .from('notas_pedido_detalle')
      .insert(detallesConNota);
    if (detError) throw detError;

    this.createEvento({
      tipo: 'NotaPedido',
      descripcion: `Nota de pedido creada`,
      modulo: 'Notas de Pedido',
      accion: 'Crear',
      usuario: this.currentUser || 'Sistema',
      entidad_id: notaData.id,
      entidad_tipo: 'nota_pedido',
      valor_nuevo: notaData
    }).catch(() => {});
    return notaData;
  }

  static async updateNotaPedidoEstado(id: string, estado: 'Pendiente' | 'Terminado') {
    const { error } = await supabase
      .from('notas_pedido')
      .update({ estado })
      .eq('id', id);
    if (error) throw error;
  }

  static async updateNotaPedidoDetalle(id: string, updates: Partial<NotaPedidoDetalle>) {
    const { error } = await supabase
      .from('notas_pedido_detalle')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }

  static async getOrdenNotasPedido(usuarioId: string) {
    const { data, error } = await supabase
      .from('notas_pedido_orden')
      .select('nota_id, posicion')
      .eq('usuario_id', usuarioId)
      .order('posicion');
    if (error) throw error;
    return data || [];
  }

  static async saveOrdenNotasPedido(usuarioId: string, notaIds: string[]) {
    await supabase.from('notas_pedido_orden').delete().eq('usuario_id', usuarioId);
    const rows = notaIds.map((nota_id, i) => ({ usuario_id: usuarioId, nota_id, posicion: i }));
    if (rows.length === 0) return;
    const { error } = await supabase.from('notas_pedido_orden').insert(rows);
    if (error) throw error;
  }

  static async getNotaDeletePreview(notaId: string) {
    // Fetch detalles
    const { data: detalles } = await supabase
      .from('notas_pedido_detalle')
      .select('*')
      .eq('nota_id', notaId);

    const enviados = (detalles || []).filter(d => d.estado === 'Enviado' || d.estado === 'Asignado');

    if (enviados.length === 0) {
      return { hasImpact: false, detalles: detalles || [], programaciones: [], avances: [] };
    }

    // Find programacion rows linked to these detalles
    const detalleIds = enviados.map(d => d.id);
    const { data: origenes } = await supabase
      .from('programacion_origen')
      .select('programacion_id, nota_detalle_id, cantidad_origen')
      .in('nota_detalle_id', detalleIds);

    const progIds = [...new Set((origenes || []).map(o => o.programacion_id))];

    let programaciones: any[] = [];
    if (progIds.length > 0) {
      const { data: progs } = await supabase
        .from('programacion')
        .select('*')
        .in('id', progIds);
      programaciones = progs || [];
    }

    // Find avance linked to these programaciones
    let avances: any[] = [];
    if (progIds.length > 0) {
      const { data: av } = await supabase
        .from('avance')
        .select('*')
        .in('programacion_id', progIds);
      avances = av || [];
    }

    return { hasImpact: true, detalles: detalles || [], programaciones, avances, origenes: origenes || [] };
  }

  static async deleteNotaPedido(notaId: string) {
    // 1. Get detalles
    const { data: detalles } = await supabase
      .from('notas_pedido_detalle')
      .select('id, estado')
      .eq('nota_id', notaId);

    const detalleIds = (detalles || []).map(d => d.id);

    if (detalleIds.length > 0) {
      // 2. Find programacion_origen rows for these detalles
      const { data: origenes } = await supabase
        .from('programacion_origen')
        .select('programacion_id, nota_detalle_id, cantidad_origen')
        .in('nota_detalle_id', detalleIds);

      const progIds = [...new Set((origenes || []).map(o => o.programacion_id))];

      // 3. Delete avance_asignaciones linked to these detalles
      await supabase.from('avance_asignaciones').delete().in('nota_detalle_id', detalleIds);

      // 4. Delete programacion_origen rows
      await supabase.from('programacion_origen').delete().in('nota_detalle_id', detalleIds);

      if (progIds.length > 0) {
        // 5. For each programacion: check if it still has other origins; if none, delete it; otherwise update quantities
        for (const progId of progIds) {
          const { data: remaining } = await supabase
            .from('programacion_origen')
            .select('cantidad_origen')
            .eq('programacion_id', progId);

          if (!remaining || remaining.length === 0) {
            // Delete avance linked to this programacion
            await supabase.from('avance').delete().eq('programacion_id', progId);
            // Delete the programacion row
            await supabase.from('programacion').delete().eq('id', progId);
          } else {
            // Recalculate totals
            const newTotal = remaining.reduce((s: number, r: any) => s + r.cantidad_origen, 0);
            await supabase.from('programacion').update({
              cantidad_total: newTotal,
              cantidad_pendiente: newTotal
            }).eq('id', progId);
          }
        }
      }

      // 6. Delete notas_pedido_detalle
      await supabase.from('notas_pedido_detalle').delete().eq('nota_id', notaId);
    }

    // 7. Delete orden entries
    await supabase.from('notas_pedido_orden').delete().eq('nota_id', notaId);

    // 8. Delete the nota itself
    const { error } = await supabase.from('notas_pedido').delete().eq('id', notaId);
    if (error) throw error;

    this.createEvento({
      tipo: 'NotaPedido',
      descripcion: `Nota de pedido eliminada (ID: ${notaId})`,
      modulo: 'Notas de Pedido',
      accion: 'Eliminar',
      usuario: this.currentUser || 'Sistema',
      entidad_id: notaId,
      entidad_tipo: 'nota_pedido'
    }).catch(() => {});
  }

  // PROGRAMACION
  static async getProgramacion() {
    const { data, error } = await supabase
      .from('programacion')
      .select('*')
      .order('fecha_envio', { ascending: false });
    if (error) throw error;
    return (data || []) as Programacion[];
  }

  static async getProgramacionConUsuarios() {
    const { data: progs, error } = await supabase
      .from('programacion')
      .select('*')
      .order('fecha_envio', { ascending: false });
    if (error) throw error;

    const result = await Promise.all((progs || []).map(async (p) => {
      const { data: origenes } = await supabase
        .from('programacion_origen')
        .select(`nota_detalle:notas_pedido_detalle(nota_id)`)
        .eq('programacion_id', p.id);

      const notaIds = new Set(
        (origenes || []).map((o: any) => o.nota_detalle?.nota_id).filter(Boolean)
      );

      const { data: notas } = await supabase
        .from('notas_pedido')
        .select('cliente_id')
        .in('id', Array.from(notaIds));

      const clienteIds = new Set((notas || []).map((n: any) => n.cliente_id).filter(Boolean));

      return { ...p, usuarios_count: clienteIds.size } as Programacion;
    }));
    return result;
  }

  static async procesarDetallesAProgramacion(detalleIds: string[]) {
    for (const detalleId of detalleIds) {
      const { data: detalle } = await supabase
        .from('notas_pedido_detalle')
        .select('*')
        .eq('id', detalleId)
        .maybeSingle();

      if (!detalle) continue;

      // Find active programacion for this color (EnProceso or Pendiente)
      const { data: existing } = await supabase
        .from('programacion')
        .select('*')
        .eq('color', detalle.color)
        .in('estado', ['EnProceso', 'Pendiente'])
        .maybeSingle();

      let progId: string;
      if (existing) {
        const newTotal = existing.cantidad_total + detalle.cantidad;
        const newPending = existing.cantidad_pendiente + detalle.cantidad;
        await supabase
          .from('programacion')
          .update({ cantidad_total: newTotal, cantidad_pendiente: newPending })
          .eq('id', existing.id);
        progId = existing.id;
      } else {
        const { data: newProg, error } = await supabase
          .from('programacion')
          .insert([{
            color: detalle.color,
            cantidad_total: detalle.cantidad,
            cantidad_pendiente: detalle.cantidad,
            estado: 'EnProceso'
          }])
          .select()
          .single();
        if (error) throw error;
        progId = newProg.id;
      }

      await supabase.from('programacion_origen').insert([{
        programacion_id: progId,
        nota_detalle_id: detalleId,
        cantidad_origen: detalle.cantidad
      }]);

      await supabase
        .from('notas_pedido_detalle')
        .update({ estado: 'Enviado' })
        .eq('id', detalleId);
    }

    this.createEvento({
      tipo: 'Programacion',
      descripcion: `${detalleIds.length} producto(s) enviados a programación`,
      modulo: 'Notas de Pedido',
      accion: 'Enviar a Programacion',
      usuario: this.currentUser || 'Sistema'
    }).catch(() => {});
  }

  static async updateProgramacionEstado(id: string, estado: Programacion['estado']) {
    const updates: any = { estado };
    if (estado === 'Completado') updates.fecha_completado = new Date().toISOString();
    const { error } = await supabase.from('programacion').update(updates).eq('id', id);
    if (error) throw error;
  }

  // AVANCE
  static async getAvanceDisponible() {
    const { data, error } = await supabase
      .from('avance')
      .select('*, trabajador:usuarios(*)')
      .gt('cantidad_disponible', 0)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Fetch programacion metadata for veteado detection (TICKET-05)
    const progIds = [...new Set((data || []).map((a: any) => a.programacion_id).filter(Boolean))];
    let progMap: Record<string, { es_veteado: boolean; estado: string }> = {};
    if (progIds.length > 0) {
      const { data: progs } = await supabase
        .from('programacion')
        .select('id, es_veteado, estado')
        .in('id', progIds);
      (progs || []).forEach((p: any) => {
        progMap[p.id] = { es_veteado: p.es_veteado || false, estado: p.estado };
      });
    }

    const avancesWithProg = (data || []).map((av: any) => ({
      ...av,
      programacion: av.programacion_id ? progMap[av.programacion_id] : undefined
    }));

    return avancesWithProg as Avance[];
  }

  static async getAvancePorColor(color: string) {
    const { data, error } = await supabase
      .from('avance')
      .select('*')
      .eq('color', color)
      .gt('cantidad_disponible', 0);
    if (error) throw error;
    const total = (data || []).reduce((s, r) => s + r.cantidad_disponible, 0);
    return total;
  }

  static async registrarAvanceTrabajador(programacionId: string, color: string, cantidad: number, trabajadorId: string) {
    const { data: prog, error: pe } = await supabase
      .from('programacion')
      .select('*')
      .eq('id', programacionId)
      .maybeSingle();
    if (pe) throw pe;
    if (!prog) throw new Error('Programación no encontrada');

    const nuevoPendiente = Math.max(0, prog.cantidad_pendiente - cantidad);
    const updates: any = { cantidad_pendiente: nuevoPendiente };
    if (nuevoPendiente === 0) {
      updates.estado = 'Completado';
      updates.fecha_completado = new Date().toISOString();
    }
    await supabase.from('programacion').update(updates).eq('id', programacionId);

    // Add to avance inventory
    const { data: existing } = await supabase
      .from('avance')
      .select('*')
      .eq('color', color)
      .eq('programacion_id', programacionId)
      .maybeSingle();

    if (existing) {
      await supabase.from('avance').update({
        cantidad_disponible: existing.cantidad_disponible + cantidad
      }).eq('id', existing.id);
    } else {
      await supabase.from('avance').insert([{
        color,
        cantidad_disponible: cantidad,
        trabajador_id: trabajadorId,
        programacion_id: programacionId
      }]);
    }

    this.createEvento({
      tipo: 'Avance',
      descripcion: `Avance registrado: ${cantidad} de color ${color}`,
      modulo: 'Procesos',
      accion: 'Registrar Avance',
      usuario: this.currentUser || 'Sistema',
      entidad_id: programacionId,
      entidad_tipo: 'programacion'
    }).catch(() => {});
  }

  static async asignarAvanceACliente(params: {
    color: string;
    cantidad: number;
    nota_detalle_id: string;
    tipo_producto: 'Crudas' | 'Reteñidas';
    descripcion?: string;
    asignado_por_id?: string;
    cliente_nombre?: string;
  }) {
    // Descontar del avance disponible por color
    const { data: avances } = await supabase
      .from('avance')
      .select('*')
      .eq('color', params.color)
      .gt('cantidad_disponible', 0)
      .order('created_at');

    let pendiente = params.cantidad;
    for (const av of avances || []) {
      if (pendiente <= 0) break;
      const restar = Math.min(av.cantidad_disponible, pendiente);
      const nuevo = av.cantidad_disponible - restar;
      await supabase.from('avance').update({ cantidad_disponible: nuevo }).eq('id', av.id);
      pendiente -= restar;
    }

    // TICKET-A: la cantidad en inventario es el doble de la trabajada
    const cantidadInventario = params.cantidad * 2;

    const { data: nuevoProducto, error: pe } = await supabase
      .from('productos')
      .insert([{
        nombre: params.tipo_producto === 'Crudas' ? 'Madejas Crudas' : 'Madejas Reteñidas',
        color: params.color,
        estado: 'Por Devanar',
        precio_base: 0,
        precio_uni: 0,
        stock: 0,
        cantidad: cantidadInventario,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        descripcion: params.descripcion || ''
      }])
      .select()
      .single();
    if (pe) throw pe;

    // Registrar asignación (cantidad original, no doblada)
    await supabase.from('avance_asignaciones').insert([{
      color: params.color,
      cantidad: params.cantidad,
      nota_detalle_id: params.nota_detalle_id,
      tipo_producto: params.tipo_producto,
      descripcion: params.descripcion || '',
      inventario_producto_id: nuevoProducto.id,
      asignado_por: params.asignado_por_id,
      fecha: new Date().toISOString()
    }]);

    // Actualizar detalle de nota
    const { data: detalle } = await supabase
      .from('notas_pedido_detalle')
      .select('*')
      .eq('id', params.nota_detalle_id)
      .maybeSingle();

    if (detalle) {
      const nuevaCantAsignada = (detalle.cantidad_asignada || 0) + params.cantidad;
      const nuevoEstado = nuevaCantAsignada >= detalle.cantidad ? 'Asignado' : 'Enviado';
      await supabase.from('notas_pedido_detalle').update({
        cantidad_asignada: nuevaCantAsignada,
        estado: nuevoEstado
      }).eq('id', params.nota_detalle_id);

      // Check if whole nota is done
      if (nuevoEstado === 'Asignado') {
        const { data: allDetalles } = await supabase
          .from('notas_pedido_detalle')
          .select('estado')
          .eq('nota_id', detalle.nota_id);

        const allDone = (allDetalles || []).every(d => d.estado === 'Asignado');
        if (allDone) {
          await supabase.from('notas_pedido').update({ estado: 'Terminado' }).eq('id', detalle.nota_id);
        }
      }
    }

    this.createEvento({
      tipo: 'Producto',
      descripcion: `Avance → Inventario: ${params.cantidad} trabajadas → ${cantidadInventario} madejas de color ${params.color} (×2)`,
      modulo: 'Inventario',
      accion: 'ingreso_desde_avance',
      usuario: this.currentUser || 'Sistema',
      entidad_id: nuevoProducto.id,
      entidad_tipo: 'producto',
      severidad: 'info',
      valor_nuevo: { ...nuevoProducto, cantidad_original: params.cantidad, cantidad_inventario: cantidadInventario }
    }).catch(() => {});

    return nuevoProducto;
  }

  // TICKET-B / TICKET-BUG: devuelve Map<color, cantidad_total_pendiente_de_clientes>.
  // Usar la suma como cap de "Trabajadas" evita mostrar acumulaciones históricas del avance.
  static async getColoresConClientesPendientes(): Promise<Map<string, number>> {
    const { data, error } = await supabase
      .from('notas_pedido_detalle')
      .select('color, cantidad, cantidad_asignada, nota:notas_pedido!inner(estado)')
      .eq('estado', 'Enviado');
    if (error) throw error;

    const coloresPendientes = new Map<string, number>();
    (data || []).forEach((d: any) => {
      if (
        d.nota?.estado === 'Pendiente' &&
        (d.cantidad - (d.cantidad_asignada || 0)) > 0
      ) {
        const pendiente = d.cantidad - (d.cantidad_asignada || 0);
        coloresPendientes.set(d.color, (coloresPendientes.get(d.color) || 0) + pendiente);
      }
    });
    return coloresPendientes;
  }

  static async getClientesConColorPendiente(color: string) {
    const { data, error } = await supabase
      .from('notas_pedido_detalle')
      .select(`
        id,
        cantidad,
        cantidad_asignada,
        color,
        nota:notas_pedido(
          id,
          estado,
          cliente:usuarios!notas_pedido_cliente_id_fkey(id, nombre)
        )
      `)
      .eq('color', color)
      .eq('estado', 'Enviado');

    if (error) throw error;

    return (data || [])
      .filter((d: any) => d.nota?.estado === 'Pendiente' && d.nota?.cliente)
      .map((d: any) => ({
        nota_detalle_id: d.id,
        cantidad_solicitada: d.cantidad - (d.cantidad_asignada || 0),
        cantidad_total: d.cantidad,
        cantidad_asignada: d.cantidad_asignada || 0,
        color: d.color,
        cliente_id: d.nota?.cliente?.id,
        cliente_nombre: d.nota?.cliente?.nombre,
        nota_id: d.nota?.id
      }))
      .filter((d: any) => d.cantidad_solicitada > 0);
  }

  // TICKET-05 — Conos Veteados (reproceso)
  static async createReprocesoProgramacion(params: {
    color: string;
    cantidad: number;
    descripcion?: string;
  }) {
    const { data, error } = await supabase
      .from('programacion')
      .insert([{
        color: params.color,
        cantidad_total: params.cantidad,
        cantidad_pendiente: params.cantidad,
        estado: 'EnProceso',
        es_veteado: true
      }])
      .select()
      .single();
    if (error) throw error;

    this.createEvento({
      tipo: 'Programacion',
      descripcion: `Reproceso veteado creado: ${params.cantidad} uds de color ${params.color}`,
      modulo: 'Programacion',
      accion: 'crear_reproceso_veteado',
      usuario: this.currentUser || 'Sistema',
      entidad_id: data.id,
      entidad_tipo: 'programacion',
      severidad: 'info',
      valor_nuevo: data
    }).catch(() => {});

    return data as Programacion;
  }

  static async enviarVeteadoAInventario(params: {
    color: string;
    cantidadOriginal: number;
    descripcion?: string;
    programacionId: string;
  }) {
    const cantidadFinal = params.cantidadOriginal * 2;

    // Zerear todos los avances de esa programación para que no reaparezcan
    const { data: avances } = await supabase
      .from('avance')
      .select('id')
      .eq('programacion_id', params.programacionId);
    for (const av of avances || []) {
      await supabase.from('avance').update({ cantidad_disponible: 0 }).eq('id', av.id);
    }

    // Crear producto en inventario con cantidad × 2
    const { data: nuevoProducto, error: pe } = await supabase
      .from('productos')
      .insert([{
        nombre: 'Madejas Reteñidas',
        color: params.color,
        estado: 'Por Devanar',
        precio_base: 0,
        precio_uni: 0,
        stock: 0,
        cantidad: cantidadFinal,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        descripcion: params.descripcion || ''
      }])
      .select()
      .single();
    if (pe) throw pe;

    this.createEvento({
      tipo: 'Producto',
      descripcion: `Cono veteado enviado al inventario: ${cantidadFinal} uds de color ${params.color} (${params.cantidadOriginal} × 2)`,
      modulo: 'Inventario',
      accion: 'ingreso_veteado_directo',
      usuario: this.currentUser || 'Sistema',
      entidad_id: nuevoProducto.id,
      entidad_tipo: 'producto',
      severidad: 'info',
      valor_nuevo: nuevoProducto
    }).catch(() => {});

    return nuevoProducto;
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

  // Consume anticipos reales disponibles del cliente (FIFO por fecha_anticipo)
  // para pagar las ventas seleccionadas. A diferencia de aplicarAnticipoADeudas,
  // no recibe un anticipoId ni un monto agregado: los deriva de los anticipos
  // reales con venta_id = NULL, para que cada aplicación quede rastreable
  // (evento 'Aplicación Automática de Anticipo' con el id real del anticipo).
  static async aplicarAnticiposDisponiblesADeudas(
    clienteId: string,
    ventasIds: string[],
    usuarioActual: string = 'Sistema'
  ) {
    const { data, error } = await supabase
      .rpc('aplicar_anticipos_disponibles_a_deudas', {
        p_cliente_id: clienteId,
        p_ventas_ids: ventasIds,
        p_usuario_actual: usuarioActual
      });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Error al aplicar anticipos a deudas');
    return data;
  }
}