import { useEffect, useRef, useState } from "react";
import "./RunawayButton.css";

/**
 * Settigation Component 95: The Runaway Button
 * - Empty form? It bolts.
 * - Fill one field and it slows to half the travel.
 * - Fill both and it snaps home and locks for good.
 * - Accessibility-safe: never disabled, Tab reaches it and it stops, Enter always submits.
 * - Zero external dependencies.
 */
export default function RunawayButton({
  completedFields = 0,
  requiredFields = 2,
  children,
  loading = false,
  type = "submit",
  className = "",
  onClick,
  ...props
}) {
  const buttonRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [hint, setHint] = useState("");
  const hintTimeoutRef = useRef(null);

  const isLocked = completedFields >= requiredFields;

  // Snaps home and resets when form requirements are met or keyboard focus is active
  useEffect(() => {
    if (isLocked || isFocused) {
      setOffset({ x: 0, y: 0 });
      setHint("");
    }
  }, [isLocked, isFocused]);

  useEffect(() => {
    if (isLocked || isFocused) return;

    const handleMouseMove = (e) => {
      // Ignore touch / pen devices
      if (e.pointerType === "touch") return;
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;

      const distX = e.clientX - btnCenterX;
      const distY = e.clientY - btnCenterY;
      const distance = Math.hypot(distX, distY);

      // Trigger radius: 110px on empty, 75px on half-filled
      const triggerRadius = completedFields === 1 ? 75 : 110;

      if (distance < triggerRadius) {
        // Component 95 logic:
        // Empty form: bolts full travel (75px)
        // 1 field filled: slows to half the travel (36px)
        const travelDist = completedFields === 1 ? 36 : 75;
        const maxBoundX = 75;
        const maxBoundY = 40;

        // Angle away from cursor
        let angle = Math.atan2(-distY, -distX);

        // Add subtle organic jitter so it never traps itself in a corner
        const jitter = (Math.random() - 0.5) * 0.45;
        angle += jitter;

        let nextX = offset.x + Math.cos(angle) * travelDist;
        let nextY = offset.y + Math.sin(angle) * travelDist;

        // Bounce back if hitting boundary
        if (Math.abs(nextX) > maxBoundX) {
          nextX = -Math.sign(nextX) * (maxBoundX * 0.7);
        }
        if (Math.abs(nextY) > maxBoundY) {
          nextY = -Math.sign(nextY) * (maxBoundY * 0.7);
        }

        setOffset({ x: nextX, y: nextY });

        // Playful feedback hint
        if (completedFields === 0) {
          setHint("Fill in username & password first! 🏃💨");
        } else if (completedFields === 1) {
          setHint("Halfway there! 1 more field 🏃");
        }

        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => {
          setHint("");
        }, 1600);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [isLocked, isFocused, completedFields, offset]);

  const handleMouseEnter = (e) => {
    if (isLocked || isFocused) return;
    const travelDist = completedFields === 1 ? 36 : 75;
    const maxBoundX = 75;
    const maxBoundY = 40;

    const rect = buttonRef.current.getBoundingClientRect();
    const dirX = e.clientX > rect.left + rect.width / 2 ? -1 : 1;
    const dirY = e.clientY > rect.top + rect.height / 2 ? -1 : 1;

    setOffset({
      x: dirX * Math.min(travelDist, maxBoundX),
      y: dirY * Math.min(travelDist * 0.65, maxBoundY),
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOffset({ x: 0, y: 0 }); // Tab reaches it and it stops!
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="auth-runaway-wrapper">
      {/* Floating playful status badge when dodging */}
      {hint && !isLocked && !isFocused && (
        <div className="auth-runaway-hint" aria-live="polite">
          {hint}
        </div>
      )}

      <button
        ref={buttonRef}
        type={type}
        className={`auth-submit-btn auth-runaway-btn ${
          isLocked ? "auth-runaway-btn--locked" : "auth-runaway-btn--dodging"
        } ${className}`}
        style={{
          transform: `translate(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px)`,
        }}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={loading}
        onClick={onClick}
        {...props}
      >
        <span className="auth-runaway-btn__content">
          {children}
          {isLocked && !loading && (
            <span className="auth-runaway-btn__lock-icon" title="Unlocked & Ready">
              🔒
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
