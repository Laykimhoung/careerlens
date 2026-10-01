import "./Loading.css";

export default function Loading({ message = "Loading...", size = "md" }) {
  return (
    <div className="loading">
      <div
        className={`loading__spinner loading__spinner--${size}`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="loading__text">{message}</p>}
    </div>
  );
}