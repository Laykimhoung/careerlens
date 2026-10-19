import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../../services/authService";
import SideRays from "../../../components/ui/SideRays";
import CurvyInput from "../../../components/common/CurvyInput";
import { useLanguage } from "../../../context/LanguageContext";
import "../AuthPage/AuthPage.css";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const isEmailFilled = Boolean(email.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await forgotPasswordApi({ email: email.trim() });
      setSentEmail(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.email?.[0] ||
          "Something went wrong. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-bg">
      {/* Sci-Fi Ambient Light Rays matching the Auth Page */}
      <div className="auth-rays-bg">
        <SideRays
          origin="top-left"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.2}
          intensity={1.8}
          spread={2}
          density={5}
          followMouse={true}
        />
        <SideRays
          origin="top-right"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.5}
          intensity={1.8}
          spread={2}
          density={5}
          followMouse={true}
        />
      </div>

      {/* ── 100% Settigation Tether Floating Card ── */}
      <div className="tether-card">
        {/* Top Header */}
        <div className="tether-header">
          <h1 className="tether-title">
            {submitted ? "Check your inbox" : t("auth.forgotPassword", "Forgot password?")}
          </h1>
          <p className="tether-subtitle">
            {submitted
              ? `We sent a reset link to ${sentEmail}. Check your email to reset your password.`
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {error && <div className="tether-error">{error}</div>}

        {/* ── SUBMITTED / SUCCESS STATE ── */}
        {submitted ? (
          <div className="tether-success-content">
            <div className="tether-success-icon">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            <p className="tether-success-note">
              Didn't receive the email? Please check your spam folder or try another email address.
            </p>

            <button
              type="button"
              className="tether-btn locked"
              onClick={() => {
                setSubmitted(false);
                setError(null);
              }}
              style={{ height: "50px", marginTop: "8px" }}
            >
              Try another email
            </button>

            <div className="tether-switch" style={{ marginTop: "20px" }}>
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        ) : (
          /* ── FORGOT PASSWORD FORM ── */
          <form className="tether-form" onSubmit={handleSubmit}>
            <div className="tether-field">
              <label className="tether-label">{t("common.email", "Email Address")}</label>
              <CurvyInput isValid={isEmailValid}>
                <span className="tether-icon-left">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="tether-input"
                  required
                  autoFocus
                />
                {isEmailValid && (
                  <span className="tether-icon-right check">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </CurvyInput>
            </div>

            <button
              type="submit"
              className={`tether-btn ${isEmailFilled ? "locked" : "unlocked"}`}
              disabled={loading}
              style={{ height: "50px", marginTop: "8px" }}
            >
              {loading ? (
                <>
                  <span className="tether-spinner" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                "Send reset link"
              )}
            </button>

            <div className="tether-switch">
              Remembered your password? <Link to="/login">{t("auth.signIn", "Back to sign in")}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}