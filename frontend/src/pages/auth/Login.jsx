import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../components/auth/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";
import "./auth.css";

const ROLE_DASHBOARD = { candidate: "/candidate", company: "/company", admin: "/admin" };

export default function Login() {
  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user?.role) navigate(ROLE_DASHBOARD[user.role] || "/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (values) => {
    const result = await login(values);
    if (result.success) {
      const from = location.state?.from?.pathname || ROLE_DASHBOARD[result.role] || "/";
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout>
      <div className="auth-page-header">
        <h1 className="auth-page-header__title">Welcome back</h1>
        <p className="auth-page-header__subtitle">Sign in to your CareerLens account</p>
      </div>
      <LoginForm onSubmit={handleSubmit} loading={loading} error={error} onClearError={clearError} />
    </AuthLayout>
  );
}