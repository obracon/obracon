// src/components/dashboard/AlertsList.tsx
import React from 'react';
import { SystemAlert as SystemAlertServiceType, AlertStatus } from '../../services/dashboardService'; // Renamed to avoid conflict

// Interface for props, ensuring it matches what GeneralDashboardPage provides
export interface AlertItem extends SystemAlertServiceType {} // Re-exporting or extending if needed

interface AlertsListProps {
  alerts: AlertItem[];
  onUpdateStatus: (alertId: string, newStatus: AlertStatus) => Promise<void>; // Matched prop name
  canManage: boolean;
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts, onUpdateStatus, canManage }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-200 text-center">
        <p className="text-gray-500">Nenhum alerta no momento. Tudo tranquilo!</p>
      </div>
    );
  }

  const getSeverityClasses = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 hover:bg-red-100 text-red-800';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100 text-yellow-800';
      case 'info':
        return 'border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-800';
      default:
        return 'border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (alertId: string, newStatus: AlertStatus) => {
    try {
      await onUpdateStatus(alertId, newStatus);
      // Optimistic update is handled by parent component's state, or parent can refetch
    } catch (error) {
      console.error(`Error updating alert ${alertId} to ${newStatus}:`, error);
      // Optionally show a local error message here
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 shadow-xl rounded-xl border border-gray-200">
      {/* <h4 className="text-xl font-semibold text-gray-700 mb-4">Lista de Alertas</h4> */}
      <ul className="space-y-4">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 shadow-md transition-all duration-200 ease-in-out ${getSeverityClasses(alert.severity)}`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex-grow mb-2 sm:mb-0">
                <p className="font-semibold text-lg">{alert.alert_message}</p>
                <p className="text-xs mt-1">
                  Severidade: <span className="font-medium capitalize">{alert.severity}</span> | Status: <span className="font-medium capitalize">{alert.status}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Criado em: {new Date(alert.created_at).toLocaleString('pt-BR')}
                  {alert.acknowledged_by && (
                    <span className="italic"> | Reconhecido por ID: {alert.acknowledged_by.substring(0,8)}...</span>
                  )}
                  {alert.resolved_at && (
                    <span className="italic"> | Resolvido em: {new Date(alert.resolved_at).toLocaleString('pt-BR')}</span>
                  )}
                </p>
                {alert.details && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-w-full sm:max-w-md md:max-w-lg">
                    Detalhes: {JSON.stringify(alert.details, null, 2)}
                  </pre>
                )}
              </div>
              {canManage && (
                <div className="flex-shrink-0 space-x-2 mt-2 sm:mt-0 sm:ml-4">
                  {alert.status === 'new' && (
                    <button
                      onClick={() => handleStatusUpdate(alert.id, 'acknowledged')}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors"
                    >
                      Reconhecer
                    </button>
                  )}
                  {(alert.status === 'new' || alert.status === 'acknowledged') && (
                     <button
                        onClick={() => handleStatusUpdate(alert.id, 'resolved')}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors"
                    >
                        Resolver
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertsList;
