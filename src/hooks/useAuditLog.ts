import { useUser } from '../contexts/UserContext';
import { SupabaseService } from '../services/supabaseService';

export const useAuditLog = () => {
  const { currentUser } = useUser();

  const getSeveridadPorAccion = (tipo: string, accion?: string): 'info' | 'warning' | 'error' | 'critical' => {
    if (accion === 'Eliminar') {
      return tipo === 'Usuario' || tipo === 'Producto' ? 'critical' : 'error';
    }
    if (accion === 'Actualizar Stock' || accion === 'Aplicación Automática') {
      return 'warning';
    }
    return 'info';
  };

  const logEvent = async (
    tipo: string,
    descripcion: string,
    modulo?: string,
    accion?: string,
    entidadId?: string,
    entidadTipo?: string,
    detalles?: any,
    valorAnterior?: any,
    valorNuevo?: any,
    entidadNombre?: string
  ) => {
    try {
      const severidad = getSeveridadPorAccion(tipo, accion);

      const eventoData = {
        tipo,
        descripcion,
        usuario: currentUser?.nombre || 'Sistema',
        modulo,
        accion,
        entidad_id: entidadId,
        entidad_tipo: entidadTipo,
        ip_address: undefined,
        detalles: detalles ? JSON.stringify(detalles) : undefined,
        valor_anterior: valorAnterior ? JSON.stringify(valorAnterior) : undefined,
        valor_nuevo: valorNuevo ? JSON.stringify(valorNuevo) : undefined,
        estado_anterior_texto: valorAnterior ? JSON.stringify(valorAnterior, null, 2) : undefined,
        estado_nuevo_texto: valorNuevo ? JSON.stringify(valorNuevo, null, 2) : undefined,
        severidad,
        entidad_nombre: entidadNombre,
        metadata: {
          navigador: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString()
        } as any
      };

      const evento = await SupabaseService.createEvento(eventoData);

      return evento;
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  const logEventWithRelated = async (
    tipo: string,
    descripcion: string,
    modulo?: string,
    accion?: string,
    entidadId?: string,
    entidadTipo?: string,
    detalles?: any,
    eventoRelacionadoId?: string,
    tipoRelacion?: 'causa' | 'efecto' | 'cascada' | 'vinculado'
  ) => {
    try {
      const evento = await logEvent(
        tipo,
        descripcion,
        modulo,
        accion,
        entidadId,
        entidadTipo,
        detalles
      );

      if (evento && eventoRelacionadoId && tipoRelacion) {
        await SupabaseService.crearRelacionEventos(
          evento.id,
          eventoRelacionadoId,
          tipoRelacion
        );
      }

      return evento;
    } catch (error) {
      console.error('Error logging event with relations:', error);
    }
  };

  return { logEvent, logEventWithRelated };
};
