import { useState } from "react";
import "./PasswordField.css";

export default function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  onBlur,
  placeholder = "Enter your password",
  error,
  disabled = false,
  required = false,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      {label && (
        <label htmlFor={id} className="password-field__label">
          {label}
          {required && <span className="password-field__required">*</span>}
        </label>
      )}
      <div className="password-field__wrapper">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`password-field__input${error ? " password-field__input--error" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          disabled={disabled}
          className="password-field__toggle"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577A11.217 11.217 0 0112 3.75c4.5 0 8.442 2.721 10.203 6.618a1.5 1.5 0 010 1.185zM15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM21.25 17.25l-2.493-2.493A11.218 11.218 0 0112 20.25c-4.5 0-8.442-2.721-10.203-6.618a1.5 1.5 0 010-1.185 11.217 11.217 0 012.058-3.28l-1.03-1.03A12.716 12.716 0 001.5 12a12.717 12.717 0 0011.625 7.5c2.149 0 4.17-.539 5.944-1.49l2.181 2.182a.75.75 0 001.06-1.06l-.06-.06z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="password-field__error">{error}</p>}
    </div>
  );
}