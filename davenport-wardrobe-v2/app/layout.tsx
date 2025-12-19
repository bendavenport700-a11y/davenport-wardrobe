import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Davenport Wardrobe",
  description: "A smarter way to dress",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {/* NAV BAR */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            width: "100%",
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#fff",
              fontSize: "1.25rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Davenport Wardrobe
          </Link>

          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/" style={linkStyle}>
              Home
            </Link>
            <Link href="/faq" style={linkStyle}>
              FAQ
            </Link>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <div style={{ paddingTop: "96px" }}>{children}</div>
      </body>
    </html>
  );
}

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "1rem",
  opacity: 0.85,
};
