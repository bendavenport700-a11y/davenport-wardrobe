# Davenport — Cheat Sheet

> Everything you need in one place. Keep this file. Never share the actual secret key values.

---

## Terminal Commands

Open Terminal, paste these exactly.

### Start the mobile app (what you test on your phone)
```
cd /Users/benjamindavenport/Davenport
npx expo start
```
Then scan the QR code with your iPhone camera (opens in Expo Go).

### Start the admin panel (where you manage orders & inventory)
```
cd /Users/benjamindavenport/Davenport/admin
npm run dev
```
Then open **localhost:3001** in your browser. Bookmark that URL.

### Start the website locally (davenport.rentals preview)
```
cd /Users/benjamindavenport/Davenport/web
npm run dev
```
Then open **localhost:3000** in your browser.

### Deploy a backend function (after editing an edge function)
```
cd /Users/benjamindavenport/Davenport
npx supabase functions deploy confirm-order
```
Replace `confirm-order` with whichever function you edited.

### Check for code errors
```
cd /Users/benjamindavenport/Davenport
npx tsc --noEmit
```
Zero output = no errors. Good.

### Build for the App Store (only run when explicitly ready — uses paid credits)
```
eas build --platform ios --profile production
```
Run this from `/Users/benjamindavenport/Davenport`. You'll be asked questions — answer interactively.

---

## Third-Party Services — What They Are & Where to Log In

| Service | What it does | Login |
|---|---|---|
| **Supabase** | Your database, user accounts, and backend functions | supabase.com → project: `davenport-closet` |
| **Stripe** | Handles all card payments, deposits, and refunds | dashboard.stripe.com |
| **Resend** | Sends emails to customers (order confirmations, receipts) | resend.com |
| **ImprovMX** | Forwards emails to @davenport.rentals into your Gmail | app.improvmx.com |
| **Vercel** | Hosts davenport.rentals (the website) and manages your domain's DNS | vercel.com |
| **Expo / EAS** | Builds and publishes the iOS app | expo.dev |
| **Apple Developer** | App Store listing, provisioning, Sign in with Apple | developer.apple.com |
| **App Store Connect** | Manage your App Store page, pricing, reviews | appstoreconnect.apple.com |
| **Anthropic** | AI that extracts product info from URLs in the admin tool | console.anthropic.com |
| **Pirateship** *(not set up yet)* | Where you buy discounted USPS/UPS shipping labels to send orders | pirateship.com |
| **Google Cloud** *(deferred)* | Was used for Google Sign-In attempt — not active | console.cloud.google.com |

---

## Important IDs (Safe to Write Down — Not Secret)

These are identifiers, not passwords. Safe to store here.

| What | Value |
|---|---|
| Supabase Project URL | `https://rjplmjtydknascuqvyzq.supabase.co` |
| Supabase Project Ref | `rjplmjtydknascuqvyzq` |
| Expo Project ID | `69329409-f8f2-4601-ab4f-d9b4cc0d71a9` |
| App Bundle ID | `com.davenportwardrobe.app` |
| App Store App ID | `6778844291` |
| Apple Team ID | `LL8CV6X742` |
| Apple Sign-In Key ID | `62K2NKU4W8` |
| Apple Services ID | `com.davenportwardrobe.signin` |
| Stripe Merchant ID | `merchant.com.davenportwardrobe` |
| Admin panel URL (local) | `localhost:3001` |
| Live website | `https://davenport.rentals` |

---

## Secret Keys — Where to Find Them (Never Put the Values Here)

These are stored securely in two places: your `.env` files and Supabase Secrets.  
If you ever need to find or reset a key, here's where each one lives.

### In Supabase Edge Function Secrets
Go to: supabase.com → your project → Settings → Edge Functions → Secrets

| Secret Name | What it's for | Where to get a new one |
|---|---|---|
| `STRIPE_SECRET_KEY` | Charges cards | dashboard.stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe events | dashboard.stripe.com → Developers → Webhooks |
| `RESEND_API_KEY` | Sends emails | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Email sender address | `noreply@davenport.rentals` (fixed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | supabase.com → Settings → API |
| `ANTHROPIC_API_KEY` | AI product extraction | console.anthropic.com → API Keys |
| `DEPOSIT_AMOUNT_CENTS` | Deposit amount (7500 = $75) | You set this |
| `HANDLING_FEE_CENTS` | Handling fee (500 = $5) | You set this |

### In the Mobile App (.env file at `/Users/benjamindavenport/Davenport/.env`)
| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | supabase.com → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Settings → API |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → Developers → API Keys |

### In the Admin Panel (`/admin/.env.local`)
| Variable | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `ADMIN_PASSWORD` | You set this — it protects the admin panel |

---

## Email Setup

All @davenport.rentals emails forward to **bendavenport700@gmail.com** via ImprovMX.

| Address | Purpose |
|---|---|
| support@davenport.rentals | General customer questions |
| returns@davenport.rentals | Return requests |
| ben@davenport.rentals | Direct founder contact |
| noreply@davenport.rentals | Outgoing emails (order confirmations, receipts) |

---

## Where Everything Lives on Your Computer

| What | Path |
|---|---|
| Davenport mobile app | `/Users/benjamindavenport/Davenport/` |
| Admin panel | `/Users/benjamindavenport/Davenport/admin/` |
| Website | `/Users/benjamindavenport/Davenport/web/` |
| Backend functions | `/Users/benjamindavenport/Davenport/supabase/functions/` |
| Master plan | `/Users/benjamindavenport/Davenport/MASTERPLAN.md` |
| This file | `/Users/benjamindavenport/Davenport/CHEATSHEET.md` |
| Guidr app | `/Users/benjamindavenport/my-app/` |

---

## Guidr (Separate App)

Guidr is a different project — a walking/exploration app. It lives at `/Users/benjamindavenport/my-app/`.

### Start Guidr
```
cd /Users/benjamindavenport/my-app
npx expo start
```

Guidr uses its own Supabase project and its own EAS build setup. It previously used **Sentry** for error tracking (a crash reporting tool — you don't need to actively manage it, it just runs in the background and logs errors).

---

## Billing — What's Free, What Will Cost Money

### What you pay right now (fixed)
| Service | Cost | What for |
|---|---|---|
| Apple Developer | **$99/year** | Required to publish on the App Store |
| Stripe | **2.9% + $0.30** per transaction | Taken automatically from every payment — no invoice |

That's it. Everything else is on a free tier right now.

---

### Stripe — most important to understand

Stripe never sends you a bill. They just take their cut automatically before depositing money to your bank.

**Example:** Customer pays $105 (first month + handling)
- Stripe takes: ~$3.35 (2.9% + $0.30)
- You receive: ~$101.65

At $75 deposit hold: Stripe charges nothing until you capture or release it.

You'll want to make sure your **bank account is connected in Stripe** so money actually transfers to you. Check: dashboard.stripe.com → Settings → Bank accounts.

---

### Free tiers — when you'll outgrow them

| Service | Free limit | When you'll hit it | Paid price |
|---|---|---|---|
| **Supabase** | 50,000 users, 500MB database | Probably 1,000+ active customers | $25/month |
| **Resend** | 3,000 emails/month | ~1,000 active customers (3 emails each/month) | $20/month |
| **Vercel** | Generous bandwidth | Very high web traffic | $20/month |
| **EAS (Expo builds)** | Limited builds/month | Whenever you build frequently | $29/month |
| **ImprovMX** | Email forwarding only | If you want to *send* from @davenport.rentals | $9/month |
| **Anthropic** | Pay per use (tiny) | Admin URL extraction — negligible cost | Pennies |

**Short version:** You won't get any surprise bills until you have hundreds of active customers. When you do start scaling, the first bill will probably be Supabase at $25/month — and at that point you'll be making real money, so it won't matter.

---

### Bills to watch for as you grow

1. **Stripe payouts** — Not a bill, but make sure your bank is connected or money just sits there
2. **Apple Developer renewal** — $99 every year in June-ish. They email you before it renews
3. **Supabase** — First paid tier is $25/month. They email you when you're near the free limit
4. **Resend** — $20/month once you pass 3,000 emails. They email you at the limit
5. **Vercel** — Only if you get significant web traffic. Most small businesses never need to upgrade
6. **EAS** — Only if you're building the app frequently. One build per release is fine on free

---

## If Something Breaks

| Problem | Where to look |
|---|---|
| App won't load / crashes | Run `npx expo start` and check the red error in terminal |
| Payment not going through | dashboard.stripe.com → Events (shows every charge attempt) |
| Email not arriving | resend.com → Logs (shows every email sent or failed) |
| Database error | supabase.com → project → Logs |
| Admin panel broken | Terminal running `npm run dev` shows errors |
| App Store rejected | appstoreconnect.apple.com → your app → Activity |
| Edge function error | supabase.com → project → Edge Functions → Logs |
