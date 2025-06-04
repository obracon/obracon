// src/pages/sales/SalesDashboardPage.tsx
import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/roles';

const SalesDashboardPage: React.FC = () => {
  const { userHasRole, isLoading, profile } = useAuth(); // Added isLoading and profile
  const location = useLocation();

  // Define who can access the sales dashboard at all
  const canAccessSales = userHasRole([
    USER_ROLES.USUARIO_DO_SETOR,
    USER_ROLES.GERENTE_DE_SETOR,
    USER_ROLES.DIRETORIA,
    USER_ROLES.ADMIN_GERAL
  ]);

  if (isLoading) {
    return <div className="p-8 text-center">Carregando informações do usuário...</div>;
  }

  if (!canAccessSales) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p className="mt-2">Você não tem permissão para visualizar o Painel de Vendas.</p>
        <p className="mt-1 text-sm text-gray-600">Sua role atual: {profile?.role || 'Não definida'}</p>
      </div>
    );
  }

  // If the base /sales path is hit, redirect to a default sub-page like oportunidades
  if (location.pathname === '/sales' || location.pathname === '/sales/') {
    return <Navigate to="/sales/oportunidades" replace />;
  }

  const getLinkClassName = (path: string) =>
    `py-2 px-3 rounded-md text-sm sm:text-base transition-colors duration-150 ease-in-out whitespace-nowrap ${
      location.pathname.startsWith(path) ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
    }`;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Painel de Vendas</h1>
        {profile && (
          <p className="text-md text-gray-600">
            Setor: {profile.sector || 'N/A'}
          </p>
        )}
      </header>
      <nav className="mb-6 pb-3 border-b border-gray-300 overflow-x-auto">
        <ul className="flex space-x-2 sm:space-x-3">
          <li><Link to="oportunidades" className={getLinkClassName('/sales/oportunidades')}>Oportunidades</Link></li>
          <li><Link to="clientes" className={getLinkClassName('/sales/clientes')}>Clientes</Link></li>
          <li><Link to="propostas" className={getLinkClassName('/sales/propostas')}>Propostas</Link></li>
          {userHasRole([USER_ROLES.GERENTE_DE_SETOR, USER_ROLES.ADMIN_GERAL, USER_ROLES.DIRETORIA]) && (
            <li><Link to="metas" className={getLinkClassName('/sales/metas')}>Metas</Link></li>
          )}
          <li><Link to="relatorios" className={getLinkClassName('/sales/relatorios')}>Relatórios</Link></li>
        </ul>
      </nav>
      <div className="bg-white p-4 sm:p-6 shadow-xl rounded-lg border border-gray-200">
        <Outlet /> {/* Child routes will render here */}
      </div>
    </div>
  );
};
export default SalesDashboardPage;
