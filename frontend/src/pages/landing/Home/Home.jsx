import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import GhostFibers from "../../../components/ui/GhostFibers";
import ThemeLanguageToggle from "../../../components/common/ThemeLanguageToggle";
import "./Home.css";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="landing-wrapper">
      {/* Background Animated Fibers (Fixed Full Page) */}
      <div className="landing-fibers-bg">
        <GhostFibers
          lightMode={false}
          lineColor="#cbd5e1"
          glowColor="#016BFB"
          speed={0.15}
          scale={2}
          layers={5}
          brightness={1.5}
          blueBoost={1.5}
        />
      </div>

      <div className="landing-content-layer">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-header__inner">
            <Link to="/" className="landing-logo">
              Career<span>Lens</span>
            </Link>
            
            <nav className="landing-nav">
              <Link to="/login">{t("common.nav.findJobs")}</Link>
              <a href="#companies">{t("common.forCompanies")}</a>
              <a href="#how">{t("common.howItWorks")}</a>
              <a href="#about">{t("common.about")}</a>
            </nav>

            <div className="landing-actions">
              <ThemeLanguageToggle />
              <Link to="/login" className="landing-btn b2">{t("auth.signIn")}</Link>
              <Link to="/register" className="landing-btn">{t("common.getStarted")}</Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="landing-hero">
            <div>
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

            <div className="landing-card">
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
                <span className="landing-journey__text">{t("candidate.jobTitle")}</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="landing-section">
            <div className="landing-section__inner">
              <h2 className="landing-section__title">{t("common.landingPlatformTitle")}</h2>
              <div className="landing-grid-3">
                <div className="landing-card">
                  <h3 className="landing-feat__title">{t("common.nav.candidates")}</h3>
                  <p className="landing-feat__desc">{t("common.forStudentsDesc")}</p>
                </div>
                <div className="landing-card">
                  <h3 className="landing-feat__title">{t("common.forCompanies")}</h3>
                  <p className="landing-feat__desc">{t("common.forCompaniesDesc")}</p>
                </div>
                <div className="landing-card">
                  <h3 className="landing-feat__title">{t("common.platformAdmin")}</h3>
                  <p className="landing-feat__desc">{t("common.forAdminsDesc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works Section */}
          <section className="landing-section landing-section--gray" id="how">
            <div className="landing-section__inner">
              <h2 className="landing-section__title">{t("common.howItWorks")}</h2>
              <div className="landing-grid-4">
                <div className="landing-card">
                  <div className="landing-step__num">01</div>
                  <h3 className="landing-feat__title">{t("candidate.completeProfile")}</h3>
                  <p className="landing-feat__desc">Create your professional profile and showcase your skills.</p>
                </div>
                <div className="landing-card">
                  <div className="landing-step__num">02</div>
                  <h3 className="landing-feat__title">{t("candidate.exploreCareer")}</h3>
                  <p className="landing-feat__desc">Find jobs that match your interests and experience.</p>
                </div>
                <div className="landing-card">
                  <div className="landing-step__num">03</div>
                  <h3 className="landing-feat__title">{t("candidate.applyJob")}</h3>
                  <p className="landing-feat__desc">Submit applications and communicate with recruiters.</p>
                </div>
                <div className="landing-card">
                  <div className="landing-step__num">04</div>
                  <h3 className="landing-feat__title">{t("candidate.upcomingInterviews")}</h3>
                  <p className="landing-feat__desc">Track interviews, offers and your path to employment.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Company & Pipeline Section */}
          <section className="landing-section" id="companies">
            <div className="landing-section__inner">
              <div style={{ marginBottom: "64px" }}>
                <h2 className="landing-section__title" style={{ marginBottom: "8px", textAlign: "left" }}>Find people who can move your company forward.</h2>
                <p className="text-muted" style={{ marginBottom: "24px", fontSize: "15px" }}>Job posting, applicant tracking, interview scheduling, messaging and offers in one ATS pipeline.</p>
                
                <div className="landing-pipeline">
                  <span className="landing-pipeline__step">{t("common.applied")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">{t("company.inReview")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">{t("company.shortlistApplication")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">{t("common.interview")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">{t("common.offer")}</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">{t("company.totalHired")}</span>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                  <Link to="/register" className="landing-btn">{t("common.hireTalent")}</Link>
                  <Link to="/login" className="landing-btn b2">{t("common.browseJobs")}</Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="landing-grid-4" style={{ marginBottom: "16px" }}>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>10K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.candidates")}</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>500+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.companies")}</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>2K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("common.nav.jobs")}</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>1K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>{t("company.totalHired")}</p>
                </div>
              </div>
              <p className="text-muted" style={{ textAlign: "center", fontSize: "12px", marginBottom: "64px" }}>Demo figures only.</p>

              {/* Testimonials */}
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", fontWeight: "600" }}>Demonstration testimonials</p>
              <div className="landing-grid-3">
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;CareerLens made it much easier to keep track of my applications and interviews.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Student (demo)</p>
                </div>
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;We can manage the entire candidate pipeline from one place.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Recruiter (demo)</p>
                </div>
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>&quot;It provides a clear view of recruitment activity across the platform.&quot;</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>University Admin (demo)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-footer-cta">
            <div className="landing-footer-cta__inner">
              <h2 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "12px" }}>{t("common.readyNextOpp")}</h2>
              <p className="text-muted" style={{ fontSize: "16px", marginBottom: "32px" }}>{t("common.landingHeroTag")}</p>
              <div className="landing-footer-cta__actions">
                <Link to="/register" className="landing-btn b-white">{t("common.browseJobs")}</Link>
                <Link to="/register" className="landing-btn b-white">{t("common.hireTalent")}</Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="landing-real-footer">
          <div className="landing-real-footer__inner">
            <div className="landing-footer__brand">
              <Link to="/" className="landing-logo">
                Career<span>Lens</span>
              </Link>
              <p>{t("common.landingHeroTag")}</p>
            </div>
            <div className="landing-footer__links">
              <div className="landing-footer__col">
                <h4>Product</h4>
                <Link to="/login">{t("common.nav.findJobs")}</Link>
                <Link to="/login">{t("common.forCompanies")}</Link>
              </div>
              <div className="landing-footer__col">
                <h4>Company</h4>
                <Link to="/">{t("common.about")}</Link>
                <Link to="/">Contact</Link>
              </div>
              <div className="landing-footer__col">
                <h4>Legal</h4>
                <Link to="/">Privacy</Link>
                <Link to="/">Terms</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
