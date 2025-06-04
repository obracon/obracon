// src/pages/sales/ProposalsPage.tsx
import React from 'react';
// Placeholder for potential future imports
// import ProposalList from '../../components/sales/proposals/ProposalList';
// import ProposalFilters from '../../components/sales/proposals/ProposalFilters';
// import { useAuth } from '../../contexts/AuthContext';
// import { USER_ROLES } from '../../config/roles';

const ProposalsPage: React.FC = () => {
  // const { userHasRole } = useAuth(); // Example if create button needs role check here

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Propostas e Orçamentos</h2>
        {/* Example: Show button only if user can create proposals */}
        {/* {userHasRole([USER_ROLES.USUARIO_DO_SETOR]) && ( // Assuming only Vendedor can create
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow">
            + Nova Proposta
          </button>
        )} */}
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out">
            + Nova Proposta (Placeholder)
        </button>
      </div>

      {/* Placeholder for Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">(Placeholder: Filtros por status, cliente, data de validade, etc.)</p>
      </div>

      {/* Placeholder for Proposal List Display */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]">
        <p className="text-center text-gray-500">
          (Placeholder: Tabela de Propostas será exibida aqui)
        </p>
        {/* E.g., <ProposalList proposals={proposalsData} /> */}
      </div>
    </div>
  );
};
export default ProposalsPage;
