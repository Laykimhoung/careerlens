import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../common/Input";
import Button from "../common/Button";
import PasswordField from "./PasswordField";
import ErrorMessage from "../common/ErrorMessage";
import "./RegisterForm.css";

const INITIAL = { full_name: "", email: "", password: "", confirm_password: "", role: "candidate" };

export default function RegisterForm({ onSubmit, loading, error, onClearError }) {
  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.full_name.trim()) errs.full_name = "Full name is required.";
    else if (data.full_name.trim().length < 2) errs.full_name = "Must be at least 2 characters.";
    if (!data.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Please enter a valid email address.";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setTouched({ full_name: true, email: true, password: true, confirm_password: true });
      return;
    }
    const { confirm_password, ...payload } = values;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="register-form">
      <ErrorMessage message={error} onDismiss={onClearError} />

      <Input id="full_name" label="Full name" type="text" value={values.full_name}
        onChange={handleChange} onBlur={handleBlur} placeholder="John Doe"
        error={touched.full_name ? fieldErrors.full_name : undefined} required disabled={loading} />

      <Input id="email" label="Email address" type="email" value={values.email}
        onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com"
        error={touched.email ? fieldErrors.email : undefined} required disabled={loading} />

      {/* Role selector */}
      <div>
        <p className="register-form__role-label">
          I am a <span>*</span>
        </p>
        <div className="register-form__role-grid">
          {[
            { value: "candidate", emoji: "👤", label: "Job Seeker" },
            { value: "company",   emoji: "🏢", label: "Employer" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`register-form__role-option${values.role === opt.value ? " register-form__role-option--active" : ""}`}
            >
              <input type="radio" name="role" value={opt.value} checked={values.role === opt.value}
                onChange={handleChange} disabled={loading} />
              {opt.emoji} {opt.label}
            </label>
          ))}
        </div>
      </div>

      <PasswordField id="password" label="Password" value={values.password}
        onChange={handleChange} onBlur={handleBlur} placeholder="Min. 8 characters"
        error={touched.password ? fieldErrors.password : undefined} required disabled={loading} />

      <PasswordField id="confirm_password" label="Confirm password" value={values.confirm_password}
        onChange={handleChange} onBlur={handleBlur} placeholder="Re-enter your password"
        error={touched.confirm_password ? fieldErrors.confirm_password : undefined} required disabled={loading} />

      <Button type="submit" fullWidth loading={loading} disabled={loading}>
        Create account
      </Button>

      <p className="register-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}