// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Imported useLocation
import { useAuth } from '../../contexts/AuthContext'; // Ensure this path is correct

const ProtectedRoute: React.FC = () => {
  const { session, isLoading } = useAuth();
  const location = useLocation(); // Get current location

  if (isLoading) {
    return <div>Loading session information...</div>; // Or a global spinner component
  }

  if (!session) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render child routes/components if authenticated
};

export default ProtectedRoute;
