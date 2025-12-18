export default function Home() {
  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: "72px 24px",
        maxWidth: "960px",
        margin: "0 auto",
        color: "#111",
      }}
    >
      {/* HERO */}
      <section style={{ textAlign: "center", marginBottom: "96px" }}>
        <h1 style={{ fontSize: "3.75rem", marginBottom: "20px" }}>
          Davenport Wardrobe
        </h1>
        <p
          style={{
            fontSize: "1.35rem",
            maxWidth: "720px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          A modern wardrobe built for young men.
          Access high-quality clothing when you need it.
          Keep what you love. Return what you don’t.
          Pricing adjusts as garments age.
        </p>
        <p style={{ marginTop: "16px", fontSize: "1.05rem", color: "#444" }}>
          Delivered directly to your doorstep.
        </p>
      </section>

      {/* FASHION WITHOUT EXCESS */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>Fashion without excess</h2>
        <p style={{ fontSize: "1.15rem", maxWidth: "760px", lineHeight: "1.7" }}>
          Davenport Wardrobe is designed to be fashionable, accessible,
          efficient, and affordable, without the waste of traditional retail.
          Every piece has a lifecycle. The more it’s worn, the more accessible it
          becomes. Nothing sits unused. Nothing is overproduced.
        </p>
      </section>

      {/* WARDROBE DELIVERY */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>A wardrobe, without the hassle</h2>
        <p style={{ fontSize: "1.15rem", maxWidth: "760px", lineHeight: "1.7" }}>
          Your wardrobe is sent straight to you.
          No hauling clothes between dorms, apartments, or seasons.
          No storing pieces you rarely wear.
          When your needs change, your wardrobe changes with you.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>How it works</h2>
        <ol style={{ fontSize: "1.1rem", lineHeight: "1.9" }}>
          <li>Select clothing from a rotating wardrobe</li>
          <li>Receive it directly at your doorstep</li>
          <li>Wear it on your terms</li>
          <li>Return it, continue using it, or purchase it at a reduced price</li>
        </ol>
      </section>

      {/* VARIETY */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>Variety, intentionally curated</h2>
        <p style={{ fontSize: "1.15rem", maxWidth: "760px", lineHeight: "1.7" }}>
          Our wardrobe includes brand-new pieces, lightly worn staples, and
          older, broken-in favorites.
          This includes modern essentials, vintage items, and unique finds that
          get better with wear.
          As garments age, pricing adjusts accordingly.
        </p>
      </section>

      {/* AI STYLING */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>Styled for you</h2>
        <p style={{ fontSize: "1.15rem", maxWidth: "760px", lineHeight: "1.7" }}>
          Davenport Wardrobe will use advanced AI to understand your fit,
          preferences, and lifestyle.
          This helps surface styles that actually work for you,
          without wasted time or unnecessary purchases.
        </p>
      </section>

      {/* SUSTAINABILITY */}
      <section style={{ marginBottom: "96px" }}>
        <h2 style={{ marginBottom: "16px" }}>Sustainability, built in</h2>
        <p style={{ fontSize: "1.15rem", maxWidth: "760px", lineHeight: "1.7" }}>
          Sustainability is not an add-on.
          By extending the life of every garment,
          Davenport Wardrobe reduces overproduction,
          unnecessary consumption, and textile waste.
          Each piece is designed to be worn, reused, and valued over time.
        </p>
      </section>

      {/* WAITLIST */}
      <section
        style={{
          padding: "48px",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "12px" }}>Join the waitlist</h2>
        <p style={{ marginBottom: "28px" }}>
          Early access when Davenport Wardrobe launches.
        </p>

        <form
          action="https://formspree.io/f/xqezkpza"
          method="POST"
        >
          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
            style={{
              padding: "14px",
              width: "260px",
              marginRight: "12px",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "14px 24px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Join
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          marginTop: "96px",
          color: "#777",
          fontSize: "0.95rem",
        }}
      >
        © {new Date().getFullYear()} Davenport Wardrobe
      </footer>
    </main>
  );
}
