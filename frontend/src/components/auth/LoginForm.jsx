import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../common/ErrorMessage";
import "./LoginForm.css";

const INITIAL = { email: "", password: "" };

export default function LoginForm({ onSubmit, loading, error, onClearError }) {
  const [values, setValues] = useState(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });

  const isEmailValid = values.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const isPasswordValid = values.password && values.password.length >= 6; // Image says 8, but we'll use 6 to match existing validation
  const filledCount = (isEmailValid ? 1 : 0) + (isPasswordValid ? 1 : 0);
  const isLocked = filledCount === 2;

  useEffect(() => {
    if (isLocked) {
      setButtonOffset({ x: 0, y: 0 });
    }
  }, [isLocked]);

  const handleButtonHover = () => {
    if (isLocked) return;

    const maxTravel = filledCount === 0 ? 120 : 60;
    const minTravel = filledCount === 0 ? 60 : 30;
    
    const randomSignX = Math.random() > 0.5 ? 1 : -1;
    const randomSignY = Math.random() > 0.5 ? 1 : -1;
    
    let newX = randomSignX * (Math.random() * (maxTravel - minTravel) + minTravel);
    let newY = randomSignY * (Math.random() * (maxTravel - minTravel) + minTravel);
    
    setButtonOffset({ x: newX, y: newY });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLocked) return;
    onSubmit(values);
  };

  // Calculate the tether cable's math
  const cableLength = Math.sqrt(buttonOffset.x ** 2 + buttonOffset.y ** 2);
  const cableAngle = Math.atan2(buttonOffset.y, buttonOffset.x) * (180 / Math.PI);

  return (
    <form onSubmit={handleSubmit} noValidate className="login-form">
      <ErrorMessage message={error} onDismiss={onClearError} />

      {/* Email Field */}
      <div className="tether-field">
        <label className="tether-label" htmlFor="email">Email</label>
        <div className={`tether-input-wrapper ${isEmailValid ? 'valid' : ''}`}>
          <span className="tether-icon-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
              <polyline points="3 7 12 13 21 7"></polyline>
            </svg>
          </span>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            placeholder="ada@lumen.co"
            className="tether-input"
            disabled={loading}
          />
          {isEmailValid && (
            <span className="tether-icon-right check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Password Field */}
      <div className="tether-field">
        <div className="tether-label-row">
          <label className="tether-label" htmlFor="password">Password</label>
          <Link to="/forgot-password" className="tether-forgot">Forgot?</Link>
        </div>
        <div className={`tether-input-wrapper ${isPasswordValid ? 'valid' : ''}`}>
          <span className="tether-icon-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className="tether-input"
            disabled={loading}
          />
          <span 
            className="tether-icon-right eye" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </span>
          {isPasswordValid && (
            <span className="tether-icon-right check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Animated Button & Track */}
      <div className="tether-track-container">
        <div className={`tether-track ${isLocked ? 'locked' : ''}`}></div>
        
        {/* Dynamic Glowing Cable */}
        {!isLocked && (
          <div 
            className="tether-cable"
            style={{ 
              width: `${cableLength}px`,
              transform: `rotate(${cableAngle}deg)`
            }}
          ></div>
        )}

        <div 
          className="tether-btn-wrapper"
          style={{ transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)` }}
        >
          <button 
            type="submit"
            className={`tether-btn ${isLocked ? 'locked' : 'unlocked'}`}
            onMouseEnter={handleButtonHover}
            disabled={loading}
          >
            {loading ? "Loading..." : "Log in"}
          </button>
        </div>
      </div>

      {/* Footer Status */}
      <div className="tether-status">
        <div className="tether-status-text">
          <div className={`tether-status-dot ${isLocked ? 'locked' : ''}`}></div>
          <span className={`tether-status-msg ${isLocked ? 'locked' : ''}`}>
            {isLocked ? "Locked in. Go on then." : "Two fields to fill before it stands still."}
          </span>
        </div>
        <div className="tether-keyboard-hints">
          <span className="tether-key">Tab</span> reaches it. <span className="tether-key">Enter</span> submits.
        </div>
      </div>

      <div className="tether-create">
        No account yet? <Link to="/register">Create one</Link>
      </div>

    </form>
  );
}