import "./Input.css";

export default function Input({
  id,
  name,
  label,
  type = "text",
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = "",
}) {
  const valueProps =
    value !== undefined
      ? { value }
      : defaultValue !== undefined
      ? { defaultValue }
      : {};

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
          {required && <span className="input-label__required">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name || id}
        type={type}
        {...valueProps}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input-field${error ? " input-field--error" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} className="input-error">
          {error}
        </p>
      )}
    </div>
  );
}