import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        
        {/* NAV BAR */}
        <nav
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #eaeaea",
    padding: "24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>

          {/* LOGO */}
          <Link
            href="/"
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              textDecoration: "none",
              color: "#111",
            }}
          >
            Davenport Wardrobe
          </Link>

          {/* LINKS */}
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/" style={linkStyle}>Home</Link>
            <Link href="/faq" style={linkStyle}>FAQ</Link>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main>{children}</main>

      </body>
    </html>
  );
}

const linkStyle = {
  textDecoration: "none",
  color: "#111",
  fontSize: "1rem",
};
