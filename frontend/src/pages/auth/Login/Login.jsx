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
      
      {/* Demo Accounts Quick Login */}
      <div style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "rgba(31, 213, 168, 0.05)",
        border: "1px solid rgba(31, 213, 168, 0.2)",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "12px", color: "#1fd5a8", marginBottom: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
          Quick Demo Login
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit({ username: "demo_admin", password: "CareerLens2026!Demo" })}
            style={{
              fontSize: "12px",
              padding: "8px 14px",
              backgroundColor: "#232b2b",
              color: "#ffffff",
              border: "1px solid #1f2a2a",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#1fd5a8"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1f2a2a"; }}
          >
            🛡️ Admin
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit({ username: "demo_cand_sreymom", password: "CareerLens2026!Demo" })}
            style={{
              fontSize: "12px",
              padding: "8px 14px",
              backgroundColor: "#232b2b",
              color: "#ffffff",
              border: "1px solid #1f2a2a",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#1fd5a8"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1f2a2a"; }}
          >
            🎓 Candidate
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit({ username: "demo_comp_mekong", password: "CareerLens2026!Demo" })}
            style={{
              fontSize: "12px",
              padding: "8px 14px",
              backgroundColor: "#232b2b",
              color: "#ffffff",
              border: "1px solid #1f2a2a",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#1fd5a8"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1f2a2a"; }}
          >
            🏢 Company
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "#818b8b", marginTop: "10px", marginBottom: 0 }}>
          Password: <code style={{ color: "#1fd5a8" }}>CareerLens2026!Demo</code>
        </p>
      </div>
    </AuthLayout>
  );
}