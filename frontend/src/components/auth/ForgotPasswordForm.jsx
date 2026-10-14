import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import Input from "../common/Input";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage";
import "./ForgotPasswordForm.css";

export default function ForgotPasswordForm({ onSubmit, loading, error, onClearError }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const validate = (v) => {
    if (!v.trim()) return t("validation.required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t("validation.emailInvalid");
    return "";
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError("");
  };

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validate(email));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate(email);
    if (err) { setFieldError(err); setTouched(true); return; }
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="forgot-form">
      <ErrorMessage message={error} onDismiss={onClearError} />
      <Input id="email" label={t("common.email")} type="email" value={email}
        onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com"
        error={touched ? fieldError : undefined} required disabled={loading} />
      <Button type="submit" fullWidth loading={loading} disabled={loading}>
        {loading ? t("common.loading") : t("auth.resetPassword")}
      </Button>
      <p className="forgot-form__footer">
        <Link to="/login">{t("common.back")} - {t("auth.signIn")}</Link>
      </p>
    </form>
  );
}