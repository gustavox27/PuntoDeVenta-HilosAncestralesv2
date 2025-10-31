import { supabase } from '../lib/supabase';
import { Usuario, Producto, Venta, VentaDetalle, Evento, Anticipo } from '../types';

export class SupabaseService {
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

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.createEvento({
      tipo: 'Usuario',
      descripcion: `Usuario eliminado: ${usuario?.nombre || 'Desconocido'}${deleteRelatedData ? ' (con datos relacionados)' : ''}`,
      modulo: 'Usuarios',
      accion: 'Eliminar',
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
      entidad_id: id,
      entidad_tipo: 'producto'
    });

    return data;
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
        usuario: venta.vendedor,
        entidad_id: ventaData.id,
        entidad_tipo: 'venta'
      });

      return { ...ventaData, detalles: detallesData };
    } catch (error) {
      throw error;
    }
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
      .order('fecha_anticipo', { ascending: false });

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

    await this.createEvento({
      tipo: 'Anticipo',
      descripcion: `Anticipo registrado: S/ ${anticipo.monto} - Método: ${anticipo.metodo_pago}`,
      modulo: 'Ventas',
      accion: 'Crear',
      entidad_id: data.id,
      entidad_tipo: 'anticipo'
    });

    return data;
  }

  static async updateAnticipo(id: string, updates: Partial<Anticipo>) {
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
      entidad_id: id,
      entidad_tipo: 'anticipo'
    });

    return data;
  }

  static async deleteAnticipo(id: string) {
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
}