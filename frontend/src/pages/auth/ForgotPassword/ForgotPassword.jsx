import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from '../../../services/authService';
import "../AuthPage/AuthPage.css"; // Reuse the premium styling

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPasswordApi({ email });
      setSentEmail(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.email?.[0] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-container">
        
        {/* Right side form */}
        <div className="auth-side auth-side-right" style={{ display: 'flex' }}>
          {submitted ? (
            <div className="auth-form" style={{ textAlign: "center" }}>
              <div style={{ color: "#c9b183", marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                </svg>
              </div>
              <h2 style={{ marginBottom: "16px" }}>Check your inbox</h2>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px", lineHeight: "1.6" }}>
                We sent a reset link to <strong>{sentEmail}</strong>. It may take a few minutes.
              </p>
              <button className="auth-submit-btn" onClick={() => setSubmitted(false)}>
                Try again
              </button>
              <p className="auth-switch-text" style={{ textAlign: "center" }}>
                <Link to="/login">Back to sign in</Link>
              </p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2 style={{ marginBottom: "16px" }}>Forgot password?</h2>
              <p style={{ fontSize: "13px", color: "#777", marginBottom: "32px", lineHeight: "1.5" }}>
                Enter your email and we'll send you a reset link.
              </p>
              
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-input-group">
                <label>EMAIL ADDRESS</label>
                <div className="auth-input-wrapper">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="auth-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                    </svg>
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <p className="auth-switch-text" style={{ textAlign: "center" }}>
                Remembered it? <Link to="/login">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>

        {/* Static Blade on Left */}
        <div className="auth-blade blade-on-left">
          <div className="blade-content show-content">
            <div className="blade-brand">CareerLens</div>
            <h1 className="blade-title">Recover your<br /><em>account.</em></h1>
            <p className="blade-desc">
              Enter your email address to regain access and continue your journey.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}