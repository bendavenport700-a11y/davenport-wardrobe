# App Review Prep — v1.0.0 (Build 13)

## Status
- [ ] Bug fixes built and submitted (EAS Build)
- [ ] Screenshots updated
- [ ] Review Notes added in App Store Connect
- [ ] Test credentials added in App Store Connect
- [ ] Force-update gate verified
- [ ] New build submitted for review

---

## Bug Fixes (already committed to code)

### 1. Indefinite loading on "Confirm & Pay" — `lib/supabase.ts`
**What was wrong:** `callEdgeFunction` only protected the `fetch` call with an AbortController. The `supabase.auth.getSession()` that runs first had no timeout — if it triggered a token refresh on a bad connection, the function hung forever. AbortController is also unreliable on iOS in certain network states.

**Fix:** Rewrote to use `Promise.race` against a hard 30-second deadline that covers the entire function including `getSession()`. The deadline fires, aborts the controller, and rejects — the catch block resets the button to idle.

### 2. Stripe Payment Sheet hang on iPad — `app/checkout/index.tsx`
**What was wrong:** `presentPaymentSheet()` had no timeout. On iPad in iPhone compatibility mode (the app has `supportsTablet: false`) the Stripe sheet can fail to present or dismiss without resolving or rejecting. The "Loading…" state became permanent.

**Fix:** Added a 2-minute `Promise.race` around `presentPaymentSheet()` so the state always recovers.

---

## Review Notes (paste this into App Store Connect)

Go to: App Store Connect → Your App → the new build → Review Notes field.

```
GUEST BROWSING
The app can be browsed without an account. On the login or signup screen,
tap "Browse without an account →" at the bottom to explore pieces and
wardrobes without signing in. Sign-in is only required when interacting
(adding to suitcase, checkout, account).

SIGN IN WITH APPLE
Sign in with Apple is available on the login screen. A new user who signs
in with Apple will be taken to a profile completion screen to add their
shipping address before checking out.

APPLE PAY
Apple Pay is integrated via the @stripe/stripe-react-native Payment Sheet.
PassKit appears in the binary as a dependency of that SDK. To verify Apple Pay:

1. Use the test credentials below (or create a new account)
2. Complete the profile screen — shipping address is required
3. Add any item to the Suitcase tab
4. Tap Checkout → tap "Set Up Payment & Pay"
5. The Stripe Payment Sheet will appear with Apple Pay as the first option
   (requires Apple Pay to be configured in the device's Wallet app)

Merchant ID: merchant.com.davenportwardrobe

Test account:
  Email:    bendavenport700+appreviewer@gmail.com
  Password: DavenportReview1!

Note: Completing checkout requires a valid payment method (Stripe live mode).
This app is optimised for iPhone. On iPad it runs in iPhone compatibility mode.
```

---

## Force-Update Gate Check

**Before submitting:** Verify in Supabase that `app_config` table row with `key = 'minimum_ios_build'` has `value` ≤ the new build number.

If that value is higher than the build being reviewed, the reviewer sees a "Update Required" modal and cannot test anything.

---

## Screenshots Needed

App Store requires at least one of these iPhone sizes. Since `supportsTablet: false`, no iPad screenshots are required.

| Device | Size | Required |
|---|---|---|
| iPhone 16 Pro Max (6.9") | 1320 × 2868 px | Yes (primary) |
| iPhone 15 Plus (6.7") | 1290 × 2796 px | Optional |

### How to take them (Xcode Simulator)

1. `npx expo run:ios` or open the project in Xcode and run on the **iPhone 16 Pro Max** simulator
2. Navigate to each screen and press `Cmd + S` in the Simulator to save to Desktop
3. Do NOT use the system screenshot shortcut — use Simulator's File → Save Screen or `Cmd + S`

### Screens to screenshot (suggested order — tells a story)

1. **Browse / home** — the piece grid, showing the aesthetic
2. **Piece detail** — a nice piece open, showing imagery + rental price
3. **Suitcase** — a few pieces in the bag
4. **Checkout** — the order review screen (don't need to complete payment)
5. **Confirmation** — the order confirmed screen (confetti, checkmark)

Optional:
- Login or sign-up screen
- Account / profile screen

### Screenshot tips
- Make sure no personal data, test emails, or ugly placeholder content is visible
- Pieces should look premium — if the browse grid looks sparse, screenshot after loading
- Hide the status bar time if it looks odd (Simulator → I/O → Show Device Bezels off can help)

---

## EAS Build Command

```bash
cd /Users/benjamindavenport/Davenport
eas build --platform ios --profile production
```

Then submit:
```bash
eas submit --platform ios --latest
```

Or upload the .ipa manually in App Store Connect → TestFlight & Releases.

---

## Submission Checklist

- [ ] Run EAS build — build number auto-increments (eas.json has `autoIncrement: true`), no manual change needed
      `eas build --platform ios --profile production`
- [ ] Upload screenshots in App Store Connect (replace all existing ones)
- [ ] Paste Review Notes (above) into the Review Notes field
- [ ] Add test credentials to Review Notes
- [ ] Confirm `minimum_ios_build` ≤ new build number in Supabase
- [ ] Submit for review
