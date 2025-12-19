export default function FAQPage() {
  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: "72px 24px",
        maxWidth: "900px",
        margin: "0 auto",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "48px" }}>
        Frequently Asked Questions
      </h1>

      <section style={{ marginBottom: "40px" }}>
        <h3>How does Davenport Wardrobe work?</h3>
        <p>
          Davenport Wardrobe gives you access to a rotating wardrobe of
          high-quality clothing. Select pieces, receive them at your doorstep,
          wear them on your terms, then return them or keep them as pricing
          adjusts over time.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h3>Is this a rental service?</h3>
        <p>
          Not in the traditional sense. Davenport focuses on access, flexibility,
          and longevity rather than ownership. Garments gain value through use,
          not novelty.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h3>Who is this for?</h3>
        <p>
          Built primarily for young men, including college students and growing
          adults, who want better clothing without unnecessary ownership.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h3>Will there be AI-powered styling?</h3>
        <p>
          Yes. Advanced styling tools will help understand your preferences,
          sizing, and lifestyle to curate wardrobes that fit you personally.
        </p>
      </section>

      <section>
        <h3>When are you launching?</h3>
        <p>
          Davenport Wardrobe is currently in development. Join the waitlist for
          early access and updates.
        </p>
      </section>
    </main>
  );
}
