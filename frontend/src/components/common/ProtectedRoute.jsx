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
  const { isAuthenticated, user, loading, token } = useAuth();
  const location = useLocation();

  // While auth state is resolving (e.g. on first load / page refresh), show a spinner
  if (loading || (token && !user)) {
    return <Loading />;
  }

  // Not logged in → redirect to login, preserving the page they tried to visit
  if (!isAuthenticated) {
    const fullTarget = location.pathname + location.search;
    const loginUrl = `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(fullTarget)}`;
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
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
