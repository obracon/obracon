// src/pages/sales/TargetsPage.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/roles';
// Placeholder for potential future imports
// import TargetList from '../../components/sales/targets/TargetList';
// import TargetForm from '../../components/sales/targets/TargetForm';
// import TargetFilters from '../../components/sales/targets/TargetFilters';

const TargetsPage: React.FC = () => {
  const { userHasRole } = useAuth();

  if (!userHasRole([USER_ROLES.GERENTE_DE_SETOR, USER_ROLES.ADMIN_GERAL, USER_ROLES.DIRETORIA])) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p className="mt-2">Você não tem permissão para visualizar ou gerenciar metas.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Metas de Vendas</h2>
        {userHasRole([USER_ROLES.GERENTE_DE_SETOR, USER_ROLES.ADMIN_GERAL]) && ( // Admin Geral might also set some high-level targets
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out">
            + Definir Nova Meta (Placeholder)
          </button>
        )}
      </div>

      {/* Placeholder for Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">(Placeholder: Filtros por período, vendedor, setor, status da meta, etc.)</p>
      </div>

      {/* Placeholder for Target List Display */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]">
        <p className="text-center text-gray-500">
          (Placeholder: Visualização de Metas por vendedor e por setor será exibida aqui)
        </p>
        {/* E.g., <TargetList targets={targetsData} /> */}
        {/* {userHasRole([USER_ROLES.GERENTE_DE_SETOR]) && <TargetForm />} */}
      </div>
    </div>
  );
};
export default TargetsPage;
