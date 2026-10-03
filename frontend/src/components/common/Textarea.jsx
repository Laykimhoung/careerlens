import "./Textarea.css";

export default function Textarea({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  rows = 4,
  disabled = false,
  required = false,
  className = "",
}) {
  return (
    <div className={`textarea-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="textarea-label">
          {label}
          {required && <span className="textarea-label__required">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`textarea-field${error ? " textarea-field--error" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} className="textarea-error">
          {error}
        </p>
      )}
    </div>
  );
}
