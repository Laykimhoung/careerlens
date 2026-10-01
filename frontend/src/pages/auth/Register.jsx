import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../components/auth/AuthLayout";
import RegisterForm from "../../components/auth/RegisterForm";
import "./auth.css";

const ROLE_DASHBOARD = { candidate: "/candidate", company: "/company", admin: "/admin" };

export default function Register() {
  const { register, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role) navigate(ROLE_DASHBOARD[user.role] || "/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (values) => {
    const result = await register(values);
    if (result.success) navigate(ROLE_DASHBOARD[result.role] || "/", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="auth-page-header">
        <h1 className="auth-page-header__title">Create your account</h1>
        <p className="auth-page-header__subtitle">Join CareerLens and find your next opportunity</p>
      </div>
      <RegisterForm onSubmit={handleSubmit} loading={loading} error={error} onClearError={clearError} />
    </AuthLayout>
  );
}