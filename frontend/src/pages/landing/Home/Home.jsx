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
          {/* Hero Section */}
          <section className="landing-hero">
            <div className="landing-animate-on-scroll">
              <p className="landing-hero__tag">{t("common.landingHeroTag")}</p>
              <h1 className="landing-hero__title">{t("common.landingHeroTitle")}</h1>
              <p className="landing-hero__desc">
                {t("common.landingHeroDesc")}
              </p>
              <div className="landing-hero__cta">
                <Link to="/register" className="landing-btn">{t("common.browseJobs")}</Link>
                <Link to="/register" className="landing-btn b2">{t("common.hireTalent")}</Link>
              </div>
            </div>

            <div className="landing-card landing-animate-on-scroll landing-stagger-2">
              <p className="landing-journey__title">{t("common.recruitmentJourney")}</p>
              
              <div className="landing-journey__step">
                <span className="landing-journey__num">1</span>
                <span className="landing-journey__text">{t("common.student")}</span>
              </div>
              <div className="landing-journey__line"></div>
              
              <div className="landing-journey__step">
                <span className="landing-journey__num">2</span>
                <span className="landing-journey__text">{t("common.application")}</span>
              </div>
              <div className="landing-journey__line"></div>

              <div className="landing-journey__step">
                <span className="landing-journey__num">3</span>
                <span className="landing-journey__text">{t("common.interview")}</span>
              </div>
              <div className="landing-journey__line"></div>

              <div className="landing-journey__step">
                <span className="landing-journey__num">4</span>
                <span className="landing-journey__text">{t("common.job")}</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="landing-section">
            <div className="landing-section__inner">
              <h2 className="landing-section__title landing-animate-on-scroll">{t("common.landingPlatformTitle")}</h2>
              <div className="landing-grid-3">
                <div className="landing-card landing-animate-on-scroll landing-stagger-1">
                  <h3 className="landing-feat__title">{t("common.nav.candidates")}</h3>
                  <p className="landing-feat__desc">{t("common.forStudentsDesc")}</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2">
                  <h3 className="landing-feat__title">{t("common.forCompanies")}</h3>
                  <p className="landing-feat__desc">{t("common.forCompaniesDesc")}</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3">
                  <h3 className="landing-feat__title">{t("common.platformAdmin")}</h3>
                  <p className="landing-feat__desc">{t("common.forAdminsDesc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works Section */}
          <section className="landing-section landing-section--gray" id="how">
            <div className="landing-section__inner">
              <h2 className="landing-section__title landing-animate-on-scroll">{t("common.howItWorks")}</h2>
              <div className="landing-grid-4">
                <div className="landing-card landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-step__num">01</div>
                  <h3 className="landing-feat__title">{t("candidate.completeProfile")}</h3>
                  <p className="landing-feat__desc">Create your professional profile and showcase your skills.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-step__num">02</div>
                  <h3 className="landing-feat__title">{t("common.browseJobs")}</h3>
                  <p className="landing-feat__desc">Find jobs that match your interests and experience.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-step__num">03</div>
                  <h3 className="landing-feat__title">{t("common.apply")}</h3>
                  <p className="landing-feat__desc">Submit applications and communicate with recruiters.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-4">
                  <div className="landing-step__num">04</div>
                  <h3 className="landing-feat__title">{t("common.getHired")}</h3>
                  <p className="landing-feat__desc">Track interviews, offers and your path to employment.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Company & Pipeline Section */}
          <section className="landing-section" id="companies">
            <div className="landing-section__inner">
              <div style={{ marginBottom: "64px" }}>
                <h2 className="landing-section__title landing-animate-on-scroll" style={{ marginBottom: "8px", textAlign: "left" }}>Find people who can move your company forward.</h2>
                <p className="text-muted landing-animate-on-scroll landing-stagger-1" style={{ marginBottom: "24px", fontSize: "15px" }}>Job posting, applicant tracking, interview scheduling, messaging and offers in one ATS pipeline.</p>
                
                <div className="landing-pipeline">
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-1">{t("common.applied")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-2">{t("company.inReview")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-3">{t("company.shortlistApplication")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-4">{t("common.interview")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-5">{t("common.offer")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-6">{t("company.totalHired")}</span>
                </div>

                <div className="landing-animate-on-scroll landing-stagger-3" style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                  <Link to="/register" className="landing-btn">{t("common.hireTalent")}</Link>
                  <Link to="/login" className="landing-btn b2">{t("common.browseJobs")}</Link>
                </div>
              </div>

              {/* Stats Grid (Real-time from Database) */}
              <div className="landing-grid-4 landing-stats-grid" style={{ marginBottom: "16px" }}>
                <div className="landing-card landing-animate-on-scroll landing-stagger-1" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.students} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.candidates")}</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.companies} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.companies")}</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.jobs} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.jobs")}</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-4" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.connections} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("company.totalHired")}</p>
                </div>
              </div>

              <div
                className="landing-animate-on-scroll"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "64px",
                }}
              >
                <span className="landing-live-dot" />
                <p className="text-muted" style={{ margin: 0, fontSize: "12px", fontWeight: "500" }}>
                  Real-time database statistics
                </p>
              </div>

              {/* Testimonials */}
              <p className="landing-animate-on-scroll" style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", fontWeight: "600" }}>Demonstration testimonials</p>
              <div className="landing-grid-3">
                <div className="landing-card landing-animate-on-scroll landing-stagger-1" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;CareerLens made it much easier to keep track of my applications and interviews.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Student (demo)</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;We can manage the entire candidate pipeline from one place.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Recruiter (demo)</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;It provides a clear view of recruitment activity across the platform.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>University Admin (demo)</p>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="landing-section landing-section--gray" id="about">
            <div className="landing-section__inner">
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <p className="landing-hero__tag landing-animate-on-scroll" style={{ display: "inline-block" }}>
                  About CareerLens
                </p>
                <h2 className="landing-section__title landing-animate-on-scroll landing-stagger-1" style={{ marginBottom: "12px" }}>
                  Empowering Cambodia&apos;s Next Generation of Talent.
                </h2>
                <p className="text-muted landing-animate-on-scroll landing-stagger-2" style={{ maxWidth: "680px", margin: "0 auto", fontSize: "15px", lineHeight: "1.6" }}>
                  CareerLens connects motivated students and graduates with forward-thinking employers through a seamless, transparent recruitment journey.
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
                      <span className="landing-about__badge">Our Community</span>
                      <h3 className="landing-about__center-title">Talent in Motion</h3>
                      <p className="landing-about__center-desc">
                        Bridging classroom excellence with real-world industry opportunities.
                      </p>
                    </div>
                  }
                />
              </div>

              {/* About Cards Grid */}
              <div className="landing-grid-3" style={{ marginTop: "40px" }}>
                <div className="landing-card landing-animate-on-scroll landing-stagger-1">
                  <h3 className="landing-feat__title">Student Opportunities</h3>
                  <p className="landing-feat__desc">
                    Access verified internships, graduate jobs, and mentorship programs designed to launch your career.
                  </p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2">
                  <h3 className="landing-feat__title">Company Growth</h3>
                  <p className="landing-feat__desc">
                    Discover skilled candidates faster with our automated screening, interview scheduling, and pipeline tools.
                  </p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3">
                  <h3 className="landing-feat__title">University Partnership</h3>
                  <p className="landing-feat__desc">
                    Empowering academic institutions to track employment outcomes and guide students toward high-impact paths.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-footer-cta">
            <div className="landing-footer-cta__inner landing-animate-on-scroll">
              <h2 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "12px" }}>{t("common.readyNextOpp")}</h2>
              <p className="text-muted" style={{ fontSize: "16px", marginBottom: "32px" }}>{t("common.landingHeroTag")}</p>
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
