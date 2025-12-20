import Link from "next/link";

export default function Home() {
  return (
    <>
      <main>
        <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, background: "yellow", color: "black", padding: 8 }}>
  DEPLOY TEST
</div>
        {/* HERO */}
        <section className="hero">
          <div className="container heroGrid">
            {/* Left: Text/content */}
            <div className="heroContent">
              <div className="badge fadeUp" style={{ animationDelay: "0.05s" }}>
                Men’s wardrobe, simplified
              </div>

              <h1 className="heroTitle fadeUp" style={{ animationDelay: "0.12s" }}>
                A premium wardrobe, delivered.
              </h1>

              <p className="heroLead fadeUp" style={{ animationDelay: "0.18s" }}>
                Premium wardrobes delivered to your door. Minimal effort, maximum style.
                Flexible access, built around sustainability and real life.
              </p>

              <div className="ctaRow fadeUp" style={{ animationDelay: "0.24s" }}>
                <a className="btnPrimary" href="#waitlist">
                  Join waitlist
                </a>
                <Link className="btnGhost" href="/faq">
                  Read FAQ
                </Link>
              </div>

              <p className="muted fadeUp" style={{ animationDelay: "0.30s" }}>
                Built for young men. New, worn-in, and vintage pieces. Pricing evolves as
                garments age.
              </p>
            </div>

            {/* Right: IMAGE ONLY (NO TEXT ON IMAGE) */}
            <div
              className="heroImage fadeUp"
              style={{ animationDelay: "0.16s" }}
              aria-label="Hero image"
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section">
          <div className="container">
            <h2 className="sectionTitle">How it works</h2>
            <p className="sectionLead">
              Four steps. No clutter. No seasonal packing headaches. Your wardrobe adapts
              when your life changes.
            </p>

            <div className="stepsGrid">
              <div className="card">
                <div className="stepNum">1</div>
                <h3 className="cardTitle">Get curated options</h3>
                <p className="muted">
                  We suggest pieces based on your fit and style. You can edit the picks,
                  swap items, and fine-tune before it ships.
                </p>
              </div>

              <div className="card">
                <div className="stepNum">2</div>
                <h3 className="cardTitle">Wear, rotate, refresh</h3>
                <p className="muted">
                  Keep what you love, return what you don’t. Rotate seasonally or anytime
                  your needs change.
                </p>
              </div>

              <div className="card">
                <div className="stepNum">3</div>
                <h3 className="cardTitle">Pricing evolves</h3>
                <p className="muted">
                  New, worn-in, and vintage items priced fairly. As garments age, pricing
                  changes—so it stays accessible.
                </p>
              </div>

              <div className="card">
                <div className="stepNum">4</div>
                <h3 className="cardTitle">Built to be sustainable</h3>
                <p className="muted">
                  Less waste. More reuse. A wardrobe that’s high-quality without the fast
                  fashion cycle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section id="waitlist" className="section">
          <div className="container waitlist">
            <h2 className="sectionTitle">Join the waitlist</h2>
            <p className="sectionLead">
              Get early access + launch pricing when we go live.
            </p>

            <form
              className="waitlistForm"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Connected! (Hook this to your email tool later)");
              }}
            >
              <input
                className="input"
                type="email"
                placeholder="you@email.com"
                required
              />
              <button className="btnPrimary" type="submit">
                Notify me
              </button>
            </form>

            <p className="tinyMuted">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>

      {/* Styles (self-contained) */}
      <style>{`
        :root{
          --bg:#0b0b0d;
          --card:rgba(255,255,255,0.06);
          --card2:rgba(255,255,255,0.08);
          --text:rgba(255,255,255,0.92);
          --muted:rgba(255,255,255,0.72);
          --line:rgba(255,255,255,0.10);
        }
        *{box-sizing:border-box}
        body{
          margin:0;
          background: radial-gradient(1200px 600px at 20% 0%, rgba(255,255,255,0.08), transparent 60%),
                      radial-gradient(900px 450px at 90% 10%, rgba(255,255,255,0.06), transparent 55%),
                      var(--bg);
          color:var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
        }
        a{color:inherit;text-decoration:none}
        .container{
          width:min(1100px, calc(100% - 40px));
          margin:0 auto;
        }

        /* Hero */
        .hero{
          padding: 64px 0 28px;
          border-bottom:1px solid var(--line);
        }
        .heroGrid{
          display:grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap:24px;
          align-items:stretch;
        }
        @media (max-width: 900px){
          .heroGrid{grid-template-columns:1fr; }
        }
        .heroContent{
          padding: 12px 0;
        }
        .badge{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:8px 12px;
          border:1px solid var(--line);
          background:rgba(255,255,255,0.04);
          border-radius:999px;
          font-size:13px;
          color:rgba(255,255,255,0.82);
          margin-bottom:14px;
        }
        .heroTitle{
          font-size: clamp(38px, 5vw, 56px);
          line-height:1.05;
          margin: 0 0 14px;
          letter-spacing:-0.02em;
        }
        .heroLead{
          margin: 0 0 18px;
          line-height:1.65;
          color: var(--muted);
          font-size: 16px;
          max-width: 56ch;
        }
        .ctaRow{
          display:flex;
          flex-wrap:wrap;
          gap:12px;
          margin: 8px 0 18px;
        }
        .btnPrimary{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 12px 16px;
          border-radius: 12px;
          background: #ffffff;
          color:#0b0b0d;
          font-weight:700;
          border:1px solid rgba(255,255,255,0.22);
        }
        .btnGhost{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 12px 16px;
          border-radius: 12px;
          border:1px solid var(--line);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.92);
          font-weight:650;
        }
        .muted{
          color: var(--muted);
          line-height:1.7;
          margin:0;
          font-size: 14px;
          max-width: 62ch;
        }

        /* The IMAGE block (no children -> no text can appear on it) */
        .heroImage{
          border-radius: 20px;
          border: 1px solid var(--line);
          background-image:
            radial-gradient(600px 300px at 25% 10%, rgba(255,255,255,0.14), transparent 55%),
            url("/hero.jpg");
          background-size: cover;
          background-position: center;
          min-height: 360px;
        }
        @media (max-width: 900px){
          .heroImage{min-height: 320px;}
        }

        /* Sections */
        .section{
          padding: 56px 0;
        }
        .sectionTitle{
          margin:0 0 10px;
          font-size: 28px;
          letter-spacing:-0.01em;
        }
        .sectionLead{
          margin:0 0 22px;
          color: var(--muted);
          line-height:1.7;
          max-width: 70ch;
        }

        /* Steps */
        .stepsGrid{
          display:grid;
          grid-template-columns: repeat(4, 1fr);
          gap:14px;
        }
        @media (max-width: 1000px){
          .stepsGrid{grid-template-columns: repeat(2, 1fr);}
        }
        @media (max-width: 560px){
          .stepsGrid{grid-template-columns: 1fr;}
        }
        .card{
          background: linear-gradient(180deg, var(--card2), var(--card));
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 16px 16px 14px;
        }
        .stepNum{
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          border:1px solid var(--line);
          background: rgba(255,255,255,0.05);
          font-weight:800;
          margin-bottom: 10px;
        }
        .cardTitle{
          margin: 0 0 8px;
          font-size: 16px;
          color: rgba(255,255,255,0.95);
        }

        /* Waitlist */
        .waitlist{
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 26px;
        }
        .waitlistForm{
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          margin-top: 12px;
        }
        .input{
          flex: 1 1 260px;
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: rgba(0,0,0,0.35);
          color: rgba(255,255,255,0.92);
          outline: none;
        }
        .input::placeholder{color: rgba(255,255,255,0.45);}
        .tinyMuted{
          margin: 12px 0 0;
          font-size: 12px;
          color: rgba(255,255,255,0.58);
        }

        /* Animation */
        .fadeUp{
          opacity:0;
          transform: translateY(10px);
          animation: fadeUp 700ms ease forwards;
        }
        @keyframes fadeUp{
          to{opacity:1; transform: translateY(0);}
        }
      `}</style>
    </>
  );
}
