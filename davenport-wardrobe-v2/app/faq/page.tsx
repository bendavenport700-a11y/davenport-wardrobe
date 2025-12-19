export default function FAQPage() {
  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: "80px 24px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "32px" }}>
        Frequently Asked Questions
      </h1>

      <section style={{ marginBottom: "32px" }}>
        <h3>What is Davenport Wardrobe?</h3>
        <p>
          Davenport Wardrobe is a modern clothing platform that gives you access
          to high-quality wardrobes without traditional ownership.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h3>How does it work?</h3>
        <p>
          Select clothing, receive it at your doorstep, wear it on your terms,
          then return it or keep it as pricing adjusts over time.
        </p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h3>Is it sustainable?</h3>
        <p>
          Yes. Every garment has a lifecycle. As pieces age, they become more
          accessible, reducing waste and overproduction.
        </p>
      </section>
    </main>
  );
}
