import { Link } from "react-router-dom";
import GhostFibers from "../../../components/ui/GhostFibers";
import "./Home.css";

export default function Home() {
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
              <Link to="/login">Find Jobs</Link>
              <a href="#companies">For Companies</a>
              <a href="#how">How It Works</a>
              <a href="#about">About</a>
            </nav>

            <div className="landing-actions">
              <Link to="/login" className="landing-btn b2">Log In</Link>
              <Link to="/register" className="landing-btn">Get Started</Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="landing-hero">
            <div>
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

            <div className="landing-card">
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
              <h2 className="landing-section__title">One platform for the entire hiring journey.</h2>
              <div className="landing-grid-3">
                <div className="landing-card">
                  <h3 className="landing-feat__title">For Students</h3>
                  <p className="landing-feat__desc">Discover opportunities, build your profile, apply for jobs and track your recruitment journey.</p>
                </div>
                <div className="landing-card">
                  <h3 className="landing-feat__title">For Companies</h3>
                  <p className="landing-feat__desc">Post jobs, manage applicants, schedule interviews and hire talent through a complete ATS workflow.</p>
                </div>
                <div className="landing-card">
                  <h3 className="landing-feat__title">For Administrators</h3>
                  <p className="landing-feat__desc">Manage the platform, users, companies, jobs and recruitment activity.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works Section */}
          <section className="landing-section landing-section--gray" id="how">
            <div className="landing-section__inner">
              <h2 className="landing-section__title">How it works</h2>
              <div className="landing-grid-4">
                <div className="landing-card">
                  <div className="landing-step__num">01</div>
                  <h3 className="landing-feat__title">Build Your Profile</h3>
                  <p className="landing-feat__desc">Create your professional profile and showcase your skills.</p>
                </div>
                <div className="landing-card">
                  <div className="landing-step__num">02</div>
                  <h3 className="landing-feat__title">Discover Opportunities</h3>
                  <p className="landing-feat__desc">Find jobs that match your interests and experience.</p>
                </div>
                <div className="landing-card">
                  <div className="landing-step__num">03</div>
                  <h3 className="landing-feat__title">Apply & Connect</h3>
                  <p className="landing-feat__desc">Submit applications and communicate with recruiters.</p>
                </div>
                <div className="landing-card">
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
                <h2 className="landing-section__title" style={{ marginBottom: "8px", textAlign: "left" }}>Find people who can move your company forward.</h2>
                <p className="text-muted" style={{ marginBottom: "24px", fontSize: "15px" }}>Job posting, applicant tracking, interview scheduling, messaging and offers in one ATS pipeline.</p>
                
                <div className="landing-pipeline">
                  <span className="landing-pipeline__step">Applied</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">Screening</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">Shortlisted</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">Interview</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">Offer</span>
                  <span className="landing-pipeline__arrow">&rarr;</span>
                  <span className="landing-pipeline__step">Hired</span>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                  <Link to="/register" className="landing-btn">Start Hiring</Link>
                  <Link to="/login" className="landing-btn b2">Start Finding Jobs</Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="landing-grid-4" style={{ marginBottom: "16px" }}>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>10K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Students</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>500+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Companies</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>2K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Jobs</p>
                </div>
                <div className="landing-card" style={{ textAlign: "center", padding: "32px 16px" }}>
                  <h3 className="text-primary" style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>1K+</h3>
                  <p className="text-muted" style={{ fontSize: "14px" }}>Successful Connections</p>
                </div>
              </div>
              <p className="text-muted" style={{ textAlign: "center", fontSize: "12px", marginBottom: "64px" }}>Demo figures only.</p>

              {/* Testimonials */}
              <p style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", fontWeight: "600" }}>Demonstration testimonials</p>
              <div className="landing-grid-3">
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"CareerLens made it much easier to keep track of my applications and interviews."</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Student (demo)</p>
                </div>
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"We can manage the entire candidate pipeline from one place."</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>Recruiter (demo)</p>
                </div>
                <div className="landing-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>"It provides a clear view of recruitment activity across the platform."</p>
                  <p className="text-muted" style={{ fontSize: "14px", fontWeight: "500" }}>University Admin (demo)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-footer-cta">
            <div className="landing-footer-cta__inner">
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
          <div className="landing-real-footer__inner">
            <div className="landing-footer__brand">
              <Link to="/" className="landing-logo">
                Career<span>Lens</span>
              </Link>
              <p>Connect. Apply. Get Hired.</p>
            </div>
            <div className="landing-footer__links">
              <div className="landing-footer__col">
                <h4>Product</h4>
                <Link to="/login">Find Jobs</Link>
                <Link to="/login">For Companies</Link>
              </div>
              <div className="landing-footer__col">
                <h4>Company</h4>
                <Link to="/">About</Link>
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
