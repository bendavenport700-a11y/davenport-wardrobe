# Davenport Wardrobe — Master Plan

> **Last revised:** 2026-06-10 | **Build status:** Phases 1–10 ✅ Complete — Phase 11 (deployment) next

---

## How to Use This Document

Read this at the start of every session. It is the strategic and architectural source of truth.

The **53-section build spec** (with exact code for every screen, SQL migration, Edge Function, and component) lives as a separate document. Paste it into Claude Code when executing a phase. This file does not duplicate that code — it tells you why things are built the way they are and where to find them.

---

# PART I — CORE IDENTITY

## What Davenport Is

**Davenport is not a clothing rental company.**

**Davenport is a wardrobe flexibility platform where renting, returning, and buying are all successful outcomes.**

Every feature, pricing decision, UX flow, and business decision must be evaluated against that principle.

## What Customers Are Paying For

Customers are not paying for clothing. They are paying for:

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

---

# PART II — CUSTOMERS

## Primary (design target): Young Professionals, 22–30

Consulting, finance, real estate, tech, startups. Building a professional identity. Moving between cities and roles. Income exists but large upfront wardrobe spend feels wasteful.

## Secondary: College Students

Internships, career fairs, interviews, formals. High price sensitivity — multi-piece discounts matter most here.

## Tertiary: High School / Special Events

Prom, graduation, early interviews. Not the design target. Future expansion only.

---

# PART III — STRATEGIC PRIORITIES

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

# PART IV — INVENTORY PHILOSOPHY

**Davenport acquires inventory based on proven demand, not assumptions.**

1. Customer places order → demand confirmed
2. Davenport purchases item from retailer
3. Item enters inventory
4. Future rentals generate higher-margin revenue on an already-paid-for asset

Every first rental = a **market validation event**. Popular products become inventory. Unpopular products never consume capital.

## Size Acquisition Rules

**Core rule: We only acquire the size that was ordered. Not all sizes.**

When a customer orders a Large, we source a Large. We do not automatically stock a Small, Medium, and Large just because we sourced one piece. Each size is a separate inventory event driven by separate customer demand.

**Why:** Buying all sizes speculatively ties up capital in unsold inventory. A Large being rented does not prove anyone wants a Small.

**Evolution path (by phase):**

| Stage | Rule |
|---|---|
| Launch (now) | Source only the exact size ordered. One order = one piece. |
| Growing ($) | If a specific product gets 3+ orders across any sizes, consider stocking 2–3 sizes proactively. |
| Scaled ($$$) | Source full size runs for proven bestsellers. If demand is proven and capital allows, buy ahead without waiting for orders. |

**In the DB:** Each `pieces` row represents one physical item in one size. A "shirt in navy, sizes S/M/L" is three separate DB rows. `sizes_available` on a piece row reflects what Davenport physically has, not what the retailer sells.

**Admin workflow implication:** When adding a piece via the admin tool, only add the size(s) actually on hand. If a customer orders a size not in inventory, the order triggers a new sourcing event — add a new piece row for that size when it arrives.

---

# PART V — PRICING MODEL

> **Status:** Updated 2026-06-04. `utils/pricing.ts` reflects these values. The DB trigger in `003_triggers.sql` must be updated to match before Phase 2.

## Why the Old Model Was Wrong

The original 30% base rental rate made an $80 item cost $24/month. Five items = $120/month. That's close to the cost of buying them — it did not feel like an affordable wardrobe solution.

## Revised Constants

```typescript
BASE_RENTAL_RATE  = 0.15   // was 0.30 — $80 item now $12/mo, not $24
BUYOUT_START_MULT = 0.90   // new — customer tested it risk-free, small reward
WEAR_DISCOUNT     = 0.010  // was 0.015
BUYOUT_DISCOUNT   = 0.08   // was 0.10
MIN_RENTAL_RATE   = 0.05   // was 0.08
MIN_BUYOUT_MULT   = 0.30   // unchanged
RETIRE_THRESHOLD  = 400    // was 500 — $4/month floor
```

## What This Looks Like for Customers

| Item Cost | Old Monthly | New Monthly | Customer Reaction |
|---|---|---|---|
| $40 | $12 | $6 | Clearly affordable |
| $80 | $24 | $12 | Easy impulse add |
| $120 | $36 | $18 | Reasonable |
| $200 | $60 | $30 | Justified for premium |

## Buyout Pricing

```
buyout_price = max(cost × 0.30, cost × (0.90 − wear_count × 0.08))
```

| Wears | Buyout on $80 item |
|---|---|
| 0 (new) | $72 |
| 3 | $53 |
| 5 | $40 |
| 8+ | $24 (floor) |

**Loyalty bonus:** After 6+ continuous months renting the same item, customer gets an additional 5% off buyout price. Implemented in `computeLoyaltyBuyoutPrice()`.

## Multi-Piece Bundle Discounts

Applied to combined monthly billing. Canonical logic lives in Edge Functions (server-side). Client-side preview in `multiPieceDiscount()`.

| Active Rentals | Discount |
|---|---|
| 1 | 0% |
| 2 | 8% |
| 3–4 | 18% |
| 5–6 | 25% |
| 7+ | 30% |

**Example:** 4 items at $12/mo = $48 standard → $48 × 0.82 = **$39.36/month** with bundle discount.

## Buyout as Primary Success Outcome

A buyout after 2 months on an $80 item:

| Line | Amount |
|---|---|
| 2 months rental | $24 |
| Buyout price | $68 |
| **Total revenue** | **$92** |
| **Gross profit** | **$12 (15%)** |
| **+ future re-rental potential** | ongoing |

This is a win. The platform must surface buyout prices prominently and send timely nudges (3-month and 6-month marks).

## DB Trigger Alignment

**Before Phase 2:** Update `003_triggers.sql` → `refresh_piece_pricing()` function to use:
- `v_buyout := round(new.cost_price::numeric * greatest(0.30, 0.90 - new.wear_count * 0.08))`
- `v_rental := round(v_buyout::numeric * greatest(0.05, new.base_rental_rate - new.wear_count * 0.010))`
- Retire threshold: `v_rental < 400`

---

# PART VI — INVENTORY LIFECYCLE

Track per item: `rental_count`, `total_rental_revenue_cents`, `cost_price`, `days_since_last_rental`.

**Recovery ratio** = `total_rental_revenue / cost_price`

| Ratio | Status | Action |
|---|---|---|
| 0–0.5 | Unrecovered | Feature prominently |
| 0.5–1.0 | Partially recovered | Standard placement |
| 1.0–2.0 | Recovered | Protect it |
| 2.0+ | Excellent | Candidate for retirement + liquidation |

**Underperforming** (`utilization < 30%` or `days_since_last_rental > 60`):
1. Promote to featured
2. Reduce rental fee 10–20%
3. Reduce buyout below standard floor
4. Retire and liquidate (Poshmark, eBay)

---

# PART VII — CUSTOMER PSYCHOLOGY

Customers compare Davenport to: TJ Maxx, Poshmark, Facebook Marketplace, outlet stores.

Not to luxury rental services.

The pricing must feel **obviously worthwhile** versus those alternatives.

Where Davenport wins vs. traditional retail:
- Try before committing
- Build a wardrobe gradually, no upfront cost
- Return instead of owning clutter
- Simplify semester and city moves
- Experiment with style safely

---

# PART VIII — RETENTION

### Automated nudges (Phase 10):
| Trigger | Timing | Message |
|---|---|---|
| Onboarding | After signup | "Add your first piece" |
| First return | 1 day after | "Ready to swap? New arrivals." |
| Idle | 30 days no rental | "Your wardrobe is waiting." |
| Long-hold | 3 months rental | "Still loving it? Buy it for $X." |
| Loyalty buyout | 6 months rental | "You've earned a loyalty discount." |
| Near tier | 1 item from next tier | "Add one more piece to save X% on everything." |

### Churn prevention:
If customer goes to 0 active rentals: wait 14 days, then send curated "What's new for your size" + offer first-month free on 1 item.

---

# PART IX — TECH STACK & ARCHITECTURE

| Layer | Choice |
|---|---|
| Frontend | Expo SDK 56 / RN 0.85, expo-router, nativewind v4, zustand, tanstack-query |
| Backend | Supabase (Postgres + RLS + Edge Functions) |
| Payments | Stripe (SetupIntent + manual deposit + cron billing) |
| Email | Resend |
| AI (admin) | Anthropic Claude API (product extraction from URLs) |
| Admin tool | Next.js 14, deployed to admin.davenport.rentals |
| Web | Expo web export → Vercel at davenport.rentals |
| Native builds | EAS Build |

## Key Files

| Need | Location |
|---|---|
| Brand colors, fonts, spacing | `constants/colors.ts`, `constants/layout.ts` |
| TypeScript types | `types/index.ts` |
| Pricing math | `utils/pricing.ts` |
| Supabase client + callEdgeFunction | `lib/supabase.ts` |
| Auth store | `store/authStore.ts` |
| Suitcase store (with hydration guard) | `store/suitcaseStore.ts` |
| Error message mapping | `utils/errors.ts` |
| Zod form schemas | `utils/schemas.ts` |
| Color + size constants | `constants/inventory.ts` |
| DB migrations | `supabase/migrations/001–008` |
| Edge Functions | `supabase/functions/` |
| Admin tool | `admin/` |

## Environment Variables

```env
# Expo client (bundled)
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
EXPO_PUBLIC_DEPOSIT_AMOUNT_CENTS=7500
EXPO_PUBLIC_HANDLING_FEE_CENTS=500
EXPO_PUBLIC_APP_ENV=development

# Edge Functions (supabase secrets set)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@davenport.rentals
DEPOSIT_AMOUNT_CENTS=7500
HANDLING_FEE_CENTS=500
OWNER_ALERT_EMAIL

# Admin tool (admin/.env.local)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

# PART X — BUILD PHASES

## Phase 1 — Project Bootstrap ✅ COMPLETE
**Completed:** 2026-06-03

All types, constants, utils, stores, hooks, nav structure, brand system, Button component, StripeWrapper shim. `tsc --noEmit` → 0 errors. `expo export --platform web` → dist.

**Deviations from spec:**
- Expo SDK 56 (spec said 52) — all APIs compatible
- tailwindcss 3.4.19 (had to downgrade from v4 for nativewind compat)
- zod 4.4.3 (spec said v3 — `errorMap` → `error` param updated)
- `nativewind/babel` in `presets[]` not `plugins[]`
- StripeWrapper platform shim in `lib/` (native Stripe breaks web bundler)

## Phase 2 — Database & Migrations
**Status:** ✅ COMPLETE (2026-06-10)

9 migrations applied. Tables: `profiles`, `pieces`, `wardrobes`, `orders`, `rentals`, `suitcase_items`, `billing_events`, `email_log`. 2 wardrobes seeded, 5+ pieces. Realtime enabled on `orders` and `rentals`.

## Phase 3 — Auth Screens
**Status:** ✅ COMPLETE (2026-06-10)

Screens: login, signup, complete-profile, forgot-password, rental-terms. Protected route guard in `hooks/useProtectedRoute.ts`.

## Phase 3.5 — Admin Inventory Tool
**Status:** ✅ COMPLETE (2026-06-10)

Next.js app at `admin/`. Running locally on port 3001. AI URL extraction via `extract-product` Edge Function (Anthropic Claude). Pieces, orders, wardrobes management.

## Phase 4 — Browse Screens
**Status:** ✅ COMPLETE (2026-06-10)

Home, Browse, Wardrobe Detail, Piece Detail. FilterBar, FadeInDown stagger, skeletons, error/empty states on all screens.

## Phase 5 — Suitcase Screen
**Status:** ✅ COMPLETE (2026-06-10)

SuitcaseItemRow, SuitcaseSummary, availability re-check on focus, tab badge with hydration guard. Multi-piece discount upsell banner.

## Phase 6 — Stripe Infrastructure
**Status:** ✅ COMPLETE (2026-06-10) — **Webhook & secrets pending**

All 11 Edge Functions deployed. `charge-monthly` cron scheduled (`0 9 1 * *`). **Still needed before go-live:** Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` as Supabase secrets, register webhook at `https://rjplmjtydknascuqvyzq.supabase.co/functions/v1/stripe-webhook`.

## Phase 7 — Checkout Flow
**Status:** ✅ COMPLETE (2026-06-10)

Path A (new customer): SetupIntent + deposit hold via Payment Sheet. Path B (returning): direct charge. `createOrderAtomically()` RPC on success.

## Phase 8 — Order Status
**Status:** ✅ COMPLETE (2026-06-10)

Real-time status via Supabase Realtime. Buyout flow on Account screen with loyalty discount at 6 months.

## Phase 9 — Account Screen
**Status:** ✅ COMPLETE (2026-06-10)

Active rentals, buyout CTA, billing summary, next charge date, shipping address, sign out.

## Phase 10 — Polish & Web Parity
**Status:** ✅ COMPLETE (2026-06-10)

- WebNavbar on web ≥768px ✓
- Accessibility labels on all interactive elements ✓
- Error/empty/skeleton states on all screens ✓
- Retention emails: onboarding (day 2–7), 3-month buyout nudge, 6-month loyalty nudge — `send-retention-emails` Edge Function deployed, cron scheduled daily at 10am UTC ✓
- **Push notifications:** deferred to Phase 11 (requires EAS build)

## Phase 11 — Deployment
**Status:** IN PROGRESS

Remaining:
1. Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `RESEND_API_KEY` as Supabase secrets
2. Register Stripe webhook at dashboard.stripe.com
3. Set `OWNER_ALERT_EMAIL` secret
4. Switch `.env` to live Stripe publishable key for production build
5. EAS production build + App Store / Play Store submission
6. Vercel deploy for web
7. Sentry error tracking

---

# PART XI — LONG-TERM VISION

Future expansion (not current priorities):
- AI wardrobe recommendations
- Career-specific wardrobes (consulting starter kit, finance look)
- Seasonal and travel wardrobes
- University and employer partnerships
- Personal styling tier
- Wardrobe analytics (cost-per-wear, usage reports)

The core mission remains: **reduce the cost, risk, friction, and complexity of building and maintaining a wardrobe.**

---

# PART XII — THE DAVENPORT PROMISE

Traditional retail requires customers to: predict what they'll like, predict what will fit, pay upfront, manage return windows, store and organize everything, accept full ownership risk.

**Davenport removes those burdens. Ownership becomes optional rather than mandatory.**

This principle must influence every product decision — from how buttons are labeled to how emails are written.

---

*For exact screen code, SQL migrations, Edge Function implementations, component implementations, and phase acceptance tests — see the 53-section build spec document.*
