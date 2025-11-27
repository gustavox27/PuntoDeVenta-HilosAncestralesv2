import { supabase } from '../lib/supabase';
import { AuditRetentionService } from './auditRetentionService';

export interface DeletionRecord {
  id: string;
  deleted_by: string;
  deleted_count: number;
  date_range_start: string;
  date_range_end: string;
  export_id: string | null;
  deleted_at: string;
  verification_hash: string | null;
}

export class AuditCleanupService {
  static async getReadyForDeletionEvents(daysOverdue: number = 0) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysOverdue);

    const { data, error } = await supabase
      .from('eventos')
      .select('id, created_at, retention_date, tipo, usuario, descripcion')
      .eq('event_status', 'active')
      .lte('retention_date', targetDate.toISOString().split('T')[0])
      .not('exported_at', 'is', null)
      .order('retention_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async markEventsForDeletion(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    const { error } = await supabase
      .from('eventos')
      .update({ event_status: 'marked_for_deletion' })
      .in('id', eventIds);

    if (error) throw error;
  }

  static async deleteMarkedEvents(
    deletedBy: string,
    alertId?: string,
    batchSize: number = 100
  ): Promise<DeletionRecord> {
    const readyEvents = await this.getReadyForDeletionEvents(0);
    const eventIds = readyEvents.map(e => e.id);

    if (eventIds.length === 0) {
      throw new Error('No hay eventos marcados para eliminación');
    }

    let totalDeleted = 0;
    let dateRangeStart = readyEvents[readyEvents.length - 1]?.created_at;
    let dateRangeEnd = readyEvents[0]?.created_at;

    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batch = eventIds.slice(i, i + batchSize);

      const { error } = await supabase
        .from('eventos')
        .update({ event_status: 'deleted' })
        .in('id', batch);

      if (error) throw error;
      totalDeleted += batch.length;
    }

    const verificationHash = this.generateVerificationHash({
      deletedCount: totalDeleted,
      deletedBy,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('audit_deletions')
      .insert([
        {
          deleted_by: deletedBy,
          deleted_count: totalDeleted,
          date_range_start: dateRangeStart?.split('T')[0],
          date_range_end: dateRangeEnd?.split('T')[0],
          export_id: alertId || null,
          deleted_at: new Date().toISOString(),
          verification_hash: verificationHash
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (alertId) {
      await AuditRetentionService.markAlertAsDeleted(alertId);
    }

    return data;
  }

  static async getDeletionHistory(limit: number = 50): Promise<DeletionRecord[]> {
    const { data, error } = await supabase
      .from('audit_deletions')
      .select('*')
      .order('deleted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getDeletionStats() {
    const { data: deletionData, error: deletionError } = await supabase
      .from('audit_deletions')
      .select('deleted_count, deleted_at');

    if (deletionError) throw deletionError;

    const { data: deletedEventsCount, error: countError } = await supabase
      .from('eventos')
      .select('*', { count: 'exact' })
      .eq('event_status', 'deleted');

    if (countError) throw countError;

    const totalDeleted = (deletionData || []).reduce((sum, record) => sum + record.deleted_count, 0);

    return {
      totalDeletions: (deletionData || []).length,
      totalDeletedEvents: totalDeleted,
      deletedEventsInDb: deletedEventsCount || 0
    };
  }

  static async softDeleteEvent(
    eventId: string,
    reason: string = 'Retention policy'
  ): Promise<void> {
    const { error } = await supabase
      .from('eventos')
      .update({
        event_status: 'deleted',
        descripcion: `${reason} - Original: [DELETED RECORD]`
      })
      .eq('id', eventId);

    if (error) throw error;
  }

  static async hardDeleteEvent(eventId: string): Promise<void> {
    const { error: relatedError } = await supabase
      .from('eventos_relacionados')
      .delete()
      .or(`evento_id.eq.${eventId},evento_relacionado_id.eq.${eventId}`);

    if (relatedError) throw relatedError;

    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  static async getDeletedEventsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('eventos')
      .select('*', { count: 'exact' })
      .eq('event_status', 'deleted');

    if (error) throw error;
    return count || 0;
  }

  static async getMarkedForDeletionCount(): Promise<number> {
    const { count, error } = await supabase
      .from('eventos')
      .select('*', { count: 'exact' })
      .eq('event_status', 'marked_for_deletion');

    if (error) throw error;
    return count || 0;
  }

  static async verifyIntegrity(deletionRecord: DeletionRecord): Promise<boolean> {
    if (!deletionRecord.verification_hash) return false;

    const calculatedHash = this.generateVerificationHash({
      deletedCount: deletionRecord.deleted_count,
      deletedBy: deletionRecord.deleted_by,
      timestamp: deletionRecord.deleted_at
    });

    return calculatedHash === deletionRecord.verification_hash;
  }

  private static generateVerificationHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  static async postponeDeletion(eventIds: string[], daysToPostpone: number = 7): Promise<void> {
    const newRetentionDate = new Date();
    newRetentionDate.setDate(newRetentionDate.getDate() + daysToPostpone);

    const { error } = await supabase
      .from('eventos')
      .update({
        retention_date: newRetentionDate.toISOString().split('T')[0],
        event_status: 'active'
      })
      .in('id', eventIds)
      .eq('event_status', 'marked_for_deletion');

    if (error) throw error;
  }
}
