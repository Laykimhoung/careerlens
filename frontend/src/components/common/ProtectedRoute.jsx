import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Loading from "./Loading";

/**
 * ProtectedRoute — blocks unauthenticated users and enforces role-based access.
 *
 * Props:
 *  - children   : the page/component to render when access is granted
 *  - role       : optional — "candidate" | "company" | "admin"
 *                 if provided, only that role may access the route
 *  - redirectTo : optional — where to send an unauthorized user (default: "/login")
 */
export default function ProtectedRoute({ children, role, redirectTo = "/login" }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // While auth state is resolving (e.g. on first load), show a spinner
  if (loading) {
    return <Loading />;
  }

  // Not logged in → redirect to login, preserving the page they tried to visit
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (role && user?.role !== role) {
    const dashboardMap = {
      candidate: "/candidate",
      company: "/company",
      admin: "/admin",
    };
    const fallback = dashboardMap[user?.role] || "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}