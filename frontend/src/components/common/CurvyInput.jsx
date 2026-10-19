import React from "react";

/**
 * CurvyInput
 * Inspired by Lakshay-art's 'curvy-earwig-22' on uiverse.io
 * Multi-layer rotating conic-gradient neon border with #016BFB electric blue palette
 */
export default function CurvyInput({ children, isValid = false, className = "" }) {
  return (
    <div className={`tether-poda ${isValid ? "valid" : ""} ${className}`}>
      <div className="tether-glow" />
      <div className="tether-darkBorderBg" />
      <div className="tether-white" />
      <div className="tether-border" />
      <div className="tether-input-inner">
        {children}
      </div>
    </div>
  );
}
