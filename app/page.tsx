export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111" }}>

      {/* HERO – VISION */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          background: "linear-gradient(180deg, #0d0d0d, #111)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "860px" }}>
          <h1
            style={{
              fontSize: "3.75rem",
              letterSpacing: "-0.03em",
              marginBottom: "24px",
            }}
          >
            A smarter way to dress
          </h1>

          <p
            style={{
              fontSize: "1.35rem",
              lineHeight: "1.6",
              opacity: 0.9,
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            Premium wardrobes delivered to your door.
            Flexible, sustainable, and built for how young men actually live.
          </p>

          <p style={{ marginTop: "20px", fontSize: "1rem", opacity: 0.75 }}>
            Access over ownership. Style without excess.
          </p>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section style={{ padding: "120px 24px", maxWidth: "960px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "24px", fontSize: "2.5rem" }}>
          What is Davenport Wardrobe?
        </h2>

        <p style={{ fontSize: "1.2rem", lineHeight: "1.7", maxWidth: "820px" }}>
          Davenport Wardrobe is a modern clothing access platform for young men.
          Instead of buying clothes that quickly go out of style, don’t fit
          anymore, or sit unused, members receive curated wardrobes that evolve
          with their lifestyle.
        </p>
      </section>

      {/* IMAGE + EXPLANATION */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "64px",
          alignItems: "center",
          padding: "120px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* IMAGE PLACEHOLDER */}
        <div
          style={{
            height: "420px",
            borderRadius: "20px",
            background:
              "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
          }}
        >
          {/* Replace this div with <img /> later */}
        </div>

        <div>
          <h2 style={{ marginBottom: "20px" }}>Designed around real life</h2>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.7" }}>
            Your wardrobe is delivered directly to your doorstep.
            No hauling clothes between dorms, apartments, or seasons.
            When your needs change, your wardrobe changes with you.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "#f6f6f6", padding: "120px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "32px", fontSize: "2.5rem" }}>
            How it works
          </h2>

          <ol style={{ fontSize: "1.15rem", lineHeight: "2" }}>
            <li>Access a rotating wardrobe of curated clothing</li>
            <li>Receive it directly at your doorstep</li>
            <li>Wear pieces on your terms</li>
            <li>Return them, continue using them, or purchase at adjusted prices</li>
          </ol>
        </div>
      </section>

      {/* WAITLIST – PRIMARY CTA */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: "960px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
          Join the waitlist
        </h2>

        <p style={{ color: "#555", marginBottom: "40px" }}>
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
              fontSize: "1rem",
              marginRight: "12px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "14px 28px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Join
          </button>
        </form>
      </section>

      {/* DEEP DIVE */}
      <section style={{ padding: "120px 24px", maxWidth: "960px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "24px" }}>
          Built for sustainability and longevity
        </h2>

        <p style={{ fontSize: "1.15rem", lineHeight: "1.7" }}>
          Every garment has a lifecycle. As pieces are worn, their cost becomes
          more accessible. This reduces waste, discourages overproduction, and
          keeps quality clothing in circulation longer.
        </p>

        <p style={{ fontSize: "1.15rem", lineHeight: "1.7", marginTop: "24px" }}>
          Over time, Davenport Wardrobe will use intelligent styling tools to
          understand your preferences, sizing, and lifestyle so each wardrobe
          feels curated specifically for you.
        </p>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "64px 24px",
          color: "#777",
          fontSize: "0.95rem",
        }}
      >
        © {new Date().getFullYear()} Davenport Wardrobe
      </footer>

    </main>
  );
}
