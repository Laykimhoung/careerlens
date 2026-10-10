import "./Select.css";

export default function Select({
  id,
  label,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  disabled = false,
  required = false,
  className = "",
}) {
  return (
    <div className={`select-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="select-label">
          {label}
          {required && <span className="select-label__required">*</span>}
        </label>
      )}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`select-field${error ? " select-field--error" : ""}`}
      >
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="select-error">
          {error}
        </p>
      )}
    </div>
  );
}
