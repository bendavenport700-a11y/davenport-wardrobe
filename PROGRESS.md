# Davenport Wardrobe — Build Progress

---

## Phase 1 — Project Bootstrap ✅ COMPLETE
**Completed:** 2026-06-03  
**Goal:** App boots on iOS, Android, browser. Brand applied. Zero TS errors.  
**Acceptance test result:** PASS — `tsc --noEmit` 0 errors, `expo export --platform web` → `Exported: dist`

### Checklist

- [x] Moved legacy Next.js site into `legacy-nextjs/`
- [x] Scaffolded fresh Expo app (SDK 56 / RN 0.85) via `create-expo-app@latest`
- [x] Installed all packages: expo-router, expo-image, expo-blur, expo-haptics, expo-font, expo-splash-screen, expo-status-bar, expo-crypto, nativewind, tailwindcss@^3, zustand, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, react-native-reanimated, react-native-confetti-cannon, @react-native-async-storage/async-storage, @supabase/supabase-js, @stripe/stripe-react-native, react-native-safe-area-context, react-native-screens, @expo/vector-icons, react-dom, react-native-web, babel-preset-expo, @expo/metro-runtime
- [x] Downloaded all 3 fonts → `assets/fonts/` (Inter-Regular.ttf, Inter-Medium.ttf, PlayfairDisplay-Bold.ttf)
- [x] `assets/images/icon.png` and `assets/splash.png` in place
- [x] `app.json` — Davenport slug, scheme, bundleId, StripeProvider plugin, newArchEnabled
- [x] `eas.json` — dev/preview/production build profiles
- [x] `babel.config.js` — babel-preset-expo + nativewind/babel (preset) + reanimated (plugin)
- [x] `tailwind.config.js` — imports colors.ts, all brand tokens, fontFamily config
- [x] `tsconfig.json` — strict, `@/*` path alias
- [x] `lib/stripe.native.ts` — re-exports useStripe/initStripe from @stripe/stripe-react-native
- [x] `lib/stripe.web.ts` — no-op stub for web
- [x] `lib/StripeWrapper.native.tsx` + `lib/StripeWrapper.web.tsx` + `lib/StripeWrapper.tsx` — platform shim so StripeProvider doesn't break web bundling
- [x] `constants/colors.ts` — full brand palette (navy, cream, sand, slate, gray scale)
- [x] `constants/layout.ts` — screenPadding, cardRadius, gridItemWidth, etc.
- [x] `constants/inventory.ts` — 21-color palette with hex map, size systems per category
- [x] `types/index.ts` — Profile, Wardrobe, Piece, Rental, Order, BillingEvent, SuitcaseItem and all enums
- [x] `utils/pricing.ts` — computeBuyoutPrice, computeRentalFee, shouldRetire, previewNewPiece (mirrors DB trigger)
- [x] `utils/format.ts` — formatCents, formatCentsPerMonth, wearCountLabel, conditionLabel, statusLabel, statusColor, formatDate, formatNextBilling
- [x] `utils/errors.ts` — friendlyError() mapping all Supabase/Stripe/RPC error codes
- [x] `utils/schemas.ts` — Zod schemas: shippingAddress, signup, login, completeProfile (fixed Zod v4 `error` param)
- [x] `lib/supabase.ts` — createClient with AsyncStorage auth + callEdgeFunction helper
- [x] `store/authStore.ts` — Zustand store: session, profile, setSession, setProfile, isAdmin, hasCompletedProfile
- [x] `store/suitcaseStore.ts` — Zustand persist store with hydration guard, useSuitcaseHydrated hook, all pricing helpers
- [x] `components/ui/Button.tsx` — Reanimated scale(0.97) spring, all 4 variants (primary/secondary/ghost/destructive), loading state, accessibility
- [x] `hooks/useWardrobes.ts`
- [x] `hooks/useFeaturedPieces.ts`
- [x] `hooks/usePieces.ts` — useInfiniteQuery with category/color/search/sort/wardrobeId filters
- [x] `hooks/usePiece.ts`
- [x] `hooks/useOrder.ts` — with Supabase Realtime subscription
- [x] `hooks/useRentals.ts` — useActiveRentals + useOrderRentals
- [x] `hooks/useProfile.ts` — useProfile, useUpdateProfile, useSyncServerSuitcase
- [x] `hooks/useProtectedRoute.ts` — auth guard using useSegments + useRouter
- [x] `.env` — all EXPO_PUBLIC_ placeholder values
- [x] `app/_layout.tsx` — full implementation: NavigationGuard, font loading, SplashScreen, StripeWrapper, SafeAreaProvider, QueryClientProvider, auth state listener, guest cart merge
- [x] `app/(tabs)/_layout.tsx` — placeholder Slot
- [x] `app/(auth)/_layout.tsx` — placeholder Slot
- [x] `app/(tabs)/index.tsx` — minimal home screen (cream bg + DAVENPORT Playfair navy)
- [x] `app/(auth)/login.tsx` — minimal placeholder

### Known deviations from master plan spec

| Item | Spec | Actual | Reason |
|---|---|---|---|
| Expo SDK | ~52.0.0 | ~56.0.8 | `create-expo-app@latest` installs current SDK; all APIs compatible |
| React Native | 0.76.3 | 0.85.3 | Paired with SDK 56 |
| tailwindcss | ^3.4.0 | 3.4.19 | npm installed v4; downgraded to v3 for nativewind v4 compatibility |
| zod | ^3.0.0 | 4.4.3 | npm installed v4; `errorMap` → `error` param updated in schemas.ts |
| `nativewind/babel` location | plugins[] | presets[] | nativewind v4 exports a preset object, must be in presets |
| StripeProvider | in _layout.tsx directly | StripeWrapper shim | @stripe/stripe-react-native imports native-only modules; web bundle fails without platform split |

---

---

## Strategic Revision — Pre-Phase 4 ✅ COMPLETE
**Completed:** 2026-06-04  
**Goal:** Align master plan and pricing to revised "wardrobe flexibility platform" vision.

- [x] Created `MASTERPLAN.md` — authoritative strategic + technical spec (replaces session-shared doc)
- [x] Part I: Core Principle, What We Sell, Problems Solved, What We're Not, Customer Definition, Strategic Priorities
- [x] Part II: Inventory Philosophy, Pricing Philosophy, Multi-Piece Strategy, Buyout Philosophy, Customer Psychology
- [x] Part III: Full pricing/economics/retention/inventory framework (Sections 12–21)
- [x] Part IV: Long-term vision and expansion map
- [x] Part V: Technical phases 1–11 rewritten with strategic lens applied
- [x] Updated `utils/pricing.ts` — BASE_RENTAL_RATE 30% → 15%, BUYOUT_START_MULT 90%, multi-piece discount tiers, loyalty buyout bonus

---

## Phase 2 — Database & Migrations ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `001_initial_schema.sql` — 7 tables (profiles, wardrobes, pieces, rentals, orders, billing_events, suitcase_items)
- [x] `002_rls_policies.sql` — RLS on all tables; rentals/orders insert blocked (service role only)
- [x] `003_triggers.sql` — handle_new_user(), refresh_piece_pricing() with revised constants, set_updated_at()
- [x] `004_checkout_rpc.sql` — create_order_atomic() with pessimistic inventory lock; grant to service_role only (security fix)
- [x] `005_indexes.sql` — performance indexes on all high-traffic query patterns
- [x] `006_idempotency.sql` — unique constraint on stripe_payment_intent_id; checkout_session_id column
- [x] `007_email_log.sql` — email_log table with RLS
- [x] `008_inventory_enhancements.sql` — tightened browse indexes; removed duplicate wardrobe index
- [x] `009_realtime_and_seed.sql` — Realtime on orders + rentals; seed The Essentials + The Interview Wardrobe
- [x] Migration history reconciled — local 001–009 match remote; all 9 in sync
- [x] `supabase db push` — all migrations applied, exit 0

### Security fixes applied during Phase 2
- `create_order_atomic` grant changed from `authenticated` → `service_role` — prevents any signed-in user from calling with an arbitrary user ID to create fraudulent orders

**Acceptance test:** `supabase migration list` → all 9 local/remote in sync

## Phase 3 — Auth Screens ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `app/(auth)/_layout.tsx` — Stack with fade animation + cream background
- [x] `app/(auth)/login.tsx` — email/password, react-hook-form + zod, error display, links to signup + forgot
- [x] `app/(auth)/signup.tsx` — name/email/password/terms, sets full_name + terms_accepted_at on profile, redirects to complete-profile
- [x] `app/(auth)/complete-profile.tsx` — shipping address form, phone (optional), terms checkbox (pre-checked if already accepted at signup)
- [x] `app/(auth)/forgot-password.tsx` — sends reset link via Supabase, shows confirmation state
- [x] `app/rental-terms.tsx` — modal with full legal terms, Close button
- [x] `hooks/useProtectedRoute.ts` — auth guard: unauthenticated → login, incomplete profile → complete-profile, complete → tabs; rental-terms exempted as public modal

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 3.5 — Admin Inventory Tool ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `admin/` — Next.js 14 App Router, TypeScript, Tailwind CSS
- [x] `admin/middleware.ts` — cookie-based password protection (ADMIN_PASSWORD env var)
- [x] `admin/app/login/page.tsx` — simple password login page
- [x] `admin/app/api/login` + `logout` — cookie set/clear routes
- [x] `admin/app/page.tsx` — dashboard with live stats (pending orders, active rentals, inventory count)
- [x] `admin/app/pieces/page.tsx` — inventory table with filter tabs (available/rented/draft/featured)
- [x] `admin/app/pieces/new/page.tsx` — add piece with AI URL extraction
- [x] `admin/app/pieces/[id]/page.tsx` — edit piece, +1 wear count, delete
- [x] `admin/app/orders/page.tsx` — orders table with status filter
- [x] `admin/app/orders/[id]/page.tsx` — order detail, update order status, per-rental tracking + carrier
- [x] `admin/app/wardrobes/page.tsx` — manage wardrobe names, descriptions, cover images, sort order
- [x] `admin/app/api/extract/route.ts` — AI product extraction via Anthropic SDK (direct, no auth required)
- [x] `admin/lib/actions.ts` — Server Actions for all mutations (pieces, orders, rentals, wardrobes)
- [x] `admin/.env.local.example` — documents all required env vars
- [x] `tsc --noEmit` → 0 errors; `npm install` clean

### To run locally
1. `cd admin && cp .env.local.example .env.local`
2. Fill in `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role)
3. Fill in `ADMIN_PASSWORD` (any password you choose)
4. Optionally add `ANTHROPIC_API_KEY` for AI extraction
5. `npm run dev` → opens at http://localhost:3001

**Acceptance test:** `tsc --noEmit` → 0 errors

## Phase 4 — Browse Screens ✅ COMPLETE
**Completed:** 2026-06-04

### Checklist
- [x] `components/ui/Skeleton.tsx` — shimmer animation, PieceCardSkeleton, WardrobeCardSkeleton, SuitcaseSkeleton
- [x] `components/ui/Badge.tsx`
- [x] `components/ui/EmptyState.tsx`
- [x] `components/ui/ErrorState.tsx`
- [x] `components/ui/Card.tsx`
- [x] `components/ui/ScreenHeader.tsx`
- [x] `components/ui/FilterBar.tsx` — category pills + color swatches
- [x] `components/piece/PricingBlock.tsx` — rental fee + buyout price display
- [x] `components/piece/PieceCard.tsx` — FadeInDown stagger, color swatch, new/rented badge
- [x] `components/wardrobe/WardrobeCard.tsx`
- [x] `components/home/HowItWorksStrip.tsx` — 3-step strip + pricing transparency block
- [x] `app/(tabs)/_layout.tsx` — BlurView iOS tab bar, badge hydration guard, 4 tabs
- [x] `app/(tabs)/index.tsx` — hero, HowItWorksStrip, wardrobe scroll, featured grid, guest CTA
- [x] `app/(tabs)/pieces.tsx` — search, FilterBar, sort pills, FlatList pagination
- [x] `app/(tabs)/suitcase.tsx` — placeholder (Phase 5)
- [x] `app/(tabs)/account.tsx` — placeholder (Phase 9)
- [x] `app/wardrobe/[id].tsx` — hero, tags, FilterBar, piece grid
- [x] `app/piece/[id].tsx` — gallery, brand/name, hygiene trust signal, PricingBlock, size selector, add to suitcase, similar pieces

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 5 — Suitcase Screen ✅ COMPLETE
**Completed:** 2026-06-04

### Checklist
- [x] `components/suitcase/SuitcaseItemRow.tsx` — image, brand, name, size badge, price, remove button, unavailable overlay
- [x] `components/suitcase/SuitcaseSummary.tsx` — monthly subtotal, bundle discount line, discounted total, handling fee, deposit, due today
- [x] `app/(tabs)/suitcase.tsx` — skeleton while !hydrated, empty state with browse CTA, item list with stagger animation, "Add X more to unlock Y% off" banner, SuitcaseSummary, checkout CTA
- [x] Availability re-check on focus via `useFocusEffect` + `queryClient.invalidateQueries` (wired for Phase 2 DB; `unavailableIds` state ready)
- [x] Tab badge with hydration guard — already in `(tabs)/_layout.tsx` from Phase 4
- [x] Multi-piece discount savings shown in SuitcaseSummary discount line
- [x] "Add 1 more to save X%" prompt banner

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 6 — Stripe Infrastructure ✅ COMPLETE
**Completed:** 2026-06-05

### Checklist
- [x] `supabase/functions/_shared/cors.ts` — CORS headers
- [x] `supabase/functions/_shared/stripe.ts` — Stripe client (npm:stripe@14, apiVersion 2024-06-20)
- [x] `supabase/functions/_shared/supabase.ts` — Supabase admin client (service role)
- [x] `supabase/functions/_shared/pricing.ts` — multiPieceDiscount() shared across functions
- [x] `supabase/functions/create-setup-intent/index.ts` — creates/reuses Stripe customer, returns SetupIntent client_secret for Payment Sheet
- [x] `supabase/functions/confirm-order/index.ts` — retrieves PM from SetupIntent, charges first month + handling, holds deposit, calls create_order_atomic RPC
- [x] `supabase/functions/stripe-webhook/index.ts` — verifies signature, handles 5 events: setup_intent.succeeded, payment_intent.succeeded, payment_intent.payment_failed, payment_intent.amount_capturable_updated, charge.refunded
- [x] `supabase/functions/charge-monthly/index.ts` — cron: groups active rentals by user, applies bundle discount, charges PM, advances next_billing_date. Schedule: 0 9 1 * *
- [x] `supabase/functions/process-buyout/index.ts` — charges buyout_price_snapshot, applies loyalty discount after 6 months, marks rental bought_out
- [x] `supabase/functions/release-deposit/index.ts` — admin: cancels deposit PaymentIntent hold
- [x] `supabase/functions/capture-deposit/index.ts` — admin: captures deposit (full or partial) for damage/non-return
- [x] `supabase/functions/cancel-rental/index.ts` — enforces 30-day minimum, stops billing, frees piece
- [x] `supabase/functions/extract-product/index.ts` — admin: Claude AI extracts product info from retailer URL
- [x] `supabase/functions/send-email/index.ts` — Resend transactional emails (6 templates); gracefully skips if RESEND_API_KEY not set
- [x] Migration 010: decrement_rental_count() helper RPC

### Pending before going live
- [ ] Register stripe-webhook URL in Stripe dashboard → copy signing secret → `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Set charge-monthly cron in Supabase dashboard: Schedule → `0 9 1 * *` → function: charge-monthly
- [ ] Add ANTHROPIC_API_KEY to Supabase secrets (for extract-product)
- [ ] Add RESEND_API_KEY + RESEND_FROM_EMAIL to Supabase secrets when ready for emails (Phase 10)

**Acceptance test:** `tsc --noEmit` → 0 errors (Edge Functions are Deno — tested at deploy time)

## Phase 7 — Checkout Flow ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `app/checkout/index.tsx` — full checkout screen with Path A (new customer) and Path B (returning)
  - Path A: calls `create-setup-intent` → `initPaymentSheet` → `presentPaymentSheet` → `confirm-order`
  - Path B: calls `confirm-order` directly using stored payment method (no card entry)
  - Loading/processing states, error display via `friendlyError()`, back nav disabled during processing
  - Android BackHandler guard blocks hardware back during payment processing
  - Clears suitcase and navigates to confirmation on success
- [x] `components/checkout/DepositExplainer.tsx` — explains deposit hold; shows "on file" badge for returning customers
- [x] `app/checkout/confirmation.tsx` — Reanimated spring checkmark (200ms delay) + ConfettiCannon (80 particles, navy/sand) + order summary from DB via useOrder + Share My Look button + Track Your Order CTA
- [x] `lib/stripe.ts` — base file for TypeScript module resolution (Metro uses platform-specific files at runtime)
- [x] `supabase/functions/create-setup-intent` — returns `setup_intent_id` and `ephemeral_key_secret` for Payment Sheet
- [x] `supabase/functions/confirm-order` — `setup_intent_id` optional; returning customers skip card entry and use stored PM
- [x] Fixed TypeScript error: `orderItems` was referenced but never declared (replaced with `buildOrderItems()` call)

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 8 — Order Status ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `app/order/[id].tsx` — Realtime order status (already wired in useOrder hook), progress bar, per-rental status
- [x] Buyout flow — "Own it" CTA appears per delivered rental with `process-buyout` Edge Function call
- [x] Loyalty discount — 5% off shown + applied after 6+ months of same rental
- [x] Contextual nudge — "Price drops each rental month" / "Still loving it? Own it." / loyalty badge
- [x] Purchased state — "✓ Purchased — yours to keep" label replaces buyout CTA after completion

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 9 — Account Screen ✅ COMPLETE
**Completed:** 2026-06-09

### Checklist
- [x] `app/(tabs)/account.tsx` — full account screen replacing placeholder
- [x] Profile header — full name + email from auth store
- [x] Active rentals list — piece image, brand, name, size, monthly fee, next billing date, status badge
- [x] Buyout CTA per delivered rental — same loyalty/nudge logic as order screen
- [x] Monthly billing summary — total, bundle discount line, next charge date
- [x] Shipping address card
- [x] Security deposit card (shown only when deposit_status === 'held')
- [x] Sign out — Alert confirmation → supabase.auth.signOut()
- [x] Empty state with Browse CTA when no active rentals

**Acceptance test:** `npx tsc --noEmit` → 0 errors

## Phase 10 — Polish & Web Parity
**Status:** NOT STARTED

## Phase 11 — Deployment
**Status:** NOT STARTED
