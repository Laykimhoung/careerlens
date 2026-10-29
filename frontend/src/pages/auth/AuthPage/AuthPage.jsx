import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import SideRays from "../../../components/ui/SideRays";
import CurvyInput from "../../../components/common/CurvyInput";
import NeonCheckbox from "../../../components/common/NeonCheckbox";
import { useLanguage } from "../../../context/LanguageContext";
import "./AuthPage.css";

const ROLE_DASHBOARD = { candidate: "/candidate", company: "/company", admin: "/admin" };

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login, register, loading, error, clearError, isAuthenticated, user } = useAuth();

  const isLogin = location.pathname === "/login";

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [registerRole, setRegisterRole] = useState("candidate");
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    university: "",
    major: "",
    graduation_year: "2029",
    company_name: "",
    work_email: "",
    industry: "Software",
    company_size: "1-10",
    location: "",
    website: "",
    terms: false,
  });

  // Settigation Component 95: Tether button physics state
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const trackRef = useRef(null);

  const isEmailValid = Boolean(loginForm.email.trim());
  const isPasswordValid = Boolean(loginForm.password.trim());
  const filledCount = (isEmailValid ? 1 : 0) + (isPasswordValid ? 1 : 0);
  const isLocked = filledCount === 2;

  // Snaps home and resets when form requirements are met or keyboard focus is active
  useEffect(() => {
    if (isLocked || isFocused) {
      setButtonOffset({ x: 0, y: 0 });
    }
  }, [isLocked, isFocused]);

  // Continuous mouse proximity tracking with vector evasion
  useEffect(() => {
    if (!isLogin || isLocked || isFocused) return;

    const handleMouseMove = (e) => {
      if (e.pointerType === "touch") return;
      if (!trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackCenterX = trackRect.left + trackRect.width / 2;
      const trackCenterY = trackRect.top + trackRect.height / 2;

      // Current center of the button in viewport
      const btnCenterX = trackCenterX + buttonOffset.x;
      const btnCenterY = trackCenterY + buttonOffset.y;

      const distX = e.clientX - btnCenterX;
      const distY = e.clientY - btnCenterY;
      const distToMouse = Math.hypot(distX, distY);

      // Trigger proximity radius: 110px on empty form, 75px on half-filled
      const triggerRadius = filledCount === 1 ? 75 : 110;

      if (distToMouse < triggerRadius) {
        // Component 95 logic:
        // Empty form: bolts full travel (95px)
        // 1 field filled: slows to half the travel (45px)
        const travel = filledCount === 1 ? 45 : 95;
        const maxBoundX = 135;
        const maxBoundY = 60;

        let angle = Math.atan2(-distY, -distX);
        const jitter = (Math.random() - 0.5) * 0.4;
        angle += jitter;

        let nextX = buttonOffset.x + Math.cos(angle) * travel;
        let nextY = buttonOffset.y + Math.sin(angle) * travel;

        // Bounce back if hitting boundaries
        if (Math.abs(nextX) > maxBoundX) {
          nextX = -Math.sign(nextX) * (maxBoundX * 0.75);
        }
        if (Math.abs(nextY) > maxBoundY) {
          nextY = -Math.sign(nextY) * (maxBoundY * 0.75);
        }

        setButtonOffset({ x: nextX, y: nextY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isLogin, isLocked, isFocused, filledCount, buttonOffset]);

  const handleButtonHover = (e) => {
    if (isLocked || isFocused) return;
    const travel = filledCount === 1 ? 45 : 95;
    const maxBoundX = 135;
    const maxBoundY = 60;

    const dirX = e.clientX > window.innerWidth / 2 ? -1 : 1;
    const dirY = (Math.random() > 0.5 ? 1 : -1);

    setButtonOffset({
      x: dirX * Math.min(travel, maxBoundX),
      y: dirY * Math.min(travel * 0.6, maxBoundY),
    });
  };

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(ROLE_DASHBOARD[user.role] || "/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors when swapping modes
  useEffect(() => {
    clearError();
  }, [isLogin, clearError]);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const result = await login(loginForm);
    if (result.success) {
      const roleBase = ROLE_DASHBOARD[result.role] || "/";
      const fromPath = location.state?.from?.pathname;
      const target = fromPath && fromPath.startsWith(roleBase) ? fromPath : roleBase;
      navigate(target, { replace: true });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.terms) {
      alert("Please agree to the Terms");
      return;
    }
    const result = await register({ ...registerForm, role: registerRole });
    if (result.success) {
      navigate(ROLE_DASHBOARD[result.role] || "/", { replace: true });
    }
  };

  // Quick Demo fill handler
  const fillDemo = (username, password) => {
    setLoginForm((prev) => ({
      ...prev,
      email: username,
      password: password,
    }));
  };

  // Dynamic tether cable geometry
  const cableLength = Math.hypot(buttonOffset.x, buttonOffset.y);
  const cableAngle = Math.atan2(buttonOffset.y, buttonOffset.x) * (180 / Math.PI);

  return (
    <div className="auth-page-bg">
      {/* Sci-Fi Ambient Light Rays */}
      <div className="auth-rays-bg">
        <SideRays
          origin="top-left"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.2}
          intensity={1.8}
          spread={2}
          density={5}
          followMouse={true}
        />
        <SideRays
          origin="top-right"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.5}
          intensity={1.8}
          spread={2}
          density={5}
          followMouse={true}
        />
      </div>

      {/* ── 100% Settigation Tether Card ── */}
      <div className="tether-card">
        {/* Top Header */}
        <div className="tether-header">
          <h1 className="tether-title">
            {isLogin ? t("auth.signIn") : t("auth.createAccount")}
          </h1>
          <p className="tether-subtitle">
            {isLogin
              ? "Welcome back. Two fields stand between you and that button."
              : "Join CareerLens to connect with opportunities across Cambodia."}
          </p>
        </div>

        {error && <div className="tether-error">{error}</div>}

        {/* ── SIGN IN MODE ── */}
        {isLogin ? (
          <form className="tether-form" onSubmit={handleLoginSubmit}>
            {/* Username / Email Field */}
            <div className="tether-field">
              <label className="tether-label">
                {t("common.email")} / {t("auth.username")}
              </label>
              <CurvyInput isValid={isEmailValid}>
                <span className="tether-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter email or username"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  disabled={loading}
                  className="tether-input"
                  required
                />
                {isEmailValid && (
                  <span className="tether-icon-right check">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </CurvyInput>
            </div>

            {/* Password Field */}
            <div className="tether-field">
              <div className="tether-label-row">
                <label className="tether-label">{t("auth.password")}</label>
                <Link to="/forgot-password" className="tether-forgot">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <CurvyInput isValid={isPasswordValid}>
                <span className="tether-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={loading}
                  className="tether-input"
                  required
                />
                <span
                  className="tether-icon-right eye"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  title={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                </span>
                {isPasswordValid && (
                  <span className="tether-icon-right check">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </CurvyInput>
            </div>

            {/* Remember Me Toggle */}
            <div className="tether-remember-row">
              <NeonCheckbox
                checked={loginForm.remember}
                onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                disabled={loading}
                label={t("auth.rememberMe")}
              />
            </div>

            {/* ── Animated Button & Tether Track (Settigation Component 95) ── */}
            <div className="tether-track-container" ref={trackRef}>
              <div className={`tether-track ${isLocked ? "locked" : ""}`} />

              {/* Dynamic Glowing Laser Cable */}
              {!isLocked && cableLength > 2 && (
                <div
                  className="tether-cable"
                  style={{
                    width: `${cableLength}px`,
                    transform: `rotate(${cableAngle}deg)`,
                  }}
                />
              )}

              <div
                className="tether-btn-wrapper"
                style={{
                  transform: `translate(${buttonOffset.x.toFixed(1)}px, ${buttonOffset.y.toFixed(1)}px)`,
                }}
              >
                <button
                  type="submit"
                  className={`tether-btn ${isLocked ? "locked" : "unlocked"}`}
                  onMouseEnter={handleButtonHover}
                  onFocus={() => {
                    setIsFocused(true);
                    setButtonOffset({ x: 0, y: 0 }); // Tab reaches it and it stops!
                  }}
                  onBlur={() => setIsFocused(false)}
                  disabled={loading}
                >
                  {loading ? (
                    t("auth.signingIn")
                  ) : (
                    <>
                      <span>{t("auth.signIn")}</span>
                      {isLocked && <span className="tether-btn__lock-icon">🔒</span>}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Feedback & Keyboard Accessibility */}
            <div className="tether-status">
              <div className="tether-status-text">
                <div className={`tether-status-dot ${isLocked ? "locked" : ""}`} />
                <span className={`tether-status-msg ${isLocked ? "locked" : ""}`}>
                  {isLocked
                    ? "Locked in. Go on then."
                    : filledCount === 1
                    ? "One down. Still got legs."
                    : "Two fields to fill before it stands still."}
                </span>
              </div>
              <div className="tether-keyboard-hints">
                <span className="tether-key">Tab</span> reaches it.{" "}
                <span className="tether-key">Enter</span> submits.
              </div>
            </div>

            {/* Quick Demo Login Pills */}
            <div className="tether-demo-box">
              <p className="tether-demo-title">Quick Demo Login</p>
              <div className="tether-demo-buttons">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_cand_sreymom", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  🎓 Candidate
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_comp_mekong", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  🏢 Company
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_admin", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  🛡️ Admin
                </button>
              </div>
              <p className="tether-demo-pw">
                Password: <code>CareerLens2026!Demo</code>
              </p>
            </div>

            {/* Switch to Register */}
            <div className="tether-switch">
              {t("auth.noAccount")} <Link to="/register">{t("auth.signUp")}</Link>
            </div>
          </form>
        ) : (
          /* ── REGISTER MODE ── */
          <form className="tether-form" onSubmit={handleRegisterSubmit}>
            <div className="tether-role-toggle">
              <button
                type="button"
                className={`tether-role-btn ${registerRole === "candidate" ? "active" : ""}`}
                onClick={() => setRegisterRole("candidate")}
              >
                {t("auth.roleCandidate")}
              </button>
              <button
                type="button"
                className={`tether-role-btn ${registerRole === "company" ? "active" : ""}`}
                onClick={() => setRegisterRole("company")}
              >
                {t("auth.roleCompany")}
              </button>
            </div>

            <div className="tether-field">
              <label className="tether-label">
                {registerRole === "company" ? t("auth.representativeName") : t("auth.fullName")}
              </label>
              <CurvyInput isValid={Boolean(registerForm.full_name.trim())}>
                <input
                  type="text"
                  placeholder={
                    registerRole === "company"
                      ? t("auth.representativePlaceholder")
                      : t("auth.candidateNamePlaceholder")
                  }
                  value={registerForm.full_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                  disabled={loading}
                  className="tether-input"
                  required
                />
              </CurvyInput>
            </div>

            <div className="tether-field">
              <label className="tether-label">{t("common.email")}</label>
              <CurvyInput isValid={Boolean(registerForm.email.trim())}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  disabled={loading}
                  className="tether-input"
                  required
                />
              </CurvyInput>
            </div>

            <div className="tether-field">
              <label className="tether-label">{t("auth.password")}</label>
              <CurvyInput isValid={Boolean(registerForm.password.trim())}>
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  disabled={loading}
                  className="tether-input"
                  required
                />
                <span
                  className="tether-icon-right eye"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  {showRegisterPassword ? <EyeOffIcon /> : <EyeIcon />}
                </span>
              </CurvyInput>
            </div>

            <div className="tether-field">
              <label className="tether-label">{t("auth.confirmPassword")}</label>
              <CurvyInput isValid={Boolean(registerForm.confirm_password.trim() && registerForm.confirm_password === registerForm.password)}>
                <input
                  type={showRegisterConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={registerForm.confirm_password}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, confirm_password: e.target.value })
                  }
                  disabled={loading}
                  className="tether-input"
                  required
                />
                <span
                  className="tether-icon-right eye"
                  onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                >
                  {showRegisterConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </span>
              </CurvyInput>
            </div>

            {registerRole === "candidate" ? (
              <div className="tether-field">
                <label className="tether-label">{t("auth.universityCollege")}</label>
                <CurvyInput isValid={Boolean(registerForm.university.trim())}>
                  <input
                    type="text"
                    placeholder="e.g. Royal University of Phnom Penh"
                    value={registerForm.university}
                    onChange={(e) => setRegisterForm({ ...registerForm, university: e.target.value })}
                    disabled={loading}
                    className="tether-input"
                  />
                </CurvyInput>
              </div>
            ) : (
              <div className="tether-field">
                <label className="tether-label">{t("auth.companyName")}</label>
                <CurvyInput isValid={Boolean(registerForm.company_name.trim())}>
                  <input
                    type="text"
                    placeholder={t("auth.companyNamePlaceholder")}
                    value={registerForm.company_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                    disabled={loading}
                    className="tether-input"
                    required
                  />
                </CurvyInput>
              </div>
            )}

            <div className="tether-remember-row">
              <NeonCheckbox
                checked={registerForm.terms}
                onChange={(e) => setRegisterForm({ ...registerForm, terms: e.target.checked })}
                disabled={loading}
                required
                label={t("auth.agreeTerms")}
              />
            </div>

            <button type="submit" className="tether-btn locked" disabled={loading} style={{ height: "54px" }}>
              {loading ? t("auth.creatingAccount") : t("auth.signUp")}
            </button>

            <div className="tether-switch">
              {t("auth.hasAccount")} <Link to="/login">{t("auth.signIn")}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
