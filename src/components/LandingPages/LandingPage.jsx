import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Church, CheckCircle2 } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer,
  XAxis, BarChart, Bar, CartesianGrid, Cell,
} from "recharts";
import { WorldMap } from "./WorldMap";
import "../../styles/tailwind.css";

const SauraraLogo = "/assets/saurara-high-resolution-logo-transparent_1772299268432.png";
const FlowersImage = "/assets/flower_2_1772300098503.png";
const avatar1 = "/assets/avatar_1.jpg";
const avatar2 = "/assets/avatar_2.jpg";
const avatar3 = "/assets/avatar_3.jpg";
const avatar4 = "/assets/avatar_4.jpg";
const avatar5 = "/assets/avatar_5.jpg";
const avatar6 = "/assets/avatar_6.jpg";
const logoActea = "/assets/logo_actea.svg";
const logoBosko = "/assets/logo_bosko.svg";

const PRIMARY = "hsl(272, 51%, 37%)";
const PRIMARY_30 = "hsla(272, 51%, 37%, 0.3)";
const MUTED_FG = "hsl(268, 28%, 45%)";
const MUTED_FG_20 = "hsla(268, 28%, 45%, 0.2)";

function HeroVisual() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderDot = (props) => {
    const { cx, cy, index } = props;
    if (index === 6) {
      return (
        <circle cx={cx} cy={cy} r={5} fill={PRIMARY} stroke="white" strokeWidth={2} key={index}
          style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" }} />
      );
    }
    return null;
  };

  return (
    <div className="lp-herovis">
      <div className="lp-herovis__glow" />

      <div className="lp-herovis__card">
        {/* Tabs */}
        <div className="lp-herovis__tabs">
          {["Impact", "Benchmarks", "Alumni"].map((label, idx) => (
            <button key={idx}
              className={`lp-herovis__tab ${activeTab === idx ? "lp-herovis__tab--active" : "lp-herovis__tab--inactive"}`}
              onClick={() => setActiveTab(idx)}
            >
              {label}
              {activeTab === idx && <div className="lp-herovis__tab-indicator" />}
            </button>
          ))}
        </div>

        <div className="lp-herovis__content">
          {/* Tab 0: Impact */}
          <div className={`lp-herovis__panel ${activeTab === 0 ? "lp-herovis__panel--active" : "lp-herovis__panel--hidden"}`}>
            <div className="lp-herovis__chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { year: "Year 1", value: 10 }, { year: "", value: 15 }, { year: "", value: 12 },
                  { year: "Year 2", value: 25 }, { year: "", value: 22 }, { year: "", value: 35 },
                  { year: "Year 3", value: 45 },
                ]} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={MUTED_FG_20} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false}
                    tick={{ fill: MUTED_FG, fontSize: 13, fontWeight: 600 }} dy={10} interval={0}
                    padding={{ left: 10, right: 10 }} />
                  <Area type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={4}
                    fillOpacity={1} fill="url(#colorValue)" dot={renderDot}
                    isAnimationActive={true} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tab 1: Benchmarks */}
          <div className={`lp-herovis__panel ${activeTab === 1 ? "lp-herovis__panel--active" : "lp-herovis__panel--hidden"}`}>
            <div className="lp-herovis__chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Institution A", value: 60 },
                  { name: "Your Institution", value: 95 },
                  { name: "Institution B", value: 75 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={MUTED_FG_20} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: MUTED_FG, fontSize: 11, fontWeight: 600 }} dy={10} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {[60, 95, 75].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? PRIMARY : PRIMARY_30} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tab 2: Alumni */}
          <div className={`lp-herovis__panel ${activeTab === 2 ? "lp-herovis__panel--active" : "lp-herovis__panel--hidden"}`}>
            <div className="lp-alumni">
              <div className="lp-alumni__inner">
                <div className="lp-alumni__center">
                  <Church style={{ width: 48, height: 48, color: "white" }} />
                </div>
                <div className="lp-alumni__node" style={{ top: 0, left: 16, width: 56, height: 56 }}>
                  <img src={avatar1} alt="" />
                </div>
                <div className="lp-alumni__node" style={{ top: 16, right: 0, width: 64, height: 64 }}>
                  <img src={avatar2} alt="" />
                </div>
                <div className="lp-alumni__node" style={{ bottom: 16, left: 0, width: 64, height: 64 }}>
                  <img src={avatar3} alt="" />
                </div>
                <div className="lp-alumni__node" style={{ bottom: 0, right: 16, width: 48, height: 48 }}>
                  <img src={avatar4} alt="" />
                </div>
                <svg className="lp-alumni__lines">
                  <line x1="25%" y1="20%" x2="50%" y2="50%" stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                  <line x1="85%" y1="30%" x2="50%" y2="50%" stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                  <line x1="20%" y1="75%" x2="50%" y2="50%" stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                  <line x1="75%" y1="85%" x2="50%" y2="50%" stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-herovis__flowers">
        <img src={FlowersImage} alt="Decorative purple flowers" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  return (
    <div className="landing-page">
      {/* ===== NAVIGATION ===== */}
      <nav className="lp-container lp-nav">
        <div><img src={SauraraLogo} alt="Saurara" className="lp-nav__logo" /></div>
        <div className="lp-nav__actions">
          <button className="lp-nav__signin lp-hidden-mobile" onClick={() => navigate("/login")}>Sign In</button>
          <button className="lp-btn-primary bg-prism-btn lp-hidden-mobile" onClick={() => navigate("/signup")}>Create an Account</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="lp-container lp-hero">
        <div className="lp-hero__text">
          <h1 className="lp-hero__title">
            Listen. Learn. <span>Lead.</span>
          </h1>
          <p className="lp-hero__subtitle">
            A research and institutional intelligence platform designed for theological education and church leadership. Move beyond disconnected surveys and spreadsheets — and build structured insight that reveals impact, tracks growth, and informs mission-driven decisions.
          </p>

          {/* Mobile visual */}
          <div className="lp-hero__visual-mobile">
            <HeroVisual />
          </div>

          <div className="lp-hero__cta">
            <button className="lp-btn-primary bg-prism-btn" onClick={() => navigate("/signup")}>
              Create an Account
            </button>
          </div>

          <div className="lp-hero__partners">
            <p className="lp-hero__partners-label">Proudly Supported By</p>
            <div className="lp-hero__partners-logos">
              <img src={logoActea} alt="ACTEA" style={{ height: 40 }} />
              <img src={logoBosko} alt="BOSKO" style={{ height: 32 }} />
            </div>
          </div>
        </div>

        {/* Desktop visual */}
        <div className="lp-hero__visual-desktop">
          <HeroVisual />
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="lp-problem bg-prism">
        <div className="lp-problem__orb lp-problem__orb--1" />
        <div className="lp-problem__orb lp-problem__orb--2" />
        <div className="lp-problem__orb lp-problem__orb--3" />

        <div className="lp-container--narrow lp-problem__inner" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-problem__orbit-section">
            <div className="lp-problem__orbit-container">
              <div className="lp-orbit-ring lp-orbit-ring--1" />
              <div className="lp-orbit-ring lp-orbit-ring--2" />
              <div className="lp-orbit-ring lp-orbit-ring--3" />

              {[
                { img: avatar1, radius: 300, duration: 60, delay: -10, size: 48 },
                { img: avatar2, radius: 300, duration: 60, delay: -30, size: 48 },
                { img: avatar3, radius: 250, duration: 45, delay: -5, size: 40, reverse: true },
                { img: avatar4, radius: 250, duration: 45, delay: -25, size: 40, reverse: true },
                { img: avatar5, radius: 200, duration: 30, delay: -15, size: 32 },
                { img: avatar6, radius: 200, duration: 30, delay: 0, size: 32 },
              ].map((item, i) => (
                <div key={i} className="orbit-item"
                  style={{
                    "--radius": `${item.radius}px`,
                    "--duration": `${item.duration}s`,
                    animationDelay: `${item.delay}s`,
                    animationDirection: item.reverse ? "reverse" : "normal",
                    width: item.size, height: item.size,
                    marginLeft: -item.size / 2, marginTop: -item.size / 2,
                  }}>
                  <img src={item.img} alt="" />
                </div>
              ))}
            </div>

            <div className="lp-problem__text">
              <h2 className="lp-problem__title">Leadership Without Clear Insight Is Risky</h2>
              <p className="lp-problem__desc">
                Theological institutions and church networks are asking important questions. But the answers are scattered across spreadsheets, disconnected reports, and short-term surveys that disappear after they're filed. The result? Decisions are made with partial information — or none at all.
              </p>
            </div>
          </div>

          <div className="lp-problem__cards">
            {[
              { title: "Struggling to track where your graduates actually serve?", desc: "You collect data at graduation — then lose sight of long-term impact." },
              { title: "Unsure how your programs compare to other institutions?", desc: "A single data point means nothing without context or benchmarks." },
              { title: "Launching initiatives without knowing if they're working?", desc: "You make changes, but lack year-over-year measurement to see real movement." },
              { title: "Unable to answer foundational questions?", desc: "How many churches are planted? What leaders are being formed? What needs remain unmet in your contribution to the Church and society?" },
            ].map((item, i) => (
              <div key={i} className="lp-problem__card">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTION SECTION ===== */}
      <section className="lp-solution">
        <div className="lp-container--narrow" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-solution__card">
            <div className="lp-solution__inner">
              <div>
                <img src={SauraraLogo} alt="Saurara" className="lp-solution__logo" />
                <h2 className="lp-solution__title">An Institutional Intelligence Platform Built for Theological Education</h2>
                <p className="lp-solution__desc">
                  Imagine being able to answer your most important institutional questions — instantly, confidently, and with context. This platform transforms fragmented surveys and disconnected spreadsheets into structured, longitudinal intelligence. Instead of collecting feedback that disappears, you build a living institutional memory. Instead of isolated reports, you gain comparative insight. Instead of guessing about impact, you measure it.
                </p>
                <p className="lp-solution__highlight">Now, you don't just ask the questions. You can answer them.</p>
              </div>

              <div className="lp-solution__features">
                {[
                  { title: "Track Impact Over Time", desc: "Graduate outcomes, church leadership placement, program strength, regional reach — preserved and measurable year after year." },
                  { title: "Benchmark With Meaning", desc: "Understand how your institution compares across regions, programs, and peer institutions. Data becomes meaningful in context." },
                  { title: "Structure Institutional Memory", desc: "Every response, relationship, and initiative is organized within a secure database — not buried in folders." },
                  { title: "Measure What's Working", desc: "Launch initiatives. Track adoption. Compare progress. Adjust with confidence." },
                  { title: "Explore Critical Questions", desc: "What leaders are needed? What challenges are emerging? How is theological education contributing to the Church's mission?" },
                ].map((item, i) => (
                  <div key={i} className="lp-solution__feature">
                    <div className="lp-solution__feature-icon">
                      <CheckCircle2 style={{ width: 24, height: 24 }} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS SECTION ===== */}
      <section className="lp-benefits">
        <div className="lp-container--narrow" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-benefits__header">
            <p className="lp-benefits__label">Why It Matters</p>
            <h2 className="lp-benefits__title">Strengthen the Church's Mission.</h2>
          </div>

          <WorldMap />

          <div className="lp-benefits__grid">
            {[
              { title: "Lead With Confidence Through Structured Insight", desc: "Because every response is organized, tracked, and preserved, leadership no longer relies on isolated reports or assumptions. You see patterns over time, understand real impact, and make decisions grounded in evidence — not intuition alone." },
              { title: "Measure Real Impact With Longitudinal Tracking", desc: "With historical data and year-over-year comparison built into the system, you can measure whether initiatives, programs, and leadership development efforts are truly working. Growth is no longer a feeling. It becomes visible." },
              { title: "Understand Your Position Through Meaningful Benchmarking", desc: "Comparative reporting allows you to see how your institution relates to peers, regions, and broader trends. A single number becomes meaningful when placed in context — enabling smarter planning and stronger positioning." },
              { title: "Preserve Institutional Memory Automatically", desc: "Instead of losing insight when staff transitions occur or reports are archived, your data remains structured and accessible. Relationships, participation, graduate outcomes, and research contributions are retained — building long-term organizational intelligence." },
              { title: "Strengthen Mission Through Clear Visibility", desc: "When you can clearly see where graduates serve, how churches are planted, what leaders are needed, and how theological education contributes to society — strategic conversations change. Planning becomes proactive. Stewardship becomes measurable." },
              { title: "Reduce Administrative Friction While Increasing Insight", desc: "Secure logins, structured databases, and clean reporting tools eliminate scattered spreadsheets and manual reconciliation. Leadership spends less time searching for answers and more time acting on them." },
            ].map((benefit, i) => (
              <div key={i} className="lp-benefits__item">
                <h4>{benefit.title}</h4>
                <p>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="lp-how">
        <div className="lp-container--xs" style={{ maxWidth: 1024, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-how__header">
            <h2 className="lp-how__title">From Questions to Insight.</h2>
          </div>

          <div className="lp-how__grid">
            <div className="lp-how__line" />
            {[
              { num: 1, title: "Define the Questions", desc: "Work with your leadership team to identify the core questions you need answered — graduate outcomes, church impact, leadership formation, regional needs. The platform structures these into organized research instruments.", outcome: "Your research becomes intentional, repeatable, and aligned with mission." },
              { num: 2, title: "Collect and Organize", desc: "Participants access secure, simple interfaces to respond. Behind the scenes, every response is stored in a structured database — connected to institutions, programs, regions, and relationships. No spreadsheets.", outcome: "Every data point strengthens a growing institutional memory." },
              { num: 3, title: "Analyze, Compare, & Lead", desc: "Leadership dashboards reveal trends over time, peer comparisons, and measurable impact across initiatives. Benchmark performance, measure growth year-over-year, and explore emerging questions.", outcome: "Decisions move from reactive to strategic. Planning becomes informed." },
            ].map((step, i) => (
              <div key={i} className="lp-how__step">
                <div className="lp-how__num">{step.num}</div>
                <div className="lp-how__step-body">
                  <h4 className="lp-how__step-title">{step.title}</h4>
                  <p className="lp-how__step-desc">{step.desc}</p>
                  <div className="lp-how__outcome">
                    <strong>Outcome:</strong>{step.outcome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="lp-cta" style={{ maxWidth: 1024, margin: "0 auto", padding: "0 24px 96px" }}>
        <div className="lp-cta__inner bg-prism">
          <div className="lp-cta__glow" />
          <div className="lp-cta__text">
            <h2 className="lp-cta__title">Ready to move beyond disconnected surveys?</h2>
            <p className="lp-cta__desc">Join the institutions building structured, longitudinal intelligence for theological education.</p>
          </div>
          <div className="lp-cta__actions">
            <button className="lp-btn-white" onClick={() => navigate("/signup")}>Create an Account</button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-container--narrow" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <img src={SauraraLogo} alt="Saurara" className="lp-footer__logo" />
              <p className="lp-footer__desc">Structured insight for theological education and church leadership.</p>
            </div>
            <div className="lp-footer__col">
              <h4>Platform</h4>
              <ul>
                <li><a href="#">Longitudinal Tracking</a></li>
                <li><a href="#">Benchmarking</a></li>
                <li><a href="#">Institutional Memory</a></li>
              </ul>
            </div>
            <div className="lp-footer__col">
              <h4>Organization</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Mission</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="lp-footer__col">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Research Reports</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer__bottom">
            <p className="lp-footer__copyright">&copy; {new Date().getFullYear()} Saurara. All Rights Reserved.</p>
            <div className="lp-footer__links">
              <a href="#">Terms of Use</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== COOKIE BANNER ===== */}
      {showCookieBanner && (
        <div className="lp-cookie">
          <div className="lp-cookie__inner lp-container--narrow" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
            <p className="lp-cookie__text">We use cookies to improve your experience on our site. By using our site, you consent to cookies.</p>
            <div className="lp-cookie__actions">
              <button className="lp-btn-outline" onClick={() => setShowCookieBanner(false)}>Decline</button>
              <button className="lp-btn-accent" onClick={() => setShowCookieBanner(false)}>Accept All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
