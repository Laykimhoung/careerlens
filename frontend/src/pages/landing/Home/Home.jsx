import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import Radar from "../../../components/ui/Radar";
import OrbitImages from "../../../components/ui/OrbitImages";
import ThemeLanguageToggle from "../../../components/common/ThemeLanguageToggle";
import { useTheme } from "../../../context/ThemeContext";
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
  const [showScrollTop, setShowScrollTop] = useState(false);
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
    // Poll every 10 seconds to keep stats synchronized with backend in real time
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
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
    // 1. Scroll Reveal Observer (RUPP-style fade-in-up)
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

    // 2. Animated Number Counters on Scroll (RUPP-style)
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const countTo = parseInt(target.getAttribute("data-target"), 10);
            const suffix = target.getAttribute("data-suffix") || "";
            const duration = 1800; // 1.8s smooth count-up
            const startTime = performance.now();

            const updateCount = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease-out quad easing for smooth landing
              const easeProgress = progress * (2 - progress);
              const currentCount = Math.floor(easeProgress * countTo);

              target.innerText = currentCount.toLocaleString() + suffix;

              if (progress < 1) {
                requestAnimationFrame(updateCount);
              } else {
                target.innerText = countTo.toLocaleString() + suffix;
              }
            };

            requestAnimationFrame(updateCount);
            counterObserver.unobserve(target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const counters = document.querySelectorAll(".landing-counter");
    counters.forEach((c) => counterObserver.observe(c));

    return () => {
      animObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return (
    <div className="landing-wrapper" data-theme={theme}>
      {/* Background Animated Radar (Fixed Full Page) */}
      <div className="landing-radar-bg">
        <Radar
          key={theme}
          color={theme === "dark" ? "#1e40af" : "#638ECB"}
          lightMode={theme === "light"}
          mode="sweep"
          speed={1.5}
          trail={theme === "dark" ? 0.5 : 0.45}
          scale={0.6}
          ringCount={8}
          spokeCount={8}
          targets={11}
          clutter={0.6}
          mouseInteraction={true}
          brightness={theme === "dark" ? 1.1 : 1.3}
          gridOpacity={1.8}
          lineWidth={1.5}
        />
      </div>

      <div className="landing-content-layer">
        {/* Header */}
        <header className="landing-header">
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
              <Link to="/login">Find Jobs</Link>
              <a href="#companies">For Companies</a>
              <a href="#how">How It Works</a>
              <a href="#about">About</a>
            </nav>

            <div className="landing-actions">
              <ThemeLanguageToggle />
              <Link to="/login" className="landing-btn b2">Log In</Link>
              <Link to="/register" className="landing-btn">Get Started</Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="landing-hero">
            <div className="landing-animate-on-scroll">
              <p className="landing-hero__tag">Connect. Apply. Get Hired.</p>
              <h1 className="landing-hero__title">Your next opportunity starts here.</h1>
              <p className="landing-hero__desc">
                CareerLens connects students and job seekers with companies while making the entire recruitment journey easier to manage.
              </p>
              <div className="landing-hero__cta">
                <Link to="/register" className="landing-btn">Find a Job</Link>
                <Link to="/register" className="landing-btn b2">Hire Talent</Link>
              </div>
            </div>

            <div className="landing-card landing-animate-on-scroll landing-stagger-2">
              <p className="landing-journey__title">THE RECRUITMENT JOURNEY</p>
              
              <div className="landing-journey__step">
                <span className="landing-journey__num">1</span>
                <span className="landing-journey__text">Student</span>
              </div>
              <div className="landing-journey__line"></div>
              
              <div className="landing-journey__step">
                <span className="landing-journey__num">2</span>
                <span className="landing-journey__text">Application</span>
              </div>
              <div className="landing-journey__line"></div>

              <div className="landing-journey__step">
                <span className="landing-journey__num">3</span>
                <span className="landing-journey__text">Interview</span>
              </div>
              <div className="landing-journey__line"></div>

              <div className="landing-journey__step">
                <span className="landing-journey__num">4</span>
                <span className="landing-journey__text">Job</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="landing-section">
            <div className="landing-section__inner">
              <h2 className="landing-section__title landing-animate-on-scroll">One platform for the entire hiring journey.</h2>
              <div className="landing-grid-3">
                <div className="landing-card landing-animate-on-scroll landing-stagger-1">
                  <h3 className="landing-feat__title">For Students</h3>
                  <p className="landing-feat__desc">Discover opportunities, build your profile, apply for jobs and track your recruitment journey.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2">
                  <h3 className="landing-feat__title">For Companies</h3>
                  <p className="landing-feat__desc">Post jobs, manage applicants, schedule interviews and hire talent through a complete ATS workflow.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3">
                  <h3 className="landing-feat__title">For Administrators</h3>
                  <p className="landing-feat__desc">Manage the platform, users, companies, jobs and recruitment activity.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works Section */}
          <section className="landing-section landing-section--gray" id="how">
            <div className="landing-section__inner">
              <h2 className="landing-section__title landing-animate-on-scroll">How it works</h2>
              <div className="landing-grid-4">
                <div className="landing-card landing-animate-on-scroll landing-stagger-1">
                  <div className="landing-step__num">01</div>
                  <h3 className="landing-feat__title">Build Your Profile</h3>
                  <p className="landing-feat__desc">Create your professional profile and showcase your skills.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2">
                  <div className="landing-step__num">02</div>
                  <h3 className="landing-feat__title">Discover Opportunities</h3>
                  <p className="landing-feat__desc">Find jobs that match your interests and experience.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3">
                  <div className="landing-step__num">03</div>
                  <h3 className="landing-feat__title">Apply & Connect</h3>
                  <p className="landing-feat__desc">Submit applications and communicate with recruiters.</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-4">
                  <div className="landing-step__num">04</div>
                  <h3 className="landing-feat__title">Get Hired</h3>
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
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-1">Applied</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-2">Screening</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-3">Shortlisted</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-4">Interview</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-5">Offer</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step landing-animate-on-scroll landing-stagger-6">Hired</span>
                </div>

                <div className="landing-animate-on-scroll landing-stagger-3" style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                  <Link to="/register" className="landing-btn">Start Hiring</Link>
                  <Link to="/login" className="landing-btn b2">Start Finding Jobs</Link>
                </div>
              </div>

              {/* Stats Grid (Real-time from Database) */}
              <div className="landing-grid-4" style={{ marginBottom: "16px" }}>
                <div className="landing-card landing-animate-on-scroll landing-stagger-1" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.students} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Students</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.companies} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Companies</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.jobs} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Jobs</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-4" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
                    <AnimatedCounter value={stats.connections} />
                  </h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Successful Connections</p>
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
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"CareerLens made it much easier to keep track of my applications and interviews."</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Student (demo)</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-2" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"We can manage the entire candidate pipeline from one place."</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Recruiter (demo)</p>
                </div>
                <div className="landing-card landing-animate-on-scroll landing-stagger-3" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"It provides a clear view of recruitment activity across the platform."</p>
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
                  Empowering Cambodia's Next Generation of Talent.
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
                  radiusX={460}
                  radiusY={85}
                  rotation={-4}
                  duration={24}
                  itemSize={135}
                  depth={0.85}
                  showPath={true}
                  pathColor={theme === "dark" ? "rgba(99, 142, 203, 0.35)" : "rgba(1, 107, 251, 0.25)"}
                  pathWidth={2}
                  pathDash={8}
                  itemRadius={24}
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
              <h2 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "12px" }}>Ready for your next opportunity?</h2>
              <p className="text-muted" style={{ fontSize: "16px", marginBottom: "32px" }}>Connect. Apply. Get Hired.</p>
              <div className="landing-footer-cta__actions">
                <Link to="/register" className="landing-btn b-white">Find a Job</Link>
                <Link to="/register" className="landing-btn b-white">Hire Talent</Link>
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
                <p>Connect. Apply. Get Hired.</p>
                <p className="landing-footer__tagline">
                  Empowering university students and graduates to bridge the gap between academic education and career success.
                </p>
              </div>

              <div className="landing-footer__links">
                <div className="landing-footer__col">
                  <h4>Product</h4>
                  <Link to="/login">Find Jobs</Link>
                  <Link to="/login">For Companies</Link>
                  <a href="#how">How It Works</a>
                </div>
                <div className="landing-footer__col">
                  <h4>Company</h4>
                  <a href="#about">About Us</a>
                  <a href="#companies">Recruitment Pipeline</a>
                  <a href="mailto:contact@careerlens.edu.kh">Contact</a>
                </div>
                <div className="landing-footer__col">
                  <h4>Legal</h4>
                  <Link to="/">Privacy Policy</Link>
                  <Link to="/">Terms of Service</Link>
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
