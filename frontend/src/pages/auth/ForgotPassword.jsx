import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../services/authService";
import AuthLayout from "../../components/auth/AuthLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import "./auth.css";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleSubmit = async (email) => {
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
    <AuthLayout>
      {submitted ? (
        <div className="auth-state-panel">
          <div className="auth-state-panel__icon auth-state-panel__icon--blue">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
            </svg>
          </div>
          <h2 className="auth-state-panel__title">Check your inbox</h2>
          <p className="auth-state-panel__desc">
            We sent a reset link to <strong>{sentEmail}</strong>. It may take a few minutes.
          </p>
          <p className="auth-state-panel__hint">
            Didn&apos;t receive it?{" "}
            <button type="button" onClick={() => setSubmitted(false)}>Try again</button>
          </p>
          <Link to="/login" className="auth-state-panel__link">← Back to sign in</Link>
        </div>
      ) : (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-header__title">Forgot password?</h1>
            <p className="auth-page-header__subtitle">Enter your email and we&apos;ll send you a reset link.</p>
          </div>
          <ForgotPasswordForm onSubmit={handleSubmit} loading={loading} error={error} onClearError={() => setError(null)} />
        </>
      )}
    </AuthLayout>
  );
}