import "./ErrorMessage.css";

export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div role="alert" className="error-message">
      <svg className="error-message__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0V8.75a.75.75 0 00-1.5 0v4zm.75-6.5a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
      </svg>
      <span className="error-message__text">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="error-message__dismiss" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}