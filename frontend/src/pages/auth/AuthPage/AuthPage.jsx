import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./AuthPage.css";

const ROLE_DASHBOARD = { candidate: "/candidate", company: "/company", admin: "/admin" };

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loading, error, clearError, isAuthenticated, user } = useAuth();
  
  const isLogin = location.pathname === "/login";

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [registerRole, setRegisterRole] = useState("candidate");
  const [registerForm, setRegisterForm] = useState({ 
    full_name: "", email: "", password: "", confirm_password: "",
    university: "", major: "", graduation_year: "2029",
    company_name: "", work_email: "", industry: "Software", company_size: "1-10", location: "", website: "",
    terms: false
  });

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
    e.preventDefault();
    const result = await login(loginForm);
    if (result.success) {
      const from = location.state?.from?.pathname || ROLE_DASHBOARD[result.role] || "/";
      navigate(from, { replace: true });
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

  return (
    <div className="auth-page-bg">
      <div className="auth-container">
        {/* The Blade (Dark Green Overlay) */}
        <div className={`auth-blade ${isLogin ? "blade-on-right" : "blade-on-left"}`}>
          {/* Blade Content for Register */}
          <div className={`blade-content ${isLogin ? "hide-content" : "show-content"}`}>
            <h4 className="blade-brand">CareerLens</h4>
            <h1 className="blade-title">Start the<br/><em>next chapter.</em></h1>
            <p className="blade-desc">One platform to connect talent with opportunity across the globe.</p>
          </div>

          {/* Blade Content for Login */}
          <div className={`blade-content ${isLogin ? "show-content" : "hide-content"}`}>
            <h4 className="blade-brand">CareerLens</h4>
            <h1 className="blade-title">Welcome<br/><em>back.</em></h1>
            <p className="blade-desc">Your applications, jobs, and interviews are exactly where you left them.</p>
          </div>
        </div>

        {/* LOGIN FORM SECTION (Fixed on LEFT) */}
        <div className="auth-side auth-side-left">
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2>Sign in</h2>
            
            {error && isLogin && <div className="auth-error">{error}</div>}

            <div className="auth-input-group">
              <label>Username or email</label>
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  disabled={loading}
                  required
                />
                <span className="auth-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
              </div>
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type="password" 
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  disabled={loading}
                  required
                />
                <span className="auth-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </span>
              </div>
            </div>

            <div className="auth-form-actions">
              <label className="auth-checkbox">
                <input 
                  type="checkbox" 
                  checked={loginForm.remember}
                  onChange={e => setLoginForm({...loginForm, remember: e.target.checked})}
                  disabled={loading}
                />
                <span>Keep me signed in</span>
              </label>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#888', marginBottom: '16px' }}>
              Test: candidate@test.com / password123
            </p>

            <p className="auth-switch-text">
              New to CareerLens? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>


        {/* REGISTER FORM SECTION (Fixed on RIGHT) */}
        <div className="auth-side auth-side-right">
          <form className="auth-form auth-form--register" onSubmit={handleRegisterSubmit}>
            <h2>Create your CareerLens account</h2>
            
            <div className="auth-role-toggle">
              <button 
                type="button" 
                className={`auth-role-btn ${registerRole === 'candidate' ? 'active' : ''}`}
                onClick={() => setRegisterRole('candidate')}
              >
                Student
              </button>
              <button 
                type="button" 
                className={`auth-role-btn ${registerRole === 'company' ? 'active' : ''}`}
                onClick={() => setRegisterRole('company')}
              >
                Company
              </button>
            </div>

            {error && !isLogin && <div className="auth-error">{error}</div>}

            {registerRole === 'candidate' ? (
              <>
                <div className="auth-input-group">
                  <label>Full name</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      value={registerForm.full_name}
                      onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Email</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="email" 
                      value={registerForm.email}
                      onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-row">
                  <div className="auth-input-group">
                    <label>Password</label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="password" 
                        value={registerForm.password}
                        onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>Confirm password</label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="password" 
                        value={registerForm.confirm_password}
                        onChange={e => setRegisterForm({...registerForm, confirm_password: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>University</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      value={registerForm.university}
                      onChange={e => setRegisterForm({...registerForm, university: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Major</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      value={registerForm.major}
                      onChange={e => setRegisterForm({...registerForm, major: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Graduation year</label>
                  <div className="auth-input-wrapper">
                    <select 
                      style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', outline: 'none' }}
                      value={registerForm.graduation_year}
                      onChange={e => setRegisterForm({...registerForm, graduation_year: e.target.value})}
                      disabled={loading}
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="auth-input-group">
                  <label>Company name</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      value={registerForm.company_name}
                      onChange={e => setRegisterForm({...registerForm, company_name: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Work email</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="email" 
                      value={registerForm.work_email}
                      onChange={e => setRegisterForm({...registerForm, work_email: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-row">
                  <div className="auth-input-group">
                    <label>Password</label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="password" 
                        value={registerForm.password}
                        onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>Confirm password</label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="password" 
                        value={registerForm.confirm_password}
                        onChange={e => setRegisterForm({...registerForm, confirm_password: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Industry</label>
                  <div className="auth-input-wrapper">
                    <select 
                      style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', outline: 'none' }}
                      value={registerForm.industry}
                      onChange={e => setRegisterForm({...registerForm, industry: e.target.value})}
                      disabled={loading}
                    >
                      <option value="Software">Software</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                    </select>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Company size</label>
                  <div className="auth-input-wrapper">
                    <select 
                      style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', outline: 'none' }}
                      value={registerForm.company_size}
                      onChange={e => setRegisterForm({...registerForm, company_size: e.target.value})}
                      disabled={loading}
                    >
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Location</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      value={registerForm.location}
                      onChange={e => setRegisterForm({...registerForm, location: e.target.value})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Website</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="https://"
                      value={registerForm.website}
                      onChange={e => setRegisterForm({...registerForm, website: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="auth-form-actions" style={{ justifyContent: 'flex-start', marginTop: '8px', marginBottom: '16px' }}>
              <label className="auth-checkbox">
                <input 
                  type="checkbox" 
                  checked={registerForm.terms}
                  onChange={e => setRegisterForm({...registerForm, terms: e.target.checked})}
                  disabled={loading}
                  required
                />
                <span>I agree to the Terms</span>
              </label>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating..." : (registerRole === 'candidate' ? "Create Student Account" : "Create Company Account")}
            </button>

            <p className="auth-switch-text" style={{ marginTop: '16px' }}>
              Have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
      
      {/* Developer shortcut for easy access */}
      <div className="dev-shortcut" onClick={() => {
        localStorage.setItem("access_token", "fake-jwt");
        localStorage.setItem("user", JSON.stringify({ id: 1, full_name: "En", role: "candidate" }));
        window.location.reload();
      }}>Demo bypass</div>
    </div>
  );
}
