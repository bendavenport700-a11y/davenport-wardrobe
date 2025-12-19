export default function Home() {
  return (
    <main
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #111, #000)",
        color: "#fff",
        textAlign: "center",
        padding: "48px",
      }}
    >
      <div style={{ maxWidth: "720px" }}>
        <h1 style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
          A smarter way to dress
        </h1>

        <p style={{ fontSize: "1.25rem", lineHeight: "1.6", opacity: 0.9 }}>
          Premium wardrobes delivered to your door.  
          Flexible, sustainable, and built for how young men actually live.
        </p>

        <p style={{ marginTop: "16px", fontSize: "1rem", opacity: 0.7 }}>
          Access over ownership. Style without excess.
        </p>
      </div>
    </main>
  );
}
