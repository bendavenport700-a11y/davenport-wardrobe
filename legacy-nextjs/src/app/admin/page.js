"use client";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["bendavenport700@gmail.com", "mileslasky@gmail.com"];

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

const CATEGORIES = ["T-Shirt","Oxford Shirt","Henley","Crewneck","Hoodie","Quarter-Zip","Fleece","Jacket","Blazer","Chinos","Denim","Trousers","Shorts","Joggers","Sweater","Polo","Cardigan","Outerwear","Accessories"];
const SIZES      = ["XS","S","M","L","XL","XXL","28","29","30","31","32","33","34","36","38","28x30","30x30","30x32","32x30","32x32","32x34","34x30","34x32","34x34"];
const WEARS      = ["0-10 wears", "10-20 wears", "20-30 wears"];
const OCCASIONS  = ["Campus","Going Out","Internship","Weekend","Travel"];
const STYLES_LIST = ["Preppy","Minimal","Business","Streetwear","Classic"];
const SEASONS    = ["Fall/Winter","Spring/Summer","All Season"];

const EMPTY_ITEM     = { name: "", brand: "", category: "", size: "", wears: "", occasion: "", style: "", season: "", price: "", description: "", image_url: "", stock: "1", wardrobe_id: "" };
const EMPTY_WARDROBE = { name: "", description: "", image_url: "" };
const EMPTY_EDIT     = { name: "", brand: "", category: "", size: "", wears: "", occasion: "", style: "", season: "", price: "", condition: "", description: "", image_url: "", stock: "1", wardrobe_id: "" };

function Label({ children }) {
  return (
    <label style={{ fontFamily: S.sans, fontSize: 11, fontWeight: 600, color: S.tan, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder = "", autoFocus = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{ fontFamily: S.sans, fontSize: 14, color: S.ink, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%" }}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select…" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ fontFamily: S.sans, fontSize: 14, color: value ? S.ink : S.muted, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", cursor: "pointer" }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [tab, setTab] = useState("inventory");
  const [items, setItems] = useState([]);
  const [wardrobes, setWardrobes] = useState([]);

  // Inventory tab state
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemDeleting, setItemDeleting] = useState(null);
  const [itemError, setItemError] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Wardrobes tab state
  const [wForm, setWForm] = useState(EMPTY_WARDROBE);
  const [wSaving, setWSaving] = useState(false);
  const [wError, setWError] = useState("");
  const [wDeleting, setWDeleting] = useState(null);
  const [expandedWardrobe, setExpandedWardrobe] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  // New-wardrobe modal (opened from inventory tab dropdown)
  const [modal, setModal] = useState(false);
  const [modalForm, setModalForm] = useState(EMPTY_WARDROBE);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user || !ADMIN_EMAILS.includes(user.primaryEmailAddress?.emailAddress)) {
      router.replace("/");
      return;
    }
    loadAll();
  }, [isLoaded, user]);

  async function loadAll() {
    const [inv, ward] = await Promise.all([
      fetch("/api/inventory").then(r => r.json()),
      fetch("/api/wardrobes").then(r => r.json()),
    ]);
    setItems(Array.isArray(inv) ? inv : []);
    setWardrobes(Array.isArray(ward) ? ward : []);
  }

  // ── Inventory actions ───────────────────────────────────────────────────────

  async function handleAddItem(e) {
    e.preventDefault();
    setItemError("");
    if (!itemForm.name || !itemForm.price) { setItemError("Name and price are required."); return; }
    if (!itemForm.wardrobe_id) { setItemError("Please select a wardrobe."); return; }
    setItemSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...itemForm, price: Math.round(parseFloat(itemForm.price) * 100), stock: parseInt(itemForm.stock) || 1, wardrobe_id: parseInt(itemForm.wardrobe_id), wears: itemForm.wears || null }),
      });
      if (!res.ok) { const d = await res.json(); setItemError(d.error ?? "Failed to add item."); return; }
      setItemForm(EMPTY_ITEM);
      await loadAll();
    } catch { setItemError("Something went wrong."); }
    finally { setItemSaving(false); }
  }

  async function handleDeleteItem(id) {
    if (!confirm("Delete this item?")) return;
    setItemDeleting(id);
    try {
      await fetch("/api/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await loadAll();
    } finally { setItemDeleting(null); }
  }

  async function handleRemoveFromWardrobe(itemId) {
    setRemovingItem(itemId);
    try {
      await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: itemId, wardrobe_id: null }) });
      await loadAll();
    } finally { setRemovingItem(null); }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditError("");
    setEditForm({
      name:        item.name || "",
      brand:       item.brand || "",
      category:    item.category || "",
      size:        item.size || "",
      wears:       item.wears || "",
      occasion:    item.occasion || "",
      style:       item.style || "",
      season:      item.season || "",
      price:       item.price ? (item.price / 100).toString() : "",
      condition:   item.condition || "",
      description: item.description || "",
      image_url:   item.image_url || "",
      stock:       item.stock != null ? item.stock.toString() : "1",
      wardrobe_id: item.wardrobe_id != null ? item.wardrobe_id.toString() : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
    setEditError("");
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editForm.name || !editForm.price) { setEditError("Name and price are required."); return; }
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:          editingId,
          name:        editForm.name,
          brand:       editForm.brand || null,
          category:    editForm.category || null,
          size:        editForm.size || null,
          wears:       editForm.wears || null,
          occasion:    editForm.occasion || null,
          style:       editForm.style || null,
          season:      editForm.season || null,
          price:       Math.round(parseFloat(editForm.price) * 100),
          condition:   editForm.condition || null,
          description: editForm.description || null,
          image_url:   editForm.image_url || null,
          stock:       parseInt(editForm.stock) || 1,
          wardrobe_id: editForm.wardrobe_id ? parseInt(editForm.wardrobe_id) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Failed to save."); return; }
      setEditingId(null);
      await loadAll();
    } catch { setEditError("Something went wrong."); }
    finally { setEditSaving(false); }
  }

  // ── Wardrobe actions ────────────────────────────────────────────────────────

  async function postWardrobe(data) {
    const res = await fetch("/api/wardrobes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to create wardrobe."); }
    return res.json();
  }

  async function handleCreateWardrobe(e) {
    e.preventDefault();
    setWError("");
    if (!wForm.name.trim()) { setWError("Name is required."); return; }
    setWSaving(true);
    try {
      await postWardrobe(wForm);
      setWForm(EMPTY_WARDROBE);
      await loadAll();
    } catch (err) { setWError(err.message); }
    finally { setWSaving(false); }
  }

  async function handleDeleteWardrobe(id) {
    if (!confirm("Delete this wardrobe? Items will be unassigned but not deleted.")) return;
    setWDeleting(id);
    try {
      await fetch("/api/wardrobes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (expandedWardrobe === id) setExpandedWardrobe(null);
      await loadAll();
    } finally { setWDeleting(null); }
  }

  async function handleModalCreate(e) {
    e.preventDefault();
    setModalError("");
    if (!modalForm.name.trim()) { setModalError("Name is required."); return; }
    setModalSaving(true);
    try {
      const created = await postWardrobe(modalForm);
      await loadAll();
      setItemForm(f => ({ ...f, wardrobe_id: String(created.id) }));
      setModal(false);
      setModalForm(EMPTY_WARDROBE);
    } catch (err) { setModalError(err.message); }
    finally { setModalSaving(false); }
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: S.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted }}>Loading...</p>
      </div>
    );
  }
  if (!user || !ADMIN_EMAILS.includes(user.primaryEmailAddress?.emailAddress)) return null;

  const wardrobeMap = Object.fromEntries(wardrobes.map(w => [w.id, w.name]));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: S.cream, fontFamily: S.sans }}>
      <header style={{ borderBottom: `1px solid ${S.stone}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 600, color: S.ink, textDecoration: "none" }}>Davenport</a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/" style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, textDecoration: "none" }}>Home</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: S.serif, fontSize: 40, fontWeight: 300, color: S.ink, marginBottom: 6 }}>Inventory Admin</h1>
          <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted }}>Manage items and wardrobes.</p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${S.stone}`, marginBottom: 40 }}>
          {[["inventory", "Inventory", items.length], ["wardrobes", "Wardrobes", wardrobes.length]].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{ fontFamily: S.sans, fontSize: 13, fontWeight: tab === key ? 600 : 400, color: tab === key ? S.ink : S.muted, background: "none", border: "none", borderBottom: tab === key ? `2px solid ${S.ink}` : "2px solid transparent", padding: "0 0 14px", marginRight: 32, cursor: "pointer", letterSpacing: "0.02em", transition: "color 0.15s, border-color 0.15s" }}
            >
              {label}
              {count > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: S.tan }}>({count})</span>}
            </button>
          ))}
        </div>

        {/* ── INVENTORY TAB ─────────────────────────────────────────────────── */}
        {tab === "inventory" && (
          <>
            {/* Add Item Form */}
            <div style={{ background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 12, padding: "32px 36px", marginBottom: 48 }}>
              <h2 style={{ fontFamily: S.serif, fontSize: 24, fontWeight: 400, color: S.ink, marginBottom: 24 }}>Add New Item</h2>
              <form onSubmit={handleAddItem} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Name *</Label>
                  <Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Ivory Oxford Shirt"/>
                </div>

                <div>
                  <Label>Brand</Label>
                  <Input value={itemForm.brand} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} placeholder="J.Crew"/>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} placeholder="Select category…"/>
                </div>

                <div>
                  <Label>Size</Label>
                  <Select value={itemForm.size} onChange={e => setItemForm(f => ({ ...f, size: e.target.value }))} options={SIZES} placeholder="Select size…"/>
                </div>

                <div>
                  <Label>Wears</Label>
                  <Select value={itemForm.wears} onChange={e => setItemForm(f => ({ ...f, wears: e.target.value }))} options={WEARS} placeholder="Select wears…"/>
                </div>

                <div>
                  <Label>Occasion</Label>
                  <Select value={itemForm.occasion} onChange={e => setItemForm(f => ({ ...f, occasion: e.target.value }))} options={OCCASIONS} placeholder="Select occasion…"/>
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={itemForm.style} onChange={e => setItemForm(f => ({ ...f, style: e.target.value }))} options={STYLES_LIST} placeholder="Select style…"/>
                </div>
                <div>
                  <Label>Season</Label>
                  <Select value={itemForm.season} onChange={e => setItemForm(f => ({ ...f, season: e.target.value }))} options={SEASONS} placeholder="Select season…"/>
                </div>

                <div>
                  <Label>Buy Price (USD) *</Label>
                  <Input type="number" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} placeholder="85"/>
                </div>

                {itemForm.price && !isNaN(parseFloat(itemForm.price)) ? (
                  <div>
                    <Label>Rent Preview</Label>
                    <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted, padding: "10px 14px", background: "#f9fafb", border: `1px solid ${S.stone}`, borderRadius: 6 }}>
                      ${(Math.round(parseFloat(itemForm.price) * 0.0834 * 100) / 100).toFixed(2)}/mo
                    </p>
                  </div>
                ) : <div/>}

                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={itemForm.stock} onChange={e => setItemForm(f => ({ ...f, stock: e.target.value }))} placeholder="1"/>
                </div>

                {/* Wardrobe selector */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Wardrobe *</Label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <select
                      required
                      value={itemForm.wardrobe_id}
                      onChange={e => setItemForm(f => ({ ...f, wardrobe_id: e.target.value }))}
                      style={{ flex: 1, fontFamily: S.sans, fontSize: 14, color: itemForm.wardrobe_id ? S.ink : S.muted, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", cursor: "pointer" }}
                    >
                      <option value="">Select a wardrobe…</option>
                      {wardrobes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setModal(true); setModalForm(EMPTY_WARDROBE); setModalError(""); }}
                      style={{ fontFamily: S.sans, fontSize: 12, fontWeight: 600, background: "transparent", color: S.tan, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      + New Wardrobe
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Image URL</Label>
                  <Input value={itemForm.image_url} onChange={e => setItemForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..."/>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Description</Label>
                  <textarea
                    value={itemForm.description}
                    onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="A crisp ivory oxford with a relaxed fit."
                    style={{ fontFamily: S.sans, fontSize: 14, color: S.ink, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", resize: "vertical" }}
                  />
                </div>

                {itemError && <p style={{ gridColumn: "1 / -1", fontFamily: S.sans, fontSize: 13, color: "#dc2626" }}>{itemError}</p>}

                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" disabled={itemSaving} style={{ fontFamily: S.sans, fontSize: 14, fontWeight: 500, background: S.ink, color: S.cream, border: "none", borderRadius: 8, padding: "12px 28px", cursor: itemSaving ? "not-allowed" : "pointer", opacity: itemSaving ? 0.7 : 1 }}>
                    {itemSaving ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </form>
            </div>

            {/* Inventory list */}
            <div>
              <h2 style={{ fontFamily: S.serif, fontSize: 24, fontWeight: 400, color: S.ink, marginBottom: 20 }}>
                Current Inventory ({items.length})
              </h2>
              {items.length === 0 ? (
                <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted, fontStyle: "italic" }}>No items yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map(item => (
                    <div key={item.id} style={{ background: "#fff", border: `1px solid ${editingId === item.id ? S.tan : S.stone}`, borderRadius: 10, overflow: "hidden" }}>
                      {editingId === item.id ? (
                        <form onSubmit={handleSaveEdit} style={{ padding: "20px 24px" }}>
                          <p style={{ fontFamily: S.serif, fontSize: 18, color: S.ink, marginBottom: 18 }}>Editing: {item.name}</p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <Label>Name *</Label>
                              <Input autoFocus value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name"/>
                            </div>
                            <div>
                              <Label>Brand</Label>
                              <Input value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} placeholder="J.Crew"/>
                            </div>
                            <div>
                              <Label>Category</Label>
                              <Select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} placeholder="Select category…"/>
                            </div>
                            <div>
                              <Label>Size</Label>
                              <Select value={editForm.size} onChange={e => setEditForm(f => ({ ...f, size: e.target.value }))} options={SIZES} placeholder="Select size…"/>
                            </div>
                            <div>
                              <Label>Wears</Label>
                              <Select value={editForm.wears} onChange={e => setEditForm(f => ({ ...f, wears: e.target.value }))} options={WEARS} placeholder="Select wears…"/>
                            </div>
                            <div>
                              <Label>Occasion</Label>
                              <Select value={editForm.occasion} onChange={e => setEditForm(f => ({ ...f, occasion: e.target.value }))} options={OCCASIONS} placeholder="Select occasion…"/>
                            </div>
                            <div>
                              <Label>Style</Label>
                              <Select value={editForm.style} onChange={e => setEditForm(f => ({ ...f, style: e.target.value }))} options={STYLES_LIST} placeholder="Select style…"/>
                            </div>
                            <div>
                              <Label>Season</Label>
                              <Select value={editForm.season} onChange={e => setEditForm(f => ({ ...f, season: e.target.value }))} options={SEASONS} placeholder="Select season…"/>
                            </div>
                            <div>
                              <Label>Condition</Label>
                              <Input value={editForm.condition} onChange={e => setEditForm(f => ({ ...f, condition: e.target.value }))} placeholder="Like New"/>
                            </div>
                            <div>
                              <Label>Buy Price (USD) *</Label>
                              <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} placeholder="85"/>
                            </div>
                            <div>
                              <Label>Stock</Label>
                              <Input type="number" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))} placeholder="1"/>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <Label>Wardrobe</Label>
                              <select value={editForm.wardrobe_id} onChange={e => setEditForm(f => ({ ...f, wardrobe_id: e.target.value }))}
                                style={{ fontFamily: S.sans, fontSize: 14, color: editForm.wardrobe_id ? S.ink : S.muted, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", cursor: "pointer" }}>
                                <option value="">No wardrobe</option>
                                {wardrobes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <Label>Image URL</Label>
                              <Input value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..."/>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <Label>Description</Label>
                              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                style={{ fontFamily: S.sans, fontSize: 14, color: S.ink, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", resize: "vertical" }}/>
                            </div>
                          </div>
                          {editError && <p style={{ fontFamily: S.sans, fontSize: 13, color: "#dc2626", marginTop: 12 }}>{editError}</p>}
                          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                            <button type="submit" disabled={editSaving}
                              style={{ fontFamily: S.sans, fontSize: 13, fontWeight: 600, background: S.ink, color: S.cream, border: "none", borderRadius: 6, padding: "10px 22px", cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1 }}>
                              {editSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button type="button" onClick={cancelEdit}
                              style={{ fontFamily: S.sans, fontSize: 13, background: "transparent", color: S.muted, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                          {item.image_url ? (
                            <>
                              <img src={item.image_url} alt={item.name}
                                style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                                onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                              />
                              <div style={{ width: 52, height: 52, background: S.stone, borderRadius: 6, display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>👕</div>
                            </>
                          ) : (
                            <div style={{ width: 52, height: 52, background: S.stone, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>👕</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: S.serif, fontSize: 17, color: S.ink, marginBottom: 2 }}>{item.name}</p>
                            <p style={{ fontFamily: S.sans, fontSize: 12, color: S.muted }}>
                              {[item.brand, item.category, item.size, item.condition].filter(Boolean).join(" · ")} · ${(item.price / 100).toFixed(0)} · {item.stock} in stock
                              {item.wardrobe_id && wardrobeMap[item.wardrobe_id] && (
                                <span style={{ marginLeft: 8, background: "#f0ebe3", border: "1px solid #ddd5c8", borderRadius: 10, padding: "1px 8px", fontSize: 11, color: S.tan }}>
                                  {wardrobeMap[item.wardrobe_id]}
                                </span>
                              )}
                            </p>
                          </div>
                          <button onClick={() => startEdit(item)}
                            style={{ fontFamily: S.sans, fontSize: 12, background: "transparent", color: S.ink, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "7px 14px", cursor: "pointer", flexShrink: 0 }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} disabled={itemDeleting === item.id}
                            style={{ fontFamily: S.sans, fontSize: 12, background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, padding: "7px 14px", cursor: "pointer", flexShrink: 0, opacity: itemDeleting === item.id ? 0.5 : 1 }}>
                            {itemDeleting === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── WARDROBES TAB ─────────────────────────────────────────────────── */}
        {tab === "wardrobes" && (
          <>
            {/* Create wardrobe form */}
            <div style={{ background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 12, padding: "32px 36px", marginBottom: 48 }}>
              <h2 style={{ fontFamily: S.serif, fontSize: 24, fontWeight: 400, color: S.ink, marginBottom: 24 }}>Create New Wardrobe</h2>
              <form onSubmit={handleCreateWardrobe} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Name *</Label>
                  <Input value={wForm.name} onChange={e => setWForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Spring Essentials"/>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Cover Photo URL</Label>
                  <Input value={wForm.image_url} onChange={e => setWForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..."/>
                  {wForm.image_url.trim() && (
                    <img src={wForm.image_url.trim()} alt="" style={{ marginTop: 10, height: 80, width: 120, objectFit: "cover", borderRadius: 6, display: "block" }} onError={e => e.currentTarget.style.display = "none"}/>
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Label>Description</Label>
                  <textarea
                    value={wForm.description}
                    onChange={e => setWForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="What's the vibe of this wardrobe?"
                    style={{ fontFamily: S.sans, fontSize: 14, color: S.ink, background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", resize: "vertical" }}
                  />
                </div>
                {wError && <p style={{ gridColumn: "1 / -1", fontFamily: S.sans, fontSize: 13, color: "#dc2626" }}>{wError}</p>}
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" disabled={wSaving} style={{ fontFamily: S.sans, fontSize: 14, fontWeight: 500, background: S.ink, color: S.cream, border: "none", borderRadius: 8, padding: "12px 28px", cursor: wSaving ? "not-allowed" : "pointer", opacity: wSaving ? 0.7 : 1 }}>
                    {wSaving ? "Creating…" : "Create Wardrobe"}
                  </button>
                </div>
              </form>
            </div>

            {/* Wardrobe list */}
            <div>
              <h2 style={{ fontFamily: S.serif, fontSize: 24, fontWeight: 400, color: S.ink, marginBottom: 20 }}>
                Current Wardrobes ({wardrobes.length})
              </h2>
              {wardrobes.length === 0 ? (
                <p style={{ fontFamily: S.sans, fontSize: 14, color: S.muted, fontStyle: "italic" }}>No wardrobes yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {wardrobes.map(w => {
                    const wardrobeItems = items.filter(i => i.wardrobe_id === w.id);
                    const isExpanded = expandedWardrobe === w.id;
                    return (
                      <div key={w.id} style={{ background: "#fff", border: `1px solid ${S.stone}`, borderRadius: 10, overflow: "hidden" }}>
                        {/* Header row */}
                        <div
                          onClick={() => setExpandedWardrobe(isExpanded ? null : w.id)}
                          style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                        >
                          {w.image_url ? (
                            <img src={w.image_url} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}/>
                          ) : (
                            <div style={{ width: 52, height: 52, background: S.stone, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>🗂️</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: S.serif, fontSize: 18, color: S.ink, marginBottom: 3 }}>{w.name}</p>
                            <p style={{ fontFamily: S.sans, fontSize: 12, color: S.muted }}>
                              {w.description || <em>No description</em>}
                              <span style={{ marginLeft: 8, background: "#f0ebe3", border: "1px solid #ddd5c8", borderRadius: 10, padding: "1px 8px", fontSize: 11, color: S.tan }}>
                                {wardrobeItems.length} item{wardrobeItems.length !== 1 ? "s" : ""}
                              </span>
                            </p>
                          </div>
                          <span style={{ fontSize: 13, color: S.muted, display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginRight: 4 }}>▾</span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteWardrobe(w.id); }}
                            disabled={wDeleting === w.id}
                            style={{ fontFamily: S.sans, fontSize: 12, background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, padding: "7px 14px", cursor: "pointer", flexShrink: 0, opacity: wDeleting === w.id ? 0.5 : 1 }}
                          >
                            {wDeleting === w.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>

                        {/* Expanded items */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${S.stone}`, background: S.cream }}>
                            {wardrobeItems.length === 0 ? (
                              <p style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, padding: "16px 20px", fontStyle: "italic" }}>
                                No items in this wardrobe yet. Add items from the Inventory tab.
                              </p>
                            ) : (
                              wardrobeItems.map((item, idx) => (
                                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: idx < wardrobeItems.length - 1 ? `1px solid ${S.stone}` : "none" }}>
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 5, flexShrink: 0 }}/>
                                  ) : (
                                    <div style={{ width: 42, height: 42, background: S.stone, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>👕</div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: S.serif, fontSize: 15, color: S.ink }}>{item.name}</p>
                                    <p style={{ fontFamily: S.sans, fontSize: 11, color: S.muted }}>
                                      {[item.brand, item.category].filter(Boolean).join(" · ")} · ${(item.price / 100).toFixed(0)} · {item.stock} in stock
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromWardrobe(item.id)}
                                    disabled={removingItem === item.id}
                                    style={{ fontFamily: S.sans, fontSize: 12, background: "transparent", color: S.tan, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", flexShrink: 0, opacity: removingItem === item.id ? 0.5 : 1 }}
                                  >
                                    {removingItem === item.id ? "Removing…" : "Remove"}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* New Wardrobe modal (from inventory tab dropdown) */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 460, borderRadius: 12, padding: "36px 36px", position: "relative" }}>
            <button onClick={() => setModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: S.muted, lineHeight: 1 }}>✕</button>
            <h3 style={{ fontFamily: S.serif, fontSize: 26, fontWeight: 600, color: S.ink, marginBottom: 6 }}>New Wardrobe</h3>
            <p style={{ fontFamily: S.sans, fontSize: 13, color: S.muted, marginBottom: 24 }}>Create a wardrobe to group inventory items.</p>
            <form onSubmit={handleModalCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Label>Name *</Label>
                <Input autoFocus value={modalForm.name} onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Spring Essentials"/>
              </div>
              <div>
                <Label>Cover Photo URL</Label>
                <Input value={modalForm.image_url} onChange={e => setModalForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..."/>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={modalForm.description}
                  onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="What's the vibe?"
                  style={{ fontFamily: S.sans, fontSize: 14, color: S.ink, background: S.cream, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 14px", width: "100%", resize: "vertical" }}
                />
              </div>
              {modalError && <p style={{ fontFamily: S.sans, fontSize: 13, color: "#dc2626" }}>{modalError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(false)} style={{ fontFamily: S.sans, fontSize: 13, background: "transparent", color: S.muted, border: `1px solid ${S.stone}`, borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={modalSaving} style={{ fontFamily: S.sans, fontSize: 13, fontWeight: 600, background: S.ink, color: S.cream, border: "none", borderRadius: 6, padding: "10px 24px", cursor: modalSaving ? "not-allowed" : "pointer", opacity: modalSaving ? 0.7 : 1 }}>
                  {modalSaving ? "Creating…" : "Create Wardrobe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
