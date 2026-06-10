"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

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

const EARN_WAYS = [
  { action: "Share a community post",    pts: 5,  icon: "📸" },
  { action: "Refer a friend",            pts: 1,  icon: "🤝" },
  { action: "Leave a piece review",      pts: 10, icon: "⭐" },
  { action: "Spend $50+ on an order",    pts: 20, icon: "🛍️" },
];

const REDEEM_WAYS = [
  { reward: "$10 off rentals $50+", pts: 100, icon: "🎁" },
];

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [points, setPoints] = useState(null);
  const [history, setHistory] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [styleProfile, setStyleProfile] = useState(null);
  const [studentVerified, setStudentVerified] = useState(false);
  const [eduEmail, setEduEmail] = useState("");
  const [eduInput, setEduInput] = useState("");
  const [eduSaving, setEduSaving] = useState(false);
  const [eduError, setEduError] = useState("");
  const [eduSuccess, setEduSuccess] = useState(false);
  const [rentals, setRentals] = useState([]);
  const [returningId, setReturningId] = useState(null);
  const [returnResult, setReturnResult] = useState({});
  const [buyingOutrightId, setBuyingOutrightId] = useState(null);
  const [buyOutrightResult, setBuyOutrightResult] = useState({});
  const isMobile = useMobile();

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    fetch(`/api/points?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(d => { setPoints(d.points ?? 0); setHistory(d.history ?? []); })
      .catch(() => {});
    fetch(`/api/referral?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(d => setReferralCode(d.referral_code ?? null))
      .catch(() => {});
    fetch(`/api/posts?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(rows => setUserPosts(Array.isArray(rows) ? rows : []))
      .catch(() => {});
    fetch("/api/style-profile").then(r=>r.json()).then(d=>{ if(d.style_profile) setStyleProfile(d.style_profile); }).catch(()=>{});
    fetch("/api/student-verify").then(r=>r.json()).then(d=>{ setStudentVerified(d.student_verified ?? false); setEduEmail(d.edu_email ?? ""); }).catch(()=>{});
    fetch("/api/rentals").then(r=>r.json()).then(d=>{ setRentals(Array.isArray(d) ? d : []); }).catch(()=>{});
  }, [isSignedIn, user?.id]);

  const referralLink = referralCode
    ? `https://davenport.rentals/?ref=${referralCode}`
    : null;

  async function handleStudentVerify(e) {
    e.preventDefault();
    if (!eduInput.endsWith(".edu")) { setEduError("Please enter a valid .edu email address."); return; }
    setEduSaving(true); setEduError("");
    try {
      const res = await fetch("/api/student-verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ edu_email: eduInput }) });
      const d = await res.json();
      if (!res.ok) { setEduError(d.error ?? "Something went wrong."); return; }
      setStudentVerified(true); setEduEmail(eduInput); setEduSuccess(true);
    } catch { setEduError("Something went wrong."); }
    finally { setEduSaving(false); }
  }

  async function handleReturn(orderId) {
    if (returningId) return;
    setReturningId(orderId);
    try {
      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const d = await res.json();
      if (d.ok) {
        setRentals(prev => prev.filter(r => r.id !== orderId));
        setReturnResult(prev => ({ ...prev, [orderId]: d.message }));
      } else {
        setReturnResult(prev => ({ ...prev, [orderId]: d.error ?? "Something went wrong." }));
      }
    } catch {
      setReturnResult(prev => ({ ...prev, [orderId]: "Something went wrong." }));
    }
    setReturningId(null);
  }

  async function handleBuyOutright(orderId) {
    if (buyingOutrightId) return;
    setBuyingOutrightId(orderId);
    try {
      const res = await fetch("/api/buy-outright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const d = await res.json();
      if (d.url) { window.location.href = d.url; return; }
      if (d.ok) {
        setRentals(prev => prev.filter(r => r.id !== orderId));
        setBuyOutrightResult(prev => ({ ...prev, [orderId]: d.message }));
      } else {
        setBuyOutrightResult(prev => ({ ...prev, [orderId]: d.error ?? "Something went wrong." }));
      }
    } catch {
      setBuyOutrightResult(prev => ({ ...prev, [orderId]: "Something went wrong." }));
    }
    setBuyingOutrightId(null);
  }

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!isLoaded) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:S.cream }}>
        <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted }}>Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:S.cream, fontFamily:S.sans }}>
        <p style={{ fontSize:13, letterSpacing:"0.16em", textTransform:"uppercase", color:S.tan, marginBottom:16 }}>Davenport</p>
        <h1 style={{ fontFamily:S.serif, fontSize:40, fontWeight:600, color:S.ink, marginBottom:12 }}>Members Only</h1>
        <p style={{ fontSize:14, color:S.muted, marginBottom:32 }}>Sign in to view your points and referral link.</p>
        <a href="/" style={{ background:S.ink, color:S.cream, padding:"12px 32px", fontSize:12, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none" }}>Go Home</a>
      </div>
    );
  }

  const progressPct = Math.min(100, ((points ?? 0) % 100));

  if (isMobile) {
    return (
      <div style={{ minHeight:"100vh", background:S.cream, fontFamily:S.sans, paddingBottom:80 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>

        {/* Mobile top bar */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${S.stone}`, padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <a href="/" style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, textDecoration:"none" }}>Davenport</a>
          <a href="/" style={{ fontFamily:S.sans, fontSize:12, color:S.muted, textDecoration:"none" }}>← Back</a>
        </div>

        {/* Instagram-style profile header */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${S.stone}`, padding:"28px 20px 20px" }}>
          {/* Avatar */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:20 }}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2px solid ${S.stone}` }} />
            ) : (
              <div style={{ width:80, height:80, borderRadius:"50%", background:S.ink, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:S.serif, fontSize:32, color:S.cream, fontWeight:600 }}>
                  {(user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
            <p style={{ fontSize:15, fontWeight:600, color:S.ink, marginTop:10 }}>
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName ?? "Member"}
            </p>
            <p style={{ fontSize:12, color:S.muted, marginTop:2 }}>{user?.primaryEmailAddress?.emailAddress}</p>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", textAlign:"center", borderTop:`1px solid ${S.stone}`, paddingTop:16 }}>
            <div>
              <p style={{ fontFamily:S.serif, fontSize:28, fontWeight:600, color:S.ink, lineHeight:1 }}>{points ?? "—"}</p>
              <p style={{ fontSize:11, color:S.muted, marginTop:4, letterSpacing:"0.06em" }}>Points</p>
            </div>
            <div style={{ borderLeft:`1px solid ${S.stone}`, borderRight:`1px solid ${S.stone}` }}>
              <p style={{ fontFamily:S.serif, fontSize:28, fontWeight:600, color:S.ink, lineHeight:1 }}>{userPosts.length}</p>
              <p style={{ fontSize:11, color:S.muted, marginTop:4, letterSpacing:"0.06em" }}>Posts</p>
            </div>
            <div>
              <p style={{ fontFamily:S.serif, fontSize:28, fontWeight:600, color:S.ink, lineHeight:1 }}>{referralCode ? 1 : 0}</p>
              <p style={{ fontSize:11, color:S.muted, marginTop:4, letterSpacing:"0.06em" }}>Referral</p>
            </div>
          </div>
        </div>

        {/* My Posts grid — Instagram style, full width below stats */}
        {userPosts.length > 0 ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, marginTop:2 }}>
            {userPosts.map(post => (
              <div key={post.id} style={{ aspectRatio:"1", background:"#d4b896", position:"relative", overflow:"hidden" }}>
                {post.image_url
                  ? <img src={post.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:10, background:"#c4a882" }}>
                      <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:10, color:"#fff", textAlign:"center", lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>{post.caption}</p>
                    </div>
                }
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background:"#fff", borderTop:`1px solid ${S.stone}`, padding:"24px 20px", textAlign:"center" }}>
            <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:S.muted }}>No posts yet. Share a fit on Community to earn 5 pts.</p>
          </div>
        )}

        <div style={{ padding:"0 16px", marginTop:16, display:"flex", flexDirection:"column", gap:12 }}>

          {/* My Rentals */}
          {rentals.length > 0 && (
            <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px" }}>
              <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:16 }}>My Rentals</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {rentals.map(r => {
                  const savings = r.original_buyout_price && r.current_buyout_price && r.original_buyout_price > r.current_buyout_price
                    ? ((r.original_buyout_price - r.current_buyout_price) / 100).toFixed(2) : null;
                  const currentBuyout = r.current_buyout_price ? (r.current_buyout_price / 100).toFixed(2) : null;
                  const actionResult = returnResult[r.id] || buyOutrightResult[r.id];
                  return (
                    <div key={r.id} style={{ border:`1px solid ${S.stone}`, padding:"14px 16px" }}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ width:52, height:52, background:"#f5f3f0", flexShrink:0, overflow:"hidden" }}>
                          {r.image_url
                            ? <img src={r.image_url} alt={r.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👕</div>}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:S.tan, marginBottom:2 }}>{r.brand}</p>
                          <p style={{ fontFamily:S.serif, fontSize:16, fontWeight:600, color:S.ink, lineHeight:1.2 }}>{r.name}</p>
                          <p style={{ fontSize:12, color:S.muted, marginTop:4 }}>${(r.amount / 100).toFixed(2)}/mo</p>
                          {r.next_billing_date && (
                            <p style={{ fontSize:11, color:S.muted, marginTop:2 }}>Next billing: {formatDate(r.next_billing_date)}</p>
                          )}
                        </div>
                      </div>
                      {currentBuyout && (
                        <div style={{ background:"#f8f6f3", border:`1px solid ${S.stone}`, padding:"10px 12px", marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, color:S.muted }}>Months rented</span>
                            <span style={{ fontSize:11, fontWeight:600, color:S.ink }}>{r.months_rented ?? 0}</span>
                          </div>
                          {r.original_buyout_price && (
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                              <span style={{ fontSize:11, color:S.muted }}>Original buyout</span>
                              <span style={{ fontSize:11, color:S.muted }}>${(r.original_buyout_price / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom: savings ? 6 : 0 }}>
                            <span style={{ fontSize:11, fontWeight:600, color:S.ink }}>Your buyout</span>
                            <span style={{ fontSize:13, fontWeight:700, color:S.ink }}>${currentBuyout}</span>
                          </div>
                          {savings && (
                            <p style={{ fontSize:10, color:"#16a34a", lineHeight:1.5 }}>
                              {r.months_rented} month{r.months_rented !== 1 ? "s" : ""} of renting reduced your buyout by <strong>${savings}</strong>
                            </p>
                          )}
                        </div>
                      )}
                      {actionResult ? (
                        <p style={{ fontSize:12, color:"#16a34a", fontWeight:500 }}>{actionResult}</p>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {currentBuyout && (
                            <button
                              onClick={() => handleBuyOutright(r.id)}
                              disabled={buyingOutrightId === r.id}
                              style={{ width:"100%", background:S.ink, color:S.cream, border:"none", cursor:buyingOutrightId===r.id?"not-allowed":"pointer", padding:"9px 0", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", opacity:buyingOutrightId===r.id?0.6:1 }}>
                              {buyingOutrightId === r.id ? "Processing…" : `Buy Outright — $${currentBuyout}`}
                            </button>
                          )}
                          <button
                            onClick={() => handleReturn(r.id)}
                            disabled={returningId === r.id}
                            style={{ width:"100%", background:"transparent", color:"#dc2626", border:"1px solid #fca5a5", cursor:returningId===r.id?"not-allowed":"pointer", padding:"9px 0", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", opacity:returningId===r.id?0.6:1 }}>
                            {returningId === r.id ? "Processing…" : "Return Item"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress toward reward */}
          <div style={{ background:S.ink, padding:"20px 20px", borderRadius:2 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
              <p style={{ fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"#6b5e4e", fontWeight:500 }}>Progress to $10 Off</p>
              <p style={{ fontFamily:S.serif, fontSize:22, fontWeight:600, color:S.cream }}>{points ?? 0} pts</p>
            </div>
            <div style={{ background:"#1f2937", height:6, borderRadius:3, overflow:"hidden", marginBottom:8 }}>
              <div style={{ background:S.gold, height:"100%", width:`${progressPct}%`, transition:"width 0.6s ease", borderRadius:3 }}/>
            </div>
            <p style={{ fontSize:11, color:S.tan }}>{(points ?? 0) % 100} / 100 pts — <strong style={{ color:S.gold }}>100 pts = $10 off rentals $50+</strong></p>
          </div>

          {/* Referral */}
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px" }}>
            <p style={{ fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:S.tan, marginBottom:8, fontWeight:500 }}>Referral Program</p>
            <p style={{ fontFamily:S.serif, fontSize:22, fontWeight:600, color:S.ink, marginBottom:6 }}>Earn 1 pt per referral</p>
            <p style={{ fontSize:13, color:S.muted, marginBottom:16, lineHeight:1.6 }}>Share your link. When someone signs up with your code, you get 1 point.</p>
            {referralLink ? (
              <>
                <div style={{ display:"flex", gap:0 }}>
                  <div style={{ flex:1, background:S.cream, border:`1px solid ${S.stone}`, padding:"11px 14px", fontFamily:"monospace", fontSize:11, color:S.muted, overflowX:"auto", whiteSpace:"nowrap" }}>
                    {referralLink}
                  </div>
                  <button onClick={copyLink} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"11px 20px", fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0, minHeight:44 }}>
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
                {referralCode && (
                  <p style={{ fontSize:11, color:S.tan, marginTop:10 }}>Code: <strong style={{ letterSpacing:"0.08em" }}>{referralCode}</strong></p>
                )}
              </>
            ) : (
              <p style={{ fontSize:12, color:S.muted }}>Generating your link…</p>
            )}
          </div>

          {/* How to Earn */}
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px" }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:16 }}>How to Earn</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {EARN_WAYS.map(({ action, pts, icon }) => (
                <div key={action} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:10, borderBottom:`1px solid ${S.stone}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:S.ink }}>{action}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:S.tan, whiteSpace:"nowrap" }}>+{pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Redeem */}
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px" }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:16 }}>How to Redeem</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {REDEEM_WAYS.map(({ reward, pts, icon }) => (
                <div key={reward} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:10, borderBottom:`1px solid ${S.stone}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:S.ink }}>{reward}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:S.tan, whiteSpace:"nowrap" }}>{pts.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Points history */}
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px" }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:16 }}>Points History</h3>
            {history.length === 0 ? (
              <p style={{ fontSize:13, color:S.muted }}>No points earned yet — start by sharing a community post or referring a friend.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {history.map((row, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom: i < history.length - 1 ? `1px solid ${S.stone}` : "none" }}>
                    <div>
                      <p style={{ fontSize:13, color:S.ink, marginBottom:2 }}>{row.reason ?? "Points added"}</p>
                      <p style={{ fontSize:11, color:S.muted }}>{formatDate(row.created_at)}</p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color: row.amount > 0 ? "#16a34a" : "#dc2626" }}>
                      {row.amount > 0 ? "+" : ""}{row.amount} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Style */}
          {styleProfile && (
            <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px", marginTop:24 }}>
              <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:6 }}>My Style</h3>
              <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:18 }}>Your style profile from the quiz.</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {Object.entries(styleProfile).map(([k, v]) => (
                  <span key={k} style={{ fontFamily:S.sans, fontSize:12, fontWeight:500, background:S.cream, border:`1px solid ${S.stone}`, color:S.ink, padding:"6px 14px", letterSpacing:"0.04em" }}>{v}</span>
                ))}
              </div>
              <a href="/" style={{ fontFamily:S.sans, fontSize:11, color:S.muted, textDecoration:"underline" }}>Retake quiz on Wardrobes page</a>
            </div>
          )}

          {/* Student Discount */}
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"20px 20px", marginTop:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink }}>Student Discount</h3>
              {studentVerified && (
                <span style={{ fontFamily:S.sans, fontSize:11, fontWeight:600, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", padding:"4px 12px", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  Student Member ✓
                </span>
              )}
            </div>
            {studentVerified ? (
              <>
                <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:8 }}>Verified with <strong style={{ color:S.ink }}>{eduEmail}</strong></p>
                <p style={{ fontFamily:S.sans, fontSize:14, fontWeight:500, color:"#16a34a" }}>You qualify for 15% off your monthly rate.</p>
              </>
            ) : (
              <>
                <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:20, lineHeight:1.7 }}>Verify your student status with a .edu email to unlock 15% off your monthly rental rate.</p>
                <form onSubmit={handleStudentVerify} style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
                  <input type="email" value={eduInput} onChange={e=>setEduInput(e.target.value)} placeholder="yourname@university.edu"
                    style={{ flex:1, padding:"11px 16px", fontFamily:S.sans, fontSize:13, color:S.ink, border:`1px solid ${S.stone}`, background:S.cream, minWidth:200 }}/>
                  <button type="submit" disabled={eduSaving} style={{ background:S.ink, color:S.cream, border:"none", cursor:eduSaving?"not-allowed":"pointer", padding:"11px 24px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0, opacity:eduSaving?0.7:1 }}>
                    {eduSaving ? "Verifying…" : "Verify"}
                  </button>
                </form>
                {eduError && <p style={{ fontFamily:S.sans, fontSize:12, color:"#dc2626", marginTop:8 }}>{eduError}</p>}
                {eduSuccess && <p style={{ fontFamily:S.sans, fontSize:12, color:"#16a34a", marginTop:8 }}>✓ Student status verified! You qualify for 15% off.</p>}
              </>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ minHeight:"100vh", background:S.cream, fontFamily:S.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${S.stone}`, padding:"0 40px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ fontFamily:S.serif, fontSize:22, fontWeight:600, color:S.ink, textDecoration:"none", letterSpacing:"-0.5px" }}>Davenport</a>
        <a href="/" style={{ fontFamily:S.sans, fontSize:12, color:S.muted, textDecoration:"none", letterSpacing:"0.04em" }}>← Back</a>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"52px 40px 80px" }}>
        <p style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10, fontWeight:500 }}>Your Account</p>
        <h1 style={{ fontFamily:S.serif, fontSize:42, fontWeight:600, letterSpacing:"-1px", color:S.ink, marginBottom:8 }}>
          {user?.firstName ? `Hey, ${user.firstName}.` : "Your Points"}
        </h1>
        <p style={{ fontSize:14, color:S.muted, marginBottom:48 }}>{user?.primaryEmailAddress?.emailAddress}</p>

        {/* Points card */}
        <div style={{ background:S.ink, padding:"40px 44px", marginBottom:32, display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#6b5e4e", marginBottom:12, fontWeight:500 }}>Point Balance</p>
            <p style={{ fontFamily:S.serif, fontSize:72, fontWeight:600, color:S.cream, lineHeight:1, letterSpacing:"-2px", marginBottom:6 }}>
              {points ?? "—"}
            </p>
            <p style={{ fontSize:12, color:S.tan }}>points</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <p style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>Progress to next $10 off</p>
            <div style={{ background:"#1f2937", height:6, borderRadius:3, overflow:"hidden", marginBottom:8 }}>
              <div style={{ background:S.gold, height:"100%", width:`${progressPct}%`, transition:"width 0.6s ease", borderRadius:3 }}/>
            </div>
            <p style={{ fontSize:11, color:S.tan }}>
              {points !== null ? `${(points ?? 0) % 100} / 100 pts` : "…"} — <strong style={{ color:S.gold }}>100 pts = $10 off rentals $50+</strong>
            </p>
          </div>
        </div>

        {/* Referral */}
        <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"32px 36px", marginBottom:32 }}>
          <p style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:S.tan, marginBottom:10, fontWeight:500 }}>Referral Program</p>
          <h2 style={{ fontFamily:S.serif, fontSize:26, fontWeight:600, color:S.ink, marginBottom:8 }}>Earn 1 pt per referral</h2>
          <p style={{ fontSize:13, color:S.muted, marginBottom:20, lineHeight:1.7 }}>Share your link. When someone signs up with your code, you get 1 point. No limit.</p>
          {referralLink ? (
            <div style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
              <div style={{ flex:1, background:S.cream, border:`1px solid ${S.stone}`, padding:"11px 16px", fontFamily:"monospace", fontSize:12, color:S.muted, minWidth:200, overflowX:"auto", whiteSpace:"nowrap" }}>
                {referralLink}
              </div>
              <button onClick={copyLink} style={{ background:S.ink, color:S.cream, border:"none", cursor:"pointer", padding:"11px 24px", fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0 }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize:12, color:S.muted }}>Generating your link…</p>
          )}
          {referralCode && (
            <p style={{ fontSize:11, color:S.tan, marginTop:10 }}>Your code: <strong style={{ letterSpacing:"0.08em" }}>{referralCode}</strong></p>
          )}
        </div>

        {/* My Rentals */}
        {rentals.length > 0 && (
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px", marginBottom:32 }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:20 }}>My Rentals</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {rentals.map((r, i) => {
                const savings = r.original_buyout_price && r.current_buyout_price && r.original_buyout_price > r.current_buyout_price
                  ? ((r.original_buyout_price - r.current_buyout_price) / 100).toFixed(2) : null;
                const currentBuyout = r.current_buyout_price ? (r.current_buyout_price / 100).toFixed(2) : null;
                const actionResult = returnResult[r.id] || buyOutrightResult[r.id];
                return (
                  <div key={r.id} style={{ padding:"20px 0", borderBottom: i < rentals.length - 1 ? `1px solid ${S.stone}` : "none" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
                      <div style={{ width:60, height:60, background:"#f5f3f0", flexShrink:0, overflow:"hidden" }}>
                        {r.image_url
                          ? <img src={r.image_url} alt={r.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>👕</div>}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:S.tan, marginBottom:2 }}>{r.brand}</p>
                        <p style={{ fontFamily:S.serif, fontSize:17, fontWeight:600, color:S.ink, marginBottom:3 }}>{r.name}</p>
                        <p style={{ fontFamily:S.serif, fontSize:18, fontWeight:700, color:S.ink }}>
                          ${(r.amount / 100).toFixed(2)}<span style={{ fontFamily:S.sans, fontSize:11, color:S.muted, fontWeight:400 }}>/mo</span>
                        </p>
                        {r.next_billing_date && (
                          <p style={{ fontSize:11, color:S.muted, marginTop:3 }}>Next billing: {formatDate(r.next_billing_date)}</p>
                        )}
                        {currentBuyout && (
                          <div style={{ background:"#f8f6f3", border:`1px solid ${S.stone}`, padding:"10px 14px", marginTop:12, display:"inline-flex", flexDirection:"column", gap:3, minWidth:260 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", gap:32 }}>
                              <span style={{ fontSize:11, color:S.muted }}>Months rented</span>
                              <span style={{ fontSize:11, fontWeight:600, color:S.ink }}>{r.months_rented ?? 0}</span>
                            </div>
                            {r.original_buyout_price && (
                              <div style={{ display:"flex", justifyContent:"space-between", gap:32 }}>
                                <span style={{ fontSize:11, color:S.muted }}>Original buyout</span>
                                <span style={{ fontSize:11, color:S.muted }}>${(r.original_buyout_price / 100).toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ display:"flex", justifyContent:"space-between", gap:32 }}>
                              <span style={{ fontSize:11, fontWeight:600, color:S.ink }}>Your buyout price</span>
                              <span style={{ fontSize:13, fontWeight:700, color:S.ink }}>${currentBuyout}</span>
                            </div>
                            {savings && (
                              <p style={{ fontSize:10, color:"#16a34a", marginTop:2 }}>
                                {r.months_rented} month{r.months_rented !== 1 ? "s" : ""} of renting reduced your buyout by <strong>${savings}</strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", flexShrink:0, paddingTop:4 }}>
                        {actionResult ? (
                          <p style={{ fontSize:12, color:"#16a34a", fontWeight:500, maxWidth:220, textAlign:"right" }}>{actionResult}</p>
                        ) : (
                          <>
                            {currentBuyout && (
                              <button
                                onClick={() => handleBuyOutright(r.id)}
                                disabled={buyingOutrightId === r.id}
                                style={{ background:S.ink, color:S.cream, border:"none", cursor:buyingOutrightId===r.id?"not-allowed":"pointer", padding:"8px 20px", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", opacity:buyingOutrightId===r.id?0.6:1, whiteSpace:"nowrap" }}>
                                {buyingOutrightId === r.id ? "Processing…" : `Buy Outright — $${currentBuyout}`}
                              </button>
                            )}
                            <button
                              onClick={() => handleReturn(r.id)}
                              disabled={returningId === r.id}
                              style={{ background:"transparent", color:"#dc2626", border:"1px solid #fca5a5", cursor:returningId===r.id?"not-allowed":"pointer", padding:"7px 18px", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", opacity:returningId===r.id?0.6:1 }}>
                              {returningId === r.id ? "Processing…" : "Return Item"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Earn + Redeem tables */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:32 }}>
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px" }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:20 }}>How to Earn</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {EARN_WAYS.map(({ action, pts, icon }) => (
                <div key={action} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, borderBottom:`1px solid ${S.stone}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:S.ink }}>{action}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:S.tan, whiteSpace:"nowrap" }}>+{pts} pts</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px" }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:20 }}>How to Redeem</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {REDEEM_WAYS.map(({ reward, pts, icon }) => (
                <div key={reward} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, borderBottom:`1px solid ${S.stone}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:S.ink }}>{reward}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:S.tan, whiteSpace:"nowrap" }}>{pts.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points history */}
        <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px", marginBottom:32 }}>
          <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:20 }}>Points History</h3>
          {history.length === 0 ? (
            <p style={{ fontSize:13, color:S.muted }}>No points earned yet — start by sharing a community post or referring a friend.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {history.map((row, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom: i < history.length - 1 ? `1px solid ${S.stone}` : "none" }}>
                  <div>
                    <p style={{ fontSize:13, color:S.ink, marginBottom:2 }}>{row.reason ?? "Points added"}</p>
                    <p style={{ fontSize:11, color:S.muted }}>{formatDate(row.created_at)}</p>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color: row.amount > 0 ? "#16a34a" : "#dc2626" }}>
                    {row.amount > 0 ? "+" : ""}{row.amount} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Posts */}
        <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px" }}>
          <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:20 }}>My Posts</h3>
          {userPosts.length === 0 ? (
            <p style={{ fontSize:13, color:S.muted }}>No posts yet — share your first fit on the Community page and earn 5 pts.</p>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {userPosts.map(post => (
                <div key={post.id} style={{ aspectRatio:"1", background:"#c4a882", position:"relative", overflow:"hidden" }}>
                  {post.image_url
                    ? <img src={post.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                    : <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:12, background:"linear-gradient(135deg,#c4a882,#9c8b78)" }}>
                        <p style={{ fontSize:11, color:"#fff", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical" }}>{post.caption}</p>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.6)", marginTop:6, letterSpacing:"0.06em" }}>{formatDate(post.created_at)}</p>
                      </div>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Style */}
        {styleProfile && (
          <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px", marginTop:24 }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink, marginBottom:6 }}>My Style</h3>
            <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:18 }}>Your style profile from the quiz.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
              {Object.entries(styleProfile).map(([k, v]) => (
                <span key={k} style={{ fontFamily:S.sans, fontSize:12, fontWeight:500, background:S.cream, border:`1px solid ${S.stone}`, color:S.ink, padding:"6px 14px", letterSpacing:"0.04em" }}>{v}</span>
              ))}
            </div>
            <a href="/" style={{ fontFamily:S.sans, fontSize:11, color:S.muted, textDecoration:"underline" }}>Retake quiz on Wardrobes page</a>
          </div>
        )}

        {/* Student Discount */}
        <div style={{ background:"#fff", border:`1px solid ${S.stone}`, padding:"28px 28px", marginTop:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <h3 style={{ fontFamily:S.serif, fontSize:20, fontWeight:600, color:S.ink }}>Student Discount</h3>
            {studentVerified && (
              <span style={{ fontFamily:S.sans, fontSize:11, fontWeight:600, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", padding:"4px 12px", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Student Member ✓
              </span>
            )}
          </div>
          {studentVerified ? (
            <>
              <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:8 }}>Verified with <strong style={{ color:S.ink }}>{eduEmail}</strong></p>
              <p style={{ fontFamily:S.sans, fontSize:14, fontWeight:500, color:"#16a34a" }}>You qualify for 15% off your monthly rate.</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily:S.sans, fontSize:13, color:S.muted, marginBottom:20, lineHeight:1.7 }}>Verify your student status with a .edu email to unlock 15% off your monthly rental rate.</p>
              <form onSubmit={handleStudentVerify} style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
                <input type="email" value={eduInput} onChange={e=>setEduInput(e.target.value)} placeholder="yourname@university.edu"
                  style={{ flex:1, padding:"11px 16px", fontFamily:S.sans, fontSize:13, color:S.ink, border:`1px solid ${S.stone}`, background:S.cream, minWidth:200 }}/>
                <button type="submit" disabled={eduSaving} style={{ background:S.ink, color:S.cream, border:"none", cursor:eduSaving?"not-allowed":"pointer", padding:"11px 24px", fontFamily:S.sans, fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0, opacity:eduSaving?0.7:1 }}>
                  {eduSaving ? "Verifying…" : "Verify"}
                </button>
              </form>
              {eduError && <p style={{ fontFamily:S.sans, fontSize:12, color:"#dc2626", marginTop:8 }}>{eduError}</p>}
              {eduSuccess && <p style={{ fontFamily:S.sans, fontSize:12, color:"#16a34a", marginTop:8 }}>✓ Student status verified! You qualify for 15% off.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
