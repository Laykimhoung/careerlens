import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import Radar from "../../../components/ui/Radar";
import OrbitImages from "../../../components/ui/OrbitImages";
import ThemeLanguageToggle from "../../../components/common/ThemeLanguageToggle";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import logoImg from "../../../assets/logo/logo.webp";
import coachImg from "../../../assets/images/Coach.webp";
import enImg from "../../../assets/images/En.webp";
import youeImg from "../../../assets/images/Youe.webp";
import kimhoungImg from "../../../assets/images/Kimhoung.webp";
import "./Home.css";

const ABOUT_ORBIT_IMAGES = [
  { src: coachImg, alt: "Mentorship & Career Coaching" },
  { src: enImg, alt: "Tech & Software Engineering" },
  { src: youeImg, alt: "Student Journey & Success" },
  { src: kimhoungImg, alt: "Professional Leadership & Growth" },
];

function AnimatedCounter({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) return;
    const start = prevRef.current;
    const end = Number(value);
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * ease);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
        prevRef.current = end;
      }
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Responsive mobile screen tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    jobs: 0,
    connections: 0,
  });

  // Real-time Database stats sync
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await api.get("/platform-stats/");
        if (isMounted && res?.data) {
          setStats({
            students: res.data.students ?? 0,
            companies: res.data.companies ?? 0,
            jobs: res.data.jobs ?? 0,
            connections: res.data.connections ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to load real-time platform stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowScrollTop(y > 200);
      setScrolled(y > 20);

      // Section tracking
      const sectionIds = ["companies", "how", "about"];
      let found = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260 && rect.bottom >= 120) {
            found = id;
            break;
          }
        }
      }
      setActiveSection(found);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    // Scroll Reveal Observer (RUPP-style fade-in-up)
    const animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("landing-visible");
            animObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const animatedEls = document.querySelectorAll(".landing-animate-on-scroll");
    animatedEls.forEach((el) => animObserver.observe(el));

    return () => {
      animObserver.disconnect();
    };
  }, []);

  return (
    <div className="landing-wrapper" data-theme={theme}>
      {/* Background Animated Radar (Fixed Full Page) */}
      <div className="landing-radar-bg">
        <Radar
          key={`${theme}-${isMobile ? "mob" : "desk"}`}
          color={theme === "dark" ? "#1e40af" : "#638ECB"}
          lightMode={theme === "light"}
          mode="sweep"
          speed={1.5}
          trail={theme === "dark" ? 0.5 : 0.45}
          scale={isMobile ? 0.46 : 0.6}
          centerY={isMobile ? 0.36 : 0.5}
          ringCount={isMobile ? 6 : 8}
          spokeCount={isMobile ? 6 : 8}
          targets={isMobile ? 6 : 11}
          clutter={isMobile ? 0.4 : 0.6}
          mouseInteraction={true}
          brightness={isMobile ? (theme === "dark" ? 0.85 : 1.05) : (theme === "dark" ? 1.1 : 1.3)}
          gridOpacity={isMobile ? 1.1 : 1.8}
          lineWidth={isMobile ? 1.1 : 1.5}
        />
      </div>

      <div className="landing-content-layer">
        {/* Header */}
        <header className={`landing-header ${scrolled ? "landing-header--scrolled" : ""}`}>
          <div className="landing-header__inner">
            <Link to="/" className="landing-logo">
              <div className="landing-logo__icon-box">
                <img src={logoImg} alt="CareerLens" className="landing-logo__img" />
              </div>
              <span className="landing-logo-text">
                <span className="brand-career">Career</span>
                <span className="brand-lens">Lens</span>
              </span>
            </Link>
            
            <nav className="landing-nav">
              <Link to="/login" className="landing-nav__link">
                <span>{t("common.nav.findJobs")}</span>
              </Link>
              <a 
                href="#companies" 
                className={`landing-nav__link ${activeSection === "companies" ? "active" : ""}`}
              >
                <span>{t("common.forCompanies")}</span>
              </a>
              <a 
                href="#how" 
                className={`landing-nav__link ${activeSection === "how" ? "active" : ""}`}
              >
                <span>{t("common.howItWorks")}</span>
              </a>
              <a 
                href="#about" 
                className={`landing-nav__link ${activeSection === "about" ? "active" : ""}`}
              >
                <span>{t("common.about")}</span>
              </a>
            </nav>

            <div className="landing-actions">
              <ThemeLanguageToggle />
              <Link to="/login" className="landing-btn landing-btn--signin landing-btn--desktop">
                {t("auth.signIn")}
              </Link>
              <Link to="/register" className="landing-btn landing-btn--getstarted landing-btn-shimmer landing-btn--desktop">
                <span>{t("common.getStarted")}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-btn__arrow">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>

              {/* Mobile menu hamburger toggle button */}
              <button 
                type="button" 
                className="landing-mobile-menu-btn"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="landing-mobile-menu">
              <nav className="landing-mobile-nav">
                <Link to="/login" className="landing-mobile-nav__link" onClick={() => setMobileMenuOpen(false)}>
                  <span>{t("common.nav.findJobs")}</span>
                </Link>
                <a href="#companies" className={`landing-mobile-nav__link ${activeSection === "companies" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
                  <span>{t("common.forCompanies")}</span>
                </a>
                <a href="#how" className={`landing-mobile-nav__link ${activeSection === "how" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
                  <span>{t("common.howItWorks")}</span>
                </a>
                <a href="#about" className={`landing-mobile-nav__link ${activeSection === "about" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
                  <span>{t("common.about")}</span>
                </a>
              </nav>

              <div className="landing-mobile-actions">
                <Link to="/login" className="landing-btn landing-btn--signin" onClick={() => setMobileMenuOpen(false)}>
                  {t("auth.signIn")}
                </Link>
                <Link to="/register" className="landing-btn landing-btn--getstarted" onClick={() => setMobileMenuOpen(false)}>
                  <span>{t("common.getStarted")}</span>
                </Link>
              </div>
            </div>
          )}
        </header>

        <main>
          {/* ── Hero Section ── */}
          <section className="landing-hero landing-hero--v2">
            <div className="landing-animate-on-scroll">
              {/* Badge */}
              <div className="landing-hero__badge">
                <span className="landing-hero__badge-dot" />
                {t("common.heroBadge")}
              </div>

              {/* Title */}
              <h1 className="landing-hero__title landing-hero__title--v2">
                {t("common.heroTitle1")}{" "}
                <span className="landing-hero__title-accent">{t("common.heroTitle2")}</span>
              </h1>

              {/* Subtitle */}
              <p className="landing-hero__desc landing-hero__desc--v2">
                {t("common.heroSubtitle")}
              </p>

              {/* CTA Buttons */}
              <div className="landing-hero__cta landing-hero__cta--v2">
                <Link to="/register" className="landing-btn landing-btn--hero-primary">
                  {t("common.browseJobs")} →
                </Link>
                <Link to="/register" className="landing-btn landing-btn--hero-outline">
                  {t("common.postJob")}
                </Link>
              </div>
            </div>
          </section>

          {/* ── Features / Role Cards Section ── */}
          <section className="landing-section">
            <div className="landing-section__inner">
              <div className="landing-section__header landing-animate-on-scroll">
                <h2 className="landing-section__title landing-section__title--center">
                  {t("common.landingPlatformTitle")}
                </h2>
                <p className="landing-section__subtitle text-muted">
                  {t("common.platformSubtitle")}
                </p>
              </div>
              <div className="landing-grid-3 landing-feat-grid">
                {/* Candidates Card */}
                <div className="landing-feat-card landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-feat-card__icon landing-feat-card__icon--blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <h3 className="landing-feat-card__title">{t("common.featCandidatesTitle")}</h3>
                  <p className="landing-feat-card__desc">{t("common.featCandidatesDesc")}</p>
                  <Link to="/register" className="landing-feat-card__link">{t("common.learnMore")}</Link>
                </div>

                {/* Companies Card */}
                <div className="landing-feat-card landing-feat-card--highlight landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-feat-card__icon landing-feat-card__icon--white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <h3 className="landing-feat-card__title">{t("common.featCompaniesTitle")}</h3>
                  <p className="landing-feat-card__desc">{t("common.featCompaniesDesc")}</p>
                  <Link to="/register" className="landing-feat-card__link landing-feat-card__link--white">{t("common.learnMore")}</Link>
                </div>

                {/* Admins Card */}
                <div className="landing-feat-card landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-feat-card__icon landing-feat-card__icon--purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <h3 className="landing-feat-card__title">{t("common.featAdminsTitle")}</h3>
                  <p className="landing-feat-card__desc">{t("common.featAdminsDesc")}</p>
                  <Link to="/login" className="landing-feat-card__link">{t("common.learnMore")}</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── How It Works — Visual Timeline ── */}
          <section className="landing-section landing-section--gray" id="how">
            <div className="landing-section__inner">
              <div className="landing-section__header landing-animate-on-scroll">
                <h2 className="landing-section__title landing-section__title--center">{t("common.howItWorks")}</h2>
                <p className="landing-section__subtitle text-muted">
                  {t("common.howSubtitle")}
                </p>
              </div>

              <div className="landing-timeline">
                {/* Connecting line (desktop) */}
                <div className="landing-timeline__line" />

                {/* Step 1 */}
                <div className="landing-timeline__step landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-timeline__circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div className="landing-timeline__number">01</div>
                  <h3 className="landing-timeline__title">{t("common.howStep1Title")}</h3>
                  <p className="landing-timeline__desc">{t("common.howStep1Desc")}</p>
                </div>

                {/* Step 2 */}
                <div className="landing-timeline__step landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-timeline__circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <div className="landing-timeline__number">02</div>
                  <h3 className="landing-timeline__title">{t("common.howStep2Title")}</h3>
                  <p className="landing-timeline__desc">{t("common.howStep2Desc")}</p>
                </div>

                {/* Step 3 */}
                <div className="landing-timeline__step landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-timeline__circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                    </svg>
                  </div>
                  <div className="landing-timeline__number">03</div>
                  <h3 className="landing-timeline__title">{t("common.howStep3Title")}</h3>
                  <p className="landing-timeline__desc">{t("common.howStep3Desc")}</p>
                </div>

                {/* Step 4 */}
                <div className="landing-timeline__step landing-animate-on-scroll landing-stagger-4">
                  <div className="landing-timeline__circle landing-timeline__circle--gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="landing-timeline__number landing-timeline__number--gold">04</div>
                  <h3 className="landing-timeline__title">{t("common.howStep4Title")}</h3>
                  <p className="landing-timeline__desc">{t("common.howStep4Desc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Stats + Pipeline Section ── */}
          <section className="landing-section" id="companies">
            <div className="landing-section__inner">

              {/* Stats Header */}
              <div className="landing-stats-header landing-animate-on-scroll">
                <h2 className="landing-section__title landing-section__title--center">
                  {t("common.statsTrust")}
                </h2>
                <div className="landing-stats-live">
                  <span className="landing-live-dot" />
                  <span className="text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>{t("common.statsLiveNotice")}</span>
                </div>
              </div>

              {/* Stats Grid (Real-time from Database) */}
              <div className="landing-grid-4 landing-stats-grid">
                <div className="landing-stat-card landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <h3 className="landing-stat-card__number">
                    <AnimatedCounter value={stats.students} />
                  </h3>
                  <p className="landing-stat-card__label">{t("common.nav.candidates")}</p>
                </div>
                <div className="landing-stat-card landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <h3 className="landing-stat-card__number">
                    <AnimatedCounter value={stats.companies} />
                  </h3>
                  <p className="landing-stat-card__label">{t("common.nav.companies")}</p>
                </div>
                <div className="landing-stat-card landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-stat-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <h3 className="landing-stat-card__number">
                    <AnimatedCounter value={stats.jobs} />
                  </h3>
                  <p className="landing-stat-card__label">{t("common.nav.jobs")}</p>
                </div>
                <div className="landing-stat-card landing-animate-on-scroll landing-stagger-4">
                  <div className="landing-stat-card__icon landing-stat-card__icon--gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 className="landing-stat-card__number landing-stat-card__number--gold">
                    <AnimatedCounter value={stats.connections} />
                  </h3>
                  <p className="landing-stat-card__label">{t("company.totalHired")}</p>
                </div>
              </div>

              {/* Pipeline Section */}
              <div className="landing-pipeline-section">
                <div className="landing-pipeline-section__content landing-animate-on-scroll">
                  <h2 className="landing-section__title" style={{ marginBottom: "8px" }}>
                    {t("common.pipelineTitle")}
                  </h2>
                  <p className="text-muted" style={{ marginBottom: "24px", fontSize: "15px", lineHeight: "1.6" }}>
                    {t("common.pipelineDesc")}
                  </p>

                  {/* Feature checklist */}
                  <div className="landing-pipeline-features">
                    {[
                      t("common.pipelineFeature1"),
                      t("common.pipelineFeature2"),
                      t("common.pipelineFeature3"),
                      t("common.pipelineFeature4"),
                    ].map((feat) => (
                      <div key={feat} className="landing-pipeline-feature-item">
                        <span className="landing-pipeline-feature-check">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
                    <Link to="/register" className="landing-btn">{t("common.hireTalent")}</Link>
                    <Link to="/login" className="landing-btn b2">{t("common.browseJobs")}</Link>
                  </div>
                </div>

                <div className="landing-pipeline-section__visual landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-pipeline landing-pipeline--v2">
                    <span className="landing-pipeline__step landing-pipeline__step--applied landing-animate-on-scroll landing-stagger-1">{t("common.applied")}</span>
                    <span className="landing-pipeline__arrow" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-pipeline__arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span className="landing-pipeline__step landing-pipeline__step--review landing-animate-on-scroll landing-stagger-2">{t("company.inReview")}</span>
                    <span className="landing-pipeline__arrow" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-pipeline__arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span className="landing-pipeline__step landing-pipeline__step--shortlist landing-animate-on-scroll landing-stagger-3">{t("company.shortlistApplication")}</span>
                    <span className="landing-pipeline__arrow" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-pipeline__arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span className="landing-pipeline__step landing-pipeline__step--interview landing-animate-on-scroll landing-stagger-4">{t("common.interview")}</span>
                    <span className="landing-pipeline__arrow" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-pipeline__arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span className="landing-pipeline__step landing-pipeline__step--offer landing-animate-on-scroll landing-stagger-5">{t("common.offer")}</span>
                    <span className="landing-pipeline__arrow" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-pipeline__arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span className="landing-pipeline__step landing-pipeline__step--hired landing-animate-on-scroll landing-stagger-6">{t("company.totalHired")}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── About Section ── */}
          <section className="landing-section landing-section--gray" id="about">
            <div className="landing-section__inner">
              <div className="landing-about__header">
                <span className="landing-hero__badge landing-animate-on-scroll" style={{ display: "inline-flex", marginBottom: "12px" }}>
                  <span className="landing-hero__badge-dot" />
                  {t("common.aboutBadge")}
                </span>
                <h2 className="landing-section__title landing-section__title--center landing-animate-on-scroll landing-stagger-1">
                  {t("common.aboutTitle")}
                </h2>
                <p className="text-muted landing-animate-on-scroll landing-stagger-2" style={{ maxWidth: "680px", margin: "0 auto", fontSize: "15px", lineHeight: "1.7" }}>
                  {t("common.aboutSubtitle")}
                </p>
              </div>

              {/* Orbiting Images Showcase */}
              <div className="landing-about__orbit-wrapper landing-animate-on-scroll landing-stagger-3">
                <OrbitImages
                  images={ABOUT_ORBIT_IMAGES}
                  shape="ellipse"
                  radiusX={isMobile ? 240 : 460}
                  radiusY={isMobile ? 75 : 85}
                  rotation={-4}
                  duration={24}
                  itemSize={isMobile ? 85 : 135}
                  depth={0.85}
                  showPath={true}
                  pathColor={theme === "dark" ? "rgba(99, 142, 203, 0.35)" : "rgba(1, 107, 251, 0.25)"}
                  pathWidth={isMobile ? 1.5 : 2}
                  pathDash={8}
                  itemRadius={isMobile ? 16 : 24}
                  hoverScale={1.16}
                  hoverSpeed={0.25}
                  draggable={true}
                  clickToFront={true}
                  centerContent={
                    <div className="landing-about__center-card">
                      <span className="landing-about__badge">{t("common.communityBadge")}</span>
                      <h3 className="landing-about__center-title">{t("common.communityTitle")}</h3>
                      <p className="landing-about__center-desc">
                        {t("common.communityDesc")}
                      </p>
                    </div>
                  }
                />
              </div>

              {/* About Cards Grid */}
              <div className="landing-grid-3 landing-about-cards" style={{ marginTop: "40px" }}>
                {/* Students */}
                <div className="landing-about-card landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-about-card__icon landing-about-card__icon--blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <h3 className="landing-about-card__title">{t("common.aboutCard1Title")}</h3>
                  <p className="landing-about-card__desc">{t("common.aboutCard1Desc")}</p>
                </div>

                {/* Companies */}
                <div className="landing-about-card landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-about-card__icon landing-about-card__icon--teal">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <h3 className="landing-about-card__title">{t("common.aboutCard2Title")}</h3>
                  <p className="landing-about-card__desc">{t("common.aboutCard2Desc")}</p>
                </div>

                {/* University */}
                <div className="landing-about-card landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-about-card__icon landing-about-card__icon--amber">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <h3 className="landing-about-card__title">{t("common.aboutCard3Title")}</h3>
                  <p className="landing-about-card__desc">{t("common.aboutCard3Desc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer CTA ── */}
          <section className="landing-footer-cta landing-footer-cta--v2">
            <div className="landing-footer-cta__inner landing-animate-on-scroll">
              <h2 className="landing-footer-cta__title">{t("common.ctaTitle")}</h2>
              <p className="landing-footer-cta__subtitle text-muted">{t("common.ctaSubtitle")}</p>
              <div className="landing-footer-cta__actions">
                <Link to="/register" className="landing-btn-3d landing-btn-3d--primary">{t("common.browseJobs")}</Link>
                <Link to="/register" className="landing-btn-3d landing-btn-3d--secondary">{t("common.hireTalent")}</Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="landing-real-footer">
          <div className="landing-real-footer__inner landing-animate-on-scroll">
            <div className="landing-footer__main">
              <div className="landing-footer__brand">
                <Link to="/" className="landing-logo">
                  <div className="landing-logo__icon-box">
                    <img src={logoImg} alt="CareerLens" className="landing-logo__img" />
                  </div>
                  <span className="landing-logo-text">
                    <span className="brand-career">Career</span>
                    <span className="brand-lens">Lens</span>
                  </span>
                </Link>
                <p>{t("common.landingHeroTag")}</p>
                <p className="landing-footer__tagline">
                  Empowering university students and graduates to bridge the gap between academic education and career success.
                </p>
              </div>

              <div className="landing-footer__links">
                <div className="landing-footer__col">
                  <h4>Product</h4>
                  <Link to="/login">{t("common.nav.findJobs")}</Link>
                  <Link to="/login">{t("common.forCompanies")}</Link>
                  <a href="#how">{t("common.howItWorks")}</a>
                </div>
                <div className="landing-footer__col">
                  <h4>Company</h4>
                  <a href="#about">{t("common.about")}</a>
                  <a href="#companies">Recruitment Pipeline</a>
                  <a href="mailto:contact@careerlens.edu.kh">Contact</a>
                </div>
                <div className="landing-footer__col">
                  <h4>Legal</h4>
                  <Link to="/">Privacy</Link>
                  <Link to="/">Terms</Link>
                  <Link to="/">Security</Link>
                </div>
              </div>
            </div>

            {/* Bottom Copyright Bar (RUPP style) */}
            <div className="landing-footer__bottom">
              <p className="landing-footer__copyright">
                © {new Date().getFullYear()} CareerLens. All rights reserved.
              </p>
              <div className="landing-footer__bottom-links">
                <span className="landing-footer__rupp-badge">
                  Angkor University
                </span>
                <span className="landing-footer__dot">•</span>
                <Link to="/login">Student Portal</Link>
                <span className="landing-footer__dot">•</span>
                <Link to="/login">Employer Portal</Link>
              </div>
              {/* Social Icons */}
              <div className="landing-footer__social">
                <a href="https://github.com/Laykimhoung/careerlens" target="_blank" rel="noopener noreferrer" className="landing-footer__social-btn" aria-label="GitHub">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Scroll to Top Button (RUPP style) */}
      <button
        type="button"
        className={`landing-scroll-top ${showScrollTop ? "landing-scroll-top--visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
