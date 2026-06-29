# Davenport Wardrobe — Master Plan

> **Last revised:** 2026-06-28 | **Status:** App live on App Store (Build 27). Admin panel fully deployed. First real inventory cycle underway. Web checkout is the #1 priority for early growth.

---

## How to Use This Document

Read this at the start of every session. It is the strategic, product, and operational source of truth for Davenport. Start each session by reading this file, then check what phase is currently active.

---

# PART I — CORE IDENTITY

## What Davenport Is

**Davenport is not a clothing rental company.**

**Davenport is a wardrobe flexibility platform where renting, returning, and buying are all successful outcomes.**

Every feature, pricing decision, UX flow, and business decision must be evaluated against that principle.

## What Customers Are Paying For

- **Flexibility** — wear what they want, return when they want
- **Confidence** — show up dressed for the moment
- **Reduced Risk** — no regret purchases, no missed return windows
- **Wardrobe Simplicity** — right pieces, when needed, without clutter
- **Lifestyle Adaptability** — a wardrobe that grows with them

Davenport competes against the **friction of traditional wardrobe ownership**, not just other rental companies.

## What Davenport Is Not

Not fast fashion. Not a mystery box. Not a subscription that forces products. Not luxury-only.

Davenport is: customer-directed, flexible, transparent, buyout-friendly, wardrobe-focused.

Customers always control: what they rent, what they return, what they buy, how long they keep it.

## The Davenport Promise

Traditional retail requires customers to: predict what they'll like, predict what will fit, pay upfront, manage return windows, store and organize everything, accept full ownership risk.

**Davenport removes those burdens. Ownership becomes optional rather than mandatory.**

This principle must influence every product decision — from how buttons are labeled to how emails are written.

---

# PART II — CURRENT AUDIENCE (Launch State)

## Primary: Young Professionals, 22–30

Consulting, finance, real estate, tech, startups. Building a professional identity. Moving between cities and roles. Income exists but large upfront wardrobe spend feels wasteful.

**Launch inventory focus:** Men's workwear, smart casual, business dress. Brands like Bonobos, J.Crew, Banana Republic.

## Secondary: College Students

Internships, career fairs, interviews, formals. High price sensitivity — multi-piece discounts matter most here.

---

# PART III — EXPANSION AUDIENCES (Post-Launch)

These two audiences are the next major growth levers. They are not launch-day targets — they require inventory investment and possibly UI updates. But they should inform every product decision from day one.

## Expansion 1: Women

**Why this is the bigger market:** Women's fashion is a larger market by volume and frequency. Women are more likely to rent for occasion-specific needs (event dressing, seasonal refreshes, trying new styles) and are culturally more accustomed to outfit variety.

**What Davenport offers them:**
- Wedding guest, holiday events, travel, work wardrobe
- Trend exploration without commitment
- Maternity and postpartum flexibility
- Style experimentation with no buyer's remorse

**What needs to happen to unlock women:**
1. Add women's inventory — workwear, going out, casual, seasonal
2. Add women's wardrobes to the browse experience
3. Update marketing copy for a women-first angle (not just professional)
4. Flyer redesigns for women's use cases (see FLYERS.md)
5. Review size run — women's sizing requires more SKUs per item

**Expected timing:** First batch of women's inventory whenever budget allows. No tech work required — just inventory additions in admin.

## Expansion 2: Kids

**Why this is the obvious market:** Kids grow constantly. Clothing they fit in today may not fit them in 3 months. Parents are spending money on clothes that are worn briefly, outgrown, and discarded. Davenport is the natural solution.

**What Davenport offers kids/parents:**
- School clothes (uniforms, picture day, back-to-school)
- Event clothing (weddings, holidays, Easter, graduation)
- Seasonal outfits (ski trip, summer wardrobe, Halloween costumes)
- Sports and activewear as kids try different activities
- Growing phase coverage — rent through the growth spurt, return, move up a size

**What needs to happen to unlock kids:**
1. Add kids' inventory categories (boys, girls, by age/size)
2. COPPA compliance audit — no account creation for under 13; parent account owns all kids' rentals
3. Size system update — use age ranges (2T, 4T, 4, 6, 8, etc.) not adult S/M/L
4. "Growing Up" wardrobe collection — marketed to parents
5. Simpler return flow — kids' clothes get more wear, potentially expedited returns

**Expected timing:** Phase 2 of post-launch. Get women's inventory running first, then expand to kids.

---

# PART IV — STRATEGIC PRIORITIES

When tradeoffs occur, prioritize in this order:

1. **Customer Adoption** — low barrier to start
2. **Customer Retention** — keep them in the ecosystem
3. **Rental Frequency** — regular, multi-piece usage
4. **Buyout Frequency** — buyouts are a primary success metric
5. **Customer Lifetime Value** — optimize the relationship, not the transaction
6. **Margin Optimization** — comes last

A customer retained 3 years > maximizing revenue from their first order.

The primary growth lever is **moving customers from 1 item to 3+ items**, not acquiring new customers.

---

# PART V — INVENTORY PHILOSOPHY

**Davenport acquires inventory based on proven demand, not assumptions.**

1. Customer places order → demand confirmed
2. Davenport purchases item from retailer
3. Item enters inventory
4. Future rentals generate higher-margin revenue on an already-paid-for asset

Every first rental = a **market validation event**. Popular products become inventory. Unpopular products never consume capital.

## Size Acquisition Rules

**Core rule: We only acquire the size that was ordered. Not all sizes.**

| Stage | Rule |
|---|---|
| Launch (now) | Source only the exact size ordered. One order = one piece. |
| Growing ($) | If a product gets 3+ orders across any sizes, consider stocking 2–3 sizes proactively. |
| Scaled ($$$) | Source full size runs for proven bestsellers. |

## Recovery Ratio

Track per item: `rental_count`, `total_rental_revenue_cents`, `cost_price`.

| Ratio | Status | Action |
|---|---|---|
| 0–0.5 | Unrecovered | Feature prominently |
| 0.5–1.0 | Partially recovered | Standard placement |
| 1.0–2.0 | Recovered | Protect it |
| 2.0+ | Excellent | Candidate for retirement + liquidation |

**Underperforming pieces** (utilization < 30% or 60+ days without rental):
1. Promote to featured
2. Reduce rental fee 10–20%
3. Reduce buyout below standard floor
4. Retire and liquidate (Poshmark, eBay)

---

# PART VI — PRICING MODEL

## Base Constants

| Constant | Value | Meaning |
|---|---|---|
| `BASE_RENTAL_RATE` | 0.15 | $80 item = $12/mo |
| `BUYOUT_START_MULT` | 0.90 | First buyout opportunity |
| `WEAR_DISCOUNT` | 0.010 | Price drops each month |
| `MIN_RENTAL_RATE` | 0.05 | Floor — never goes below 5% of cost |
| `MIN_BUYOUT_MULT` | 0.30 | Floor — never below 30% of cost |
| `RETIRE_THRESHOLD` | 400 | $4/month floor before retirement |

## What This Looks Like for Customers

| Item Cost | Monthly Rent | Customer Reaction |
|---|---|---|
| $40 | $6 | Clearly affordable |
| $80 | $12 | Easy impulse add |
| $120 | $18 | Reasonable |
| $200 | $30 | Justified for premium |

## Buyout Pricing

```
buyout_price = max(cost × 0.30, cost × (0.90 − wear_count × 0.08))
```

| Wears | Buyout on $80 item |
|---|---|
| 0 (new) | $72 |
| 3 months | $53 |
| 5 months | $40 |
| 8+ months | $24 (floor) |

**Loyalty bonus:** After 6+ continuous months renting the same item, customer gets an additional 5% off buyout price.

## Multi-Piece Bundle Discounts

| Active Rentals | Discount |
|---|---|
| 1 | 0% |
| 2 | 8% |
| 3–4 | 18% |
| 5–6 | 25% |
| 7+ | 30% |

---

# PART VII — RETENTION

| Trigger | Timing | Message |
|---|---|---|
| Onboarding | After signup | "Add your first piece" |
| First return | 1 day after | "Ready to swap? New arrivals." |
| Idle | 30 days no rental | "Your wardrobe is waiting." |
| Long-hold | 3 months rental | "Still loving it? Buy it for $X." |
| Loyalty buyout | 6 months rental | "You've earned a loyalty discount." |
| Near tier | 1 item from next tier | "Add one more piece to save X% on everything." |

**Churn prevention:** If customer goes to 0 active rentals, wait 14 days then send curated "What's new for your size" + offer first-month free on 1 item.

---

# PART VIII — TECH STACK

| Layer | Choice |
|---|---|
| Mobile app | Expo SDK 56 / RN 0.85, expo-router, nativewind v4, zustand, tanstack-query |
| Backend | Supabase (Postgres + RLS + Edge Functions) |
| Payments | Stripe (SetupIntent + manual deposit + cron billing) |
| Email | Resend |
| AI (admin) | Anthropic Claude API (product extraction from URLs) |
| Admin tool | Next.js 14 at admin.davenport.rentals |
| Web | Next.js at davenport.rentals (Vercel) |
| Native builds | EAS Build |

## Key Files

| Need | Location |
|---|---|
| Brand colors, fonts | `constants/colors.ts`, `constants/layout.ts` |
| TypeScript types | `types/index.ts` |
| Pricing math | `utils/pricing.ts` |
| Supabase client | `lib/supabase.ts` |
| Auth store | `store/authStore.ts` |
| Suitcase store | `store/suitcaseStore.ts` |
| DB migrations | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| Admin tool | `admin/` |
| Web app | `web/` |
| Flyer concepts | `FLYERS.md` |

---

# PART IX — BUILD HISTORY

All original build phases are complete. This section is a record of what was built.

| Phase | Status | Summary |
|---|---|---|
| 1 — Bootstrap | ✅ Done | Types, constants, utils, stores, nav structure, brand system |
| 2 — Database | ✅ Done | 29 migrations, all tables, Realtime, seeded inventory |
| 3 — Auth | ✅ Done | Login, signup, complete-profile, forgot-password, rental-terms |
| 3.5 — Admin | ✅ Done | Next.js admin, AI extraction, full ops panel — roles, orders, rentals, refunds, wardrobes |
| 4 — Browse | ✅ Done | Home, Browse, Wardrobe Detail, Piece Detail with skeletons + errors |
| 5 — Suitcase | ✅ Done | Cart, availability check, bundle discount upsell banner |
| 6 — Stripe | ✅ Done | 11 Edge Functions, cron billing, all secrets set |
| 7 — Checkout | ✅ Done | Path A (new card) + Path B (returning customer), atomic order creation |
| 8 — Order Status | ✅ Done | Real-time order status, buyout flow |
| 9 — Account | ✅ Done | Active rentals, buyout CTA, billing summary, address, sign out |
| 10 — Polish | ✅ Done | Web parity, retention emails, error/empty/skeleton states everywhere |
| 11 — Deployment | ✅ Done | Stripe live key set, EAS build submitted to App Store |
| 26 — Build 26 sweep | ✅ Done | Image loading fix, wardrobe UX, edge function hardening, admin dashboard stats |
| 27 — Build 27 sweep | ✅ Done | FilterSheet fix, auth fixes, wardrobe cover art, admin full deploy, web .next cleanup |

---

# PART X — CURRENT STATE (June 28, 2026)

## What Works Today

- Browse pieces and wardrobes ✅
- Checkout with card (Stripe live mode) ✅
- Order confirmation + email ✅
- Account screen with active rentals — buyout, return, swap actions ✅
- Buyout available at any rental stage (before delivery, mid-rental, after months) ✅
- Customer refund request in-app — emails admin, 30-day window enforced ✅
- Admin tool (davenport-admin.vercel.app) — full ops panel ✅
  - Orders, rentals, pieces, wardrobes, pricing, announcements, app settings
  - Role-based access: admin (full) vs catalog (pieces + wardrobes only)
  - Non-return charge, excess damage charge, deposit capture/release, refund
  - Wardrobe editor with piece image mosaic and tag management
- Rental terms — rolling 30-day billing, non-return buyout, damage excess, refund policy ✅
- Web site at davenport.rentals (browse-only, no checkout yet) ✅
- Force update gating via Supabase `app_config` table ✅
- Sign in with Apple live ✅
- Per-unit inventory tracking (piece_units) ✅

## Feature Flags (flip in Supabase `app_settings` table)

| Flag | Current | What it unlocks |
|---|---|---|
| `womens_enabled` | `false` | Gender toggle in profile, women's browse filter |
| `trips_enabled` | `false` | Trips tab in app — plan outfits by trip/occasion |

## What's Live

- App Store approved and live (v1.0.3 / Build 27) ✅
- Admin panel deployed to Vercel ✅
- Supabase URL Configuration set (Site URL + `davenport://**` redirect) ✅
- Sign in with Apple live ✅
- Apple Pay in Stripe Payment Sheet live ✅

## Immediate Next Priorities

1. **Web checkout** (Phase 18) — let customers order from davenport.rentals without the app
2. **Women's inventory** — add pieces + create wardrobes, then flip `womens_enabled`
3. **Trips polish** — review UX, connect to suitcase flow, then flip `trips_enabled`

---

# PART XI — POST-LAUNCH ROADMAP

## Phase 12 — Auth & Checkout Polish ✅ Done (Build #11)

**Goal:** Reduce friction at the two biggest drop-off points — signup and checkout.

- [x] Add Sign in with Apple (`expo-apple-authentication`) — Supabase configured, provisioning profile updated
- [x] Google Sign-In removed — OAuth redirect flow broken, deferred to Phase 12.5
- [x] Add Apple Pay to Stripe Payment Sheet (`merchantIdentifier` already in `app.json`)
- [x] Shipping copy standardized to "Ships in 1–2 weeks" everywhere
- [x] ForceUpdateModal wired to live `needsUpdate` flag
- [x] Set Supabase URL Configuration (Site URL + `davenport://**` redirect)

## Phase 12.5 — Google Sign-In (Deferred)

**Why deferred:** The Google OAuth redirect flow returned 400 "validation failed / provider not enabled" despite correct Supabase config and Google Cloud Console setup. Root cause unclear — possibly a Supabase GoTrue bug with the PKCE redirect flow for custom-scheme apps. Apple Sign-In covers the immediate social auth need.

**To revisit:**
- [ ] Try `expo-auth-session` with `useProxy: true` (Expo auth proxy avoids custom scheme issues)
- [ ] Or wait for Supabase to fix PKCE + custom scheme redirect handling
- [ ] Google Cloud Console: Web application client, callback `https://rjplmjtydknascuqvyzq.supabase.co/auth/v1/callback`
- [ ] Supabase: Google provider enabled with correct Client ID + Secret

## Phase 13 — Women's Expansion

**Goal:** Open inventory and marketing to women. The tech is already built and gated — this is primarily an inventory and content play.

**Strategic note (June 2026):** Women's is the next major growth lever. Women are the audience most attached to their clothes and most naturally suited to rental — more occasion-specific needs, higher outfit variety, stronger cultural habit of wardrobe refresh. The long-term vision is a "his and hers" experience: two distinct but complementary sides of Davenport that share the same platform. Men's launches first to build the operational foundation. Women's follows as soon as inventory budget allows.

**What's already built (just needs to be turned on):**
- `womens_enabled` feature flag in `app_settings` table — flip to `true` to unlock
- Gender preference selector in complete-profile screen (hidden until `womens_enabled`)
- Gender filter on browse already wired to `gender_preference` from profile
- `gender` field on wardrobes and pieces already exists — just add women's content in admin
- Wardrobe cards and browse are fully gender-aware once pieces are added

**What still needs to happen:**
- [ ] Add first batch of women's pieces in admin (workwear, going out, casual)
- [ ] Create women's wardrobes in admin — tag them correctly (occasion, season, style)
- [ ] Set `womens_enabled = true` in Supabase `app_settings` table to unlock the gender toggle in the app
- [ ] Update homepage copy to be gender-neutral (remove male-coded language)
- [ ] Add women's use cases to the homepage ticker and flyer copy
- [ ] Redesign 2 flyers for women-first messaging (see FLYERS.md)
- [ ] Consider "Shop Men's / Shop Women's" top-level nav split once both inventories are substantial

**Estimated effort to unlock:** ~1 hour of admin work (add inventory + flip flag). No new code needed.

## Phase 13.5 — Trips Feature

**Goal:** Let customers plan outfits for specific trips or occasions — a suitcase with a purpose and a date attached to it.

**What's already built (gated behind feature flag):**
- `trips_enabled` feature flag in `app_settings` — currently `false`
- Full trips tab in the app (`app/trips.tsx`, hidden from nav when disabled)
- Trip creation flow (`app/trip/new.tsx`) — name, type, occasion, dates
- Trip detail screen (`app/trip/[id].tsx`) — view pieces in a trip
- Component library: `TripCard`, `TripItemRow`, `TripPickerSheet`, `OccasionPicker`, `TripTypeSelector`
- DB migration 025 — trips table exists in Supabase
- Hooks: `useTrip`, `useTrips` — data layer is complete

**What still needs to happen before turning on:**
- [ ] Review the trip creation UX — make sure the flow feels natural and guides the customer
- [ ] Connect trips to the suitcase: "Plan this as a trip" option when building a suitcase
- [ ] "Add to trip" action from piece detail and wardrobe screens
- [ ] Trip-based packing list view — see all pieces in a trip with their rental status
- [ ] Test the full flow end-to-end before flipping `trips_enabled = true`
- [ ] Consider: trip sharing (send a link to the trip — social/gifting angle)
- [ ] Marketing: "Pack smarter. Rent by the trip." angle for flyers and web copy

**Strategic value:** Trips are a natural retention hook — a customer building a trip is committing to multiple pieces and a time window. They also drive multi-piece orders (the primary growth lever per Part IV).

**Estimated effort to finish and turn on:** 1–2 sessions of polish and testing.

---

## Phase 14 — Growth & Retention

**Goal:** Make the first 30 days of a customer's life as sticky as possible.

- [ ] Push notifications (requires EAS build with `expo-notifications`)
  - Order status changes (shipped, delivered)
  - Buyout nudges at 3 months and 6 months
  - Idle customer re-engagement at 30 days
- [ ] In-app referral: "Give a friend $5 off their first month"
- [ ] Bundle upsell: prompt to add a second or third piece during checkout
- [ ] "New arrivals" email when a new piece matches a customer's size/style

## Phase 15 — Kids Expansion

**Goal:** Enter the kids' clothing rental market. This requires more prep than the women's expansion.

- [ ] COPPA compliance review — all kids' rentals owned by parent account
- [ ] Add kids' size system (age ranges + size labels like 2T, 4T, 4, 6, 8, 10, 12)
- [ ] Inventory: school clothes, holiday/event, seasonal, activewear
- [ ] Create "Growing Up" wardrobe in admin
- [ ] Update browse experience — kids' pieces clearly labeled for parents
- [ ] Dedicated marketing: flyers targeting parents, school pickup areas, pediatrician offices

## Phase 16 — Piece Holds & Waitlists

**Problem being solved:** A customer finds a piece they love but it's already rented out. Currently there's no way to express interest or get notified when it comes back.

**What to build:**
- "Notify me when available" button on rented-out pieces in the app
- Waitlist stored in Supabase (`piece_waitlist` table: `piece_id`, `user_id`, `size`, `created_at`)
- When a rental is returned and the piece goes back to available, trigger an email to the first person on the waitlist
- Admin can see waitlist count per piece (helps with sourcing decisions — high waitlist = buy another unit)
- Optional: "X people waiting for this" social proof label on piece detail screens

**Not needed yet** — we don't have enough inventory or customers for waitlists to matter. Build this once pieces are regularly renting out and you're turning people away.

## Phase 17 — Multi-Unit Inventory ✅ Done

`piece_units` table built and live. Each physical garment is its own row. Rentals are linked to a specific unit. Sizes are tracked per unit. Admin has a Unit Inventory view at `/units` showing which customer has each physical piece, its condition, and wear count. New pieces automatically create unit rows when added.

## Phase 18.5 — Post-Launch Hardening ✅ Done (June 2026)

Critical bugs and business logic gaps addressed before first customer orders:

- **Inventory unlock bug fixed** — pieces were permanently locked after a return; now correctly unlocked per unit
- **Admin refund fixed** — status constraint and security hole patched
- **Non-return charging built** — admin can now charge buyout price for unreturned items without customer action (`admin-charge-nonreturn`)
- **Excess damage charging built** — can charge above the $75 deposit (`charge-damage`)
- **Partial deposit dead-end fixed** — release-deposit works after a partial capture
- **Buyout at any stage** — customers can buy a piece before it even arrives
- **Customer refund request button** — in-app, emails admin immediately
- **Unit Inventory admin view** — see every physical unit, who has it, its status
- **Rental terms updated** — rolling 30-day billing, non-return buyout language, damage excess charges
- **Double-charge risk fixed** — stable idempotency key on checkout
- **Security fix** — admin functions use JWT + is_admin, not service-role key as password

## Quick Ops Checklist (do these when you have 5 minutes)

- [ ] **Enable leaked password protection** — Supabase Dashboard → project `rjplmjtydknascuqvyzq` → Authentication → Sign In / Up → Password → toggle on "Leaked Password Protection" → Save.
- [ ] **Set ADMIN_EMAIL env var** — Supabase Edge Function secrets → add `ADMIN_EMAIL=your@email.com` so refund request notifications reach you.
- [ ] **Run migrations 017–019** — orders status constraints and billing_events type. Run via Supabase Dashboard → SQL Editor or `supabase db push`.
- [ ] **Deploy new edge functions** — `admin-charge-nonreturn`, `charge-damage`, `request-refund` need to be deployed: `supabase functions deploy admin-charge-nonreturn && supabase functions deploy charge-damage && supabase functions deploy request-refund`.

---

## Phase 19 — Legal & Compliance (Do Before Scale)

**Why this matters:** As inventory grows and customers scale, non-returns and damage disputes become real legal situations. The rental terms cover a lot, but the business needs additional legal infrastructure before dealing with non-trivial customer conflicts.

**What needs to happen:**

- [ ] **LLC formalization** — confirm the LLC is properly registered with its state, EIN on file, business bank account separate from personal
- [ ] **Rental agreement review** — have a lawyer review the Rental Terms, specifically: (a) enforceability of buyout-price charges for non-returns, (b) damage charge authorization language, (c) deposit legality in your state (some states regulate security deposits even for goods, not just apartments)
- [ ] **Collections path** — establish a process for accounts that don't pay after non-return/damage charges: (1) email series, (2) collections referral (services like Upright Law or a local attorney for small claims), (3) credit bureau reporting threshold
- [ ] **Chargeback policy** — write and document your response procedure for Stripe disputes. Prepare evidence templates: order confirmation email, tracking delivery confirmation, signed rental terms acceptance timestamp (stored in `profiles.terms_accepted_at`)
- [ ] **Insurance** — research whether a small business inland marine policy covers inventory while in a customer's possession. This protects against catastrophic damage (fire, flood) that exceeds what can be recovered from a customer.
- [ ] **Privacy policy review** — once you have real payment data and are marketing to customers, a formal privacy policy review and CCPA/GDPR readiness check is worthwhile
- [ ] **Kids expansion COPPA compliance** — required before Phase 15; cannot launch kids' rentals without this

**Timing:** Do the LLC check and rental agreement review before the first major marketing push. Everything else can wait until you have 50+ customers or the first dispute arises.

---

## Phase 20 — Browse & Search Improvements

**Why this matters:** As inventory grows to 30, 50, 100+ pieces, the current browse experience breaks down. Customers need to find what they want — at the price they want, in the condition they want, in their size.

**What to build:**

- [ ] **Collapsible filter bar** — filter chips that collapse into a single "Filters (N)" button when not in use. Keeps browse clean.
- [ ] **New filter types:**
  - Price range (monthly rental fee, e.g. "$5–$15/mo")
  - Condition (New / Like New / Good)
  - Size (pre-filtered to your size if saved in profile)
  - Occasion (Work / Weekend / Formal / Active / Going Out)
  - Brand
- [ ] **"My size" shortcut** — if customer has a saved profile size, show a quick toggle to filter to their size
- [ ] **Sort options** — Newest, Lowest price, Highest rated (once reviews are live), Most popular (rental count)
- [ ] **Search** — type-ahead search across piece name, brand, and tags

**Note on current state:** The color filter should be removed or deprioritized. Customers don't shop by color. They shop by occasion, size, and price.

---

## Phase 21 — Real Inventory Transition

**Where we're going:** Moving from on-demand sourcing (buy when ordered) to holding actual inventory (have pieces in hand before orders come in). This changes the economics and operations significantly.

**What changes when you hold inventory:**

- **Admin piece creation** — pieces will be in hand before they're listed. Photography needs to happen before listing. The admin new-piece form is ready; just need a photo workflow.
- **Condition tracking** — items arrive new, go out, come back. Wear count and condition need to be updated after every return (admin → Rentals → mark returned → update wear_count in Units view).
- **Storage** — you need a physical home for inventory. At small scale: a clean closet or rack dedicated to Davenport pieces. At medium scale: a storage unit. Track storage cost as overhead.
- **Cleaning workflow** — every returned piece gets cleaned before re-listing. Build this into the ops calendar.
- **Photography** — pieces need good photos. Natural light, consistent background. Consider a simple photo setup (white backdrop, phone camera, good window light).
- **Sourcing strategy shift** — instead of buying one-at-a-time per order, you'll buy ahead of demand. Use the Recovery Ratio (Part V) to decide what to restock.

**Ops checklist for first real inventory cycle:**
- [ ] Photograph each piece before listing (front, back, detail shots)
- [ ] Add pieces in admin with correct cost, condition, and sizes
- [ ] Confirm piece_units rows are created (check Unit Inventory view)
- [ ] Set up a cleaning rotation schedule (every return → clean → relist)
- [ ] Track cleaning costs per item in notes field

---

## Phase 18 — Web Checkout ⭐ TOP PRIORITY

**Goal:** Let customers order directly from davenport.rentals without downloading the app.

**Why this is the #1 priority right now:** At early stages, asking someone to download an app is a major barrier to that first order. Anyone who finds Davenport through a web search, a flyer link, a text from a friend, or an Instagram bio can land on the website and immediately order — no App Store, no install required. The website is already beautiful and browsable. Making it transactional could meaningfully accelerate early customer acquisition.

**What to build:**
- [ ] Auth pages on the web (`/login`, `/signup`) — Supabase auth already exists; just need web UI
- [ ] "Add to suitcase" button on `/piece/[id]` piece detail — currently display-only
- [ ] Web suitcase state — localStorage cart, syncs to Supabase once authenticated
- [ ] `/cart` page — selected pieces + sizes, bundle discount shown, handling fee
- [ ] `/checkout` page — Stripe Elements wired to existing `create-setup-intent` + `confirm-order` edge functions (same functions the app uses — no duplication)
- [ ] `/checkout/confirmation` — order confirmation page with order details
- [ ] `/account` page — active rentals, billing summary, return requests
- [ ] Web navbar: cart count badge + account link when logged in

**Existing infrastructure that carries over (no changes needed):**
- All Stripe edge functions are platform-agnostic — they work from web or mobile
- Supabase auth supports web OAuth (magic link, Google, Apple) out of the box
- Brand system, colors, and typography are already shared between web and app
- Order, piece, and wardrobe data models are unchanged

**Effort estimate:** 2–3 sessions. Auth + cart are the hard parts. Checkout follows the same logic as the app.

**Sequencing note:** Start with auth + "Add to suitcase" + cart first. Get a working end-to-end flow before polishing the account page. The account page is nice to have but not required for the first order.

## Phase 18 — Long-Term Vision

Revisit these once the core business has traction:

- AI wardrobe recommendations based on rental history
- Career-specific wardrobes (consulting starter kit, finance look, medical rotation)
- Seasonal and travel wardrobes
- University and employer partnerships (bulk access)
- Personal styling tier (stylist picks for you monthly)
- Wardrobe analytics (cost-per-wear, usage reports)
- Expand beyond Fairfield County — logistics partner required

---

# PART XII — OPERATIONS

## Daily Admin Checklist

1. Check admin tool for new orders — set status to `confirmed`, begin sourcing
2. Update tracking info when items ship
3. Check for any failed payments or billing errors
4. Respond to any support messages

## When a New Order Comes In

1. Mark order `confirmed` in admin
2. Source the item in the exact size ordered (do not buy other sizes)
3. Package and ship — update carrier + tracking in admin
4. Mark `shipped` when it goes out
5. Mark `delivered` when tracking shows delivered

## When a Customer Wants to Return

1. Customer initiates return in app (return_requested status)
2. Provide return shipping label (coordinate via email for now)
3. Mark item `returned` in admin when received
4. Inspect item condition
5. **Professionally clean the piece before any future rental** — dry clean or launder per item care instructions. This is non-negotiable. Every item must be clean before it ships to the next customer.
6. Update piece `wear_count` +1 in admin
7. Mark piece as available again

## Professional Cleaning Standard

Every piece returned by a customer must be professionally cleaned before it can be rented again. This is a core part of the Davenport promise and must never be skipped.

- Dry clean or launder per the item's care label
- Inspect for damage, stains, or excessive wear after cleaning
- If a piece cannot be returned to wearable condition after cleaning, retire it
- Keep cleaning receipts — useful for calculating true cost-per-rental

This cleaning standard is mentioned on the website and is part of the brand trust. If you ever skip it, you risk the entire reputation of the platform.

## When a Customer Wants to Buy Out

1. Customer initiates buyout in app (works at any stage — even before delivery)
2. Charge processes automatically via their saved card
3. Rental is automatically marked `bought_out`, billing stops — no admin action needed
4. Piece is the customer's to keep — no return label needed

## When You Need to Refund

**Customer-initiated:** Customer taps "Request Refund" in the app (within 30 days). You get an email. Review it, then:
- Go to admin.davenport.rentals → Orders → find the order (status shows `refund_requested`) → "Refund This Order"
- Refunds the rental payment + cancels the deposit hold + frees pieces for new rentals

**Admin-initiated:** Same flow — use the Refund button directly in the admin Orders view.

## When a Customer Damages Something

1. Inspect returned item
2. Assess damage cost
3. If ≤ $75 (within deposit): admin → call `capture-deposit` with the user_id and damage amount
4. If > $75 (exceeds deposit): capture the full $75 deposit first, then use `charge-damage` for the excess amount
5. Email customer automatically when either function is called
6. If multiple items damaged: handle each item's damage separately — you can call `charge-damage` multiple times

## When a Customer Doesn't Return Something

1. Wait until 90 days after return request (per rental terms)
2. Send a written notice (email the customer manually)
3. Wait 30 days after notice
4. Use `admin-charge-nonreturn` with the rental_id — charges the buyout price, stops billing, emails customer
5. If multiple unreturned pieces: call once per rental_id

## Pricing Reminders

- Base rental: 15% of cost price per month (computed by DB trigger from `base_rental_rate`)
- Billing cycle: rolling 30 days from **delivery date** — NOT order date, NOT the 1st of each month *(billing-on-delivery change planned — see Phase 22)*
- Shipping: Davenport provides prepaid return label; outbound shipping included in handling fee
- Deposit: $75 refundable, held until all pieces returned; released via admin → release-deposit
- Handling fee: $5 per order
- Damage charges: up to $75 from deposit (capture-deposit); above $75 via charge-damage function
- Non-return charges: admin charges buyout price via admin-charge-nonreturn, one per unreturned rental

---

---

## Phase 22 — Billing Start on Delivery *(high priority)*

**The problem:** Currently billing starts the day an order is placed. If a piece takes 2 weeks to arrive, the customer has already paid for 2 weeks they didn't have the clothing. This is a bad customer experience and contrary to the Davenport promise.

**The fix:** Billing should not start until the piece is delivered. The first 30-day billing cycle begins on `delivered_at`, not `created_at`.

**What needs to change:**
- [ ] Add `delivered_at` timestamp to the `rentals` table (or use the existing status-change timestamp when status moves to `delivered`)
- [ ] Update `billing-cron` edge function: calculate next charge date from `delivered_at` instead of `created_at`
- [ ] Update `confirm-order` edge function: don't schedule first charge until delivery is confirmed
- [ ] Update the Rental Terms screen to reflect "billing begins on delivery"
- [ ] Update the Account screen billing date display to use `delivered_at` as the cycle anchor
- [ ] Handle edge case: if `delivered_at` is null (not yet delivered), do not charge — cron skips that rental
- [ ] Admin: when marking a rental `delivered`, ensure `delivered_at` is set

**Impact:** This is the right thing to do. Customers pay for what they use. It also reduces support requests and disputes from customers who feel they paid for time without the clothing.

---

## Phase 23 — Pants & Detailed Sizing

**The problem:** Pants require inseam and sometimes length measurements, but the AI product extraction and the piece data model don't capture these. A size "32" tells you the waist — it doesn't tell you if it's a 30", 32", or 34" inseam. Customers need this to decide if pants will fit.

**What needs to change:**
- [ ] Add `inseam` field to `pieces` table (e.g., `inseam: string | null` — "30", "32", "34")
- [ ] Add `length` field for cases where length is distinct from inseam (some brands use "short/regular/long" instead of inches)
- [ ] Update admin piece form to include inseam and length fields
- [ ] Update AI extraction prompt (`extract` edge function) to capture inseam and length from product URLs
- [ ] Display inseam in piece detail screen when present (below size, e.g. "Size 32 · 32\" inseam")
- [ ] Add inseam as a filter option in the Browse screen (relevant once pants inventory grows)

---

## Phase 24 — Inventory Transparency (Stock View)

**What customers want:** Know how much is in stock, and what condition it's in. Especially as inventory grows, customers want to see at a glance: "How many of this are available in my size, and are they new or have they been worn before?"

**What to build:**
- [ ] Piece detail screen: show stock count per size (e.g., "3 available in size M")
- [ ] Tapping the stock count opens a **Stock Detail Sheet** showing the breakdown:
  - New / unworn units
  - 1–5 wears
  - 6–10 wears
  - 10+ wears
  - (Each line shows quantity, e.g. "2 new · 1 at 3 wears")
- [ ] Browse screen: optional "Available now" badge vs "1 left in your size" scarcity signal
- [ ] Admin: stock overview per piece — how many units are rented vs available, by condition bucket

**Note:** Don't build this until there's enough inventory to make it meaningful. A piece with 1 unit in 1 size doesn't need a stock breakdown. Build once you have 3+ units of individual pieces.

---

## Phase 25 — Admin Hub Evolution

**The vision:** The admin tool should be the operational nerve center of Davenport. Right now it handles the basics. As inventory and customers grow, it needs to become smarter about surface problems and opportunities before they become crises.

**Low-stock alerts:**
- [ ] On the Pieces list and Piece detail view, show a warning when new (unworn) units of a piece are running low (e.g., 0 new units remaining → "No new units left")
- [ ] If all units of a size are currently rented out → "Fully rented in this size"
- [ ] Dashboard summary: "X pieces have no new units remaining" — prompts restocking decisions

**Discontinued / can't restock flag:**
- [ ] Add `discontinued` boolean to `pieces` table
- [ ] Admin can mark a piece as discontinued ("can't buy more of this")
- [ ] Discontinued pieces show a badge in admin — helps decide when to retire vs liquidate
- [ ] Consider: when all units of a discontinued piece are rented, hide it from Browse

**General admin improvements to build over time:**
- [ ] Orders dashboard — summary stats (orders this week, this month, revenue, active rentals)
- [ ] Customer view — see all orders and rentals for a specific customer
- [ ] Billing event log — every charge, capture, and release in one view
- [ ] Return workflow — mark returns received, update wear count, relist piece, all in one flow
- [ ] Waitlist visibility (when Phase 16 is built) — see demand for each piece before sourcing
- [ ] Photo upload directly in admin piece form (currently requires external URL)
- [ ] Bulk status updates for orders

---

## Phase 26 — Physical Operations Infrastructure

**These are non-technical but required for the business to run at any scale.**

**Shipping materials:**
- [ ] Source branded or clean boxes and poly mailers in appropriate sizes for clothing shipments
- [ ] Get a supply of tissue paper, thank-you cards, and stickers/tape for a premium unboxing experience
- [ ] Set up a prepaid return label system (Shippo, EasyPost, or Pirateship) for customer returns
- [ ] Establish a packing station at home for consistent, professional packaging

**Cleaning:**
- [ ] Identify a reliable dry cleaner or laundry service nearby
- [ ] Establish a relationship and account for recurring cleaning orders
- [ ] Get per-item pricing so cleaning cost can be tracked per rental cycle
- [ ] Build cleaning turnaround into the return-to-relist timeline (target: returned → cleaned → relisted within 5 business days)

**Branded visuals / photography:**
- [ ] Set up a simple home photo studio (white/neutral backdrop, good natural window light or ring light, phone camera)
- [ ] Establish a consistent photo style — front, back, detail close-up, flat lay — for every piece
- [ ] As inventory grows, consider a photographer session to batch-photograph all pieces at once
- [ ] Branded content: lifestyle photos for homepage, social, flyers — models wearing the pieces in real settings

**Legal:**
- [ ] Confirm LLC is registered and in good standing (see Phase 19 for full legal checklist)
- [ ] Open a dedicated business bank account if not already done
- [ ] EIN on file — separate from personal taxes

---

*Flyer concepts and physical marketing materials: see FLYERS.md*
