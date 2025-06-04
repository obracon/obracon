// src/pages/sales/OpportunitiesPage.tsx
import React from 'react';
// Placeholder for potential future imports
// import OpportunityList from '../../components/sales/opportunities/OpportunityList';
// import OpportunityKanban from '../../components/sales/opportunities/OpportunityKanban';
// import OpportunityFilters from '../../components/sales/opportunities/OpportunityFilters';
// import { useAuth } from '../../contexts/AuthContext';
// import { USER_ROLES } from '../../config/roles';

const OpportunitiesPage: React.FC = () => {
  // const { userHasRole } = useAuth(); // Example if create button needs role check here

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Funil de Oportunidades</h2>
        {/* Example: Show button only if user can create opportunities */}
        {/* {userHasRole([USER_ROLES.USUARIO_DO_SETOR, USER_ROLES.GERENTE_DE_SETOR]) && (
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow">
            + Nova Oportunidade
          </button>
        )} */}
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out">
            + Nova Oportunidade (Placeholder)
        </button>
      </div>

      {/* Placeholder for Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">(Placeholder: Filtros por status, vendedor, data, etc.)</p>
      </div>

      {/* Placeholder for Opportunity Display (Table or Kanban) */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]">
        <p className="text-center text-gray-500">
          (Placeholder: Tabela ou Kanban de Oportunidades será exibido aqui)
        </p>
        {/* E.g., <OpportunityKanban opportunities={opportunitiesData} /> or <OpportunityList opportunities={opportunitiesData} /> */}
      </div>
    </div>
  );
};
export default OpportunitiesPage;
