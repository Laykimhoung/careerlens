import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Briefcase, Lock, Check, GraduationCap, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import SideRays from "../../../components/ui/SideRays";
import CurvyInput from "../../../components/common/CurvyInput";
import NeonCheckbox from "../../../components/common/NeonCheckbox";
import ThemeLanguageToggle from "../../../components/common/ThemeLanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";
import "./AuthPage.css";
import { isDemoModeEnabled } from "../../../config/features";

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

  const isLogin = location.pathname !== "/register";

  // Check for redirect intent from query string, location state, or previous sessionStorage
  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get("redirect") || location.state?.from?.pathname;

  useEffect(() => {
    if (rawRedirect) {
      sessionStorage.setItem("post_auth_redirect", rawRedirect);
    }
  }, [rawRedirect]);

  const targetRedirect = rawRedirect || sessionStorage.getItem("post_auth_redirect");
  const isJobTarget = Boolean(
    targetRedirect &&
      (targetRedirect.includes("/jobs/") || targetRedirect.includes("/candidate/jobs/"))
  );

  const getFinalDestination = (role) => {
    const saved = sessionStorage.getItem("post_auth_redirect") || rawRedirect;
    const defaultDashboard = ROLE_DASHBOARD[role] || "/";
    if (saved && (saved.startsWith("/candidate/") || saved.startsWith("/jobs/"))) {
      sessionStorage.removeItem("post_auth_redirect");
      if (saved.startsWith("/jobs/")) {
        return `/candidate${saved}`;
      }
      return saved;
    }
    return defaultDashboard;
  };

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [registerRole, setRegisterRole] = useState("candidate");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    university: "",
    major: "",
    skills: [],
    graduation_year: "2029",
    company_name: "",
    work_email: "",
    industry: "Software",
    company_size: "1-10",
    location: "",
    website: "",
    terms: false,
  });

  const isEmailValid = Boolean(loginForm.email.trim());
  const isPasswordValid = Boolean(loginForm.password.trim());

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const destination = getFinalDestination(user.role);
      navigate(destination, { replace: true });
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
      const destination = getFinalDestination(result.role);
      navigate(destination, { replace: true });
    }
  };

  const POPULAR_SIGNUP_SKILLS = [
    "React",
    "Node.js",
    "Python",
    "JavaScript",
    "TypeScript",
    "SQL",
    "Git",
    "Figma",
    "UI/UX",
    "Docker",
    "Java",
    "Tailwind CSS",
  ];

  const handleToggleSkill = (skill) => {
    setRegisterForm((prev) => {
      const current = prev.skills || [];
      const exists = current.some((s) => s.toLowerCase() === skill.toLowerCase());
      if (exists) {
        return { ...prev, skills: current.filter((s) => s.toLowerCase() !== skill.toLowerCase()) };
      } else {
        return { ...prev, skills: [...current, skill] };
      }
    });
  };

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    setRegisterForm((prev) => {
      const current = prev.skills || [];
      if (!current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        return { ...prev, skills: [...current, trimmed] };
      }
      return prev;
    });
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRegisterForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerRole === "candidate") {
      if (!registerForm.major?.trim()) {
        alert("Please enter your Field of Study / Major.");
        return;
      }
    }
    if (!registerForm.terms) {
      alert("Please agree to the Terms");
      return;
    }
    const result = await register({ ...registerForm, role: registerRole });
    if (result.success) {
      const destination = getFinalDestination(result.role);
      navigate(destination, { replace: true });
    }
  };

  // Quick Demo fill handler
  const fillDemo = (username, password) => {
    if (!isDemoModeEnabled()) return;
    setLoginForm((prev) => ({
      ...prev,
      email: username,
      password: password,
    }));
  };

  return (
    <div className="auth-page-bg">
      {/* Top Bar with Theme/Language switcher */}
      <div className="auth-top-bar">
        <ThemeLanguageToggle />
      </div>

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
          <div className="auth-card-logo-wrap">
            <Link to="/" title="CareerLens">
              <img src="/favicon.svg" alt="CareerLens" className="auth-card-logo" />
            </Link>
          </div>
          <h1 className="tether-title">
            {isLogin ? t("auth.signIn") : t("auth.createAccount")}
          </h1>
          <p className="tether-subtitle">
            {isJobTarget ? (
              isLogin
                ? "Sign in to view job details and submit your application."
                : "Create your candidate account to connect and apply directly."
            ) : isLogin ? (
              t("auth.welcomeBack", "Welcome back! Enter your credentials to access your dashboard.")
            ) : (
              "Join CareerLens to connect with opportunities across Cambodia."
            )}
          </p>
        </div>

        {isJobTarget && (
          <div className="tether-redirect-notice">
            <span className="tether-redirect-notice__icon"><Briefcase size={16} /></span>
            <span>
              {isLogin
                ? "Sign in to your account to continue to the job listing."
                : "Register a free candidate profile to view and apply for this job."}
            </span>
          </div>
        )}

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

            {/* Submit Button */}
            <button
              type="submit"
              className="tether-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="tether-spinner" />
                  <span>{t("auth.signingIn", "Signing In...")}</span>
                </>
              ) : (
                <span>{t("auth.signIn")}</span>
              )}
            </button>

            {/* Quick Demo Login Pills (Visible only when Demo Mode is enabled) */}
            {isDemoModeEnabled() && (
              <div className="tether-demo-box">
              <p className="tether-demo-title">Quick Demo Login</p>
              <div className="tether-demo-buttons">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_cand_sreymom", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <GraduationCap size={14} /> Candidate
                  </span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_comp_mekong", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={14} /> Company
                  </span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fillDemo("demo_admin", "CareerLens2026!Demo")}
                  className="tether-demo-btn"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={14} /> Admin
                  </span>
                </button>
              </div>
              <p className="tether-demo-pw">
                Password: <code>CareerLens2026!Demo</code>
              </p>
            </div>
            )}

            {/* Switch to Register */}
            <div className="tether-switch">
              {t("auth.noAccount")}{" "}
              <Link
                to={`/register${
                  targetRedirect ? `?redirect=${encodeURIComponent(targetRedirect)}` : ""
                }`}
              >
                {t("auth.signUp")}
              </Link>
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
                  placeholder={t("auth.enterPassword", "Enter your password")}
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
              <>
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

                <div className="tether-field">
                  <label className="tether-label">{t("auth.majorStudyField", "Major / Field of Study")} *</label>
                  <CurvyInput isValid={Boolean(registerForm.major.trim())}>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Information Technology, Software Engineering"
                      value={registerForm.major}
                      onChange={(e) => setRegisterForm({ ...registerForm, major: e.target.value })}
                      disabled={loading}
                      className="tether-input"
                      required
                    />
                  </CurvyInput>
                </div>

                <div className="tether-field">
                  <div className="tether-label-row">
                    <label className="tether-label">{t("auth.skills", "Key Skills & Technologies")}</label>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {(registerForm.skills || []).length} selected
                    </span>
                  </div>

                  {/* Selected Skill Tags */}
                  {(registerForm.skills || []).length > 0 && (
                    <div className="tether-selected-tags">
                      {registerForm.skills.map((skill) => (
                        <span key={skill} className="tether-skill-tag">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            title={`Remove ${skill}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom Skill Input Row */}
                  <div className="tether-skill-input-row">
                    <div className="flex-1">
                      <CurvyInput isValid={Boolean(customSkillInput.trim())}>
                        <input
                          type="text"
                          placeholder={t("auth.skillsPlaceholder", "Add a skill (e.g. React, Python) and press Enter")}
                          value={customSkillInput}
                          onChange={(e) => setCustomSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomSkill();
                            }
                          }}
                          disabled={loading}
                          className="tether-input"
                        />
                      </CurvyInput>
                    </div>
                    <button
                      type="button"
                      className="tether-btn-add-skill"
                      onClick={handleAddCustomSkill}
                      disabled={!customSkillInput.trim() || loading}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Quick-Pick Popular Suggestions */}
                  <div className="tether-skills-quick">
                    <span className="tether-skills-quick-label">Suggestions:</span>
                    {POPULAR_SIGNUP_SKILLS.map((skill) => {
                      const isSel = (registerForm.skills || []).some(
                        (s) => s.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <button
                          key={skill}
                          type="button"
                          className={`tether-skill-chip-btn ${isSel ? "selected" : ""}`}
                          onClick={() => handleToggleSkill(skill)}
                        >
                          {isSel ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Check size={12} /> {skill}
                            </span>
                          ) : (
                            `+ ${skill}`
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
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

            <button type="submit" className="tether-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="tether-spinner" />
                  <span>{t("auth.creatingAccount", "Creating Account...")}</span>
                </>
              ) : (
                <span>{t("auth.signUp")}</span>
              )}
            </button>

            <div className="tether-switch">
              {t("auth.hasAccount")}{" "}
              <Link
                to={`/login${
                  targetRedirect ? `?redirect=${encodeURIComponent(targetRedirect)}` : ""
                }`}
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
