import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  element: React.ReactElement;
}

function PrivateRoute({ element }: PrivateRouteProps) {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" />;
}

export default PrivateRoute;
