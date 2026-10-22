import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../../../services/authService";
import SideRays from "../../../components/ui/SideRays";
import CurvyInput from "../../../components/common/CurvyInput";
import { useLanguage } from "../../../context/LanguageContext";
import "../AuthPage/AuthPage.css";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const INITIAL = { password: "", confirm_password: "" };

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  const [values, setValues] = useState(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isPasswordValid =
    values.password.length >= 8 &&
    /[A-Z]/.test(values.password) &&
    /[0-9]/.test(values.password);

  const isConfirmValid =
    Boolean(values.confirm_password) && values.confirm_password === values.password;

  const isFormValid = isPasswordValid && isConfirmValid;

  const validate = () => {
    if (!values.password) return "Password is required.";
    if (values.password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(values.password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(values.password)) return "Password must contain at least one number.";
    if (!values.confirm_password) return "Please confirm your password.";
    if (values.confirm_password !== values.password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPasswordApi({ token, uid, password: values.password });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.token?.[0] ||
          "Reset failed. The link may have expired or is invalid."
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

      <div className="tether-card">
        {/* Invalid Token / Missing Params */}
        {!token || !uid ? (
          <div className="tether-success-content">
            <div className="tether-success-icon" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="tether-title" style={{ fontSize: "20px", marginTop: "16px" }}>
              Invalid Reset Link
            </h2>
            <p className="tether-success-note">
              This password reset link is invalid or has expired. Please request a new link.
            </p>
            <Link
              to="/forgot-password"
              className="tether-btn locked"
              style={{ height: "50px", marginTop: "16px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Request New Link
            </Link>
            <div className="tether-switch" style={{ marginTop: "20px" }}>
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        ) : success ? (
          /* Success State */
          <div className="tether-success-content">
            <div className="tether-success-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="tether-title" style={{ fontSize: "22px", marginTop: "16px" }}>
              Password Updated!
            </h2>
            <p className="tether-success-note">
              Your password has been successfully reset. You can now sign in with your new credentials.
            </p>
            <button
              type="button"
              className="tether-btn locked"
              onClick={() => navigate("/login")}
              style={{ height: "50px", marginTop: "16px" }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          /* Reset Form */
          <>
            <div className="tether-header">
              <h1 className="tether-title">Set new password</h1>
              <p className="tether-subtitle">
                Choose a strong password containing at least 8 characters, an uppercase letter, and a number.
              </p>
            </div>

            {error && <div className="tether-error">{error}</div>}

            <form className="tether-form" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="tether-field">
                <label className="tether-label">New Password</label>
                <CurvyInput isValid={isPasswordValid}>
                  <span className="tether-icon-left">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={values.password}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, password: e.target.value }));
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    className="tether-input"
                    required
                  />
                  <div className="tether-input-actions">
                    <button
                      type="button"
                      className="tether-icon-action"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex="-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {isPasswordValid && (
                      <span className="tether-icon-right check">
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                </CurvyInput>
              </div>

              {/* Confirm New Password */}
              <div className="tether-field">
                <label className="tether-label">Confirm New Password</label>
                <CurvyInput isValid={isConfirmValid}>
                  <span className="tether-icon-left">
                    <LockIcon />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={values.confirm_password}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, confirm_password: e.target.value }));
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    className="tether-input"
                    required
                  />
                  <div className="tether-input-actions">
                    <button
                      type="button"
                      className="tether-icon-action"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex="-1"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {isConfirmValid && (
                      <span className="tether-icon-right check">
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                </CurvyInput>
              </div>

              <button
                type="submit"
                className={`tether-btn ${isFormValid ? "locked" : "unlocked"}`}
                disabled={loading}
                style={{ height: "50px", marginTop: "12px" }}
              >
                {loading ? (
                  <>
                    <span className="tether-spinner" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  "Reset password"
                )}
              </button>

              <div className="tether-switch">
                <Link to="/login">← Back to sign in</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
