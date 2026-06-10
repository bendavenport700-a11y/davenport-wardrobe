"use client";
import { useState, useEffect, useRef } from "react";
import { SignInButton, UserButton, useUser, useClerk } from "@clerk/nextjs";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');`;

const S = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Outfit', system-ui, sans-serif",
  cream: "#faf9f7",
  ink: "#0a0a0a",
  tan: "#9c8b78",
  stone: "#e8e3dc",
  muted: "#6b7280",
  gold: "#c4a882",
};

const BRANDS = ["COS","ARKET","ASKET","Buck Mason","Taylor Stitch","Club Monaco","Faherty","Marine Layer","J.Crew","Banana Republic","Bonobos","Lululemon","Vuori","Rhone","Peter Millar","Rhoback","Patagonia","Levi's","Ralph Lauren","Uniqlo"];

const CONDITIONS = {
  "Like New": { label:"Like New", multiplier:1.0,  tagline:"Brand new, never worn." },
  "Good":     { label:"Good",     multiplier:0.75, tagline:"Minimal signs of life."  },
  "Fair":     { label:"Fair",     multiplier:0.55, tagline:"Worn in, priced down."   },
};

function getBuyPrice(item) {
  return Math.round(item.buyPrice * CONDITIONS[item.condition].multiplier);
}
function getMonthlyPrice(item) {
  return Math.round(item.buyPrice * 0.0834 * 100) / 100;
}
function getWearRange(count) {
  if (count <= 5)  return `${count} wear${count !== 1 ? "s" : ""}`;
  if (count <= 15) return "6-15 wears";
  if (count <= 29) return "16-29 wears";
  return "30+ wears";
}
function wearsLabel(wears) {
  if (!wears) return null;
  if (wears === "0-10 wears") return "Like New";
  if (wears === "10-20 wears") return "~15 wears";
  if (wears === "20-30 wears") return "~25 wears";
  return wears;
}

const STATIC_ITEMS = [
  { id:1,  name:"Ivory Oxford Shirt",        brand:"J.Crew",         category:"Oxford Shirt", occasion:"Campus",    style:"Preppy",    season:"Fall/Winter",  buyPrice:85,  condition:"Like New", rentalCount:3,  color:"#f5f0e8", emoji:"👕", description:"A crisp ivory oxford with a relaxed fit. Works everywhere, all semester." },
  { id:2,  name:"Charcoal Merino Crewneck",  brand:"Uniqlo",         category:"Crewneck",     occasion:"Campus",    style:"Minimal",   season:"Fall/Winter",  buyPrice:70,  condition:"Good",     rentalCount:9,  color:"#4b5563", emoji:"🧥", description:"Ultrasoft merino that drapes well and layers even better." },
  { id:3,  name:"Slim Dark Wash Denim",      brand:"J.Crew",         category:"Denim",        occasion:"Going Out", style:"Minimal",   season:"Fall/Winter",  buyPrice:110, condition:"Like New", rentalCount:2,  color:"#1e293b", emoji:"👖", description:"A versatile dark rinse slim jean. Goes from class to dinner without trying." },
  { id:4,  name:"Taupe Chinos",              brand:"Banana Republic",category:"Chinos",       occasion:"Internship",style:"Business",  season:"Spring/Summer",buyPrice:90,  condition:"Good",     rentalCount:11, color:"#c4a882", emoji:"👖", description:"Tailored but comfortable. The backbone of a smart-casual wardrobe." },
  { id:7,  name:"Navy Quarter-Zip",          brand:"Rhone",          category:"Quarter-Zip",  occasion:"Campus",    style:"Minimal",   season:"Fall/Winter",  buyPrice:120, condition:"Like New", rentalCount:1,  color:"#1e3a5f", emoji:"🧥", description:"Performance fabric with a clean aesthetic. Looks put together, feels athletic." },
  { id:8,  name:"Camel Overcoat",            brand:"Club Monaco",    category:"Overcoat",     occasion:"Internship",style:"Business",  season:"Fall/Winter",  buyPrice:280, condition:"Like New", rentalCount:3,  color:"#c19a6b", emoji:"🧥", description:"The statement layer. Timeless camel wool that signals you mean business." },
  { id:9,  name:"Black Slim Trousers",       brand:"Banana Republic",category:"Trousers",     occasion:"Internship",style:"Business",  season:"Fall/Winter",  buyPrice:120, condition:"Good",     rentalCount:14, color:"#111827", emoji:"👖", description:"Sharply tailored with a modern slim leg. Pairs with anything." },
  { id:10, name:"Heather Grey Hoodie",       brand:"Uniqlo",         category:"Hoodie",       occasion:"Campus",    style:"Streetwear",season:"Fall/Winter",  buyPrice:65,  condition:"Fair",     rentalCount:22, color:"#9ca3af", emoji:"👕", description:"The classic hoodie, done right. Heavy fabric, clean fit." },
  { id:11, name:"Linen Shirt Sage",          brand:"Marine Layer",   category:"Oxford Shirt", occasion:"Weekend",   style:"Minimal",   season:"Spring/Summer",buyPrice:95,  condition:"Like New", rentalCount:5,  color:"#86a98a", emoji:"👕", description:"Breathable linen in a muted sage. Perfect for warm days and easy evenings." },
  { id:12, name:"Olive Cargo Pants",         brand:"Uniqlo",         category:"Trousers",     occasion:"Weekend",   style:"Streetwear",season:"Spring/Summer",buyPrice:75,  condition:"Good",     rentalCount:7,  color:"#4a5c3b", emoji:"👖", description:"Relaxed cargo with clean lines. Utility without looking sloppy." },
  { id:14, name:"White Linen Shorts",        brand:"Rhone",          category:"Shorts",       occasion:"Weekend",   style:"Minimal",   season:"Spring/Summer",buyPrice:80,  condition:"Like New", rentalCount:2,  color:"#f0ede8", emoji:"🩳", description:"Tailored linen shorts with a 7-inch inseam. Resort-ready, campus-appropriate." },
  { id:15, name:"Striped Rugby Shirt",       brand:"J.Crew",         category:"Crewneck",     occasion:"Campus",    style:"Preppy",    season:"Spring/Summer",buyPrice:90,  condition:"Good",     rentalCount:10, color:"#1d3461", emoji:"👕", description:"Navy and cream stripe with a relaxed collar. Effortlessly collegiate." },
  { id:16, name:"Black Bomber",              brand:"ASKET",          category:"Bomber",       occasion:"Going Out", style:"Streetwear",season:"Fall/Winter",  buyPrice:195, condition:"Like New", rentalCount:4,  color:"#0f172a", emoji:"🧥", description:"Clean black bomber with minimal hardware. The outerwear that does the work." },
  { id:17, name:"Burgundy Corduroy Shirt",   brand:"Faherty",        category:"Oxford Shirt", occasion:"Weekend",   style:"Preppy",    season:"Fall/Winter",  buyPrice:110, condition:"Good",     rentalCount:8,  color:"#7c2d3c", emoji:"👕", description:"Soft corduroy in a rich burgundy. Textured, warm, genuinely stylish." },
  { id:19, name:"Cream Knit Cardigan",       brand:"COS",            category:"Cardigan",     occasion:"Campus",    style:"Preppy",    season:"Fall/Winter",  buyPrice:130, condition:"Like New", rentalCount:3,  color:"#f5f0e0", emoji:"🧥", description:"Soft ribbed knit in an off-white. Smart-casual perfection." },
  { id:21, name:"Cobalt Blue Dress Shirt",   brand:"Club Monaco",    category:"Oxford Shirt", occasion:"Internship",style:"Business",  season:"Spring/Summer",buyPrice:110, condition:"Like New", rentalCount:4,  color:"#1e40af", emoji:"👕", description:"A confident blue dress shirt that signals attention to detail." },
  { id:22, name:"Vintage Wash Tee",          brand:"Buck Mason",     category:"T-Shirt",      occasion:"Weekend",   style:"Streetwear",season:"Spring/Summer",buyPrice:55,  condition:"Fair",     rentalCount:24, color:"#78716c", emoji:"👕", description:"Perfectly broken-in feel from day one. Wears better than anything you own." },
  { id:23, name:"Slim Wool Blazer",          brand:"Taylor Stitch",  category:"Jacket",       occasion:"Going Out", style:"Business",  season:"Fall/Winter",  buyPrice:260, condition:"Like New", rentalCount:2,  color:"#1f2937", emoji:"🧥", description:"A structured navy blazer that turns any outfit into a statement." },
  { id:24, name:"Merino Turtleneck",         brand:"ASKET",          category:"Crewneck",     occasion:"Going Out", style:"Minimal",   season:"Fall/Winter",  buyPrice:115, condition:"Good",     rentalCount:9,  color:"#292524", emoji:"🧥", description:"The black turtleneck. Minimal, intellectual, magnetic." },
  { id:25, name:"Stone Chore Coat",          brand:"Faherty",        category:"Chore Coat",   occasion:"Weekend",   style:"Streetwear",season:"Fall/Winter",  buyPrice:185, condition:"Like New", rentalCount:5,  color:"#d6cfc7", emoji:"🧥", description:"A washed canvas chore coat with a relaxed fit. Effortlessly cool." },
  { id:30, name:"Ribbed Polo Ecru",          brand:"Peter Millar",   category:"Polo",         occasion:"Going Out", style:"Preppy",    season:"Spring/Summer",buyPrice:125, condition:"Like New", rentalCount:2,  color:"#f5f0e8", emoji:"👕", description:"A ribbed polo with a modern slim cut. Dressed up or down effortlessly." },
  { id:31, name:"Washed Grey Henley",        brand:"Buck Mason",     category:"Henley",       occasion:"Weekend",   style:"Minimal",   season:"Spring/Summer",buyPrice:70,  condition:"Good",     rentalCount:6,  color:"#9ca3af", emoji:"👕", description:"Lived-in grey henley with a relaxed fit. The easiest thing you'll reach for." },
  { id:32, name:"Navy Polo",                 brand:"Rhoback",        category:"Polo",         occasion:"Campus",    style:"Preppy",    season:"Spring/Summer",buyPrice:95,  condition:"Like New", rentalCount:3,  color:"#1e3a5f", emoji:"👕", description:"Performance polo that moves with you. Sharp enough for the dining hall, fast enough for the rec." },
  { id:33, name:"Olive Shirt Jacket",        brand:"Taylor Stitch",  category:"Shirt Jacket", occasion:"Weekend",   style:"Streetwear",season:"Fall/Winter",  buyPrice:165, condition:"Like New", rentalCount:4,  color:"#4a5c3b", emoji:"🧥", description:"A shirt that thinks it's a jacket. The layering piece that makes every outfit work." },
  { id:34, name:"Caramel Sweater",           brand:"COS",            category:"Sweater",      occasion:"Campus",    style:"Minimal",   season:"Fall/Winter",  buyPrice:140, condition:"Good",     rentalCount:7,  color:"#c19a6b", emoji:"🧥", description:"Substantial knit in a warm caramel. The sweater that stops people mid-sentence." },
  { id:35, name:"Heather Navy Quarter-Zip",  brand:"Peter Millar",   category:"Quarter-Zip",  occasion:"Campus",    style:"Preppy",    season:"Fall/Winter",  buyPrice:145, condition:"Like New", rentalCount:2,  color:"#334155", emoji:"🧥", description:"Midlayer perfection. Polished enough for the office, comfortable enough for everything else." },
  { id:36, name:"Khaki Chinos",              brand:"Bonobos",        category:"Chinos",       occasion:"Campus",    style:"Preppy",    season:"Spring/Summer",buyPrice:98,  condition:"Good",     rentalCount:12, color:"#d4b896", emoji:"👖", description:"The chino that fits right out of the box. Sits at the waist, tapers cleanly." },
  { id:37, name:"Charcoal Joggers",          brand:"Vuori",          category:"Joggers",      occasion:"Campus",    style:"Minimal",   season:"Fall/Winter",  buyPrice:88,  condition:"Like New", rentalCount:1,  color:"#374151", emoji:"👖", description:"Performance joggers with a tailored silhouette. Wear them everywhere without apology." },
  { id:38, name:"Cream Fleece",              brand:"Patagonia",      category:"Fleece",       occasion:"Weekend",   style:"Minimal",   season:"Fall/Winter",  buyPrice:135, condition:"Good",     rentalCount:8,  color:"#f5f0e8", emoji:"🧥", description:"Warm, packable, and clean-looking. The fleece that goes from trail to town." },
  { id:39, name:"Navy Shorts",               brand:"Lululemon",      category:"Shorts",       occasion:"Campus",    style:"Minimal",   season:"Spring/Summer",buyPrice:68,  condition:"Like New", rentalCount:3,  color:"#1e3a5f", emoji:"🩳", description:"7-inch inseam, clean fit, zero effort. The only shorts you need." },
];

function dbItemToUi(row) {
  return {
    id: 10000 + row.id,
    _dbId: row.id,
    name: row.name,
    brand: row.brand || "",
    category: row.category || "Other",
    description: row.description || "",
    buyPrice: Math.round((row.price || 0) / 100),
    condition: "Like New",
    rentalCount: 0,
    color: "#e8e3dc",
    emoji: "👕",
    occasion: row.occasion || null,
    style: row.style || null,
    season: row.season || null,
    stock: row.stock || 1,
    image_url: row.image_url || null,
    wardrobe_id: row.wardrobe_id ?? null,
    wears: row.wears || null,
  };
}

function mergeItems(staticItems, dbRows) {
  const result = staticItems.map(s => ({ ...s }));
  dbRows.forEach(row => {
    const match = staticItems.findIndex(s => s.name.toLowerCase() === row.name.toLowerCase());
    if (match >= 0) {
      result[match] = { ...result[match], _dbId: row.id };
    } else {
      result.push(dbItemToUi(row));
    }
  });
  return result;
}

const CATEGORIES = ["T-Shirt","Oxford Shirt","Henley","Crewneck","Hoodie","Quarter-Zip","Fleece","Jacket","Blazer","Chinos","Denim","Trousers","Shorts","Joggers","Sweater","Polo","Cardigan","Outerwear","Accessories"];

// ─── WARDROBES ────────────────────────────────────────────────────────────────
// Each wardrobe is a Davenport-curated seasonal collection.
const WARDROBES = [
  {
    id:"w1",
    name:"The Intern",
    season:"Fall/Winter",
    tagline:"Walk in looking like you belong there.",
    description:"Everything you need for your first real job. Sharp enough for the office, versatile enough for the dinner after. Built around a palette of navy, black, and camel that works together without thinking.",
    style:"Business",
    color:"#1f2937",
    accentColor:"#c19a6b",
    itemIds:[8,9,21,23,4,2,35],
    occasions:["Internship","Going Out","Campus"],
  },
  {
    id:"w2",
    name:"The Weekend Guy",
    season:"Spring/Summer",
    tagline:"Nothing to prove. Everything to wear.",
    description:"Relaxed fits that still look intentional. For the guys who want to look good without looking like they tried. Linen, earth tones, clean cuts.",
    style:"Minimal",
    color:"#4a5c3b",
    accentColor:"#d4b896",
    itemIds:[11,14,31,36,38,39,22],
    occasions:["Weekend","Campus"],
  },
  {
    id:"w3",
    name:"The Campus Classic",
    season:"Fall/Winter",
    tagline:"Effortlessly put together, every single day.",
    description:"The wardrobe that works from 8am lectures to Saturday night. Timeless pieces from brands that understand college life. Polos, crewnecks, chinos — done right.",
    style:"Preppy",
    color:"#1d3461",
    accentColor:"#f5f0e0",
    itemIds:[1,15,19,32,36,2,37],
    occasions:["Campus","Going Out"],
  },
  {
    id:"w4",
    name:"The Night Out",
    season:"Fall/Winter",
    tagline:"Dark tones. Clean fits. No explanation needed.",
    description:"Built for when it matters. Every piece in this wardrobe works on its own and works even better together. The kind of fits people notice.",
    style:"Minimal",
    color:"#0f172a",
    accentColor:"#9ca3af",
    itemIds:[24,3,16,23,2,25],
    occasions:["Going Out"],
  },
  {
    id:"w5",
    name:"The Spring Edit",
    season:"Spring/Summer",
    tagline:"Light fabrics. Warm days. Better looks.",
    description:"A full spring rotation built around breathable fabrics and clean color. From the quad to the patio — this wardrobe transitions as fast as the weather does.",
    style:"Minimal",
    color:"#86a98a",
    accentColor:"#f0ede8",
    itemIds:[11,30,14,36,39,31,32],
    occasions:["Campus","Weekend","Going Out"],
  },
  {
    id:"w6",
    name:"The Streetwear Edit",
    season:"Fall/Winter",
    tagline:"Relaxed. Layered. Intentional.",
    description:"For the guy who treats getting dressed like an art form. Cargo, earth tones, chore coats, and pieces that layer without looking overthought.",
    style:"Streetwear",
    color:"#292524",
    accentColor:"#78716c",
    itemIds:[10,12,25,33,22,16,3],
    occasions:["Weekend","Campus","Going Out"],
  },
];

const SWIPE_ITEMS = [
  { id:"s1", label:"Clean & Minimal",  emoji:"⬜", desc:"White tees, slim cuts, nothing loud" },
  { id:"s2", label:"Streetwear Edge",  emoji:"🖤", desc:"Oversized fits, cargo, bold silhouettes" },
  { id:"s3", label:"Collegiate Prep",  emoji:"🏛️", desc:"Oxford shirts, chinos, rugby stripes" },
  { id:"s4", label:"Sharp Business",   emoji:"💼", desc:"Blazers, dress shirts, leather shoes" },
  { id:"s5", label:"Weekend Casual",   emoji:"🌿", desc:"Linen, cargo, relaxed everything" },
  { id:"s6", label:"Going Out Fits",   emoji:"🌙", desc:"Dark tones, structure, heads turning" },
  { id:"s7", label:"Earth Tones",      emoji:"🍂", desc:"Camel, olive, stone warm palette" },
  { id:"s8", label:"Monochrome",       emoji:"◾", desc:"Black, white, grey. Nothing in between" },
];

const OUTFITS = [
  { id:"o1", name:"The Campus Classic", itemIds:[1,2,7,37],  style:"Preppy",   occasion:"Campus" },
  { id:"o2", name:"Internship Ready",   itemIds:[21,9,23,8], style:"Business", occasion:"Internship" },
  { id:"o3", name:"Weekend Off-Duty",   itemIds:[11,14,31,38],style:"Minimal",  occasion:"Weekend" },
  { id:"o4", name:"Night Out",          itemIds:[24,3,16,23], style:"Minimal",  occasion:"Going Out" },
];

// pricing helpers defined above with data

// ─── useMobile hook ───────────────────────────────────────────────────────────
function useMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return m;
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ page, setPage, suitcase }) {
  const isMobile = useMobile();
  const { isSignedIn, user } = useUser();
  const [userPoints, setUserPoints] = useState(null);

  useEffect(() => {
    if (!isSignedIn || !user?.id) { setUserPoints(null); return; }
    fetch(`/api/points?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(d => setUserPoints(d.points ?? 0))
      .catch(() => {});
  }, [isSignedIn, user?.id]);

  const navLinks = [
    ["wardrobes","Wardrobes"],
    ["browse","Shop Pieces"],
    ["community","Community"],
    ["sustainability","Our Mission"],
  ];

  function go(p) { setPage(p); }

  const TabIcon = ({ name, active }) => {
    const c = active ? S.ink : "#9ca3af";
    if (name === "home") return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    );
    if (name === "wardrobes") return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/>
      </svg>
    );
    if (name === "browse") return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    );
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    );
  };

  const tabs = [
    { key:"home",      label:"Home",      icon:"home" },
    { key:"wardrobes", label:"Wardrobes", icon:"wardrobes" },
    { key:"browse",    label:"Shop",      icon:"browse" },
    { key:"_account",  label:"Account",   icon:"account" },
  ];

  return (
    <>
      {/* Top bar */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:200,background:"rgba(250,249,247,0.97)",backdropFilter:"blur(16px)",borderBottom:"1px solid #ede8e1",display:"flex",alignItems:"center",justifyContent:"space-between",padding: isMobile ? "0 16px 0 20px" : "0 24px 0 32px",height:60 }}>
        <button onClick={()=>go("home")} style={{ fontFamily:S.serif,fontSize: isMobile ? 22 : 26,fontWeight:700,letterSpacing:"-0.5px",background:"none",border:"none",cursor:"pointer",color:S.ink,display:"flex",alignItems:"center",gap:10 }}>
          Davenport
          <span style={{ fontFamily:S.sans,fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,background:"#f0ebe3",border:`1px solid #ddd5c8`,borderRadius:20,padding:"3px 8px",lineHeight:1 }}>Beta</span>
        </button>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display:"flex",gap:28,alignItems:"center" }}>
            {navLinks.map(([p,label])=>(
              <button key={p} onClick={()=>go(p)} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:12,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:page===p?S.ink:S.muted,borderBottom:page===p?`1px solid ${S.ink}`:"1px solid transparent",paddingBottom:2 }}>
                {label}
              </button>
            ))}
            {isSignedIn ? (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {userPoints !== null && (
                  <a href="/account" style={{ fontFamily:S.sans, fontSize:11, fontWeight:600, color:S.tan, background:"#f0ebe3", border:`1px solid #ddd5c8`, borderRadius:20, padding:"3px 10px", textDecoration:"none", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                    {userPoints} pts
                  </a>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button style={{ background:"transparent",color:S.ink,border:`1px solid #c9bfb0`,cursor:"pointer",padding:"9px 18px",fontFamily:S.sans,fontSize:12,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>
                  Sign In
                </button>
              </SignInButton>
            )}
            <button onClick={()=>go("suitcase")} style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"9px 20px",fontFamily:S.sans,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,transition:"background 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#d4b896"}
              onMouseLeave={e=>e.currentTarget.style.background=S.gold}>
              🧳 Suitcase {suitcase.length>0&&<span style={{ background:S.ink,color:S.cream,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700 }}>{suitcase.length}</span>}
            </button>
          </div>
        )}

        {/* Mobile: suitcase button only */}
        {isMobile && (
          <button onClick={()=>go("suitcase")} style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"10px 16px",fontFamily:S.sans,fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6,minHeight:44 }}>
            🧳 {suitcase.length>0&&<span style={{ background:S.ink,color:S.cream,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700 }}>{suitcase.length}</span>}
          </button>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(250,249,247,0.97)",backdropFilter:"blur(16px)",borderTop:"1px solid #ede8e1",display:"flex",height:64 }}>
          {tabs.map(tab => {
            const active = tab.key === "_account" ? false : page === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => tab.key === "_account" ? (window.location.href="/account") : go(tab.key)}
                style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",gap:3,color:active?S.ink:"#9ca3af",minHeight:48,WebkitTapHighlightColor:"transparent" }}
              >
                <TabIcon name={tab.icon} active={active}/>
                <span style={{ fontFamily:S.sans,fontSize:9,fontWeight:active?600:400,letterSpacing:"0.04em",textTransform:"uppercase" }}>{tab.label}</span>
                {active && <div style={{ width:4,height:4,borderRadius:"50%",background:S.ink,position:"absolute",bottom:8 }}/>}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── MINI CARD ────────────────────────────────────────────────────────────────
function MiniItemCard({ item, setPage }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={()=>setPage(`item-${item.id}`)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer",border:`1px solid ${S.stone}`,background:"#fff",transition:"transform 0.2s,box-shadow 0.2s",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 32px rgba(0,0,0,0.08)":"none" }}>
      <div style={{ height:120,background:item.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36 }}>
        {item.emoji}
      </div>
      <div style={{ padding:"16px 16px 20px" }}>
        <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:4 }}>{item.brand}</p>
        <h3 style={{ fontFamily:S.serif,fontSize:17,fontWeight:600,color:S.ink,marginBottom:8,lineHeight:1.2 }}>{item.name}</h3>
        <span style={{ fontFamily:S.serif,fontSize:20,fontWeight:700,color:S.ink }}>${getMonthlyPrice(item).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:10,color:S.muted }}>/mo</span></span>
        <p style={{ fontFamily:S.sans,fontSize:9,color:S.muted,marginTop:4 }}>Buy outright: ${getBuyPrice(item)}</p>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function NewArrivalCard({ item, setPage }) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const showImg = item.image_url && !imgErr;
  return (
    <div onClick={()=>setPage(`item-${item.id}`)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer", background:"#fff", border:`1px solid ${hov?S.tan:S.stone}`, transition:"transform 0.2s,box-shadow 0.2s", transform:hov?"translateY(-3px)":"none", boxShadow:hov?"0 12px 32px rgba(0,0,0,0.08)":"none" }}>
      <div style={{ height:200, background: showImg?"#f5f3f0":"#e8e3dc", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {showImg
          ? <img src={item.image_url} alt={item.name} onError={()=>setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}/>
          : <div style={{ fontSize:40, color:S.muted }}>👕</div>
        }
      </div>
      <div style={{ padding:"14px 16px 18px" }}>
        <p style={{ fontFamily:S.sans, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:S.tan, marginBottom:4 }}>{item.brand}</p>
        <h3 style={{ fontFamily:S.serif, fontSize:16, fontWeight:600, color:S.ink, marginBottom:8, lineHeight:1.2 }}>{item.name}</h3>
        <span style={{ fontFamily:S.serif, fontSize:19, fontWeight:700, color:S.ink }}>${getMonthlyPrice(item).toFixed(2)}<span style={{ fontFamily:S.sans, fontSize:9, color:S.muted }}>/mo</span></span>
      </div>
    </div>
  );
}

function HomePage({ setPage, items=[], loadingItems=false }) {
  const isMobile = useMobile();
  const featured = STATIC_ITEMS.filter(i=>i.condition==="Like New").slice(0,3);
  const founderRef = useRef(null);
  const [founderVisible, setFounderVisible] = useState(false);
  const [dbWardrobes, setDbWardrobes] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideFade, setSlideFade] = useState(true);

  useEffect(() => {
    const el = founderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFounderVisible(true); },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/wardrobes").then(r=>r.json()).then(d=>setDbWardrobes(Array.isArray(d)?d:[])).catch(()=>{});
    fetch("/api/posts").then(r=>r.json()).then(d=>setRecentPosts(Array.isArray(d)?d.slice(0,2):[])).catch(()=>{});
  }, []);

  const newArrivals = items.slice(0, 4);

  const peekItems = newArrivals.filter(i => i.image_url).slice(0, 4);

  const editorialSlides = (() => {
    const itemSlides = items.filter(i => i.image_url).slice(0, 5).map(i => ({
      id: `i-${i.id}`, url: i.image_url, label: i.name, sub: i.brand, onClick: () => setPage("browse"),
    }));
    const wardrobeSlides = dbWardrobes.filter(w => w.image_url).slice(0, 3).map(w => ({
      id: `w-${w.id}`, url: w.image_url, label: w.name, sub: "View Wardrobe", onClick: () => setPage(`wardrobe-db-${w.id}`),
    }));
    const merged = [];
    const maxLen = Math.max(itemSlides.length, wardrobeSlides.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < wardrobeSlides.length) merged.push(wardrobeSlides[i]);
      if (i < itemSlides.length) merged.push(itemSlides[i]);
    }
    return merged;
  })();

  const editorialCount = editorialSlides.length;
  useEffect(() => {
    if (editorialCount <= 1) return;
    const t = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => { setSlideIdx(i => (i + 1) % editorialCount); setSlideFade(true); }, 500);
    }, 3000);
    return () => clearInterval(t);
  }, [editorialCount]);

  return (
    <div style={{ paddingTop:60 }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .founder-animate { animation: fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes peekIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .peek-item { animation: peekIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes peekUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .peek-item-mob { animation: peekUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Hero */}
      <section style={{ minHeight:"calc(75vh - 60px)", display:"flex", flexDirection: isMobile ? "column" : "row", background:"#faf9f7", position:"relative", overflow:"hidden" }}>
        {/* Left: text content */}
        <div style={{ flex: isMobile ? "none" : "0 0 58%", display:"flex", flexDirection:"column", justifyContent:"center", padding: isMobile ? "36px 24px 32px" : "0 56px 0 64px", position:"relative", zIndex:1 }}>
          <p style={{ fontFamily:S.sans, fontSize: isMobile ? 10 : 11, letterSpacing:"0.26em", textTransform:"uppercase", color:S.tan, marginBottom: isMobile ? 16 : 28, fontWeight:600 }}>Better clothes. Less effort.</p>
          <h1 style={{ fontFamily:S.serif, fontSize: isMobile ? "clamp(44px,12vw,64px)" : "clamp(48px,6.5vw,100px)", fontWeight:600, lineHeight:0.92, letterSpacing:"-3px", color:S.ink, marginBottom: isMobile ? 20 : 36, maxWidth:600 }}>
            A smarter way<br/>
            <em style={{ fontStyle:"italic", color:"#7a6a58" }}>for men</em><br/>
            to dress.
          </h1>
          <p style={{ fontFamily:S.sans, fontSize: isMobile ? 14 : 16, color:S.muted, lineHeight:1.75, maxWidth: isMobile ? "100%" : 380, marginBottom: isMobile ? 24 : 40 }}>
            A curated wardrobe subscription for college men. Wear the brands you actually want — pay only for what's in your Suitcase.
          </p>
          <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap:10 }}>
            <button onClick={()=>setPage("wardrobes")} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"15px 36px", fontFamily:S.sans, fontSize:13, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", minHeight:50, width: isMobile ? "100%" : "auto" }}>Shop Wardrobes</button>
            <button onClick={()=>setPage("browse")} style={{ background:"transparent", color:S.ink, border:`1px solid #b8afa4`, cursor:"pointer", padding:"15px 36px", fontFamily:S.sans, fontSize:13, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", minHeight:50, width: isMobile ? "100%" : "auto" }}>Shop Pieces</button>
          </div>

          {/* Mobile peek strip */}
          {isMobile && peekItems.length > 0 && (
            <div style={{ display:"flex", gap:8, marginTop:24, marginLeft:-24, marginRight:-24, paddingLeft:24, overflowX:"hidden" }}>
              {peekItems.map((item, i) => (
                <div key={item.id} className="peek-item-mob"
                  onClick={()=>setPage("browse")}
                  style={{ flexShrink:0, width:90, height:110, background:"#f5f3f0", border:`1px solid ${S.stone}`, cursor:"pointer", overflow:"hidden", animationDelay:`${i*0.1}s` }}>
                  <img src={item.image_url} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}
                    onError={e=>e.currentTarget.parentElement.style.background="#e8e3dc"}/>
                </div>
              ))}
              <div style={{ flexShrink:0, width:50, height:110, background:"linear-gradient(to right, #f5f3f0, transparent)", pointerEvents:"none" }}/>
            </div>
          )}

          {/* Scroll hint */}
          {!isMobile && (
            <div style={{ position:"absolute", bottom:20, left:64, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:1, height:28, background:`linear-gradient(to bottom, ${S.tan}, transparent)` }}/>
              <p style={{ fontFamily:S.sans, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase", color:S.tan }}>Scroll</p>
            </div>
          )}
        </div>

        {/* Right: editorial slideshow — desktop only */}
        {!isMobile && (
          <div style={{ flex:"0 0 42%", position:"relative", overflow:"hidden", background:"#f5f3f0" }}>
            {editorialSlides.length > 0 ? (
              <>
                {editorialSlides.map((slide, i) => (
                  <div key={slide.id}
                    style={{ position:"absolute", inset:0, opacity: i === slideIdx && slideFade ? 1 : 0, transition:"opacity 0.8s ease", cursor:"pointer" }}
                    onClick={slide.onClick}>
                    <img src={slide.url} alt={slide.label}
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      onError={e=>{ e.currentTarget.style.display="none"; }}/>
                    {/* Vignette + caption */}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}/>
                    <div style={{ position:"absolute", bottom:32, left:28, right:28 }}>
                      <p style={{ fontFamily:S.sans, fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.7)", marginBottom:5 }}>{slide.sub}</p>
                      <p style={{ fontFamily:S.serif, fontSize:22, fontWeight:600, color:"#fff", lineHeight:1.2 }}>{slide.label}</p>
                    </div>
                    {/* Dot indicators */}
                    <div style={{ position:"absolute", top:20, right:20, display:"flex", flexDirection:"column", gap:5 }}>
                      {editorialSlides.map((_, di) => (
                        <div key={di} style={{ width:4, height: di === slideIdx ? 20 : 4, background: di === slideIdx ? "#fff" : "rgba(255,255,255,0.4)", borderRadius:2, transition:"height 0.3s" }}/>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Left fade bleed into text area */}
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:60, background:"linear-gradient(to right, #faf9f7, transparent)", pointerEvents:"none", zIndex:5 }}/>
              </>
            ) : (
              /* Placeholder pattern when no images yet */
              <div style={{ width:"100%", height:"100%", background:`repeating-linear-gradient(45deg, ${S.stone} 0px, ${S.stone} 1px, transparent 1px, transparent 24px)`, opacity:0.5 }}/>
            )}
          </div>
        )}
      </section>

      {/* Founder Story — immediately after hero */}
      <section
        ref={founderRef}
        style={{ background:"#fff", borderTop:`1px solid ${S.stone}`, borderBottom:`1px solid ${S.stone}`, padding: isMobile ? "44px 24px" : "72px 64px", opacity: founderVisible ? 1 : 0 }}
      >
        <div
          className={founderVisible ? "founder-animate" : ""}
          style={{ maxWidth:1080, margin:"0 auto", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: isMobile ? "28px" : "60px", alignItems:"start" }}
        >
          <div style={{ flexShrink:0 }}>
            <img src="https://i.imgur.com/1y1EZRn.png" alt="Ben Davenport" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: isMobile ? "120px" : "100%", aspectRatio:"3/4", objectFit:"cover", objectPosition:"center top", display:"block" }}/>
            <p style={{ fontFamily:S.sans, fontSize:12, fontWeight:600, color:S.ink, marginTop:12, letterSpacing:"0.04em" }}>Ben Davenport</p>
            <p style={{ fontFamily:S.sans, fontSize:11, color:S.muted, marginTop:2 }}>Founder · Penn State</p>
          </div>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:12, fontWeight:500 }}>Founder</p>
            <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 30 : "clamp(30px,3.8vw,48px)", fontWeight:600, letterSpacing:"-1px", color:S.ink, marginBottom:28, lineHeight:1.05 }}>Why I Built This</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {[
                "I'm Ben Davenport, a student at Penn State — and like most guys in college, I spent way too much money on clothes I didn't need, that didn't fit right, and that I had to haul back and forth every semester.",
                "It started in high school when I learned about fast fashion and the damage it does — to the environment, to our wallets, to the way we actually think about style. I kept thinking: there has to be a better way.",
                "When I got to college, I noticed something. Guys actually care about how they look. They want to dress well, show up with confidence, and stay current — but the whole system works against them.",
                "Davenport is my answer to all of it. A curated wardrobe, sent to you, personalized to your style. Wear it as long as you want. If something doesn't fit, send it back. If you love a piece, buy it outright.",
              ].map((text, i) => (
                <p key={i} style={{ fontFamily:S.sans, fontSize: isMobile ? 14 : 15, color:S.muted, lineHeight:1.9 }}>{text}</p>
              ))}
              <p style={{ fontFamily:S.sans, fontSize: isMobile ? 14 : 15, color:S.ink, lineHeight:1.9, fontWeight:500 }}>I built this because I needed it. And I think you do too.</p>
            </div>
            <p style={{ fontFamily:S.serif, fontSize:22, fontWeight:600, color:S.ink, marginTop:28, fontStyle:"italic" }}>— Ben</p>
          </div>
        </div>
      </section>

      {/* Brands marquee */}
      <section style={{ padding:"44px 0",background:S.ink,overflow:"hidden" }}>
        <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.22em",textTransform:"uppercase",color:"#9c8b78",textAlign:"center",marginBottom:24,fontWeight:600 }}>Brands in our catalog</p>
        <div style={{ overflow:"hidden" }}>
          <div style={{ display:"inline-flex",gap:0,animation:"marquee 38s linear infinite",whiteSpace:"nowrap" }}>
            {[...BRANDS,...BRANDS,...BRANDS].map((brand,i)=>(
              <span key={i} style={{ fontFamily:S.serif,fontSize:21,color:i%4===0?S.gold:"#e8e3dc",padding:"0 32px",letterSpacing:"-0.3px",flexShrink:0 }}>{brand}</span>
            ))}
          </div>
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
      </section>

      {/* How it works */}
      <section style={{ padding: isMobile ? "52px 20px" : "88px 40px", background:S.cream }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:16 }}>How It Works</p>
          <h2 style={{ fontFamily:S.serif,fontSize: isMobile ? 32 : 44,fontWeight:600,letterSpacing:"-1px",color:S.ink,marginBottom:14 }}>Your wardrobe, delivered.</h2>
          <p style={{ fontFamily:S.sans,fontSize: isMobile ? 14 : 16,color:S.muted,marginBottom: isMobile ? 36 : 64,maxWidth:520 }}>Pick your pieces from home. We pack them up and ship a Davenport box straight to your door.</p>
          <div style={{ display:"grid",gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",gap:1,background:S.stone }}>
            {[
              { n:"01", emoji:"🧳", title:"Build your Suitcase", desc:"Browse and add the pieces you want. You're only charged for what you pick." },
              { n:"02", emoji:"📦", title:"We pack your box",    desc:"We pull every piece, inspect it, and ship a Davenport box to your door." },
              { n:"03", emoji:"👕", title:"Wear it all month",   desc:"Dress better every day. Swap anything that doesn't fit the vibe." },
              { n:"04", emoji:"🔄", title:"Keep, swap, or own",  desc:"Love a piece? Buy it outright. Done? Send it back and refresh." },
            ].map(({n,emoji,title,desc})=>(
              <div key={n} style={{ background:"#fff", padding: isMobile ? "24px 18px" : "36px 28px" }}>
                <div style={{ fontSize: isMobile ? 26 : 32, marginBottom:12 }}>{emoji}</div>
                <div style={{ fontFamily:S.serif,fontSize: isMobile ? 28 : 36,color:S.stone,fontWeight:700,lineHeight:1,marginBottom:12 }}>{n}</div>
                <h3 style={{ fontFamily:S.serif,fontSize: isMobile ? 16 : 20,fontWeight:600,color:S.ink,marginBottom:8 }}>{title}</h3>
                <p style={{ fontFamily:S.sans,fontSize: isMobile ? 12 : 13,color:S.muted,lineHeight:1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:isMobile?20:44, padding: isMobile ? "24px 20px" : "32px 40px", background:S.ink, display:"flex", flexDirection: isMobile?"column":"row", justifyContent:"space-between", alignItems: isMobile?"stretch":"center", gap:16 }}>
            <div>
              <p style={{ fontFamily:S.serif,fontSize: isMobile ? 18 : 22,fontWeight:600,color:S.cream,marginBottom:6 }}>A box built around you. Shipped to your door.</p>
              <p style={{ fontFamily:S.sans,fontSize:13,color:"#6b7280" }}>Pick a couple pieces or a whole season's worth.</p>
            </div>
            <button onClick={()=>setPage("browse")} style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"16px 36px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0,minHeight:52 }}>
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* Four ways to shop */}
      <section style={{ padding: isMobile ? "52px 20px" : "80px 40px", background:"#fff" }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:16 }}>How You Want to Shop</p>
          <h2 style={{ fontFamily:S.serif,fontSize: isMobile ? 30 : 44,fontWeight:600,letterSpacing:"-1px",color:S.ink,marginBottom:10 }}>Four ways in. One wardrobe.</h2>
          <p style={{ fontFamily:S.sans,fontSize: isMobile ? 14 : 16,color:S.muted,marginBottom: isMobile ? 32 : 56,maxWidth:520,lineHeight:1.7 }}>Davenport meets you wherever you are.</p>
          <div style={{ display:"grid",gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",gap:1,background:S.stone }}>
            {[
              { page:"browse",    num:"01", title:"By Piece",    desc:"Browse the full catalog and build your Suitcase piece by piece.",  cta:"Browse",    bg:"#fff" },
              { page:"wardrobes", num:"02", title:"By Wardrobe", desc:"Pick a curated wardrobe built around a season and a vibe.",         cta:"Wardrobes", bg:S.cream },
              { page:"wardrobes", num:"03", title:"By Style",    desc:"Swipe through aesthetics and we'll match you with the right pieces.",cta:"Find Style",bg:"#fff" },
              { page:"community", num:"04", title:"Community",   desc:"See how real members wear their pieces. Shop directly from fits.",   cta:"Community", bg:S.cream },
            ].map(({page,num,title,desc,cta,bg})=>(
              <div key={num} style={{ background:bg,padding: isMobile ? "20px 16px" : "36px 28px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight: isMobile ? 200 : 320 }}>
                <div>
                  <div style={{ fontFamily:S.serif,fontSize: isMobile ? 32 : 44,color:S.stone,fontWeight:700,lineHeight:1,marginBottom:12 }}>{num}</div>
                  <h3 style={{ fontFamily:S.serif,fontSize: isMobile ? 17 : 22,fontWeight:600,color:S.ink,marginBottom:8 }}>{title}</h3>
                  <p style={{ fontFamily:S.sans,fontSize: isMobile ? 11 : 13,color:S.muted,lineHeight:1.7 }}>{desc}</p>
                </div>
                <button onClick={()=>setPage(page)} style={{ marginTop:16,background:"none",border:`1px solid ${S.ink}`,cursor:"pointer",padding: isMobile ? "10px 0" : "9px 0",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:S.ink,width:"100%",minHeight:42 }}>
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {(newArrivals.length > 0 || !loadingItems) && (
        <section style={{ padding: isMobile ? "40px 16px" : "72px 40px", background:"#fff" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: isMobile ? 24 : 40, flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10 }}>Fresh In</p>
                <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 28 : 44, fontWeight:600, letterSpacing:"-1px", color:S.ink }}>New Arrivals.</h2>
              </div>
              <button onClick={()=>setPage("browse")} style={{ background:"none", border:`1px solid #c9bfb0`, cursor:"pointer", padding:"10px 24px", fontFamily:S.sans, fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#6b5e4e", minHeight:40 }}>
                Shop All
              </button>
            </div>
            {loadingItems ? (
              <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted, fontStyle:"italic" }}>Loading…</p>
            ) : newArrivals.length === 0 ? (
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 22 }}>
                {featured.map(item=><MiniItemCard key={item.id} item={item} setPage={setPage}/>)}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 22 }}>
                {newArrivals.map(item=><NewArrivalCard key={item.id} item={item} setPage={setPage}/>)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Wardrobes */}
      <section style={{ padding: isMobile ? "40px 16px" : "72px 40px", background:S.ink }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: isMobile ? 24 : 40, flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#6b5e4e", marginBottom:10 }}>Curated by Davenport</p>
              <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 28 : 44, fontWeight:600, color:S.cream, letterSpacing:"-1px" }}>Shop by Wardrobe.</h2>
            </div>
            <button onClick={()=>setPage("wardrobes")} style={{ background:"transparent", color:S.cream, border:"1px solid #374151", cursor:"pointer", padding:"10px 24px", fontFamily:S.sans, fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", minHeight:40 }}>
              View All Wardrobes
            </button>
          </div>
          {dbWardrobes.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 14 : 20 }}>
              {dbWardrobes.slice(0,3).map(w => {
                const wPieces = items.filter(i => i.wardrobe_id === w.id);
                return (
                  <WardrobeSlideCard key={w.id} wardrobe={w} pieces={wPieces} itemCount={wPieces.length} isMobile={isMobile} onView={()=>setPage(`wardrobe-db-${w.id}`)}/>
                );
              })}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 14 : 20 }}>
              {WARDROBES.slice(0,3).map(w=>{
                const pieces = w.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
                const monthlySum = pieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
                return <WardrobeCard key={w.id} wardrobe={w} pieces={pieces} monthlySum={monthlySum} setPage={setPage} dark={true}/>;
              })}
            </div>
          )}
        </div>
      </section>

      {/* Quiz CTA */}
      <section style={{ padding:"88px 40px",background:S.ink }}>
        <div style={{ maxWidth:680,margin:"0 auto",textAlign:"center" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#6b5e4e",marginBottom:20 }}>Style Discovery</p>
          <h2 style={{ fontFamily:S.serif,fontSize:"clamp(34px, 5vw, 58px)",fontWeight:600,color:S.cream,letterSpacing:"-1.5px",marginBottom:20 }}>Don't know where to start?</h2>
          <p style={{ fontFamily:S.sans,fontSize:16,color:"#9ca3af",marginBottom:40,lineHeight:1.75 }}>Swipe through styles. We'll build your taste profile and surface the pieces that match how you want to be seen.</p>
          <button onClick={()=>setPage("wardrobes")} style={{ background:S.cream,color:S.ink,border:"none",cursor:"pointer",padding:"16px 44px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Find My Style</button>
        </div>
      </section>

      {/* Community teaser */}
      <section style={{ padding: isMobile ? "40px 16px" : "72px 40px", background:S.cream, borderTop:`1px solid ${S.stone}` }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: isMobile ? 20 : 36, flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10 }}>The Community</p>
              <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 28 : 44, fontWeight:600, color:S.ink, letterSpacing:"-1px" }}>Worn by real people.</h2>
            </div>
            <button onClick={()=>setPage("community")} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"11px 24px", fontFamily:S.sans, fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", minHeight:44 }}>
              Join the Community
            </button>
          </div>
          {recentPosts.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20 }}>
              {recentPosts.map(post => (
                <div key={post.id} onClick={()=>setPage("community")} style={{ cursor:"pointer", background:"#fff", border:`1px solid ${S.stone}` }}>
                  <div style={{ height: isMobile ? 220 : 260, background:"#e8e3dc", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                    {post.image_url
                      ? <img src={post.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : <div style={{ fontSize:44, opacity:0.4 }}>👤</div>
                    }
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)" }}/>
                    <div style={{ position:"absolute", bottom:14, left:14 }}>
                      <p style={{ fontFamily:S.sans, fontSize:12, fontWeight:600, color:"#fff" }}>@{post.user_name || "member"}</p>
                    </div>
                  </div>
                  <div style={{ padding:"14px 16px" }}>
                    <p style={{ fontFamily:S.sans, fontSize:13, color:S.ink, lineHeight:1.65, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{post.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20 }}>
              {POSTS.slice(0,2).map(post => (
                <div key={post.id} onClick={()=>setPage("community")} style={{ cursor:"pointer", background:"#fff", border:`1px solid ${S.stone}` }}>
                  <div style={{ height: isMobile ? 220 : 260, background:post.bg, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:18, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }}/>
                    <div style={{ position:"relative", zIndex:1 }}>
                      <p style={{ fontFamily:S.sans, fontSize:12, fontWeight:600, color:"#fff", marginBottom:2 }}>@{post.user}</p>
                      <p style={{ fontFamily:S.sans, fontSize:10, color:"rgba(255,255,255,0.65)" }}>{post.school}</p>
                    </div>
                  </div>
                  <div style={{ padding:"14px 16px" }}>
                    <p style={{ fontFamily:S.sans, fontSize:13, color:S.ink, lineHeight:1.65, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{post.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sign In CTA */}
      <section style={{ padding:"88px 40px", background:S.ink }}>
        <div style={{ maxWidth:680, margin:"0 auto", textAlign:"center" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#6b5e4e",marginBottom:20 }}>Members</p>
          <h2 style={{ fontFamily:S.serif,fontSize:"clamp(36px,5vw,60px)",fontWeight:600,color:S.cream,letterSpacing:"-1.5px",lineHeight:0.95,marginBottom:20 }}>Ready to upgrade your wardrobe?</h2>
          <p style={{ fontFamily:S.sans,fontSize:15,color:"#6b7280",lineHeight:1.8,maxWidth:440,margin:"0 auto 40px" }}>Create an account to start building your Suitcase and buy pieces directly from the Davenport catalog.</p>
          <SignInButton mode="modal">
            <button style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"16px 44px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>
              Sign In / Create Account
            </button>
          </SignInButton>
        </div>
      </section>

      {/* Sustainability teaser */}
      <section style={{ padding:"88px 40px",background:"#fff",display:"flex",alignItems:"center",gap:72,flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:280 }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:16 }}>Our Mission</p>
          <h2 style={{ fontFamily:S.serif,fontSize:44,fontWeight:600,color:S.ink,letterSpacing:"-1px",marginBottom:16 }}>Fashion has a problem.</h2>
          <p style={{ fontFamily:S.sans,fontSize:16,color:S.muted,lineHeight:1.75,marginBottom:32,maxWidth:420 }}>92 million tons of textile waste enter landfills every year. Davenport exists as the answer wear more, own less, waste nothing.</p>
          <button onClick={()=>setPage("sustainability")} style={{ background:"none",border:`1px solid ${S.ink}`,cursor:"pointer",padding:"12px 28px",fontFamily:S.sans,fontSize:12,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:S.ink }}>Read Our Story</button>
        </div>
        <div style={{ flex:1,minWidth:280,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          {[["92M","Tons of textile waste yearly"],["60%","Clothes worn fewer than 5 times"],["$500B","Lost to underused clothing annually"],["3,000L","Water per pair of jeans"]].map(([stat,label])=>(
            <div key={stat} style={{ background:S.cream,padding:"28px 22px",border:`1px solid ${S.stone}` }}>
              <div style={{ fontFamily:S.serif,fontSize:34,fontWeight:700,color:S.ink,marginBottom:6 }}>{stat}</div>
              <div style={{ fontFamily:S.sans,fontSize:12,color:S.muted,lineHeight:1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── BROWSE ───────────────────────────────────────────────────────────────────
// ─── WARDROBE CARD ────────────────────────────────────────────────────────────
function WardrobeCard({ wardrobe: w, pieces, monthlySum, setPage, onCardClick, dark=false }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setSlideIndex(i => (i + 1) % pieces.length);
        setTransitioning(false);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, [pieces.length]);

  const currentPiece = pieces[slideIndex];
  const bg = dark ? "#111" : "#fff";
  const border = dark ? "#1f2937" : S.stone;
  const nameColor = dark ? S.cream : S.ink;
  const taglineColor = dark ? "#6b7280" : S.muted;
  const countColor = dark ? "#4b5563" : S.tan;
  const priceColor = dark ? S.cream : S.ink;

  return (
    <div
      onClick={() => onCardClick ? onCardClick(w.id) : setPage(`wardrobe-${w.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor:"pointer", background:bg, border:`1px solid ${hovered?(dark?"#4b5563":S.tan):border}`, overflow:"hidden", transition:"border-color 0.25s, transform 0.25s, box-shadow 0.25s", transform:hovered?"translateY(-4px)":"none", boxShadow:hovered?"0 16px 48px rgba(0,0,0,0.12)":"none" }}
    >
      {/* Animated slideshow area */}
      <div style={{ height:220, background:currentPiece?.color || w.color, position:"relative", overflow:"hidden", transition:"background 0.6s ease" }}>
        {/* Sliding piece display */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity: transitioning ? 0 : 1, transform: transitioning ? "scale(0.85) translateY(12px)" : "scale(1) translateY(0)", transition:"opacity 0.3s ease, transform 0.3s ease" }}>
          <div style={{ fontSize:88 }}>{currentPiece?.emoji}</div>
        </div>
        {/* Piece name fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)", padding:"36px 16px 14px" }}>
          <p style={{ fontFamily:S.sans, fontSize:10, color:"rgba(255,255,255,0.7)", letterSpacing:"0.08em", opacity: transitioning?0:1, transition:"opacity 0.3s ease", margin:0 }}>
            {currentPiece?.name}
          </p>
        </div>
        {/* Dot indicators */}
        <div style={{ position:"absolute", top:12, right:12, display:"flex", gap:4 }}>
          {pieces.map((_,i) => (
            <div key={i} onClick={e=>{ e.stopPropagation(); setSlideIndex(i); }} style={{ width: i===slideIndex?16:5, height:5, background: i===slideIndex?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", borderRadius:3, transition:"all 0.3s ease", cursor:"pointer" }}/>
          ))}
        </div>
        {/* Season badge */}
        <div style={{ position:"absolute", top:12, left:12, background:w.accentColor, color:S.ink, fontFamily:S.sans, fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"3px 10px" }}>{w.season}</div>
      </div>
      {/* Info */}
      <div style={{ padding:"20px 22px 24px" }}>
        <p style={{ fontFamily:S.sans, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:countColor, marginBottom:6 }}>{pieces.length} pieces</p>
        <h3 style={{ fontFamily:S.serif, fontSize:24, fontWeight:600, color:nameColor, marginBottom:6 }}>{w.name}</h3>
        <p style={{ fontFamily:S.sans, fontSize:12, color:taglineColor, lineHeight:1.65, marginBottom:16 }}>{w.tagline}</p>
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontFamily:S.serif, fontSize:24, fontWeight:700, color:priceColor }}>${(Math.round(monthlySum*100)/100).toFixed(2)}</span>
          <span style={{ fontFamily:S.sans, fontSize:10, color:taglineColor }}>/mo</span>
        </div>
      </div>
    </div>
  );
}

// ─── DB WARDROBE CARD (SLIDESHOW) ────────────────────────────────────────────
function WardrobeSlideCard({ wardrobe, pieces, itemCount, isMobile, onView }) {
  const [hov, setHov] = useState(false);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const photos = pieces.filter(p => p.image_url);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % photos.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(t);
  }, [photos.length]);

  const currentPhoto = photos[idx];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:"#fff", border:`1px solid ${hov ? S.tan : S.stone}`, overflow:"hidden", transition:"border-color 0.2s, transform 0.2s, box-shadow 0.2s", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? "0 12px 32px rgba(0,0,0,0.07)" : "none" }}
    >
      <div style={{ position:"relative", width:"100%", height:240, overflow:"hidden", background:S.stone }}>
        {photos.length === 0 ? (
          <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
            <span style={{ fontSize:36 }}>🗂️</span>
            <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:S.muted }}>Coming Soon</p>
          </div>
        ) : (
          <img
            key={currentPhoto.id}
            src={currentPhoto.image_url}
            alt={currentPhoto.name}
            style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", opacity: fade ? 1 : 0, transition:"opacity 0.3s ease" }}
          />
        )}
        {photos.length > 1 && (
          <div style={{ position:"absolute", bottom:10, left:0, right:0, display:"flex", justifyContent:"center", gap:5 }}>
            {photos.map((_, i) => (
              <div key={i} style={{ width: i === idx ? 18 : 6, height:6, borderRadius:3, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", transition:"width 0.3s, background 0.3s" }}/>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: isMobile ? "20px" : "22px 26px 24px" }}>
        <p style={{ fontFamily:S.sans, fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:S.tan, marginBottom:8 }}>
          {itemCount} piece{itemCount !== 1 ? "s" : ""}
        </p>
        <h3 style={{ fontFamily:S.serif, fontSize: isMobile ? 22 : 24, fontWeight:600, color:S.ink, marginBottom: wardrobe.description ? 8 : 16 }}>{wardrobe.name}</h3>
        {wardrobe.description && (
          <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, lineHeight:1.65, marginBottom:16 }}>{wardrobe.description}</p>
        )}
        <button
          onClick={onView}
          style={{ background:S.ink, color:"#fff", border:"none", padding:"10px 20px", fontFamily:S.sans, fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}
        >
          View Wardrobe
        </button>
      </div>
    </div>
  );
}

// ─── DB WARDROBE DETAIL PAGE ──────────────────────────────────────────────────
function DbWardrobeDetailPage({ wardrobeId, setPage, addToSuitcase, suitcase, items }) {
  const isMobile = useMobile();
  const [wardrobe, setWardrobe] = useState(null);
  const [catFilter, setCatFilter] = useState(null);

  useEffect(() => {
    fetch("/api/wardrobes")
      .then(r => r.json())
      .then(d => {
        const found = (Array.isArray(d) ? d : []).find(w => w.id === wardrobeId);
        setWardrobe(found ?? null);
      })
      .catch(() => {});
  }, [wardrobeId]);

  const pieces = items.filter(i => i.wardrobe_id === wardrobeId);
  const filtered = catFilter ? pieces.filter(i => i.category === catFilter) : pieces;
  const activeCats = [...new Set(pieces.map(i => i.category).filter(Boolean))];

  if (!wardrobe) {
    return (
      <div style={{ paddingTop:60, minHeight:"100vh", background:S.cream, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop:60, minHeight:"100vh", background:S.cream }}>
      <div style={{ background:"#fff", borderBottom:`1px solid ${S.stone}`, padding: isMobile ? "28px 20px 24px" : "52px 40px 36px" }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <button onClick={()=>setPage("wardrobes")} style={{ fontFamily:S.sans, fontSize:12, color:S.muted, background:"none", border:"none", cursor:"pointer", marginBottom:16, padding:0, letterSpacing:"0.04em" }}>
            ← All Wardrobes
          </button>
          <h1 style={{ fontFamily:S.serif, fontSize: isMobile ? 36 : 52, fontWeight:600, letterSpacing:"-1.5px", color:S.ink, marginBottom:10 }}>{wardrobe.name}</h1>
          {wardrobe.description && (
            <p style={{ fontFamily:S.sans, fontSize: isMobile ? 14 : 16, color:S.muted, maxWidth:520 }}>{wardrobe.description}</p>
          )}
          <p style={{ fontFamily:S.sans, fontSize:12, color:S.tan, marginTop:12 }}>{pieces.length} piece{pieces.length !== 1 ? "s" : ""}</p>
          {activeCats.length > 1 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:18 }}>
              {[null, ...CATEGORIES.filter(c => activeCats.includes(c))].map(c => (
                <button key={c ?? "all"} onClick={() => setCatFilter(catFilter === c ? null : c)}
                  style={{ background: catFilter === c ? S.ink : "#fff", color: catFilter === c ? S.cream : S.muted, border:`1px solid ${catFilter === c ? S.ink : S.stone}`, padding: isMobile ? "8px 12px" : "6px 14px", fontFamily:S.sans, fontSize:11, fontWeight:500, letterSpacing:"0.06em", cursor:"pointer", textTransform:"uppercase", minHeight:36 }}>
                  {c ?? "All"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:1080, margin:"0 auto", padding: isMobile ? "20px 12px 60px" : "36px 40px 80px" }}>
        {pieces.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <p style={{ fontFamily:S.serif, fontSize:32, fontWeight:300, color:S.tan, fontStyle:"italic", marginBottom:12 }}>No pieces yet.</p>
            <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted }}>Items added to this wardrobe in admin will appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted }}>No {catFilter} items in this wardrobe.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(228px,1fr))", gap: isMobile ? 10 : 22 }}>
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} setPage={setPage} addToSuitcase={addToSuitcase} inSuitcase={suitcase.some(s=>s.id===item.id)} isMobile={isMobile}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WARDROBES PAGE ───────────────────────────────────────────────────────────

const QUIZ_STEPS = [
  { key:"occasion", label:"What's your main occasion?",       options:["Campus","Going Out","Internship","Weekend","Travel"] },
  { key:"style",    label:"What style speaks to you?",        options:["Preppy","Minimal","Business","Streetwear","Classic"] },
  { key:"season",   label:"What season are you shopping for?",options:["Fall/Winter","Spring/Summer","All Season"] },
  { key:"budget",   label:"Monthly budget?",                  options:["Under $25","$25–$50","$50–$100","$100+"] },
  { key:"frequency",label:"How often do you want to refresh?",options:["Monthly","Every 2–3 months","Seasonally"] },
];

function StyleQuiz({ onComplete }) {
  const isMobile = useMobile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [animating, setAnimating] = useState(false);

  function pick(value) {
    if (animating) return;
    const q = QUIZ_STEPS[step];
    const newAnswers = { ...answers, [q.key]: value };
    if (step + 1 >= QUIZ_STEPS.length) {
      onComplete(newAnswers);
    } else {
      setAnimating(true);
      setAnswers(newAnswers);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 240);
    }
  }

  const q = QUIZ_STEPS[step];

  return (
    <section style={{ background:S.ink, padding: isMobile ? "52px 20px 64px" : "80px 40px" }}>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#6b5e4e", marginBottom:12 }}>Style Discovery</p>
        <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 32 : 40, fontWeight:600, color:S.cream, letterSpacing:"-1px", marginBottom:8 }}>Find My Style</h2>
        {/* Progress */}
        <div style={{ display:"flex", gap:4, marginBottom:36, marginTop:4 }}>
          {QUIZ_STEPS.map((_, i) => (
            <div key={i} style={{ flex:1, height:3, background: i <= step ? S.gold : "#1f2937", borderRadius:2, transition:"background 0.3s" }}/>
          ))}
        </div>
        {/* Question */}
        <div style={{ opacity: animating ? 0 : 1, transition:"opacity 0.24s", marginBottom:28 }}>
          <p style={{ fontFamily:S.sans, fontSize: isMobile ? 14 : 15, color:"#9ca3af", marginBottom:20 }}>{q.label}</p>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
            {q.options.map(opt => (
              <button key={opt} onClick={() => pick(opt)}
                style={{ background: answers[q.key] === opt ? S.gold : "#111827", color: answers[q.key] === opt ? S.ink : S.cream, border:`1px solid ${answers[q.key] === opt ? S.gold : "#374151"}`, padding:"14px 10px", fontFamily:S.sans, fontSize:13, fontWeight:500, cursor:"pointer", letterSpacing:"0.02em", transition:"all 0.15s", textAlign:"center", minHeight:52 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontFamily:S.sans, fontSize:11, color:"#4b5563", textAlign:"center" }}>{step + 1} of {QUIZ_STEPS.length}</p>
      </div>
    </section>
  );
}

function WardrobesPage({ setPage, addToSuitcase, suitcase, items=[] }) {
  const isMobile = useMobile();
  const [quizDone, setQuizDone] = useState(false);
  const [styleProfile, setStyleProfile] = useState(null);
  const [dbWardrobes, setDbWardrobes] = useState([]);
  const [loadingWardrobes, setLoadingWardrobes] = useState(true);
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    fetch("/api/wardrobes").then(r=>r.json()).then(d=>{
      setDbWardrobes(Array.isArray(d)?d:[]);
      setLoadingWardrobes(false);
    }).catch(()=>{ setLoadingWardrobes(false); });
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    fetch("/api/style-profile").then(r=>r.json()).then(d=>{
      if (d.style_profile) { setStyleProfile(d.style_profile); setQuizDone(true); }
    }).catch(()=>{});
  }, [isSignedIn, user?.id]);

  function handleDbWardrobeClick(wardrobeId) {
    if (isSignedIn) setPage(`wardrobe-db-${wardrobeId}`);
    else openSignIn();
  }

  async function handleQuizComplete(answers) {
    setStyleProfile(answers);
    setQuizDone(true);
    if (isSignedIn) {
      try { await fetch("/api/style-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ style_profile: answers }) }); }
      catch {}
    }
  }

  // Personalized items/wardrobes based on style profile
  const recommended = styleProfile ? items.filter(i =>
    (!styleProfile.occasion || i.occasion === styleProfile.occasion) &&
    (!styleProfile.style    || i.style    === styleProfile.style)
  ).slice(0, 8) : [];

  return (
    <div style={{ paddingTop:60, minHeight:"100vh", background:S.cream }}>
      <div style={{ padding: isMobile ? "28px 16px 20px" : "52px 40px 36px", background:"#fff", borderBottom:`1px solid ${S.stone}` }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10 }}>Curated by Davenport</p>
          <h1 style={{ fontFamily:S.serif, fontSize: isMobile ? 36 : 48, fontWeight:600, letterSpacing:"-1.5px", color:S.ink, marginBottom:14 }}>Wardrobes.</h1>
          {!isMobile && <p style={{ fontFamily:S.sans, fontSize:16, color:S.muted, maxWidth:520 }}>Each wardrobe is a full collection built around a vibe. Browse the pieces and pick what you want.</p>}
        </div>
      </div>

      <div style={{ maxWidth:1080, margin:"0 auto", padding: isMobile ? "20px 16px 40px" : "40px 40px 80px" }}>
        {loadingWardrobes ? (
          <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted, fontStyle:"italic" }}>Loading wardrobes…</p>
        ) : dbWardrobes.length === 0 ? (
          <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted, fontStyle:"italic" }}>No wardrobes yet.</p>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(340px,1fr))", gap: isMobile ? 16 : 28 }}>
            {dbWardrobes.map(w => {
              const allPieces = items.filter(i => i.wardrobe_id === w.id);
              return (
                <WardrobeSlideCard key={w.id} wardrobe={w} pieces={allPieces} itemCount={allPieces.length} isMobile={isMobile} onView={()=>handleDbWardrobeClick(w.id)}/>
              );
            })}
          </div>
        )}
      </div>

      {/* Style Quiz / Results */}
      {!quizDone ? (
        <StyleQuiz onComplete={handleQuizComplete}/>
      ) : (
        <section style={{ background:S.cream, borderTop:`1px solid ${S.stone}`, padding: isMobile ? "40px 16px 60px" : "72px 40px 80px" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {/* Style profile tags */}
            {styleProfile && (
              <div style={{ marginBottom:40 }}>
                <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:12 }}>Your Style</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                  {Object.entries(styleProfile).map(([k, v]) => (
                    <span key={k} style={{ fontFamily:S.sans, fontSize:12, fontWeight:500, background:"#fff", border:`1px solid ${S.stone}`, color:S.ink, padding:"6px 14px", letterSpacing:"0.04em" }}>{v}</span>
                  ))}
                </div>
                <button onClick={()=>{ setQuizDone(false); setStyleProfile(null); }} style={{ fontFamily:S.sans, fontSize:11, color:S.muted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Retake quiz
                </button>
              </div>
            )}
            <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:12 }}>Your Style Matches</p>
            <h2 style={{ fontFamily:S.serif, fontSize: isMobile ? 28 : 44, fontWeight:600, color:S.ink, letterSpacing:"-1px", marginBottom:36 }}>We know your vibe.</h2>
            {recommended.length > 0 ? (
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(228px,1fr))", gap: isMobile ? 10 : 22 }}>
                {recommended.map(item=>(
                  <ItemCard key={item.id} item={item} setPage={setPage} addToSuitcase={addToSuitcase} inSuitcase={suitcase.some(s=>s.id===item.id)} isMobile={isMobile}/>
                ))}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:24 }}>
                {WARDROBES.slice(0,3).map(w=>{
                  const pieces=w.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
                  const monthlySum=pieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
                  return <WardrobeCard key={w.id} wardrobe={w} pieces={pieces} monthlySum={monthlySum} setPage={setPage} onCardClick={(id)=>{ if(isSignedIn) setPage(`wardrobe-${id}`); else openSignIn(); }}/>;
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── WARDROBE DETAIL PAGE ─────────────────────────────────────────────────────
function WardrobeDetailPage({ wardrobeId, setPage, addToSuitcase, suitcase }) {
  const wardrobe = WARDROBES.find(w=>w.id===wardrobeId);
  const [view, setView] = useState("wardrobe"); // "wardrobe" | "pieces"
  if(!wardrobe) return <div style={{ padding:"120px 40px" }}><h2>Wardrobe not found</h2></div>;

  const pieces = wardrobe.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
  const monthlySum = pieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
  const allInSuitcase = pieces.every(p=>suitcase.some(s=>s.id===p.id));

  // Related wardrobes
  const related = WARDROBES.filter(w=>w.id!==wardrobe.id).slice(0,2);

  return (
    <div style={{ paddingTop:60,background:S.cream,minHeight:"100vh" }}>
      {/* Hero */}
      <div style={{ background:wardrobe.color,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.55) 0%,transparent 60%)" }}/>
        <div style={{ maxWidth:1080,margin:"0 auto",padding:"72px 40px",position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center" }}>
          <div>
            <button onClick={()=>setPage("wardrobes")} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)",marginBottom:28,padding:0 }}>← All Wardrobes</button>
            <div style={{ display:"flex",gap:8,marginBottom:18 }}>
              <span style={{ background:wardrobe.accentColor,color:S.ink,fontFamily:S.sans,fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px" }}>{wardrobe.season}</span>
              <span style={{ background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",fontFamily:S.sans,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px" }}>{pieces.length} pieces</span>
            </div>
            <h1 style={{ fontFamily:S.serif,fontSize:"clamp(44px,6vw,72px)",fontWeight:600,color:"#fff",letterSpacing:"-2px",lineHeight:0.95,marginBottom:18 }}>{wardrobe.name}</h1>
            <p style={{ fontFamily:S.sans,fontSize:16,color:"rgba(255,255,255,0.65)",lineHeight:1.75,maxWidth:400,marginBottom:32 }}>{wardrobe.description}</p>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <button onClick={()=>{ pieces.forEach(p=>addToSuitcase(p)); }} style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"14px 32px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>
                {allInSuitcase ? "✓ All in Suitcase" : `Add Full Wardrobe $${(Math.round(monthlySum*100)/100).toFixed(2)}/mo`}
              </button>
              <button onClick={()=>setView(v=>v==="pieces"?"wardrobe":"pieces")} style={{ background:"transparent",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",padding:"14px 32px",fontFamily:S.sans,fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>
                Browse Pieces
              </button>
            </div>
          </div>
          {/* Piece grid */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
            {pieces.slice(0,6).map(p=>(
              <div key={p.id} style={{ background:p.color,aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,border:"1px solid rgba(255,255,255,0.08)" }}>{p.emoji}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing bar */}
      <div style={{ background:"#fff",borderBottom:`1px solid ${S.stone}`,padding:"20px 40px" }}>
        <div style={{ maxWidth:1080,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16 }}>
          <div style={{ display:"flex",gap:40,alignItems:"center" }}>
            <div>
              <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:3 }}>{pieces.length} Pieces</p>
              <span style={{ fontFamily:S.serif,fontSize:28,fontWeight:700,color:S.ink }}>${(Math.round(monthlySum*100)/100).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:11,color:S.muted }}>/mo</span></span>
            </div>
            <div style={{ width:1,height:40,background:S.stone }}/>
            <div>
              <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:3 }}>Season</p>
              <span style={{ fontFamily:S.sans,fontSize:14,fontWeight:600,color:S.ink }}>{wardrobe.season}</span>
            </div>
            <div style={{ width:1,height:40,background:S.stone }}/>
            <div>
              <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:3 }}>Style</p>
              <span style={{ fontFamily:S.sans,fontSize:14,fontWeight:600,color:S.ink }}>{wardrobe.style}</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setView("wardrobe")} style={{ background:view==="wardrobe"?S.ink:"#fff",color:view==="wardrobe"?S.cream:S.muted,border:`1px solid ${view==="wardrobe"?S.ink:S.stone}`,cursor:"pointer",padding:"8px 18px",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>Wardrobe View</button>
            <button onClick={()=>setView("pieces")} style={{ background:view==="pieces"?S.ink:"#fff",color:view==="pieces"?S.cream:S.muted,border:`1px solid ${view==="pieces"?S.ink:S.stone}`,cursor:"pointer",padding:"8px 18px",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>Browse Pieces</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1080,margin:"0 auto",padding:"48px 40px 80px" }}>
        {view==="wardrobe" ? (
          // Wardrobe view — outfit-style layout showing all pieces together
          <div>
            <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:S.tan,marginBottom:28 }}>What's in this wardrobe</p>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:48 }}>
              {pieces.map(p=>{
                const inSuitcase=suitcase.some(s=>s.id===p.id);
                return (
                  <div key={p.id} style={{ background:"#fff",border:`1px solid ${S.stone}` }}>
                    <div onClick={()=>setPage(`item-${p.id}`)} style={{ cursor:"pointer",height:130,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36 }}>{p.emoji}</div>
                    <div style={{ padding:"12px 14px" }}>
                      <p style={{ fontFamily:S.sans,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:3 }}>{p.brand}</p>
                      <p style={{ fontFamily:S.serif,fontSize:15,fontWeight:600,color:S.ink,marginBottom:6,lineHeight:1.2 }}>{p.name}</p>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <span style={{ fontFamily:S.serif,fontSize:17,fontWeight:700,color:S.ink }}>${getMonthlyPrice(p).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:9,color:S.muted }}>/mo</span></span>
                        <button onClick={()=>addToSuitcase(p)} style={{ background:inSuitcase?"#f0ede8":S.ink,color:inSuitcase?"#6b5e4e":S.cream,border:"none",cursor:inSuitcase?"default":"pointer",padding:"4px 10px",fontFamily:S.sans,fontSize:9,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>
                          {inSuitcase?"✓":"+ Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:S.ink,padding:"32px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20 }}>
              <div>
                <p style={{ fontFamily:S.sans,fontSize:11,color:"#6b7280",marginBottom:4 }}>Take the whole wardrobe</p>
                <span style={{ fontFamily:S.serif,fontSize:32,fontWeight:700,color:S.cream }}>${(Math.round(monthlySum*100)/100).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:12,color:"#6b7280" }}>/mo</span></span>
              </div>
              <button onClick={()=>pieces.forEach(p=>addToSuitcase(p))} style={{ background:S.gold,color:S.ink,border:"none",cursor:"pointer",padding:"14px 36px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>
                {allInSuitcase ? "✓ All in Suitcase" : "Add Full Wardrobe"}
              </button>
            </div>
          </div>
        ) : (
          // Piece-by-piece browse view
          <div>
            <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:S.tan,marginBottom:28 }}>Pick what you want</p>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:22 }}>
              {pieces.map(p=>(
                <ItemCard key={p.id} item={p} setPage={setPage} addToSuitcase={addToSuitcase} inSuitcase={suitcase.some(s=>s.id===p.id)} onBuy={()=>{}}/>
              ))}
            </div>
          </div>
        )}

        {/* Related wardrobes */}
        {related.length>0&&(
          <div style={{ marginTop:72 }}>
            <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:S.tan,marginBottom:12 }}>More Wardrobes</p>
            <h2 style={{ fontFamily:S.serif,fontSize:34,fontWeight:600,color:S.ink,marginBottom:32 }}>You might also like.</h2>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
              {related.map(w=>{
                const wPieces=w.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
                const wSum=wPieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
                return (
                  <div key={w.id} onClick={()=>setPage(`wardrobe-${w.id}`)} style={{ cursor:"pointer",background:"#fff",border:`1px solid ${S.stone}`,display:"flex",gap:0,overflow:"hidden" }}>
                    <div style={{ width:120,background:w.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0 }}>
                      {wPieces[0]?.emoji}
                    </div>
                    <div style={{ padding:"20px 20px" }}>
                      <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:6 }}>{w.season}</p>
                      <h3 style={{ fontFamily:S.serif,fontSize:22,fontWeight:600,color:S.ink,marginBottom:6 }}>{w.name}</h3>
                      <p style={{ fontFamily:S.sans,fontSize:12,color:S.muted,marginBottom:10 }}>{w.tagline}</p>
                      <span style={{ fontFamily:S.serif,fontSize:18,fontWeight:700,color:S.ink }}>${(Math.round(wSum*100)/100).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:10,color:S.muted }}>/mo</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthGate() {
  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center",maxWidth:420,padding:"0 24px" }}>
        <p style={{ fontFamily:S.serif,fontSize:32,fontWeight:600,letterSpacing:"0.02em",color:S.ink,marginBottom:24 }}>Davenport</p>
        <h2 style={{ fontFamily:S.serif,fontSize:44,fontWeight:600,letterSpacing:"-1px",color:S.ink,marginBottom:16 }}>Members Only</h2>
        <p style={{ fontFamily:S.sans,fontSize:15,color:S.muted,lineHeight:1.75,marginBottom:36 }}>Sign in to browse the collection.</p>
        <SignInButton mode="modal">
          <button style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"14px 40px",fontFamily:S.sans,fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" }}>
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

function BrowsePage({ setPage, addToSuitcase, suitcase, items, onBuy, loading, initialWardrobe=null, initialShopNew=false }) {
  const isMobile = useMobile();
  const { isSignedIn, isLoaded } = useUser();
  const [filters,setFilters]=useState({ occasion:"All",style:"All",season:"All",category:"All" });
  const [newOnly,setNewOnly]=useState(false);
  const [shopNew,setShopNew]=useState(initialShopNew);
  const [sort,setSort]=useState("price-asc");
  const [wardrobeFilter,setWardrobeFilter]=useState(initialWardrobe);
  const [dbWardrobes,setDbWardrobes]=useState([]);

  useEffect(()=>{
    fetch("/api/wardrobes").then(r=>r.json()).then(d=>setDbWardrobes(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <AuthGate />;

  const condOrder = ["Like New","Good","Fair"];
  const occasions  = ["All",...new Set(items.map(i=>i.occasion).filter(Boolean))];
  const styles     = ["All",...new Set(items.map(i=>i.style).filter(Boolean))];
  const seasons    = ["All",...new Set(items.map(i=>i.season).filter(Boolean))];
  const categories = ["All",...new Set(items.map(i=>i.category).filter(Boolean))];

  const filtered = items
    .filter(i=>wardrobeFilter===null||i.wardrobe_id===wardrobeFilter)
    .filter(i=>!newOnly||i.condition==="Like New")
    .filter(i=>!shopNew||i.wears==="0-10 wears")
    .filter(i=>filters.occasion==="All"||!i.occasion||i.occasion===filters.occasion)
    .filter(i=>filters.style==="All"||!i.style||i.style===filters.style)
    .filter(i=>filters.season==="All"||!i.season||i.season===filters.season)
    .filter(i=>filters.category==="All"||!i.category||i.category===filters.category)
    .sort((a,b)=>sort==="price-asc"?getMonthlyPrice(a)-getMonthlyPrice(b):sort==="price-desc"?getMonthlyPrice(b)-getMonthlyPrice(a):condOrder.indexOf(a.condition)-condOrder.indexOf(b.condition));

  const pill=(value,active,onClick)=>(
    <button key={value} onClick={onClick} style={{ background:active?S.ink:"#fff",color:active?S.cream:S.muted,border:`1px solid ${active?S.ink:S.stone}`,padding: isMobile ? "8px 12px" : "6px 14px",fontFamily:S.sans,fontSize:11,fontWeight:500,letterSpacing:"0.06em",cursor:"pointer",textTransform:"uppercase",transition:"all 0.15s",flexShrink:0,minHeight:36 }}>
      {value}
    </button>
  );

  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream }}>
      <div style={{ padding: isMobile ? "28px 16px 20px" : "52px 40px 36px",background:"#fff",borderBottom:`1px solid ${S.stone}` }}>
        <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:8 }}>The Catalog</p>
        <h1 style={{ fontFamily:S.serif,fontSize: isMobile ? 32 : 48,fontWeight:600,letterSpacing:"-1.5px",color:S.ink,marginBottom: isMobile ? 16 : 24 }}>Every piece. Your price.</h1>

        {/* Wardrobe filter */}
        {dbWardrobes.length > 0 && (
          <div style={{ marginBottom: isMobile ? 14 : 20 }}>
            {!isMobile && <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:8 }}>Wardrobe</p>}
            <div style={{ display:"flex",gap:6,overflowX:"auto",flexWrap: isMobile ? "nowrap" : "wrap",paddingBottom: isMobile ? 4 : 0 }}>
              {pill("All Wardrobes", wardrobeFilter===null, ()=>setWardrobeFilter(null))}
              {dbWardrobes.map(w=>pill(w.name, wardrobeFilter===w.id, ()=>setWardrobeFilter(w.id)))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:16,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
          <button onClick={()=>setNewOnly(n=>!n)} style={{ background:newOnly?S.ink:"#fff",color:newOnly?S.cream:S.ink,border:`1px solid ${newOnly?S.ink:S.stone}`,padding:"8px 16px",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.08em",cursor:"pointer",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,minHeight:40 }}>
            {newOnly&&<span style={{ fontSize:10 }}>✓</span>}Shop Brand New
          </button>
          <button onClick={()=>setShopNew(n=>!n)} style={{ background:shopNew?S.tan:"#fff",color:shopNew?S.cream:S.ink,border:`1px solid ${shopNew?S.tan:S.stone}`,padding:"8px 16px",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.08em",cursor:"pointer",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,minHeight:40 }}>
            {shopNew&&<span style={{ fontSize:10 }}>✓</span>}Shop New (0–10 Wears)
          </button>
        </div>

        {/* Filters */}
        {isMobile ? (
          /* Mobile: horizontal scrolling filter rows */
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[["Category",categories,"category"],["Occasion",occasions,"occasion"]].map(([label,opts,key])=>(
              <div key={key}>
                <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:6 }}>{label}</p>
                <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4 }}>
                  {opts.map(o=>pill(o,filters[key]===o,()=>setFilters(f=>({...f,[key]:o}))))}
                </div>
              </div>
            ))}
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{ fontFamily:S.sans,fontSize:12,border:`1px solid ${S.stone}`,padding:"8px 12px",background:"#fff",cursor:"pointer",color:S.ink,flex:1,minHeight:40 }}>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="condition">Condition: Best First</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
            {[["Occasion",occasions,"occasion"],["Style",styles,"style"],["Season",seasons,"season"],["Category",categories,"category"]].map(([label,opts,key])=>(
              <div key={key} style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                <span style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,width:68,flexShrink:0 }}>{label}</span>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {opts.map(o=>pill(o,filters[key]===o,()=>setFilters(f=>({...f,[key]:o}))))}
                </div>
              </div>
            ))}
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,width:68,flexShrink:0 }}>Sort</span>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{ fontFamily:S.sans,fontSize:12,border:`1px solid ${S.stone}`,padding:"6px 12px",background:"#fff",cursor:"pointer",color:S.ink }}>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="condition">Condition: Best First</option>
              </select>
            </div>
          </div>
        )}
        <p style={{ fontFamily:S.sans,fontSize:12,color:S.muted,marginTop:14 }}>{filtered.length} piece{filtered.length!==1?"s":""} found</p>
      </div>

      {loading ? (
        <div style={{ padding:"88px 40px",textAlign:"center" }}>
          <p style={{ fontFamily:S.sans,fontSize:14,color:S.muted }}>Loading catalog...</p>
        </div>
      ) : items.length===0 ? (
        <div style={{ padding:"88px 40px",textAlign:"center" }}>
          <p style={{ fontFamily:S.serif,fontSize:42,fontWeight:300,color:S.tan,fontStyle:"italic",marginBottom:16 }}>Coming soon.</p>
          <p style={{ fontFamily:S.sans,fontSize:14,color:S.muted,maxWidth:360,margin:"0 auto" }}>The catalog is being assembled. Check back soon.</p>
        </div>
      ) : (
        <div style={{ padding: isMobile ? "16px 12px" : "36px 40px",display:"grid",gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(228px,1fr))",gap: isMobile ? 10 : 22 }}>
          {filtered.length===0 ? (
            <p style={{ gridColumn:"1/-1",fontFamily:S.sans,fontSize:14,color:S.muted,padding:"40px 0",textAlign:"center" }}>No items match the current filters.</p>
          ) : filtered.map(item=>(
            <ItemCard key={item.id} item={item} setPage={setPage} addToSuitcase={addToSuitcase} inSuitcase={suitcase.some(s=>s.id===item.id)} onBuy={onBuy} isMobile={isMobile}/>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, setPage, addToSuitcase, inSuitcase, onBuy, isMobile=false }) {
  const [hov,setHov]=useState(false);
  const [imgErr,setImgErr]=useState(false);
  const showImg = item.image_url && !imgErr;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#fff",border:`1px solid ${S.stone}`,transition:"transform 0.2s,box-shadow 0.2s",transform:hov&&!isMobile?"translateY(-4px)":"none",boxShadow:hov&&!isMobile?"0 16px 40px rgba(0,0,0,0.09)":"none" }}>
      <div onClick={()=>setPage(`item-${item.id}`)} style={{ cursor:"pointer" }}>
        <div style={{ position:"relative", width:"100%", height: isMobile ? "auto" : 160, aspectRatio: isMobile ? "1" : "auto", background: showImg ? "#f5f3f0" : item._dbId != null ? "#e8e3dc" : item.color, overflow:"hidden" }}>
          {showImg ? (
            <img src={item.image_url} alt={item.name} onError={()=>setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}/>
          ) : item._dbId != null ? null : (
            <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isMobile ? 44 : 40 }}>
              {item.emoji}
            </div>
          )}
          {item.wears && (
            <div style={{ position:"absolute", top:7, left:7, background:"rgba(10,10,10,0.72)", color:"#fff", fontFamily:S.sans, fontSize:9, fontWeight:600, letterSpacing:"0.06em", padding:"3px 8px", backdropFilter:"blur(4px)" }}>
              {wearsLabel(item.wears)}
            </div>
          )}
        </div>
        <div style={{ padding: isMobile ? "10px 10px 8px" : "13px 14px 8px" }}>
          <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:2 }}>{item.brand}</p>
          <h3 style={{ fontFamily:S.serif,fontSize: isMobile ? 13 : 15,fontWeight:600,color:S.ink,marginBottom: isMobile ? 4 : 5,lineHeight:1.2 }}>{item.name}</h3>
          <div>
            <span style={{ fontFamily:S.serif,fontSize: isMobile ? 17 : 20,fontWeight:700,color:S.ink }}>${getMonthlyPrice(item).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:9,color:S.muted }}>/mo</span></span>
            {!isMobile && <p style={{ fontFamily:S.sans,fontSize:9,color:S.muted,marginTop:3 }}>Buy outright: ${getBuyPrice(item)}</p>}
          </div>
        </div>
      </div>
      <div style={{ padding: isMobile ? "0 10px 10px" : "0 16px 16px" }}>
        <button onClick={()=>addToSuitcase(item)} style={{ width:"100%",background:inSuitcase?"#f0ede8":S.ink,color:inSuitcase?"#6b5e4e":S.cream,border:"none",cursor:inSuitcase?"default":"pointer",padding: isMobile ? "12px 6px" : "10px",fontFamily:S.sans,fontSize: isMobile ? 10 : 11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom: isMobile ? 4 : 6,minHeight:42 }}>
          {inSuitcase?"✓ Added":"+ Add"}
        </button>
        {!isMobile && (
          <button onClick={()=>item._dbId ? onBuy(item) : setPage(`item-${item.id}`)} style={{ width:"100%",background:"transparent",color:item._dbId?S.ink:S.muted,border:`1px solid ${item._dbId?S.ink:S.stone}`,cursor:"pointer",padding:"7px",fontFamily:S.sans,fontSize:10,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase" }}>
            Buy Outright ${getBuyPrice(item)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ITEM DETAIL ──────────────────────────────────────────────────────────────
function ItemDetailPage({ itemId, setPage, addToSuitcase, suitcase, items, onBuy, rentals=[] }) {
  const item=items.find(i=>i.id===itemId);
  const [inSuitcase,setInSuitcase]=useState(suitcase.some(s=>s.id===itemId));
  const [imgErr,setImgErr]=useState(false);
  const [buyingOut,setBuyingOut]=useState(false);
  const [buyOutMsg,setBuyOutMsg]=useState("");
  if(!item) return <div style={{ padding:"120px 40px" }}><h2>Item not found</h2></div>;

  const monthlyPrice=getMonthlyPrice(item);
  const buyPrice=getBuyPrice(item);
  const rental = item._dbId ? rentals.find(r => r.inventory_id === item._dbId) : null;

  async function handleBuyOutrightDetail() {
    if (!rental || buyingOut) return;
    setBuyingOut(true); setBuyOutMsg("");
    try {
      const res = await fetch("/api/buy-outright", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ orderId: rental.id }) });
      const d = await res.json();
      if (d.url) { window.location.href = d.url; return; }
      setBuyOutMsg(d.message ?? d.error ?? "Something went wrong.");
    } catch { setBuyOutMsg("Something went wrong."); }
    setBuyingOut(false);
  }
  const related=items.filter(i=>i.id!==item.id&&(i.style===item.style||i.occasion===item.occasion)).slice(0,3);

  return (
    <div style={{ paddingTop:60,background:S.cream,minHeight:"100vh" }}>
      <div style={{ maxWidth:1020,margin:"0 auto",padding:"52px 40px" }}>
        <button onClick={()=>setPage("browse")} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:S.tan,marginBottom:36 }}>← Back to Catalog</button>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:60 }}>
          <div style={{ position:"relative", height:420, background: (item.image_url && !imgErr) ? "#f5f3f0" : item._dbId != null ? "#e8e3dc" : item.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {item.image_url && !imgErr ? (
              <img src={item.image_url} alt={item.name} onError={()=>setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}/>
            ) : item._dbId == null ? (
              <div style={{ fontSize:110 }}>{item.emoji}</div>
            ) : null}
            {item.wears && (
              <div style={{ position:"absolute", top:12, left:12, background:"rgba(10,10,10,0.75)", color:"#fff", fontFamily:S.sans, fontSize:11, fontWeight:600, letterSpacing:"0.08em", padding:"5px 12px" }}>
                {wearsLabel(item.wears)}
              </div>
            )}
          </div>
          <div>
            <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:S.tan,marginBottom:10 }}>{item.brand} · {item.category} · {item.occasion}</p>
            <h1 style={{ fontFamily:S.serif,fontSize:42,fontWeight:600,letterSpacing:"-1px",color:S.ink,marginBottom:14 }}>{item.name}</h1>
            <p style={{ fontFamily:S.sans,fontSize:15,color:S.muted,lineHeight:1.8,marginBottom:36 }}>{item.description}</p>
            <div style={{ marginBottom:32 }}>
              <div style={{ padding:"20px 22px",background:S.ink,marginBottom:10 }}>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#9ca3af",marginBottom:6 }}>Monthly rental</p>
                <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
                  <span style={{ fontFamily:S.serif,fontSize:38,fontWeight:700,color:S.cream }}>${monthlyPrice.toFixed(2)}</span>
                  <span style={{ fontFamily:S.sans,fontSize:12,color:"#9ca3af" }}>/mo</span>
                </div>
              </div>
              <div style={{ padding:"16px 22px",background:"#fff",border:`1px solid ${S.stone}` }}>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:4 }}>Buy outright</p>
                <span style={{ fontFamily:S.serif,fontSize:24,fontWeight:600,color:S.ink }}>${buyPrice}</span>
              </div>
              <p style={{ fontFamily:S.sans,fontSize:11,color:S.muted,marginTop:10 }}>Every item is inspected and verified before it ships.</p>
            </div>

            {/* Active rental panel */}
            {rental && (
              <div style={{ background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"18px 20px",marginBottom:16 }}>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#16a34a",marginBottom:8,fontWeight:600 }}>You're renting this piece</p>
                <div style={{ display:"flex",flexDirection:"column",gap:4,marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span style={{ fontFamily:S.sans,fontSize:12,color:S.muted }}>Months rented</span>
                    <span style={{ fontFamily:S.sans,fontSize:12,fontWeight:600,color:S.ink }}>{rental.months_rented ?? 0}</span>
                  </div>
                  {rental.original_buyout_price && (
                    <div style={{ display:"flex",justifyContent:"space-between" }}>
                      <span style={{ fontFamily:S.sans,fontSize:12,color:S.muted }}>Original buyout</span>
                      <span style={{ fontFamily:S.sans,fontSize:12,color:S.muted }}>${(rental.original_buyout_price/100).toFixed(2)}</span>
                    </div>
                  )}
                  {rental.current_buyout_price && (
                    <div style={{ display:"flex",justifyContent:"space-between" }}>
                      <span style={{ fontFamily:S.sans,fontSize:12,fontWeight:600,color:S.ink }}>Your buyout price</span>
                      <span style={{ fontFamily:S.serif,fontSize:18,fontWeight:700,color:S.ink }}>${(rental.current_buyout_price/100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {rental.original_buyout_price && rental.current_buyout_price && rental.original_buyout_price > rental.current_buyout_price && (
                  <p style={{ fontFamily:S.sans,fontSize:11,color:"#16a34a",marginBottom:12 }}>
                    {rental.months_rented} month{rental.months_rented !== 1 ? "s" : ""} of renting has reduced your buyout by <strong>${((rental.original_buyout_price - rental.current_buyout_price)/100).toFixed(2)}</strong>
                  </p>
                )}
                {buyOutMsg ? (
                  <p style={{ fontFamily:S.sans,fontSize:12,color:"#16a34a",fontWeight:500 }}>{buyOutMsg}</p>
                ) : rental.current_buyout_price && (
                  <button onClick={handleBuyOutrightDetail} disabled={buyingOut}
                    style={{ width:"100%",background:"#16a34a",color:"#fff",border:"none",cursor:buyingOut?"not-allowed":"pointer",padding:"11px",fontFamily:S.sans,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",opacity:buyingOut?0.7:1 }}>
                    {buyingOut ? "Processing…" : `Buy Outright — $${(rental.current_buyout_price/100).toFixed(2)}`}
                  </button>
                )}
              </div>
            )}

            <button onClick={()=>{ addToSuitcase(item); setInSuitcase(true); }} style={{ width:"100%",background:inSuitcase?"#f0ede8":S.ink,color:inSuitcase?"#6b5e4e":S.cream,border:"none",cursor:inSuitcase?"default":"pointer",padding:"16px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>
              {inSuitcase?"✓ In Your Suitcase":"Add to Suitcase"}
            </button>
            {inSuitcase&&<button onClick={()=>setPage("suitcase")} style={{ width:"100%",background:"transparent",color:S.ink,border:`1px solid #c9bfb0`,cursor:"pointer",padding:"12px",fontFamily:S.sans,fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:10 }}>View Suitcase</button>}
            <div style={{ display:"flex",alignItems:"center",gap:12,marginTop:14 }}>
              <div style={{ flex:1,height:1,background:S.stone }}/>
              <span style={{ fontFamily:S.sans,fontSize:10,color:S.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>or</span>
              <div style={{ flex:1,height:1,background:S.stone }}/>
            </div>
            <button
              onClick={()=>item._dbId&&onBuy(item)}
              disabled={!item._dbId}
              style={{ width:"100%",background:"transparent",color:item._dbId?S.ink:S.muted,border:`1px solid ${item._dbId?S.ink:S.stone}`,cursor:item._dbId?"pointer":"not-allowed",padding:"14px",fontFamily:S.sans,fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              Buy Outright ${buyPrice}
            </button>
            <p style={{ fontFamily:S.sans,fontSize:11,color:S.muted,textAlign:"center",marginTop:8 }}>One-time purchase. Yours to keep.</p>
          </div>
        </div>
        {related.length>0&&(
          <div style={{ marginTop:80 }}>
            <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",color:S.tan,marginBottom:12 }}>Goes Well With</p>
            <h2 style={{ fontFamily:S.serif,fontSize:34,fontWeight:600,color:S.ink,marginBottom:32 }}>Complete the look.</h2>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24 }}>
              {related.map(i=><MiniItemCard key={i.id} item={i} setPage={setPage}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
function QuizPage({ setPage, setStyleProfile }) {
  const [index,setIndex]=useState(0);
  const [liked,setLiked]=useState([]);
  const [done,setDone]=useState(false);
  const [animDir,setAnimDir]=useState(null);

  function swipe(dir) {
    setAnimDir(dir);
    setTimeout(()=>{
      const newLiked=dir==="right"?[...liked,SWIPE_ITEMS[index].id]:liked;
      if(index+1>=SWIPE_ITEMS.length){ setStyleProfile(newLiked); setDone(true); }
      else{ setLiked(newLiked); setIndex(i=>i+1); setAnimDir(null); }
    },280);
  }

  if(done) {
    const [resultView, setResultView] = useState("pieces");
    const picks = STATIC_ITEMS.filter(i=>i.condition==="Like New").slice(0,4);
    // Match wardrobes — just show all for now, in future filter by swipes
    const matchedWardrobes = WARDROBES.slice(0,3);

    return (
      <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream }}>
        <div style={{ maxWidth:960,margin:"0 auto",padding:"60px 40px" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:14 }}>Your Style Profile</p>
          <h1 style={{ fontFamily:S.serif,fontSize:54,fontWeight:600,color:S.ink,letterSpacing:"-1.5px",marginBottom:14 }}>We know your vibe.</h1>
          <p style={{ fontFamily:S.sans,fontSize:16,color:S.muted,marginBottom:36 }}>Based on your swipes, here's what we think you'll love.</p>

          {/* Toggle */}
          <div style={{ display:"flex",gap:0,marginBottom:48,background:S.stone,padding:4,width:"fit-content" }}>
            <button onClick={()=>setResultView("pieces")} style={{ background:resultView==="pieces"?S.ink:"transparent",color:resultView==="pieces"?S.cream:S.muted,border:"none",cursor:"pointer",padding:"10px 28px",fontFamily:S.sans,fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.18s" }}>
              Show Me Pieces
            </button>
            <button onClick={()=>setResultView("wardrobes")} style={{ background:resultView==="wardrobes"?S.ink:"transparent",color:resultView==="wardrobes"?S.cream:S.muted,border:"none",cursor:"pointer",padding:"10px 28px",fontFamily:S.sans,fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.18s" }}>
              Build Me a Wardrobe
            </button>
          </div>

          {resultView==="pieces" ? (
            <div>
              <div style={{ marginBottom:56 }}>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:S.tan,marginBottom:20 }}>Suggested Outfits</p>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
                  {OUTFITS.slice(0,2).map(outfit=>{
                    const pieces=outfit.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
                    const total=pieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
                    return (
                      <div key={outfit.id} style={{ background:"#fff",border:`1px solid ${S.stone}`,padding:"28px" }}>
                        <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:8 }}>{outfit.occasion} · {outfit.style}</p>
                        <h3 style={{ fontFamily:S.serif,fontSize:24,fontWeight:600,color:S.ink,marginBottom:20 }}>{outfit.name}</h3>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20 }}>
                          {pieces.map(p=><div key={p.id} style={{ background:p.color,height:60,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{p.emoji}</div>)}
                        </div>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <span style={{ fontFamily:S.serif,fontSize:20,fontWeight:700,color:S.ink }}>${(Math.round(total*100)/100).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:10,color:S.muted }}>/mo</span></span>
                          <button onClick={()=>setPage("browse")} style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"8px 18px",fontFamily:S.sans,fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>Shop Outfit</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:S.tan,marginBottom:20 }}>Individual Picks For You</p>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
                  {picks.map(item=><MiniItemCard key={item.id} item={item} setPage={setPage}/>)}
                </div>
              </div>
              <div style={{ marginTop:44,textAlign:"center" }}>
                <button onClick={()=>setPage("browse")} style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"14px 40px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Browse Full Catalog</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:S.tan,marginBottom:20 }}>Wardrobes matched to your style</p>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24 }}>
                {matchedWardrobes.map(w=>{
                  const wPieces=w.itemIds.map(id=>STATIC_ITEMS.find(i=>i.id===id)).filter(Boolean);
                  const wSum=wPieces.reduce((s,p)=>s+getMonthlyPrice(p),0);
                  return (
                    <div key={w.id} style={{ background:"#fff",border:`1px solid ${S.stone}`,overflow:"hidden" }}>
                      <div style={{ height:160,background:w.color,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,padding:2,position:"relative" }}>
                        {wPieces.slice(0,8).map(p=>(
                          <div key={p.id} style={{ background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{p.emoji}</div>
                        ))}
                        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.4))" }}/>
                        <div style={{ position:"absolute",bottom:10,left:12 }}>
                          <span style={{ background:w.accentColor,color:S.ink,fontFamily:S.sans,fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"2px 8px" }}>{w.season}</span>
                        </div>
                      </div>
                      <div style={{ padding:"20px 20px 22px" }}>
                        <h3 style={{ fontFamily:S.serif,fontSize:24,fontWeight:600,color:S.ink,marginBottom:6 }}>{w.name}</h3>
                        <p style={{ fontFamily:S.sans,fontSize:12,color:S.muted,lineHeight:1.7,marginBottom:16 }}>{w.tagline}</p>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                          <span style={{ fontFamily:S.serif,fontSize:22,fontWeight:700,color:S.ink }}>${(Math.round(wSum*100)/100).toFixed(2)}<span style={{ fontFamily:S.sans,fontSize:10,color:S.muted }}>/mo</span></span>
                        </div>
                        <button onClick={()=>setPage(`wardrobe-${w.id}`)} style={{ width:"100%",background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"10px",fontFamily:S.sans,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>
                          View Wardrobe
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:44,textAlign:"center" }}>
                <button onClick={()=>setPage("wardrobes")} style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"14px 40px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Browse All Wardrobes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const current=SWIPE_ITEMS[index];
  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.ink,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
      <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#6b5e4e",marginBottom:12 }}>Style Discovery</p>
      <h1 style={{ fontFamily:S.serif,fontSize:44,fontWeight:600,color:S.cream,letterSpacing:"-1px",marginBottom:8 }}>What speaks to you?</h1>
      <p style={{ fontFamily:S.sans,fontSize:14,color:"#6b7280",marginBottom:52 }}>{index+1} of {SWIPE_ITEMS.length}</p>
      <div style={{ width:340,background:"#fff",border:"1px solid #1f2937",padding:"52px 40px",textAlign:"center",transition:"transform 0.28s,opacity 0.28s",transform:animDir==="left"?"translateX(-120px) rotate(-8deg)":animDir==="right"?"translateX(120px) rotate(8deg)":"none",opacity:animDir?0:1 }}>
        <div style={{ fontSize:64,marginBottom:24 }}>{current.emoji}</div>
        <h2 style={{ fontFamily:S.serif,fontSize:30,fontWeight:600,color:S.ink,marginBottom:10 }}>{current.label}</h2>
        <p style={{ fontFamily:S.sans,fontSize:14,color:S.muted }}>{current.desc}</p>
      </div>
      <div style={{ display:"flex",gap:24,marginTop:44 }}>
        <button onClick={()=>swipe("left")}  style={{ width:64,height:64,borderRadius:"50%",background:"#1f2937",border:"1px solid #374151",cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        <button onClick={()=>swipe("right")} style={{ width:64,height:64,borderRadius:"50%",background:S.gold,border:"none",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center" }}>♥</button>
      </div>
      <div style={{ display:"flex",gap:5,marginTop:36 }}>
        {SWIPE_ITEMS.map((_,i)=><div key={i} style={{ width:28,height:3,background:i<=index?"#c4a882":"#1f2937",transition:"background 0.2s" }}/>)}
      </div>
    </div>
  );
}

// ─── SUITCASE ─────────────────────────────────────────────────────────────────
function SuitcasePage({ suitcase, removeFromSuitcase, setPage, items, rentals=[] }) {
  const { isSignedIn, isLoaded } = useUser();
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const totalMonthly = suitcase.reduce((s, i) => s + getMonthlyPrice(i), 0);
  // legacy alias used in summary panel
  const total = totalMonthly;
  const dbItems = suitcase.filter(i => i._dbId);
  const totalDeposit = dbItems.reduce((s, i) => s + i.buyPrice, 0);
  const totalFirstMonth = dbItems.reduce((s, i) => s + getMonthlyPrice(i), 0);
  const totalDueToday = totalFirstMonth + totalDeposit;

  async function handleSubscribe() {
    if (!dbItems.length) { setSubscribeError("Add items from the catalog to start your subscription."); return; }
    setSubscribing(true);
    setSubscribeError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: dbItems.map(i => i._dbId) }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setSubscribeError(data.error ?? "Something went wrong.");
    } catch { setSubscribeError("Something went wrong. Please try again."); }
    setSubscribing(false);
  }

  if (!isLoaded) return null;
  if (!isSignedIn) return <AuthGate />;
  const suggested=items.filter(i=>!suitcase.some(s=>s.id===i.id)).slice(0,4);

  if(suitcase.length===0) return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center" }}>
      <div style={{ fontSize:72,marginBottom:24 }}>🧳</div>
      <h2 style={{ fontFamily:S.serif,fontSize:44,fontWeight:600,color:S.ink,marginBottom:14 }}>Your suitcase is empty.</h2>
      <p style={{ fontFamily:S.sans,fontSize:16,color:S.muted,marginBottom:36 }}>Start adding pieces, or let us build a wardrobe for you.</p>
      <div style={{ display:"flex",gap:12 }}>
        <button onClick={()=>setPage("browse")} style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"14px 36px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Browse Pieces</button>
        <button onClick={()=>setPage("wardrobes")} style={{ background:"transparent",color:S.ink,border:`1px solid ${S.ink}`,cursor:"pointer",padding:"14px 36px",fontFamily:S.sans,fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" }}>Wardrobes</button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream }}>
      <div style={{ maxWidth:980,margin:"0 auto",padding:"52px 40px" }}>
        <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:12 }}>Your Suitcase</p>
        <h1 style={{ fontFamily:S.serif,fontSize:48,fontWeight:600,color:S.ink,letterSpacing:"-1.5px",marginBottom:44 }}>
          {suitcase.length} piece{suitcase.length!==1?"s":""} selected.
        </h1>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:40,alignItems:"start" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {suitcase.map(item=>{
              const monthlyPrice = getMonthlyPrice(item);
              const depositAmt = item._dbId ? item.buyPrice : 0;
              const dueToday = item._dbId ? (monthlyPrice + depositAmt) : monthlyPrice;
              const [imgErr, setImgErr] = useState(false);
              const showImg = item.image_url && !imgErr;
              return (
                <div key={item.id} style={{ background:"#fff",border:`1px solid ${S.stone}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:16,padding:"16px 20px" }}>
                    {/* Photo */}
                    <div style={{ width:72,height:72,background:showImg?"#f5f3f0":item.color,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28 }}>
                      {showImg
                        ? <img src={item.image_url} alt={item.name} onError={()=>setImgErr(true)} style={{ width:"100%",height:"100%",objectFit:"contain",display:"block" }}/>
                        : (item.emoji || "👕")}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:S.tan,marginBottom:2 }}>{item.brand}</p>
                      <h3 style={{ fontFamily:S.serif,fontSize:17,fontWeight:600,color:S.ink,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</h3>
                      <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                        <span style={{ fontFamily:S.sans,fontSize:11,color:S.muted }}>${monthlyPrice.toFixed(2)}/mo</span>
                        {item._dbId && <span style={{ fontFamily:S.sans,fontSize:11,color:S.tan }}>+${depositAmt} deposit hold</span>}
                      </div>
                    </div>
                    {/* Total due today for this item */}
                    {item._dbId && (
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <p style={{ fontFamily:S.sans,fontSize:9,color:S.muted,marginBottom:2,letterSpacing:"0.08em",textTransform:"uppercase" }}>Due today</p>
                        <p style={{ fontFamily:S.serif,fontSize:20,fontWeight:700,color:S.ink }}>${dueToday.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",borderTop:`1px solid ${S.stone}` }}>
                    <button onClick={()=>removeFromSuitcase(item.id)} style={{ flex:1,background:"transparent",color:"#ef4444",border:"none",cursor:"pointer",padding:"9px 0",fontFamily:S.sans,fontSize:10,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase" }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary panel */}
          <div style={{ background:S.ink,padding:"36px 32px",position:"sticky",top:80 }}>
            <h2 style={{ fontFamily:S.serif,fontSize:26,fontWeight:600,color:S.cream,marginBottom:6 }}>Monthly Total</h2>
            <p style={{ fontFamily:S.sans,fontSize:11,color:"#6b7280",marginBottom:24,letterSpacing:"0.04em" }}>Billed monthly · cancel any time</p>

            {/* Per-item breakdown */}
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
              {suitcase.map(item=>(
                <div key={item.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontFamily:S.sans,fontSize:12,color:"#9ca3af",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</span>
                  <span style={{ fontFamily:S.sans,fontSize:12,color:S.cream,flexShrink:0 }}>${getMonthlyPrice(item).toFixed(2)}/mo</span>
                </div>
              ))}
            </div>

            {/* Monthly total */}
            <div style={{ borderTop:"1px solid #1f2937",paddingTop:16,marginBottom:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                <span style={{ fontFamily:S.sans,fontSize:13,fontWeight:600,color:S.cream }}>Total / month</span>
                <span style={{ fontFamily:S.serif,fontSize:28,fontWeight:700,color:S.cream }}>${(Math.round(total*100)/100).toFixed(2)}</span>
              </div>
            </div>

            {/* Deposit info */}
            {dbItems.length > 0 && (
              <div style={{ background:"#111",border:"1px solid #1f2937",padding:"14px 16px",marginBottom:20 }}>
                <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:S.tan,marginBottom:6 }}>Security Deposit</p>
                {dbItems.map(item=>(
                  <div key={item.id} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                    <span style={{ fontFamily:S.sans,fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150 }}>{item.name}</span>
                    <span style={{ fontFamily:S.sans,fontSize:11,color:"#9ca3af",flexShrink:0 }}>${item.buyPrice}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid #1f2937",paddingTop:8,marginTop:6,display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontFamily:S.sans,fontSize:11,fontWeight:600,color:"#9ca3af" }}>Total held</span>
                  <span style={{ fontFamily:S.sans,fontSize:11,fontWeight:600,color:S.cream }}>${totalDeposit}</span>
                </div>
                <p style={{ fontFamily:S.sans,fontSize:10,color:"#4b5563",marginTop:8,lineHeight:1.6 }}>Authorized on your card — not charged. Released automatically when items are returned.</p>
              </div>
            )}

            {/* Total due today */}
            {dbItems.length > 0 && (
              <div style={{ borderTop:"1px solid #1f2937",paddingTop:14,marginBottom:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontFamily:S.sans,fontSize:13,fontWeight:600,color:S.cream }}>Due Today</span>
                  <span style={{ fontFamily:S.serif,fontSize:28,fontWeight:700,color:S.gold }}>${(Math.round(totalDueToday*100)/100).toFixed(2)}</span>
                </div>
                <p style={{ fontFamily:S.sans,fontSize:10,color:"#6b7280",marginTop:4 }}>First month + security deposit hold</p>
              </div>
            )}

            {/* Return policy note */}
            <div style={{ background:"#111",border:"1px solid #1f2937",padding:"12px 14px",marginBottom:20 }}>
              <p style={{ fontFamily:S.sans,fontSize:10,color:"#6b7280",lineHeight:1.7 }}>
                Return early? You'll be refunded for unused days in the current billing period — automatically, no questions asked.
              </p>
            </div>

            {subscribeError && (
              <p style={{ fontFamily:S.sans,fontSize:11,color:"#ef4444",marginBottom:12,textAlign:"center" }}>{subscribeError}</p>
            )}

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              style={{ width:"100%",background:subscribing?"#4b5563":S.gold,color:S.ink,border:"none",cursor:subscribing?"not-allowed":"pointer",padding:"15px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,transition:"background 0.2s",opacity:subscribing?0.8:1 }}>
              {subscribing ? "Redirecting…" : dbItems.length > 0 ? "Start Monthly Rental" : "Checkout"}
            </button>

            <p style={{ fontFamily:S.sans,fontSize:10,color:"#374151",textAlign:"center",lineHeight:1.6 }}>
              Powered by Stripe · SSL secured
            </p>
          </div>
        </div>

        {/* Suggested for you */}
        <div style={{ marginTop:80 }}>
          <p style={{ fontFamily:S.sans,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:12 }}>Suggested for You</p>
          <h2 style={{ fontFamily:S.serif,fontSize:36,fontWeight:600,color:S.ink,marginBottom:10 }}>Pieces that pair well.</h2>
          <p style={{ fontFamily:S.sans,fontSize:14,color:S.muted,marginBottom:36 }}>Based on your Suitcase, your style profile, and what's trending right now.</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18 }}>
            {suggested.map(item=><MiniItemCard key={item.id} item={item} setPage={setPage}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUSTAINABILITY ───────────────────────────────────────────────────────────
function SustainabilityPage() {
  return (
    <div style={{ paddingTop:60,background:"#000",minHeight:"100vh",color:"#fff" }}>

      {/* Personal opening */}
      <section style={{ padding:"100px 40px",borderBottom:"1px solid #111" }}>
        <div style={{ maxWidth:820,margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.22em",textTransform:"uppercase",color:"#444",marginBottom:28 }}>Our Mission</p>
          <h1 style={{ fontFamily:S.serif,fontSize:"clamp(48px, 8vw, 96px)",fontWeight:300,lineHeight:0.9,letterSpacing:"-3px",color:"#fff",marginBottom:44 }}>
            You don't need<br/><em style={{ fontStyle:"italic" }}>more clothes.</em>
          </h1>
          <p style={{ fontFamily:S.sans,fontSize:18,color:"#888",lineHeight:1.85,maxWidth:580,marginBottom:24 }}>
            If you're like most guys in college, you've got a closet full of stuff you don't wear, and nothing to put on for the occasion that actually matters. More shopping doesn't fix that.
          </p>
          <p style={{ fontFamily:S.sans,fontSize:18,color:"#aaa",lineHeight:1.85,maxWidth:580 }}>
            Davenport was built for exactly that problem. Access to the right pieces, from brands worth wearing, at a price that makes sense for where you are right now.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding:"80px 40px",borderBottom:"1px solid #111" }}>
        <div style={{ maxWidth:1080,margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#333",marginBottom:48 }}>The bigger picture</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#111" }}>
            {[["92M","Tons","of textile waste enter landfills every single year"],["60%","Of clothes","are worn fewer than 5 times before being thrown away"],["$500B","Lost annually","to clothing that gets discarded instead of reused"],["20%","Of pollution","of global wastewater comes from textile dyeing"],["3,000L","Of water","used to produce a single pair of jeans"],["10%","Of emissions","of global carbon output is from the fashion industry"]].map(([stat,label,detail])=>(
              <div key={stat} style={{ background:"#000",padding:"52px 36px" }}>
                <div style={{ fontFamily:S.serif,fontSize:62,fontWeight:700,color:"#fff",lineHeight:1,marginBottom:6 }}>{stat}</div>
                <div style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:12 }}>{label}</div>
                <div style={{ fontFamily:S.sans,fontSize:14,color:"#555",lineHeight:1.65 }}>{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Davenport Answer */}
      <section style={{ padding:"80px 40px",borderBottom:"1px solid #111" }}>
        <div style={{ maxWidth:820,margin:"0 auto" }}>
          <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:"#333",marginBottom:36 }}>The Davenport Answer</p>
          {[
            ["Wear more. Own less.","Every piece in your Suitcase is one you didn't have to buy outright and throw away after a season. And if you fall in love with it, you can buy it. That's the whole idea."],
            ["Quality over quantity.","We work with brands built to last. Nothing in our catalog is fast fashion. Every piece is worth wearing, and worth passing on."],
            ["Pricing that makes sense.","As a piece gets more wear, the monthly price comes down. You pay for the state it's in. Transparent, fair, simple."],
            ["Cleaned. Checked. Reshipped.","Every return is inspected, cleaned, and verified before it goes back out. The lifecycle of each piece is extended as long as possible."],
          ].map(([t,d])=>(
            <div key={t} style={{ borderTop:"1px solid #111",padding:"36px 0" }}>
              <h3 style={{ fontFamily:S.serif,fontSize:30,fontWeight:600,color:"#fff",marginBottom:12 }}>{t}</h3>
              <p style={{ fontFamily:S.sans,fontSize:16,color:"#666",lineHeight:1.8 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Inspiring close */}
      <section style={{ padding:"80px 40px",textAlign:"center" }}>
        <h2 style={{ fontFamily:S.serif,fontSize:"clamp(36px, 5vw, 62px)",fontWeight:600,color:"#fff",letterSpacing:"-2px",marginBottom:20 }}>
          A smarter way to dress.<br/><em style={{ fontStyle:"italic",color:"#9c8b78" }}>For everyone.</em>
        </h2>
        <p style={{ fontFamily:S.sans,fontSize:16,color:"#666",marginBottom:44,maxWidth:480,margin:"0 auto 44px" }}>
          When you wear instead of buying and tossing, you're part of something bigger. Better for your wallet. Better for the planet. Better for the next guy who wears it after you.
        </p>
        <button style={{ background:"#fff",color:"#000",border:"none",cursor:"pointer",padding:"16px 44px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" }}>
          Start Wearing Today
        </button>
      </section>
    </div>
  );
}

// ─── AUTH GATE ────────────────────────────────────────────────────────────────
function AuthGatePage({ setPage }) {
  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ maxWidth:480,width:"100%",padding:"0 24px",textAlign:"center" }}>
        <div style={{ fontSize:48,marginBottom:24 }}>🔒</div>
        <p style={{ fontFamily:S.sans,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:S.tan,marginBottom:16 }}>Members Only</p>
        <h1 style={{ fontFamily:S.serif,fontSize:44,fontWeight:600,color:S.ink,letterSpacing:"-1px",marginBottom:16 }}>This is for members.</h1>
        <p style={{ fontFamily:S.sans,fontSize:16,color:S.muted,lineHeight:1.75,marginBottom:40 }}>Create a free Davenport account to access the style quiz, the community, and your personal Suitcase.</p>
        <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
          <button onClick={()=>setPage("auth-signup")} style={{ background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:"14px 36px",fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>
            Create Account
          </button>
          <button onClick={()=>setPage("auth-login")} style={{ background:"transparent",color:S.ink,border:`1px solid ${S.ink}`,cursor:"pointer",padding:"14px 36px",fontFamily:S.sans,fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" }}>
            Sign In
          </button>
        </div>
        <button onClick={()=>setPage("home")} style={{ marginTop:24,background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:12,color:S.muted,textDecoration:"underline" }}>
          Back to home
        </button>
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthPage({ mode, setIsLoggedIn, setPage }) {
  const inp={ width:"100%",padding:"13px 16px",border:`1px solid ${S.stone}`,background:S.cream,fontFamily:S.sans,fontSize:14,color:S.ink,outline:"none",marginBottom:14,boxSizing:"border-box" };

  function handleSubmit() {
    setIsLoggedIn(true);
    setPage("home");
  }

  return (
    <div style={{ paddingTop:60,minHeight:"100vh",background:S.cream,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:400,padding:"0 24px" }}>
        <div style={{ textAlign:"center",marginBottom:44 }}>
          <p style={{ fontFamily:S.serif,fontSize:14,color:S.tan,marginBottom:8 }}>Davenport Wardrobe</p>
          <h1 style={{ fontFamily:S.serif,fontSize:36,fontWeight:600,color:S.ink,letterSpacing:"-0.8px" }}>{mode==="signup"?"Create your account.":"Sign back in."}</h1>
        </div>
        {mode==="signup"&&<input placeholder="Full name" style={inp}/>}
        <input placeholder="Email address" type="email" style={inp}/>
        <input placeholder="Password" type="password" style={inp}/>
        <button onClick={handleSubmit} style={{ width:"100%",background:S.ink,color:S.cream,border:"none",cursor:"pointer",padding:14,fontFamily:S.sans,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:4 }}>
          {mode==="signup"?"Create Account":"Sign In"}
        </button>
        <p style={{ fontFamily:S.sans,fontSize:12,color:S.muted,textAlign:"center",marginTop:20 }}>
          {mode==="signup"?"Already have an account? ":"Don't have an account? "}
          <button onClick={()=>setPage(mode==="signup"?"auth-login":"auth-signup")} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:12,color:S.ink,textDecoration:"underline",padding:0 }}>
            {mode==="signup"?"Sign in":"Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
const POSTS = [
  { id:1,  user:"marcus_w",   school:"UVA",          emoji:"👤", bg:"#1e293b", caption:"Campus-to-dinner in the dark wash denim. Easiest fit I've put together all semester.",    items:["Slim Dark Wash Denim","Navy Quarter-Zip"],          likes:214, wears:"Worn together 3 times", aspect:"tall" },
  { id:2,  user:"tyler.b",    school:"Georgetown",   emoji:"👤", bg:"#c4a882", caption:"Internship week 1. The camel overcoat did all the work.",                                   items:["Camel Overcoat","Black Slim Trousers"],             likes:187, wears:"Overcoat 3 wears",   aspect:"tall" },
  { id:3,  user:"jameson_k",  school:"Michigan",     emoji:"👤", bg:"#86a98a", caption:"Weekend in the sage linen. Never going back to synthetic fabrics.",                         items:["Linen Shirt Sage","White Linen Shorts"],         likes:302, wears:"Shirt 5 wears",      aspect:"wide" },
  { id:4,  user:"cole.r",     school:"USC",          emoji:"👤", bg:"#0f172a", caption:"Night out uniform. Black bomber does exactly what you need it to.",                          items:["Black Bomber Jacket","Merino Turtleneck"],         likes:421, wears:"Bomber 4 wears",    aspect:"tall" },
  { id:5,  user:"ben_a",      school:"NYU",          emoji:"👤", bg:"#f5f0e0", caption:"The cream cardigan goes with literally everything. Wore it 3 days straight.",               items:["Cream Knit Cardigan","Taupe Chinos"],               likes:156, wears:"Cardigan 3 wears",  aspect:"wide" },
  { id:6,  user:"luca.m",     school:"Vanderbilt",   emoji:"👤", bg:"#7c2d3c", caption:"Corduroy season. The burgundy hits different in fall light.",                               items:["Burgundy Corduroy Shirt","Slim Dark Wash Denim"],  likes:289, wears:"Shirt 8 wears",    aspect:"tall" },
  { id:7,  user:"alex_n",     school:"Duke",         emoji:"👤", bg:"#1d3461", caption:"Rugby shirt + white sneakers. Simple. Just works.",                                          items:["Striped Rugby Shirt","White Court Sneakers"],      likes:198, wears:"Shirt 10 wears",   aspect:"wide" },
  { id:8,  user:"noah.f",     school:"Emory",        emoji:"👤", bg:"#d6cfc7", caption:"Stone chore coat is the most versatile thing in my Suitcase.",                              items:["Stone Chore Coat","Olive Cargo Pants"],            likes:341, wears:"Coat 5 wears",     aspect:"tall" },
  { id:9,  user:"drew_p",     school:"Boston College",emoji:"👤",bg:"#292524", caption:"The turtleneck. That's it. That's the post.",                                               items:["Merino Turtleneck"],                                likes:512, wears:"9 wears",             aspect:"wide" },
];

function CommunityPage({ setPage }) {
  const isMobile = useMobile();
  const [filter, setFilter] = useState("All");
  const [liked, setLiked] = useState({});
  const [showPost, setShowPost] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postStatus, setPostStatus] = useState(null);
  const [dbPosts, setDbPosts] = useState([]);
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.json())
      .then(rows => setDbPosts(Array.isArray(rows) ? rows : []))
      .catch(() => {});
  }, []);

  function normalizeDbPost(row) {
    return {
      id: `db-${row.id}`,
      user: row.user_name || "member",
      school: null,
      userImage: row.user_image || null,
      bg: "#c4a882",
      imageUrl: row.image_url || null,
      caption: row.caption,
      items: [],
      likes: row.likes || 0,
      wears: null,
      aspect: "wide",
      createdAt: row.created_at,
      isDb: true,
    };
  }

  const schools = ["All", ...new Set(POSTS.map(p => p.school))];
  const staticFiltered = filter === "All" ? POSTS : POSTS.filter(p => p.school === filter);
  const filtered = [...dbPosts.map(normalizeDbPost), ...staticFiltered];

  function toggleLike(id) {
    setLiked(l => ({ ...l, [id]: !l[id] }));
  }

  function handleShareClick() {
    if (!isSignedIn) { openSignIn(); return; }
    setShowPost(true);
    setCaption("");
    setImageUrl("");
    setPostStatus(null);
  }

  async function handlePostSubmit(e) {
    e.preventDefault();
    if (!caption.trim() || !user?.id) return;
    setPostStatus("submitting");
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: user.id,
          user_name: user.firstName
            ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
            : user.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "member",
          user_image: user.imageUrl || null,
          caption,
          image_url: imageUrl.trim() || null,
        }),
      });
      const rows = await fetch("/api/posts").then(r => r.json());
      setDbPosts(Array.isArray(rows) ? rows : []);
      setPostStatus("done");
    } catch {
      setPostStatus("done");
    }
  }

  return (
    <div style={{ paddingTop:60, minHeight:"100vh", background:S.cream }}>
      {/* Header */}
      <div style={{ padding: isMobile ? "20px 16px 14px" : "52px 40px 36px", background:"#fff", borderBottom:`1px solid ${S.stone}` }}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile ? "center" : "flex-end", flexWrap:"wrap", gap:12 }}>
            <div>
              {!isMobile && <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10 }}>The Community</p>}
              <h1 style={{ fontFamily:S.serif, fontSize: isMobile ? 26 : 48, fontWeight:600, letterSpacing:"-1px", color:S.ink }}>{isMobile ? "Community" : "Worn by real people."}</h1>
            </div>
            {!isMobile && (
              <button onClick={handleShareClick} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"10px 22px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", minHeight:48, flexShrink:0 }}>
                + Share Your Look
              </button>
            )}
          </div>
          {/* School filter */}
          <div style={{ display:"flex", gap:6, marginTop: isMobile ? 12 : 16, overflowX: isMobile ? "auto" : "visible", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 4 : 0 }}>
            {schools.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ background:filter===s?S.ink:"#fff", color:filter===s?S.cream:S.muted, border:`1px solid ${filter===s?S.ink:S.stone}`, padding: isMobile ? "7px 12px" : "5px 14px", fontFamily:S.sans, fontSize:11, fontWeight:500, letterSpacing:"0.06em", cursor:"pointer", textTransform:"uppercase", flexShrink:0, minHeight:36 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: isMobile ? "100%" : 1080, margin:"0 auto", padding: isMobile ? "0" : "40px 40px 80px" }}>
        {isMobile ? (
          /* Instagram-style feed: full-width cards */
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {filtered.map(post => (
              <div key={post.id} style={{ background:"#fff", borderBottom:`1px solid ${S.stone}` }}>
                {/* Post header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {post.userImage
                      ? <img src={post.userImage} alt="" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
                      : <div style={{ width:36, height:36, borderRadius:"50%", background:post.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👤</div>
                    }
                    <div>
                      <p style={{ fontFamily:S.sans, fontSize:13, fontWeight:600, color:S.ink }}>@{post.user}</p>
                      {post.school && <p style={{ fontFamily:S.sans, fontSize:11, color:S.muted }}>{post.school}</p>}
                    </div>
                  </div>
                  <span style={{ fontFamily:S.sans, fontSize:10, fontWeight:600, color:S.tan, background:"#f0ebe3", border:`1px solid #ddd5c8`, borderRadius:20, padding:"3px 8px" }}>+5 pts</span>
                </div>
                {/* Photo area */}
                <div style={{ background:post.bg, aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", width:"100%" }}>
                  {post.imageUrl
                    ? <img src={post.imageUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <>
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)" }}/>
                        <div style={{ fontSize:72, position:"relative", zIndex:1 }}>👤</div>
                      </>
                  }
                  {typeof post.id === "number" && post.id % 3 === 0 && (
                    <div style={{ position:"absolute", bottom:12, left:12, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.5)", padding:"4px 10px", borderRadius:2, zIndex:2 }}>
                      <div style={{ width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:"8px solid #fff" }}/>
                      <span style={{ fontFamily:S.sans, fontSize:9, color:"#fff" }}>VIDEO</span>
                    </div>
                  )}
                </div>
                {/* Actions + caption */}
                <div style={{ padding:"12px 16px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:10 }}>
                    <button onClick={() => toggleLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color: liked[post.id] ? "#e11d48" : S.muted, padding:0, minHeight:44, minWidth:44 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={liked[post.id]?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      <span style={{ fontFamily:S.sans, fontSize:13, fontWeight:500 }}>{liked[post.id] ? post.likes+1 : post.likes}</span>
                    </button>
                  </div>
                  <p style={{ fontFamily:S.sans, fontSize:14, color:S.ink, lineHeight:1.6, marginBottom:10 }}>
                    <strong>@{post.user}</strong> {post.caption}
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {post.items.map(item => (
                      <button key={item} onClick={() => { const found = STATIC_ITEMS.find(i=>i.name===item); if(found) setPage(`item-${found.id}`); }}
                        style={{ background:S.cream, border:`1px solid ${S.stone}`, padding:"4px 10px", fontFamily:S.sans, fontSize:11, color:S.tan, cursor:"pointer", letterSpacing:"0.04em", minHeight:32 }}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding:"36px 20px 100px", background:S.ink, textAlign:"center" }}>
              <h2 style={{ fontFamily:S.serif, fontSize:28, fontWeight:600, color:S.cream, letterSpacing:"-1px", marginBottom:10 }}>Wearing Davenport?</h2>
              <p style={{ fontFamily:S.sans, fontSize:13, color:"#6b7280", marginBottom:24 }}>Tag <strong style={{ color:S.gold }}>@davenportwardrobe</strong> to be featured.</p>
              <button onClick={handleShareClick} style={{ background:S.gold, color:S.ink, border:"none", cursor:"pointer", padding:"16px 32px", fontFamily:S.sans, fontSize:13, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", width:"100%", minHeight:54 }}>
                Share Your Look (+5 pts)
              </button>
            </div>
          </div>
        ) : (
          /* Desktop: masonry grid */
          <>
            <div style={{ columns:"3 300px", columnGap:20 }}>
              {filtered.map(post => (
                <div key={post.id} style={{ breakInside:"avoid", marginBottom:20, background:"#fff", border:`1px solid ${S.stone}` }}>
                  <div style={{ background:post.bg, height: post.aspect==="tall" ? 280 : 180, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                    {post.imageUrl
                      ? <img src={post.imageUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
                      : <>
                          <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%, rgba(0,0,0,0.15) 100%)" }}/>
                          <div style={{ textAlign:"center", position:"relative", zIndex:1 }}>
                            {post.userImage
                              ? <img src={post.userImage} alt="" style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover", margin:"0 auto 12px", display:"block" }}/>
                              : <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto 12px", border:"1px solid rgba(255,255,255,0.2)" }}>👤</div>
                            }
                            <p style={{ fontFamily:S.sans, fontSize:11, color:"rgba(255,255,255,0.7)", letterSpacing:"0.06em" }}>@{post.user}</p>
                          </div>
                        </>
                    }
                    {typeof post.id === "number" && post.id % 3 === 0 && (
                      <div style={{ position:"absolute", bottom:12, left:12, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.5)", padding:"4px 10px", borderRadius:2 }}>
                        <div style={{ width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:"8px solid #fff" }}/>
                        <span style={{ fontFamily:S.sans, fontSize:9, color:"#fff", letterSpacing:"0.06em" }}>VIDEO</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:"16px 18px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div>
                        <span style={{ fontFamily:S.sans, fontSize:12, fontWeight:600, color:S.ink }}>@{post.user}</span>
                        <span style={{ fontFamily:S.sans, fontSize:10, color:S.muted, marginLeft:8 }}>{post.school}</span>
                      </div>
                      <button onClick={() => toggleLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color: liked[post.id] ? "#e11d48" : S.muted }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={liked[post.id]?"currentColor":"none"} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        <span style={{ fontFamily:S.sans, fontSize:11 }}>{liked[post.id] ? post.likes+1 : post.likes}</span>
                      </button>
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:13, color:S.ink, lineHeight:1.65, marginBottom:12 }}>{post.caption}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                      {post.items.map(item => (
                        <button key={item} onClick={() => { const found = STATIC_ITEMS.find(i=>i.name===item); if(found) setPage(`item-${found.id}`); }}
                          style={{ background:S.cream, border:`1px solid ${S.stone}`, padding:"3px 10px", fontFamily:S.sans, fontSize:10, color:S.tan, cursor:"pointer", letterSpacing:"0.04em" }}>
                          {item}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:9, color:"#c4bdb5", letterSpacing:"0.06em", textTransform:"uppercase" }}>{post.wears}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, padding:"44px", background:S.ink, textAlign:"center" }}>
              <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#6b5e4e", marginBottom:16 }}>Share Your Look</p>
              <h2 style={{ fontFamily:S.serif, fontSize:36, fontWeight:600, color:S.cream, letterSpacing:"-1px", marginBottom:12 }}>Wearing Davenport?</h2>
              <p style={{ fontFamily:S.sans, fontSize:14, color:"#6b7280", marginBottom:32, maxWidth:400, margin:"0 auto 32px" }}>Post on Instagram or TikTok and tag <strong style={{ color:S.gold }}>@davenportwardrobe</strong> to be featured.</p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <a href="https://instagram.com/davenportwardrobe" target="_blank" rel="noreferrer" style={{ background:"transparent", color:S.cream, border:`1px solid #374151`, padding:"12px 28px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", textDecoration:"none", display:"inline-block" }}>Instagram</a>
                <a href="https://tiktok.com/@davenportwardrobe" target="_blank" rel="noreferrer" style={{ background:S.cream, color:S.ink, border:"none", padding:"12px 28px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", textDecoration:"none", display:"inline-block" }}>TikTok</a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating post button — mobile only */}
      {isMobile && (
        <button onClick={handleShareClick} style={{ position:"fixed", bottom:76, right:16, zIndex:300, background:S.ink, color:S.cream, border:"none", cursor:"pointer", width:56, height:56, borderRadius:"50%", fontFamily:S.sans, fontSize:26, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          +
        </button>
      )}

      {/* Share Your Look modal */}
      {showPost && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#fff", width:"100%", maxWidth:480, padding:"40px 36px", position:"relative" }}>
            <button onClick={() => setShowPost(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", fontFamily:S.sans, fontSize:18, color:S.muted, lineHeight:1 }}>✕</button>
            {postStatus === "done" ? (
              <div style={{ textAlign:"center", paddingTop:12, paddingBottom:12 }}>
                <div style={{ fontSize:40, marginBottom:16 }}>🎉</div>
                <h3 style={{ fontFamily:S.serif, fontSize:28, fontWeight:600, color:S.ink, marginBottom:10 }}>Look submitted!</h3>
                <p style={{ fontFamily:S.sans, fontSize:14, color:S.muted, marginBottom:6 }}>You earned <strong style={{ color:S.ink }}>5 pts</strong> for sharing your fit.</p>
                <p style={{ fontFamily:S.sans, fontSize:12, color:S.tan, marginBottom:28 }}>Points added to your account.</p>
                <button onClick={() => setShowPost(false)} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"12px 32px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit}>
                <p style={{ fontFamily:S.sans, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10, fontWeight:500 }}>Share Your Look</p>
                <h3 style={{ fontFamily:S.serif, fontSize:26, fontWeight:600, color:S.ink, marginBottom:6 }}>Submit a post</h3>
                <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:24, lineHeight:1.7 }}>Share your caption and tag your pieces. Earn <strong>5 pts</strong> instantly.</p>
                <label style={{ display:"block", fontFamily:S.sans, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:S.muted, marginBottom:6 }}>Caption</label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Describe your fit — pieces, occasion, vibe..."
                  rows={4}
                  required
                  style={{ width:"100%", padding:"12px 14px", fontFamily:S.sans, fontSize:13, color:S.ink, border:`1px solid ${S.stone}`, resize:"vertical", lineHeight:1.6, marginBottom:16, background:S.cream }}
                />
                <label style={{ display:"block", fontFamily:S.sans, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:S.muted, marginBottom:6 }}>Photo URL <span style={{ color:"#c4bdb5" }}>(optional)</span></label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width:"100%", padding:"11px 14px", fontFamily:S.sans, fontSize:13, color:S.ink, border:`1px solid ${S.stone}`, marginBottom:20, background:S.cream }}
                />
                {imageUrl.trim() && (
                  <div style={{ marginBottom:16, border:`1px solid ${S.stone}`, overflow:"hidden", aspectRatio:"1", maxHeight:160 }}>
                    <img src={imageUrl.trim()} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={e=>e.currentTarget.style.display="none"}/>
                  </div>
                )}
                <button type="submit" disabled={postStatus === "submitting" || !caption.trim()} style={{ width:"100%", background:postStatus==="submitting"?S.muted:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"14px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", minHeight:48 }}>
                  {postStatus === "submitting" ? "Submitting…" : "Post & Earn 5 pts"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer style={{ background:S.ink,padding:"52px 40px 36px",borderTop:"1px solid #1a1a1a" }}>
      <div style={{ maxWidth:1080,margin:"0 auto",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:32,marginBottom:40 }}>
        <div>
          <div style={{ fontFamily:S.serif,fontSize:22,color:S.cream,marginBottom:8 }}>Davenport</div>
          <p style={{ fontFamily:S.sans,fontSize:12,color:"#6b7280",maxWidth:200,lineHeight:1.7,marginBottom:20 }}>Upgrade your presence. One piece at a time.</p>
          <div style={{ display:"flex",gap:14 }}>
            <a href="https://instagram.com/davenportwardrobe" target="_blank" rel="noreferrer"
              style={{ display:"flex",alignItems:"center",gap:7,fontFamily:S.sans,fontSize:11,color:"#9ca3af",textDecoration:"none",border:"1px solid #1f2937",padding:"7px 14px",transition:"border-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#9ca3af"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#1f2937"}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              @davenportwardrobe
            </a>
            <a href="https://tiktok.com/@davenportwardrobe" target="_blank" rel="noreferrer"
              style={{ display:"flex",alignItems:"center",gap:7,fontFamily:S.sans,fontSize:11,color:"#9ca3af",textDecoration:"none",border:"1px solid #1f2937",padding:"7px 14px",transition:"border-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#9ca3af"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#1f2937"}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
              @davenportwardrobe
            </a>
          </div>
        </div>
        <div style={{ display:"flex",gap:56,flexWrap:"wrap" }}>
          {[["Shop",[["browse","Shop Pieces"],["wardrobes","Wardrobes"],["community","Community"]]],["Company",[["sustainability","Our Mission"]]]].map(([col,links])=>(
            <div key={col}>
              <p style={{ fontFamily:S.sans,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#4b5563",marginBottom:14 }}>{col}</p>
              {links.map(([p,label])=>(
                <button key={p} onClick={()=>setPage(p)} style={{ display:"block",background:"none",border:"none",cursor:"pointer",fontFamily:S.sans,fontSize:13,color:"#9ca3af",padding:"4px 0",textAlign:"left" }}>{label}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid #1f2937",paddingTop:20,display:"flex",justifyContent:"space-between" }}>
        <p style={{ fontFamily:S.sans,fontSize:11,color:"#374151" }}>© 2026 Davenport Wardrobe</p>
        <p style={{ fontFamily:S.sans,fontSize:11,color:"#374151" }}>Built for men who mean it.</p>
      </div>
    </footer>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useMobile();
  const { isSignedIn } = useUser();
  const [page,setPage]=useState("home");
  const [suitcase,setSuitcase]=useState([]);
  const [styleProfile,setStyleProfile]=useState([]);
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [items,setItems]=useState([]);
  const [loadingItems,setLoadingItems]=useState(true);
  const [buying,setBuying]=useState(null);
  const [rentals,setRentals]=useState([]);

  useEffect(()=>{
    fetch("/api/inventory")
      .then(r=>r.json())
      .then(rows=>{ setItems(Array.isArray(rows)?rows.map(dbItemToUi):[]); })
      .catch(()=>{ setItems([]); })
      .finally(()=>{ setLoadingItems(false); });
  },[]);

  useEffect(()=>{
    if(!isSignedIn) return;
    fetch("/api/rentals").then(r=>r.json()).then(d=>{ setRentals(Array.isArray(d)?d:[]); }).catch(()=>{});
  },[isSignedIn]);

  async function handleBuy(item) {
    if(!item._dbId||buying) return;
    setBuying(item._dbId);
    try {
      const res=await fetch("/api/checkout",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:item._dbId}) });
      const data=await res.json();
      if(data.url) window.location.href=data.url;
    } catch(e){}
    setBuying(null);
  }

  function addToSuitcase(item){ setSuitcase(s=>s.some(i=>i.id===item.id)?s:[...s,item]); }
  function removeFromSuitcase(id){ setSuitcase(s=>s.filter(i=>i.id!==id)); }

  function nav(p){
    if(p==="signup"){ setPage("auth-signup"); window.scrollTo(0,0); return; }
    if(p==="login"){  setPage("auth-login");  window.scrollTo(0,0); return; }
    setPage(p); window.scrollTo(0,0);
  }

  function render(){
    if(page==="waitlist")      return <HomePage setPage={nav} items={items} loadingItems={loadingItems}/>;
    if(page==="home")          return <HomePage setPage={nav} items={items} loadingItems={loadingItems}/>;
    if(page==="browse")        return <BrowsePage setPage={nav} addToSuitcase={addToSuitcase} suitcase={suitcase} items={items} onBuy={handleBuy} loading={loadingItems}/>;
    if(page==="wardrobes")     return <WardrobesPage setPage={nav} addToSuitcase={addToSuitcase} suitcase={suitcase} items={items}/>;
    if(page==="suitcase")      return <SuitcasePage suitcase={suitcase} removeFromSuitcase={removeFromSuitcase} setPage={nav} items={items} rentals={rentals}/>;
    if(page==="community")     return <CommunityPage setPage={nav}/>;
    if(page==="sustainability") return <SustainabilityPage/>;
    if(page==="auth-signup")   return <AuthPage mode="signup" setIsLoggedIn={setIsLoggedIn} setPage={setPage}/>;
    if(page==="auth-login")    return <AuthPage mode="login"  setIsLoggedIn={setIsLoggedIn} setPage={setPage}/>;
    if(page==="auth-gate")     return <AuthGatePage setPage={setPage}/>;
    if(page.startsWith("item-")) return <ItemDetailPage itemId={parseInt(page.replace("item-",""))} setPage={nav} addToSuitcase={addToSuitcase} suitcase={suitcase} items={items} onBuy={handleBuy} rentals={rentals}/>;
    if(page.startsWith("wardrobe-db-")) return <DbWardrobeDetailPage wardrobeId={parseInt(page.replace("wardrobe-db-",""))} setPage={nav} addToSuitcase={addToSuitcase} suitcase={suitcase} items={items}/>;
    if(page.startsWith("wardrobe-")) return <WardrobeDetailPage wardrobeId={page.replace("wardrobe-","")} setPage={nav} addToSuitcase={addToSuitcase} suitcase={suitcase}/>;
    return <HomePage setPage={nav}/>;
  }

  return (
    <>
      <style>{FONTS}{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#faf9f7;-webkit-font-smoothing:antialiased}
        button:focus,input:focus{outline:none}
        html{font-size:16px}
      `}</style>
      <Nav page={page} setPage={nav} suitcase={suitcase}/>
      <div style={{ paddingBottom: isMobile ? 64 : 0 }}>
        {render()}
        <Footer setPage={nav}/>
      </div>
    </>
  );
}
