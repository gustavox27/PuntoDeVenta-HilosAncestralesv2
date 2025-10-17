import { useUser } from '../contexts/UserContext';
import { SupabaseService } from '../services/supabaseService';

export const useAuditLog = () => {
  const { currentUser } = useUser();

  const logEvent = async (
    tipo: string,
    descripcion: string,
    modulo?: string,
    accion?: string,
    entidadId?: string,
    entidadTipo?: string,
    detalles?: any
  ) => {
    try {
      await SupabaseService.createEvento({
        tipo,
        descripcion,
        usuario: currentUser?.nombre || 'Sistema',
        modulo,
        accion,
        entidad_id: entidadId,
        entidad_tipo: entidadTipo,
        ip_address: undefined,
        detalles: detalles ? JSON.stringify(detalles) : undefined
      });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  return { logEvent };
};
