import { Link } from "react-router-dom";
import "./AuthLayout.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">

      {/* ── Left brand panel ──────────────────────────────────────────────── */}
      <div className="auth-layout__brand">
        <div className="auth-layout__circle auth-layout__circle--1" />
        <div className="auth-layout__circle auth-layout__circle--2" />
        <div className="auth-layout__circle auth-layout__circle--3" />

        {/* Logo */}
        <Link to="/" className="auth-layout__logo">
          <div className="auth-layout__logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a2.25 2.25 0 001.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258a2.25 2.25 0 00-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.25 2.25 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.25 2.25 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="auth-layout__logo-text">CareerLens</span>
        </Link>

        {/* Center content */}
        <div className="auth-layout__content">
          <div>
            <h2 className="auth-layout__headline">
              Find your next<br />
              <span>dream career.</span>
            </h2>
            <p className="auth-layout__subtitle">
              AI-powered job matching that connects the right talent with the right opportunity.
            </p>
          </div>

          {/* Stats */}
          <div className="auth-layout__stats">
            {[
              { value: "10K+", label: "Job Listings" },
              { value: "5K+", label: "Companies" },
              { value: "98%", label: "Match Rate" },
            ].map((stat) => (
              <div key={stat.label} className="auth-layout__stat">
                <div className="auth-layout__stat-value">{stat.value}</div>
                <div className="auth-layout__stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="auth-layout__testimonial">
            <p className="auth-layout__testimonial-text">
              &ldquo;CareerLens helped me land my dream job in just 2 weeks.
              The AI matching is incredibly accurate!&rdquo;
            </p>
            <div className="auth-layout__testimonial-author">
              <div className="auth-layout__testimonial-avatar">S</div>
              <div>
                <div className="auth-layout__testimonial-name">Sarah K.</div>
                <div className="auth-layout__testimonial-role">Software Engineer at Meta</div>
              </div>
            </div>
          </div>
        </div>

        <p className="auth-layout__footer">© 2026 CareerLens. All rights reserved.</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="auth-layout__form-panel">
        {/* Mobile logo */}
        <Link to="/" className="auth-layout__mobile-logo">
          <div className="auth-layout__mobile-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="auth-layout__mobile-logo-text">CareerLens</span>
        </Link>

        <div className="auth-layout__form-box">
          {children}
        </div>
      </div>

    </div>
  );
}
