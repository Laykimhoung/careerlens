import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../common/Input";
import Button from "../common/Button";
import PasswordField from "./PasswordField";
import ErrorMessage from "../common/ErrorMessage";
import "./LoginForm.css";

const INITIAL = { email: "", password: "" };

export default function LoginForm({ onSubmit, loading, error, onClearError }) {
  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Please enter a valid email address.";
    if (!data.password) errs.password = "Password is required.";
    else if (data.password.length < 6) errs.password = "Password must be at least 6 characters.";
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
      setTouched({ email: true, password: true });
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="login-form">
      <ErrorMessage message={error} onDismiss={onClearError} />

      <Input
        id="email"
        label="Email address"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="you@example.com"
        error={touched.email ? fieldErrors.email : undefined}
        required
        disabled={loading}
      />

      <div>
        <PasswordField
          id="password"
          label="Password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? fieldErrors.password : undefined}
          required
          disabled={loading}
        />
        <div className="login-form__forgot">
          <Link to="/forgot-password" className="login-form__forgot-link">
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={loading} disabled={loading}>
        Sign in
      </Button>

      <p className="login-form__footer">
        Don&apos;t have an account?{" "}
        <Link to="/register">Create one</Link>
      </p>
    </form>
  );
}