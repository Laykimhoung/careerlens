import React from "react";
import "./NeonCheckbox.css";

/**
 * NeonCheckbox
 * Inspired by 00Kubi's 'hot-dragonfly-56' on uiverse.io
 * Cyberpunk animated neon checkbox with edge flow, sparks, rings, and particle explosion
 * Themed with #016BFB electric royal blue
 */
export default function NeonCheckbox({
  id,
  name,
  checked,
  onChange,
  disabled = false,
  required = false,
  label,
  className = "",
  size = 20,
  style = {},
  ...props
}) {
  return (
    <label
      className={`neon-checkbox-wrapper ${disabled ? "disabled" : ""} ${className}`}
      style={style}
    >
      <div className="neon-checkbox" style={{ "--size": `${size}px` }}>
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        <div className="neon-checkbox__frame">
          <div className="neon-checkbox__box">
            <div className="neon-checkbox__check-container">
              <svg viewBox="0 0 24 24" className="neon-checkbox__check">
                <path d="M3,12.5l7,7L21,5" />
              </svg>
            </div>
            <div className="neon-checkbox__glow" />
            <div className="neon-checkbox__borders">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="neon-checkbox__effects">
            <div className="neon-checkbox__particles">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="neon-checkbox__rings">
              <div className="ring" />
              <div className="ring" />
              <div className="ring" />
            </div>
            <div className="neon-checkbox__sparks">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
      {label && <span className="neon-checkbox__label-text">{label}</span>}
    </label>
  );
}
