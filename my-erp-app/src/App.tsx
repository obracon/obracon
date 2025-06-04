// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'; // Added Navigate
import './App.css';
import AuthPage from './pages/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { USER_ROLES } from './config/roles';
import GeneralDashboardPage from './pages/dashboard/GeneralDashboardPage';

// Sales Dashboard Pages
import SalesDashboardPage from './pages/sales/SalesDashboardPage';
import OpportunitiesPage from './pages/sales/OpportunitiesPage';
import CustomersPage from './pages/sales/CustomersPage';
import ProposalsPage from './pages/sales/ProposalsPage';
import TargetsPage from './pages/sales/TargetsPage';
import ReportsPage from './pages/sales/ReportsPage';


const HomePage = () => {
  const { session, user, profile, signOut, userHasRole, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return <div className="p-4">Loading user information...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Home Page</h2>
      {session && user ? (
        <div>
          <p>Bem-vindo(a), {profile?.full_name || user.email}!</p>
          <p>User ID: {user.id}</p>
          <p>Role: {profile?.role || 'Role não carregada.'}</p>
          {profile?.sector && <p>Setor: {profile.sector}</p>}

          {userHasRole([USER_ROLES.ADMIN_GERAL]) && (
            <div className="my-4 p-3 border border-red-300 bg-red-50 rounded">
              <p className="font-bold text-red-600">Você é Admin Geral.</p>
            </div>
          )}
           {userHasRole([USER_ROLES.DIRETORIA]) && (
            <div className="my-4 p-3 border border-blue-300 bg-blue-50 rounded">
              <p className="font-bold text-blue-600">Você é da Diretoria.</p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p>Você não está logado.</p>
          <p><Link to="/login" className="text-blue-600 hover:underline">Por favor, faça Login ou Registre-se</Link></p>
        </div>
      )}
    </div>
  );
};

const SimpleDashboardPage = () => {
  const { profile } = useAuth();
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold">Painel Simples (Protegido)</h2>
      <p>Esta página é acessível a qualquer usuário logado.</p>
      <p>Sua role: {profile?.role || 'Carregando...'}</p>
    </div>
  );
};


function App() {
  const { session, isLoading, userHasRole, profile, user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold hover:opacity-90">Meu ERP</Link>
            <ul className="flex space-x-2 sm:space-x-4 items-center overflow-x-auto py-2"> {/* Added overflow-x-auto and py-2 */}
              <li><Link to="/" className="hover:text-sky-200 whitespace-nowrap">Home</Link></li>
              {!session && !isLoading && <li><Link to="/login" className="hover:text-sky-200 whitespace-nowrap">Login/Registrar</Link></li>}

              {session && <li><Link to="/dashboard-usuario" className="hover:text-sky-200 whitespace-nowrap">Painel Usuário</Link></li>}

              {userHasRole([USER_ROLES.DIRETORIA, USER_ROLES.ADMIN_GERAL]) && (
                <li><Link to="/painel-geral" className="hover:text-sky-200 whitespace-nowrap">Painel Geral</Link></li>
              )}
              {userHasRole([
                  USER_ROLES.USUARIO_DO_SETOR,
                  USER_ROLES.GERENTE_DE_SETOR,
                  USER_ROLES.DIRETORIA,
                  USER_ROLES.ADMIN_GERAL
                ]) && (
                <li><Link to="/sales" className="hover:text-sky-200 whitespace-nowrap">Painel de Vendas</Link></li>
              )}
            </ul>
            <div className="text-sm ml-2 whitespace-nowrap"> {/* Added ml-2 and whitespace-nowrap */}
              {isLoading ? 'Carregando...' : session && profile ? (
                <span>{profile.full_name || user?.email} ({profile.role})</span>
              ) : !session ? 'Não conectado' : ''}
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard-usuario" element={<SimpleDashboardPage />} />
              <Route path="/painel-geral" element={<GeneralDashboardPage />} />

              {/* Sales Dashboard Routes */}
              <Route path="/sales" element={<SalesDashboardPage />}>
                {/* Default child route for /sales */}
                <Route index element={<Navigate to="oportunidades" replace />} />
                <Route path="oportunidades" element={<OpportunitiesPage />} />
                <Route path="clientes" element={<CustomersPage />} />
                <Route path="propostas" element={<ProposalsPage />} />
                <Route path="metas" element={<TargetsPage />} /> {/* Access control within TargetsPage itself */}
                <Route path="relatorios" element={<ReportsPage />} />
              </Route>
              {/* Add more protected routes here */}
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
