import { supabase } from '../lib/supabase';

export interface RetentionConfig {
  id: string;
  retention_months: number;
  alert_days_before: number;
  auto_delete_enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface RetentionAlert {
  id: string;
  user_id: string;
  alert_type: 'retention_warning' | 'export_ready' | 'deletion_complete';
  evento_count: number;
  date_range_start: string;
  date_range_end: string;
  status: 'pending' | 'acknowledged' | 'exported' | 'deleted';
  exported_at: string | null;
  export_filename: string | null;
  deleted_at: string | null;
  created_at: string;
  acknowledged_at: string | null;
}

export interface AuditExport {
  id: string;
  exported_by: string;
  export_type: 'pdf' | 'excel';
  filename: string;
  event_count: number;
  date_range_start: string;
  date_range_end: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface RetentionEligibleEvent {
  evento_id: string;
  created_at: string;
  retention_date: string;
  days_until_deletion: number;
  tipo: string;
  usuario: string;
  descripcion: string;
}

export class AuditRetentionService {
  static async getRetentionConfig(): Promise<RetentionConfig> {
    const { data, error } = await supabase
      .from('audit_retention_config')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        id: '',
        retention_months: 3,
        alert_days_before: 15,
        auto_delete_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'System'
      };
    }

    return data;
  }

  static async updateRetentionConfig(
    retentionMonths: number,
    alertDaysBefore: number,
    autoDeleteEnabled: boolean,
    updatedBy: string
  ): Promise<RetentionConfig> {
    const { data, error } = await supabase
      .from('audit_retention_config')
      .update({
        retention_months: retentionMonths,
        alert_days_before: alertDaysBefore,
        auto_delete_enabled: autoDeleteEnabled,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', (await this.getRetentionConfig()).id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getRetentionEligibleEvents(daysThreshold?: number): Promise<RetentionEligibleEvent[]> {
    const threshold = daysThreshold ?? 15;

    const { data, error } = await supabase.rpc(
      'get_retention_eligible_events',
      { p_days_threshold: threshold }
    );

    if (error) throw error;
    return data || [];
  }

  static async getRetentionSummary() {
    const config = await this.getRetentionConfig();
    const eligibleEvents = await this.getRetentionEligibleEvents(config.alert_days_before);

    const { data: alertCount } = await supabase
      .from('audit_alerts')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    const { data: recentExports } = await supabase
      .from('audit_exports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      config,
      eligibleEvents: eligibleEvents || [],
      pendingAlerts: alertCount || 0,
      recentExports: recentExports || []
    };
  }

  static async createRetentionAlert(
    userId: string,
    alertType: 'retention_warning' | 'export_ready' | 'deletion_complete',
    eventoCount: number,
    dateRangeStart: string,
    dateRangeEnd: string
  ): Promise<RetentionAlert> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .insert([
        {
          user_id: userId,
          alert_type: alertType,
          evento_count: eventoCount,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async acknowledgeAlert(alertId: string): Promise<RetentionAlert> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAlertAsExported(alertId: string, filename: string): Promise<RetentionAlert> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .update({
        status: 'exported',
        exported_at: new Date().toISOString(),
        export_filename: filename
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAlertAsDeleted(alertId: string): Promise<RetentionAlert> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingAlerts(userId: string): Promise<RetentionAlert[]> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAlertHistory(userId: string, limit: number = 50): Promise<RetentionAlert[]> {
    const { data, error } = await supabase
      .from('audit_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async recordExport(
    exportedBy: string,
    exportType: 'pdf' | 'excel',
    filename: string,
    eventCount: number,
    dateRangeStart: string,
    dateRangeEnd: string,
    fileSizeBytes?: number
  ): Promise<AuditExport> {
    const { data, error } = await supabase
      .from('audit_exports')
      .insert([
        {
          exported_by: exportedBy,
          export_type: exportType,
          filename,
          event_count: eventCount,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
          file_size_bytes: fileSizeBytes || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getExportHistory(limit: number = 50): Promise<AuditExport[]> {
    const { data, error } = await supabase
      .from('audit_exports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async markEventsAsExported(eventIds: string[], alertId: string): Promise<void> {
    const exportedAt = new Date().toISOString();

    for (const eventId of eventIds) {
      const { error } = await supabase
        .from('eventos')
        .update({ exported_at: exportedAt })
        .eq('id', eventId);

      if (error) throw error;
    }

    await this.markAlertAsExported(alertId, `export-${alertId}`);
  }

  static async getExportedEventsSummary() {
    const { data, error } = await supabase
      .from('eventos')
      .select('exported_at', { count: 'exact' })
      .not('exported_at', 'is', null);

    if (error) throw error;
    return data;
  }
}
