// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { USER_ROLES } from './config/roles';
import GeneralDashboardPage from './pages/dashboard/GeneralDashboardPage'; // Import the new page

// Placeholder Pages (from previous steps)
const HomePage = () => {
  const { session, user, profile, signOut, userHasRole, isLoading } = useAuth();
  // const navigate = useNavigate(); // Already imported in the outer scope if needed

  const handleSignOut = async () => {
    await signOut();
    // Navigation is handled by ProtectedRoute/AuthPage logic based on session state
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

// This DashboardPage is a simpler one, distinct from GeneralDashboardPage
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
            <ul className="flex space-x-4 items-center">
              <li><Link to="/" className="hover:text-sky-200">Home</Link></li>
              {!session && !isLoading && <li><Link to="/login" className="hover:text-sky-200">Login/Registrar</Link></li>}

              {/* Link para um painel simples para qualquer usuário logado */}
              {session && <li><Link to="/dashboard-usuario" className="hover:text-sky-200">Painel Usuário</Link></li>}

              {/* Link para o Painel Geral para roles específicas */}
              {userHasRole([USER_ROLES.DIRETORIA, USER_ROLES.ADMIN_GERAL]) && (
                <li><Link to="/painel-geral" className="hover:text-sky-200">Painel Geral (Diretoria/Admin)</Link></li>
              )}
            </ul>
            <div className="text-sm">
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
              {/* Painel simples acessível a qualquer usuário logado */}
              <Route path="/dashboard-usuario" element={<SimpleDashboardPage />} />

              {/* Painel Geral - a própria página GeneralDashboardPage faz a checagem de role internamente */}
              {/* Se quiséssemos proteger a rota em si para apenas roles específicas, precisaríamos de um ProtectedRoute aprimorado */}
              <Route path="/painel-geral" element={<GeneralDashboardPage />} />
            </Route>
            {/* Adicionar mais rotas aqui */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
