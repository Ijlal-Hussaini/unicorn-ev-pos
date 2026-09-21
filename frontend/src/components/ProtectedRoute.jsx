import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If no specific roles required, allow any authenticated user
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has required role
  if (user && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'sales') {
      return <Navigate to="/sales/dashboard" replace />;
    }
    // Fallback to login if role is unknown
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
