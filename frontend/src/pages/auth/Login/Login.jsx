import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../../hooks/useAuth';
import AuthLayout from '../../../components/auth/AuthLayout';
import LoginForm from '../../../components/auth/LoginForm';
import "../auth.css";

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
      <div className="auth-page-header" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #1fd5a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#1fd5a8', borderRadius: '50%' }}></div>
          </div>
          <span style={{ color: '#818b8b', fontWeight: '600', letterSpacing: '2px', fontSize: '13px' }}>TETHER</span>
        </div>
        <h1 className="auth-page-header__title" style={{ color: '#ffffff', fontSize: '32px', marginBottom: '12px' }}>Sign in</h1>
        <p className="auth-page-header__subtitle" style={{ color: '#818b8b', fontSize: '15px', lineHeight: '1.5' }}>Welcome back. Two fields stand between you and that button.</p>
      </div>
      <LoginForm onSubmit={handleSubmit} loading={loading} error={error} onClearError={clearError} />
      
      {/* DEV BYPASS - Remove when backend is ready */}
      <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f0fdf4", border: "1px dashed #4ade80", borderRadius: "8px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#166534", marginBottom: "8px", fontWeight: "500" }}>
          Backend not running? Use this to preview the UI:
        </p>
        <button 
          type="button"
          onClick={() => {
            localStorage.setItem("access_token", "fake-jwt-token");
            localStorage.setItem("user", JSON.stringify({ id: 1, full_name: "En (Candidate)", email: "en@test.com", role: "candidate" }));
            window.location.reload();
          }}
          style={{ fontSize: "13px", padding: "8px 16px", backgroundColor: "#16a34a", color: "white", borderRadius: "6px", cursor: "pointer", border: "none", fontWeight: "500" }}
        >
          Simulate Login as Candidate
        </button>
      </div>
    </AuthLayout>
  );
}