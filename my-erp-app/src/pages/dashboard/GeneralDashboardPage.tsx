// src/pages/dashboard/GeneralDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/roles';
import KpiCard from '../../components/dashboard/KpiCard';
import KpiChart from '../../components/dashboard/KpiChart';
import AlertsList, { AlertItem as AlertItemType } from '../../components/dashboard/AlertsList'; // Import AlertItemType
import {
  fetchGeneralKpis,
  fetchKpiHistoricalData,
  fetchSystemAlerts,
  updateSystemAlertStatus,
  fetchKpiConfigurations,
  upsertKpiConfiguration,
  deleteKpiConfiguration,
  exportGeneralDashboardData,
  GeneralKpi,
  KpiHistoricalData,
  SystemAlert, // This is the interface for SystemAlert data
  AlertStatus, // Enum for alert statuses
  KpiConfiguration
} from '../../services/dashboardService';

const GeneralDashboardPage: React.FC = () => {
  const { user, profile, userHasRole } = useAuth();

  const [kpis, setKpis] = useState<GeneralKpi[]>([]);
  const [sampleHistoricalData, setSampleHistoricalData] = useState<KpiHistoricalData[]>([]);
  const [sampleKpiName, setSampleKpiName] = useState<string>('Sample KPI');
  const [alerts, setAlerts] = useState<AlertItemType[]>([]); // Use AlertItemType here
  const [configurations, setConfigurations] = useState<KpiConfiguration[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Partial<KpiConfiguration> | null>(null);
  const [configKpiName, setConfigKpiName] = useState('');
  const [configDetails, setConfigDetails] = useState('');

  const loadDashboardData = useCallback(async () => {
    if (!profile) return;

    if (!userHasRole([USER_ROLES.DIRETORIA, USER_ROLES.ADMIN_GERAL])) {
      setError("Acesso negado a este painel.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [kpisData, alertsData] = await Promise.all([
        fetchGeneralKpis(),
        fetchSystemAlerts()
      ]);
      setKpis(kpisData);
      // Ensure alertsData conforms to AlertItemType[] if SystemAlert from service is different
      setAlerts(alertsData as AlertItemType[]);


      if (kpisData.length > 0) {
        const firstKpi = kpisData[0];
        setSampleKpiName(firstKpi.kpi_name);
        const historicalData = await fetchKpiHistoricalData(firstKpi.id);
        setSampleHistoricalData(historicalData);
      }

      if (userHasRole([USER_ROLES.ADMIN_GERAL])) {
        const configData = await fetchKpiConfigurations();
        setConfigurations(configData);
      }

    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || 'Falha ao carregar dados do painel.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, userHasRole]); // userHasRole is stable, profile is key dependency

  useEffect(() => {
    if (profile) {
        loadDashboardData();
    }
  }, [profile, loadDashboardData]);

  const handleExportData = async () => {
    try {
      const csvData = await exportGeneralDashboardData();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'painel_geral_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
      } else {
        alert("Seu navegador não suporta download direto. Tente copiar os dados.");
      }
    } catch (err: any) {
      console.error("Failed to export data:", err);
      alert(`Falha ao exportar dados: ${err.message}`);
    }
  };

  const handleAlertStatusUpdate = async (alertId: string, newStatus: AlertStatus) => {
    if (!user) return;
    try {
        const updatedAlert = await updateSystemAlertStatus(alertId, newStatus, user.id);
        if (updatedAlert) {
            setAlerts(prevAlerts =>
                prevAlerts.map(a => a.id === alertId ? { ...a, status: newStatus, acknowledged_by: user.id, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : a.resolved_at } as AlertItemType : a)
            );
        }
    } catch (err: any) {
        console.error("Failed to update alert status", err);
        alert(`Falha ao atualizar status do alerta: ${err.message}`);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !configKpiName.trim() || !configDetails.trim()) {
        alert("Nome do KPI e Detalhes da Configuração são obrigatórios.");
        return;
    }
    try {
        let parsedConfigDetails;
        try {
            parsedConfigDetails = JSON.parse(configDetails);
        } catch (jsonError) {
            alert("Detalhes da Configuração devem ser um JSON válido.");
            return;
        }

        const configToSave: Partial<KpiConfiguration> & { kpi_name: string; config_details: any } = {
            id: currentConfig?.id,
            kpi_name: configKpiName.trim(),
            config_details: parsedConfigDetails,
        };

        const savedConfig = await upsertKpiConfiguration(configToSave, user.id);
        if (savedConfig) {
            setConfigurations(prev => {
                const existingIndex = prev.findIndex(c => c.id === savedConfig.id || c.kpi_name === savedConfig.kpi_name);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = savedConfig;
                    return updated;
                }
                return [...prev, savedConfig];
            });
            setShowConfigForm(false);
            setCurrentConfig(null);
            setConfigKpiName('');
            setConfigDetails('');
        }
    } catch (err: any) {
        console.error("Failed to save KPI configuration", err);
        alert(`Falha ao salvar configuração: ${err.message}`);
    }
  };

  const handleEditConfig = (config: KpiConfiguration) => {
    setCurrentConfig(config);
    setConfigKpiName(config.kpi_name);
    setConfigDetails(JSON.stringify(config.config_details, null, 2));
    setShowConfigForm(true);
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta configuração?")) return;
    try {
        await deleteKpiConfiguration(configId);
        setConfigurations(prev => prev.filter(c => c.id !== configId));
    } catch (err: any) {
        console.error("Failed to delete KPI configuration", err);
        alert(`Falha ao excluir configuração: ${err.message}`);
    }
  };

  if (!profile && isLoading && !error) {
    return <div className="p-8 text-center">Carregando perfil do usuário...</div>;
  }

  if (!userHasRole([USER_ROLES.DIRETORIA, USER_ROLES.ADMIN_GERAL])) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p>Você não tem permissão para visualizar este painel.</p>
        <p className="mt-1 text-sm text-gray-600">Sua role atual: {profile?.role || 'Não definida ou não carregada'}</p>
      </div>
    );
  }

  if (isLoading && kpis.length === 0 && alerts.length === 0) { // More specific loading check
    return <div className="p-8 text-center">Carregando dados do painel...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar o painel: {error}</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Painel Geral</h1>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Visão Consolidada (KPIs)</h2>
        {kpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kpis.map(kpi => (
              <KpiCard
                key={kpi.id}
                title={kpi.kpi_name}
                value={kpi.kpi_value.toLocaleString('pt-BR')}
                unit={kpi.unit ?? undefined}
                target={kpi.target_value?.toLocaleString('pt-BR') ?? undefined}
                description={kpi.description ?? undefined}
              />
            ))}
          </div>
        ) : !isLoading ? <p>Nenhum KPI para exibir.</p> : null}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Comparativos por Período</h2>
        <KpiChart data={sampleHistoricalData} kpiName={sampleKpiName} targetValue={kpis.find(k => k.kpi_name === sampleKpiName)?.target_value}/>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Alertas e Indicadores Críticos</h2>
        <AlertsList
            alerts={alerts}
            onUpdateStatus={handleAlertStatusUpdate}
            canManage={userHasRole([USER_ROLES.ADMIN_GERAL, USER_ROLES.DIRETORIA])} // Example: Diretoria can also manage alerts
        />
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Relatórios</h2>
        <button
          onClick={handleExportData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out"
        >
          Download Relatório Geral (CSV)
        </button>
      </section>

      {userHasRole([USER_ROLES.ADMIN_GERAL]) && (
        <section className="mt-12 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-orange-600">Configurar Indicadores (Admin)</h2>
            <button
                onClick={() => { setShowConfigForm(true); setCurrentConfig(null); setConfigKpiName(''); setConfigDetails('{}');}}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm"
            >
                + Adicionar Nova
            </button>
          </div>

          {showConfigForm && (
            <form onSubmit={handleSaveConfig} className="bg-white p-6 shadow-md rounded-lg mb-6 border border-gray-200">
                <h3 className="text-xl mb-3 font-semibold text-gray-700">{currentConfig?.id ? 'Editar' : 'Adicionar'} Configuração de KPI</h3>
                <div className="mb-4">
                    <label htmlFor="kpiName" className="block text-sm font-medium text-gray-700 mb-1">Nome do KPI</label>
                    <input type="text" name="kpiName" id="kpiName" value={configKpiName} onChange={e => setConfigKpiName(e.target.value)} required
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="mb-4">
                    <label htmlFor="configDetails" className="block text-sm font-medium text-gray-700 mb-1">Detalhes da Configuração (JSON)</label>
                    <textarea name="configDetails" id="configDetails" value={configDetails} onChange={e => setConfigDetails(e.target.value)} required rows={5}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono" />
                </div>
                <div className="flex gap-3">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">Salvar</button>
                    <button type="button" onClick={() => setShowConfigForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-sm">Cancelar</button>
                </div>
            </form>
          )}

          {configurations.length > 0 ? (
            <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Configurações Existentes</h3>
              <ul className="space-y-3">
                {configurations.map(config => (
                  <li key={config.id} className="bg-gray-50 p-3 shadow-sm rounded-md border border-gray-200 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{config.kpi_name}</p>
                      <pre className="text-xs bg-gray-200 text-gray-700 p-2 rounded mt-1 overflow-auto max-w-lg">{JSON.stringify(config.config_details, null, 2)}</pre>
                      <p className="text-xs text-gray-500 mt-1">Atualizado em: {new Date(config.updated_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex flex-col space-y-1 whitespace-nowrap">
                      <button onClick={() => handleEditConfig(config)} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded-md shadow-sm">Editar</button>
                      <button onClick={() => handleDeleteConfig(config.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md shadow-sm">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : !isLoading ? <p>Nenhuma configuração de KPI definida.</p> : null}
        </section>
      )}
    </div>
  );
};

export default GeneralDashboardPage;
