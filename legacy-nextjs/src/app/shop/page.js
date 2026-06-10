"use client";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

const S = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Outfit', system-ui, sans-serif",
  cream: "#faf9f7",
  ink: "#0a0a0a",
  tan: "#9c8b78",
  stone: "#e8e3dc",
  gold: "#c4a882",
  muted: "#6b7280",
};

export default function ShopPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("success=1")) {
      setSuccess(true);
    }
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleBuy(item) {
    setBuying(item.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Something went wrong. Please try again.");
    } finally {
      setBuying(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: S.cream, fontFamily: S.sans }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${S.stone}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 600, color: S.ink, textDecoration: "none", letterSpacing: "0.02em" }}>
          Davenport
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/admin" style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, textDecoration: "none" }}>Admin</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: S.serif, fontSize: 42, fontWeight: 300, color: S.ink, letterSpacing: "0.01em", marginBottom: 8 }}>
            The Collection
          </h1>
          <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted }}>
            Curated menswear, available to own.
          </p>
        </div>

        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "14px 20px", marginBottom: 32, fontFamily: S.sans, fontSize: 14, color: "#166534" }}>
            Order placed successfully. Check your email for confirmation.
          </div>
        )}

        {loading ? (
          <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted }}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: S.serif, fontSize: 24, color: S.tan, fontStyle: "italic" }}>No items yet.</p>
            <p style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, marginTop: 8 }}>Check back soon or add items via the admin page.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 12, overflow: "hidden" }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: 220, background: S.stone, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 48 }}>👕</span>
                  </div>
                )}
                <div style={{ padding: "20px 24px 24px" }}>
                  {item.brand && (
                    <p style={{ fontFamily: S.sans, fontSize: 11, fontWeight: 600, color: S.tan, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      {item.brand}
                    </p>
                  )}
                  <h3 style={{ fontFamily: S.serif, fontSize: 20, fontWeight: 400, color: S.ink, marginBottom: 6 }}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, lineHeight: 1.5, marginBottom: 16 }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 600, color: S.ink }}>
                      ${(item.price / 100).toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={buying === item.id || item.stock === 0}
                      style={{
                        fontFamily: S.sans, fontSize: 13, fontWeight: 500,
                        background: item.stock === 0 ? S.stone : S.ink,
                        color: item.stock === 0 ? S.muted : S.cream,
                        border: "none", borderRadius: 6, padding: "10px 20px",
                        cursor: item.stock === 0 ? "not-allowed" : "pointer",
                        opacity: buying === item.id ? 0.7 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {item.stock === 0 ? "Sold Out" : buying === item.id ? "Redirecting..." : "Buy Now"}
                    </button>
                  </div>
                  {item.stock > 0 && (
                    <p style={{ fontFamily: S.sans, fontSize: 11, color: S.muted, marginTop: 8 }}>
                      {item.stock} in stock
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
