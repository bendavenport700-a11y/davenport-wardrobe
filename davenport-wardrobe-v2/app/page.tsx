import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
        color: "#eaeaea",
        background: "radial-gradient(circle at top, #0f0f10 0%, #070708 60%)",
        minHeight: "100vh",
      }}
    >
      {/* GLOBAL STYLES + MOTION */}
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        a { color: inherit; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
        }
        .container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .fadeUp {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp 700ms ease forwards;
        }
        .fadeUp.delay1 { animation-delay: 120ms; }
        .fadeUp.delay2 { animation-delay: 220ms; }
        .fadeUp.delay3 { animation-delay: 320ms; }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .glow {
          position: absolute;
          inset: -200px -200px auto -200px;
          height: 520px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%);
          pointer-events: none;
          filter: blur(10px);
        }
        .heroGrid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 28px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .heroGrid { grid-template-columns: 1fr; }
        }
        .card {
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 22px;
          transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
        }
        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.045);
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.82);
          font-size: 0.9rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .btnPrimary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: #ffffff;
          color: #0a0a0a;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: transform 200ms ease, opacity 200ms ease;
        }
        .btnPrimary:hover { transform: translateY(-1px); opacity: 0.95; }
        .btnGhost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.92);
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: transform 200ms ease, background 200ms ease, border-color 200ms ease;
        }
        .btnGhost:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
        }
        .muted { color: rgba(255,255,255,0.72); }
        .muted2 { color: rgba(255,255,255,0.60); }
        .sectionTitle {
          font-size: 2.2rem;
          letter-spacing: -0.02em;
          margin: 0 0 18px 0;
          color: rgba(255,255,255,0.94);
        }
        .sectionLead {
          max-width: 820px;
          margin: 0 0 32px 0;
          color: rgba(255,255,255,0.70);
          font-size: 1.1rem;
          line-height: 1.75;
        }
        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 900px) { .grid2 { grid-template-columns: 1fr; } }
        .stepsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1100px) { .stepsGrid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 680px) { .stepsGrid { grid-template-columns: 1fr; } }
        .stepNum {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.86);
          font-weight: 700;
          margin-bottom: 12px;
        }
        .heroImage {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.02);
          min-height: 520px;
        }
        @media (max-width: 900px) { .heroImage { min-height: 360px; } }
        .heroImage::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.75)),
            url("/hero.jpg");
          background-size: cover;
          background-position: center;
          filter: saturate(0.9) contrast(1.05);
          transform: scale(1.02);
        }
        .heroImage::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%);
          pointer-events: none;
        }
        .imageNote {
          position: absolute;
          left: 18px;
          bottom: 18px;
          right: 18px;
          padding: 14px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.35);
          color: rgba(255,255,255,0.80);
          backdrop-filter: blur(10px);
          font-size: 0.95rem;
          line-height: 1.5;
        }
      `}</style>

      {/* HERO */}
      <section style={{ position: "relative", padding: "110px 0 70px" }}>
        <div className="glow" />
        <div className="container heroGrid">
          <div>
            <div className="fadeUp">
              <span className="chip">Davenport Wardrobe · v2</span>
            </div>

            <h1
              className="fadeUp delay1"
              style={{
                fontSize: "4.5rem",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                fontWeight: 600,
                margin: "18px 0 16px",
                color: "#ffffff",
              }}
            >
              A smarter way to dress
            </h1>

            <p
              className="fadeUp delay2"
              style={{
                fontSize: "1.25rem",
                maxWidth: "720px",
                margin: "0 0 26px",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.76)",
              }}
            >
              Premium wardrobes delivered to your door. Minimal effort, maximum
              style. Flexible access, built around sustainability and real life.
            </p>

            <div className="fadeUp delay3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="btnPrimary" href="#waitlist">
                Join waitlist
              </a>
              <Link className="btnGhost" href="/faq">
                Read FAQ
              </Link>
            </div>

            <p style={{ marginTop: 18 }} className="muted2">
              Built for young men. New, worn-in, and vintage pieces. Pricing
              evolves as garments age.
            </p>
          </div>

          {/* HERO IMAGE */}
          <div className="heroImage fadeUp delay2">
            <div className="imageNote">
              <strong style={{ color: "#fff" }}>Hero image:</strong>{" "}
              add a file named <code style={{ color: "#fff" }}>/public/hero.jpg</code>{" "}
              (a clean grayscale fashion photo works best).
              If you don’t add one, you’ll still see the gradient overlay.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <h2 className="sectionTitle">How it works</h2>
          <p className="sectionLead">
            Four steps. No clutter. No seasonal packing headaches. Your wardrobe
            adapts when your life changes.
          </p>

          <div className="stepsGrid">
            <div className="card">
              <div className="stepNum">1</div>
              <h3 style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.92)" }}>
                Get curated options
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                AI suggests pieces based on your fit and style. You can edit the
                picks, swap items, and fine-tune the wardrobe before it ships.
              </p>
            </div>

            <div className="card">
              <div className="stepNum">2</div>
              <h3 style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.92)" }}>
                Delivered to your door
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                A wardrobe arrives when you need it. No hauling bags between
                dorms, apartments, or seasons.
              </p>
            </div>

            <div className="card">
              <div className="stepNum">3</div>
              <h3 style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.92)" }}>
                Wear it on your terms
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                Daily staples, statement pieces, and special-occasion fits—built
                to match your week, not your closet.
              </p>
            </div>

            <div className="card">
              <div className="stepNum">4</div>
              <h3 style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.92)" }}>
                Keep or send back
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                Return it, continue using it, or purchase it. Pricing adjusts as
                garments age and move through their lifecycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BUILT DIFFERENTLY */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <h2 className="sectionTitle">Built differently</h2>
          <p className="sectionLead">
            Luxury doesn’t have to mean waste. This is an access model designed
            for quality, longevity, and convenience.
          </p>

          <div className="grid2">
            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                Pricing evolves with wear
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Every piece has an “age.” As it’s worn more, it becomes more
                accessible—without losing quality standards.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                No unnecessary ownership
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Get style without the closet buildup. Swap with the season
                instead of packing, storing, and rebuying.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                Variety, intentionally curated
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                New pieces, lightly worn staples, broken-in favorites, and
                vintage finds—each one chosen to work together.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                Advanced styling (AI)
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                AI helps find the fit and style that actually works for you.
                Less scrolling, fewer misses, better wardrobes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <h2 className="sectionTitle">Sustainability, built in</h2>
          <p className="sectionLead">
            The point isn’t “more clothes.” It’s fewer, better pieces worn for
            longer. That reduces overproduction, lowers textile waste, and helps
            the planet—without sacrificing style.
          </p>

          <div className="grid2">
            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                Less overproduction
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                When garments circulate longer, demand shifts from constant new
                inventory to smarter reuse.
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: "rgba(255,255,255,0.92)" }}>
                Longer garment life
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                A lifecycle model means each piece is worn, valued, and kept in
                rotation instead of sitting unused.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" style={{ padding: "90px 0 130px" }}>
        <div className="container">
          <div
            className="card"
            style={{
              maxWidth: 760,
              margin: "0 auto",
              padding: "56px",
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: "2.4rem", color: "#fff" }}>
              Join the waitlist
            </h2>
            <p style={{ margin: "0 0 28px" }} className="muted">
              Early access when Davenport Wardrobe launches. Be first in line
              for new drops and wardrobe releases.
            </p>

            <form action="https://formspree.io/f/xqezkpza" method="POST">
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  required
                  style={{
                    padding: "14px",
                    width: 280,
                    fontSize: "1rem",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    outline: "none",
                  }}
                />
                <button type="submit" className="btnPrimary">
                  Join
                </button>
              </div>
            </form>

            <p style={{ marginTop: 16 }} className="muted2">
              No spam. Just product updates.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "48px 24px",
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.55)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        © {new Date().getFullYear()} Davenport Wardrobe
      </footer>
    </main>
  );
}
