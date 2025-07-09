import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  return currentUser ? <>{children}</> : <Login />;
};

export default ProtectedRoute;