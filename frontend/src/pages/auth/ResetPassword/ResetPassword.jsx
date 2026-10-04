import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordApi } from '../../../services/authService';
import AuthLayout from '../../../components/auth/AuthLayout';
import PasswordField from '../../../components/auth/PasswordField';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import "../auth.css";

const INITIAL = { password: "", confirm_password: "" };

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = (data) => {
    const errs = {};
    if (!data.password) errs.password = "Password is required.";
    else if (data.password.length < 8) errs.password = "Must be at least 8 characters.";
    else if (!/[A-Z]/.test(data.password)) errs.password = "Must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(data.password)) errs.password = "Must contain at least one number.";
    if (!data.confirm_password) errs.confirm_password = "Please confirm your password.";
    else if (data.confirm_password !== data.password) errs.confirm_password = "Passwords do not match.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validate(values)[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); setTouched({ password: true, confirm_password: true }); return; }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordApi({ token, uid, password: values.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.token?.[0] || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !uid) {
    return (
      <AuthLayout>
        <div className="auth-state-panel">
          <div className="auth-state-panel__icon auth-state-panel__icon--red">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="auth-state-panel__title">Invalid reset link</h2>
          <p className="auth-state-panel__desc">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="auth-state-panel__link">Request a new link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="auth-state-panel">
          <div className="auth-state-panel__icon auth-state-panel__icon--green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="auth-state-panel__title">Password updated!</h2>
          <p className="auth-state-panel__desc">Your password has been reset. You can now sign in.</p>
          <Button fullWidth onClick={() => navigate("/login")}>Go to sign in</Button>
        </div>
      ) : (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-header__title">Set new password</h1>
            <p className="auth-page-header__subtitle">Choose a strong password for your account.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate className="reset-form">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
            <PasswordField id="password" label="New password" value={values.password}
              onChange={handleChange} onBlur={handleBlur} placeholder="Min. 8 characters"
              error={touched.password ? fieldErrors.password : undefined} required disabled={loading} />
            <PasswordField id="confirm_password" label="Confirm new password" value={values.confirm_password}
              onChange={handleChange} onBlur={handleBlur} placeholder="Re-enter your password"
              error={touched.confirm_password ? fieldErrors.confirm_password : undefined} required disabled={loading} />
            <Button type="submit" fullWidth loading={loading} disabled={loading}>Reset password</Button>
            <p className="reset-form__footer">
              <Link to="/login">← Back to sign in</Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  );
}