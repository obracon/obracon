// src/pages/sales/CustomersPage.tsx
import React from 'react';
// Placeholder for potential future imports
// import CustomerList from '../../components/sales/customers/CustomerList';
// import CustomerFilters from '../../components/sales/customers/CustomerFilters';
// import { useAuth } from '../../contexts/AuthContext';
// import { USER_ROLES } from '../../config/roles';

const CustomersPage: React.FC = () => {
  // const { userHasRole } = useAuth(); // Example if create button needs role check here

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Gestão de Clientes</h2>
        {/* Example: Show button only if user can create customers */}
        {/* {userHasRole([USER_ROLES.USUARIO_DO_SETOR]) && ( // Assuming only Vendedor can create
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow">
            + Novo Cliente
          </button>
        )} */}
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out">
            + Novo Cliente (Placeholder)
        </button>
      </div>

      {/* Placeholder for Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">(Placeholder: Filtros por nome, setor, vendedor associado, etc.)</p>
      </div>

      {/* Placeholder for Customer List Display */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]">
        <p className="text-center text-gray-500">
          (Placeholder: Tabela de Clientes será exibida aqui)
        </p>
        {/* E.g., <CustomerList customers={customersData} /> */}
      </div>
    </div>
  );
};
export default CustomersPage;
