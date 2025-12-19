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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 40px",
            borderBottom: "1px solid #eaeaea",
            backgroundColor: "#fff",
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
