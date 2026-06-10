export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#faf9f7" }}>
      <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9c8b78", marginBottom: 16 }}>Davenport</p>
      <h1 style={{ fontSize: 72, fontWeight: 300, color: "#0a0a0a", margin: "0 0 16px", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>404</h1>
      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 36 }}>This page doesn't exist.</p>
      <a href="/" style={{ background: "#0a0a0a", color: "#faf9f7", padding: "12px 32px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
        Go Home
      </a>
    </div>
  );
}
