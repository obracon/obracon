// src/services/dashboardService.ts
import { supabase } from '../config/supabaseClient';

export interface GeneralKpi {
  id: string;
  kpi_name: string;
  kpi_value: number;
  target_value?: number | null;
  unit?: string | null;
  last_updated: string;
  description?: string | null;
  created_at: string;
}

export interface KpiHistoricalData {
  id: string;
  kpi_id: string;
  record_date: string;
  value: number;
  created_at: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export interface SystemAlert {
  id: string;
  alert_message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string | null;
  acknowledged_by?: string | null;
  details?: Record<string, any> | null;
}

export interface KpiConfiguration {
  id: string;
  kpi_name: string;
  config_details: Record<string, any>;
  last_updated_by: string;
  updated_at: string;
  created_at: string;
}

export const fetchGeneralKpis = async (): Promise<GeneralKpi[]> => {
  const { data, error } = await supabase
    .from('general_kpis')
    .select('*')
    .order('kpi_name', { ascending: true });

  if (error) {
    console.error('Error fetching general KPIs:', error.message);
    throw new Error(`Failed to fetch general KPIs: ${error.message}`);
  }
  return data || [];
};

export const fetchKpiHistoricalData = async (kpiId: string): Promise<KpiHistoricalData[]> => {
  const { data, error } = await supabase
    .from('kpi_historical_data')
    .select('*')
    .eq('kpi_id', kpiId)
    .order('record_date', { ascending: false });

  if (error) {
    console.error(`Error fetching historical data for KPI ${kpiId}:`, error.message);
    throw new Error(`Failed to fetch historical data for KPI ${kpiId}: ${error.message}`);
  }
  return data || [];
};

export const fetchSystemAlerts = async (): Promise<SystemAlert[]> => {
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching system alerts:', error.message);
    throw new Error(`Failed to fetch system alerts: ${error.message}`);
  }
  return data || [];
};

export const updateSystemAlertStatus = async (
    alertId: string,
    status: AlertStatus,
    userId: string
): Promise<SystemAlert> => {
    const updatePayload: {
      status: AlertStatus;
      acknowledged_by?: string;
      resolved_at?: string;
    } = { status };

    if (status === 'acknowledged' || status === 'resolved') {
        updatePayload.acknowledged_by = userId;
        // Also update resolved_at if the new status is 'resolved'
        if (status === 'resolved') {
            updatePayload.resolved_at = new Date().toISOString();
        }
    }
    // If reverting to 'new', clear acknowledged_by and resolved_at
    // This logic might need refinement based on exact requirements
    else if (status === 'new') {
        updatePayload.acknowledged_by = undefined; // Or null
        updatePayload.resolved_at = undefined; // Or null
    }


    const { data, error } = await supabase
        .from('system_alerts')
        .update(updatePayload)
        .eq('id', alertId)
        .select()
        .single();

    if (error) {
        console.error(`Error updating alert ${alertId}:`, error.message);
        throw new Error(`Failed to update alert ${alertId}: ${error.message}`);
    }
    if (!data) {
        throw new Error(`No data returned after updating alert ${alertId}`);
    }
    return data;
};

export const fetchKpiConfigurations = async (): Promise<KpiConfiguration[]> => {
  const { data, error } = await supabase
    .from('kpi_configurations')
    .select('*')
    .order('kpi_name', { ascending: true });

  if (error) {
    console.error('Error fetching KPI configurations:', error.message);
    throw new Error(`Failed to fetch KPI configurations: ${error.message}`);
  }
  return data || [];
};

export const upsertKpiConfiguration = async (
    config: Partial<KpiConfiguration> & { kpi_name: string; config_details: any },
    adminUserId: string
): Promise<KpiConfiguration> => {
    const payload: any = {
        ...config,
        last_updated_by: adminUserId,
        updated_at: new Date().toISOString(),
    };
    if (!config.id) { // If it's a new configuration (no id)
        payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('kpi_configurations')
        .upsert(payload, { onConflict: 'kpi_name' })
        .select()
        .single();

    if (error) {
        console.error('Error upserting KPI configuration:', error.message);
        throw new Error(`Failed to upsert KPI configuration: ${error.message}`);
    }
     if (!data) {
        throw new Error(`No data returned after upserting KPI configuration`);
    }
    return data;
};

export const deleteKpiConfiguration = async (kpiConfigId: string): Promise<void> => {
    const { error, count } = await supabase
        .from('kpi_configurations')
        .delete()
        .eq('id', kpiConfigId);

    if (error) {
        console.error(`Error deleting KPI configuration ${kpiConfigId}:`, error.message);
        throw new Error(`Failed to delete KPI configuration ${kpiConfigId}: ${error.message}`);
    }
    if (count === 0) {
        console.warn(`No KPI configuration found with ID ${kpiConfigId} to delete.`);
    }
};

export const exportGeneralDashboardData = async (): Promise<string> => {
  console.log('Fetching data for CSV export...');
  const kpis = await fetchGeneralKpis();

  if (kpis.length === 0) {
    return "Nenhum dado para exportar.";
  }

  const header = Object.keys(kpis[0]).join(',');
  const rows = kpis.map(kpi => {
    // Iterate over values in the order of headers
    return Object.keys(kpis[0]).map(key => {
      // @ts-ignore
      const value = kpi[key];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`; // Enclose strings with commas in quotes
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value !== null && value !== undefined ? value : ''; // Handle null/undefined as empty string
    }).join(',');
  });

  return `${header}\n${rows.join('\n')}`;
};
