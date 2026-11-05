import { useState, useTransition } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import SideRays from "../../../components/ui/SideRays";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const isKhmer = language === "km";

  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Smart home destination based on authentication state and user role
  const getHomeDestination = () => {
    if (!isAuthenticated || !user?.role) return "/";
    const role = user.role.toLowerCase();
    if (role === "company") return "/company";
    if (role === "admin") return "/admin";
    return "/candidate";
  };

  const homePath = getHomeDestination();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    startTransition(() => {
      if (isAuthenticated && user?.role?.toLowerCase() === "candidate") {
        navigate(`/candidate/jobs?search=${encodeURIComponent(query)}`);
      } else {
        navigate(`/?search=${encodeURIComponent(query)}`);
      }
    });
  };

  return (
    <div className="not-found-page">
      {/* Sci-Fi Ambient Light Rays */}
      <div className="not-found-rays">
        <SideRays
          origin="top-left"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.2}
          intensity={1.6}
          spread={2}
          density={4}
          followMouse={true}
        />
        <SideRays
          origin="top-right"
          rayColor1="#016BFB"
          rayColor2="#388bfd"
          speed={2.5}
          intensity={1.6}
          spread={2}
          density={4}
          followMouse={true}
        />
      </div>

      {/* Cybernetic Grid Overlay */}
      <div className="not-found-grid" />

      {/* Main 404 Glass Card */}
      <div className="not-found-card">
        {/* Radar Status Badge */}
        <div className="not-found-badge">
          <span className="not-found-radar-dot" />
          <span className="not-found-badge-text">
            {isKhmer ? "បាត់បង់សញ្ញា • កំហុស ៤០៤" : "SIGNAL LOST • ERROR 404"}
          </span>
        </div>

        {/* Holographic 404 Visual & Concentric Scanner Rings */}
        <div className="not-found-hero">
          <div className="not-found-rings">
            <div className="not-found-ring not-found-ring-1" />
            <div className="not-found-ring not-found-ring-2" />
            <div className="not-found-ring not-found-ring-3" />
            <div className="not-found-scanline" />
          </div>

          <h1 className="not-found-glitch-number" data-text="404">
            404
          </h1>
        </div>

        {/* Headings */}
        <h2 className="not-found-title">
          {isKhmer ? "រកមិនឃើញទំព័រដែលអ្នកស្នើសុំទេ" : "Coordinates Out of Range"}
        </h2>

        <p className="not-found-desc">
          {isKhmer
            ? "ទំព័រដែលអ្នកកំពុងព្យាយាមចូលមើលមិនមាន ឬត្រូវបានផ្លាស់ប្តូរទីតាំងនៅលើប្រព័ន្ធ CareerLens។"
            : "The page or destination you are searching for does not exist on the CareerLens network. It may have been moved, renamed, or typed with an invalid coordinate."}
        </p>

        {/* Display Attempted Route */}
        {location.pathname && (
          <div className="not-found-target-pill">
            <span className="not-found-target-icon">📡</span>
            <code className="not-found-target-code">{location.pathname}</code>
          </div>
        )}

        {/* Quick Search Input */}
        <form className="not-found-search-box" onSubmit={handleSearchSubmit}>
          <span className="not-found-search-icon">🔍</span>
          <input
            type="text"
            className="not-found-search-input"
            placeholder={
              isKhmer
                ? "ស្វែងរកការងារ ឬពាក្យគន្លឹះ..."
                : "Search jobs or keywords (e.g. React, Python)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="not-found-search-btn">
            {isKhmer ? "ស្វែងរក" : "Search"}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="not-found-actions">
          <Link to={homePath} className="not-found-btn not-found-btn-primary">
            <span>🏠</span>
            <span>
              {isAuthenticated
                ? isKhmer
                  ? "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង"
                  : "Go to Dashboard"
                : isKhmer
                ? "ត្រឡប់ទៅទំព័រដើម"
                : "Return Home"}
            </span>
          </Link>

          <Link
            to={
              isAuthenticated && user?.role?.toLowerCase() === "candidate"
                ? "/candidate/jobs"
                : "/#jobs"
            }
            className="not-found-btn not-found-btn-secondary"
          >
            <span>💼</span>
            <span>{isKhmer ? "ស្វែងរកការងារ" : "Explore Jobs"}</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="not-found-btn not-found-btn-ghost"
          >
            <span>↩</span>
            <span>{isKhmer ? "ត្រឡប់ក្រោយ" : "Go Back"}</span>
          </button>
        </div>

        {/* Helpful Quick Links Footer */}
        <div className="not-found-footer-links">
          <span className="not-found-footer-label">
            {isKhmer ? "ផ្លូវកាត់រហ័ស:" : "Quick Links:"}
          </span>
          <Link to="/" className="not-found-chip">
            {isKhmer ? "ទំព័រដើម" : "Home"}
          </Link>
          {!isAuthenticated && (
            <>
              <Link to="/login" className="not-found-chip">
                {isKhmer ? "ចូលគណនី" : "Sign In"}
              </Link>
              <Link to="/register" className="not-found-chip">
                {isKhmer ? "ចុះឈ្មោះ" : "Register"}
              </Link>
            </>
          )}
          <a
            href="https://t.me/careerlens_jobs_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="not-found-chip not-found-chip-tg"
          >
            🤖 Telegram Bot
          </a>
        </div>
      </div>
    </div>
  );
}

