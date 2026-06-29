# The Big Addition — Trip Planning + Women's Expansion

*Created June 2026. Do not start coding until this plan is reviewed and approved.*

---

## What This Is

Two intertwined expansions that together turn Davenport from "a men's clothing rental app" into "a wardrobe platform for how people actually live":

1. **Trip Mode** — Rent for a specific trip, not just "some clothes." Quick trip, long stay, school year, wedding, vacation. Context-aware browsing, packing list builder, duration-aware billing.
2. **Women's Line** — His & hers. Open the market in half. Same rental model, new categories, new sizes, new wardrobes.

These should launch together or in very close sequence. Trip Mode is the platform differentiator. Women's Line is the market doubler.

---

## Part 1: Trip Mode

### Trip Types

| Type | Duration | Use Case | Example |
|------|----------|----------|---------|
| **Event** | 1–7 days | Specific occasion | "Nashville wedding weekend — need a suit, dress shirt, belt" |
| **Vacation** | 1–2 weeks | Leisure travel | "Week in Miami — beach, dinners, a nice night out" |
| **Extended Stay** | 1–3 months | Travel, work, exploration | "In Florida for the winter — need a full casual rotation" |
| **Season / School** | 3–12 months | Long commitment | "Fall semester — 2 weeks of outfits, all new" |

Each type has different implications for:
- How many pieces to recommend
- How billing works (single order vs. phased)
- What occasions/activities to prompt for
- What the packing list looks like

### What a Trip Is (Data Model)

```sql
-- New table
CREATE TABLE trips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users NOT NULL,
  name          text NOT NULL,                         -- "Nashville Wedding", "Florida Winter"
  type          text NOT NULL,                         -- 'event' | 'vacation' | 'extended_stay' | 'season'
  start_date    date,
  end_date      date,
  destination   text,                                  -- "Nashville, TN"
  climate       text,                                  -- 'tropical' | 'cold' | 'mild' | 'variable'
  occasions     text[],                                -- ['wedding', 'beach', 'casual', 'formal', 'athletic']
  notes         text,
  status        text DEFAULT 'planning',               -- 'planning' | 'active' | 'ordered' | 'complete'
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- New table
CREATE TABLE trip_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid REFERENCES trips ON DELETE CASCADE NOT NULL,
  piece_id    uuid REFERENCES pieces NOT NULL,
  size        text,                                    -- null = not yet sized
  occasion    text,                                    -- "rehearsal dinner", "travel day"
  notes       text,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
```

**RLS:** Users can only see and modify their own trips.

### The Trip Creation Wizard (4 steps)

**Step 1 — What kind of trip?**
Four big tappable cards with icons and one-line descriptions. Selecting a type pre-sets duration hints and occasion suggestions.

```
[✈️ Event]          [🌴 Vacation]
1–7 days, specific  1–2 weeks, leisure
occasions

[🏠 Extended Stay]  [🎓 Season / School]
1–3 months         A whole semester or year
```

**Step 2 — Tell us about it**
- Trip name (pre-filled suggestion based on type: "Miami Trip", "Fall Semester")
- Destination (optional but unlocks climate-aware suggestions)
- Dates (start → end, or just duration for season type)

**Step 3 — What's on your agenda?**
Multi-select occasion chips (context-aware based on type):

```
Event type shows:     Vacation type shows:     Season shows:
☑ Ceremony/wedding   ☑ Beach days             ☑ Everyday casual
☑ Rehearsal dinner   ☑ Nice dinners           ☑ Work / class
☑ Reception          ☑ Daytime exploring      ☑ Weekend / going out
☑ Travel day         ☑ Athletic / active      ☑ Formal occasions
☑ Day-after brunch   ☑ Travel days            ☑ Athletic / gym
```

**Step 4 — Start building your packing list**
Browse opens pre-filtered to occasion-appropriate pieces. User adds pieces to the trip (not yet to suitcase). Think: Pinterest board for clothes.

### Trip Detail Screen (`/trip/[id]`)

```
┌─ Nashville Wedding ─────────────────────────────┐
│  Jun 27 – Jul 1  ·  5 days  ·  Nashville, TN   │
│                                                  │
│  Packing List (3 pieces)                         │
│  ──────────────────────────────                  │
│  [img] Todd Snyder Suit · Navy · Size M    [×]  │
│        Ceremony, Reception                       │
│  [img] Bonobos Dress Shirt · White · —     [×]  │
│        SIZE NOT SELECTED ⚠                      │
│  [img] Rails Linen Shirt · Sand · Size M   [×]  │
│        Day-after brunch                          │
│                                                  │
│  + Browse pieces for this trip →                 │
│                                                  │
│  [Send to Suitcase →]                            │
└──────────────────────────────────────────────────┘
```

- Items without sizes show a warning but can still be saved
- "Send to Suitcase" moves all sized items to the existing suitcase flow, then to checkout
- Trip items can be annotated ("for the rehearsal dinner")
- Share trip link (future: send to partner to shop together)

### Where Trip Mode Lives in the App

**Entry points (3):**
1. **Home screen** — New "Plan a Trip" card between Wardrobes and Featured Pieces. Large CTA with trip type icons.
2. **Suitcase tab** — When suitcase is empty: "Building a suitcase? Give it context →" links to trip creation.
3. **Browse screen** — Filter chip "For a trip…" opens trip selector or creation.

**Navigation:**
- New screen: `app/trip/[id].tsx` (trip detail / packing list)
- New screen: `app/trip/new.tsx` (4-step wizard)
- New screen: `app/trips.tsx` (list of all my trips — linked from Account tab)
- Account tab: new "My Trips" section above active rentals

**No new tab needed.** Trips live in the flow of home → browse → suitcase → checkout. A separate tab would isolate them; the goal is trips as context for every other action.

### Billing Implications by Trip Type

| Type | Billing Model |
|------|---------------|
| Event / Vacation | Standard — one order, pieces returned after trip |
| Extended Stay | Standard — pieces stay for duration, month-to-month |
| Season / School | Standard billing but surface "semester bundle" framing — "4 pieces for a semester" |

The underlying billing model doesn't change. What changes is the UX framing. A "season stay" user is committing to a longer rental — the UI should acknowledge this and encourage more pieces (activates bundle discount).

---

## Part 2: Women's Line

### What Needs to Change

**Database:**
```sql
-- Add to pieces table
ALTER TABLE pieces ADD COLUMN gender text DEFAULT 'men';
-- Values: 'men' | 'women' | 'unisex'

-- Add to wardrobes table  
ALTER TABLE wardrobes ADD COLUMN gender text DEFAULT 'men';

-- Add to profiles table
ALTER TABLE profiles ADD COLUMN gender_preference text DEFAULT 'all';
-- Values: 'men' | 'women' | 'all'
```

**New Women's Categories (add to PieceCategory type):**
```
'dress' | 'midi-dress' | 'maxi-dress' | 'mini-dress'
'skirt' | 'blouse' | 'women-shirt' | 'women-pants' | 'women-shorts'
'romper' | 'jumpsuit' | 'women-outerwear' | 'women-jacket'
'women-shoes' | 'women-accessories'
```

**New Women's Sizes (add to ClothingSize type):**
- Clothing: '00' | '0' | '2' | '4' | '6' | '8' | '10' | '12' | '14' | '16' | '18'
- Shoes: '5' | '5.5' | '6' | '6.5' | '7' | '7.5' | '8' | '8.5' | '9' | '9.5' | '10'
- Standard letter sizes already exist (XS–XXL, shared with men's)

**Browse Screen:**
- Add gender toggle: `Men | Women | All` (pill toggle, defaults to profile preference)
- Filter chips update dynamically based on selected gender
- Category groups reorganized by gender

**Home Screen:**
- Wardrobes section shows gender-appropriate wardrobes
- "Featured Pieces" respects gender preference
- If `gender_preference = 'all'`, show a mix

**Profile / Onboarding:**
- Complete-profile screen: add "What are you shopping for?" — Men / Women / Both
- Saves to `profiles.gender_preference`
- Can be changed anytime in Account settings

**Admin:**
- Gender selector on PieceForm (Men / Women / Unisex)
- Women's categories in category dropdown when gender = women
- Women's sizes populate when women's category selected
- Wardrobe form: gender tag

### Women's Wardrobe Ideas (First Wave)

| Wardrobe | Concept |
|----------|---------|
| The Boardroom | Sharp women's workwear — blazers, trousers, blouses |
| The Social Edit | Going out pieces — dresses, elevated tops |
| The Weekend | Elevated casual — linen, relaxed fits, weekend comfort |
| The Resort | Vacation dressing — sundresses, resort wear |

### Rollout Sequence for Women's Line

1. DB schema changes (gender columns, new categories, new sizes)
2. Admin: add gender + women's categories to PieceForm
3. Start sourcing women's inventory (10 units per size, same model)
4. Browse: gender toggle
5. Profile: gender preference onboarding
6. Women's wardrobes curated and published
7. Marketing push

---

## How These Two Things Connect

- Women's trips have women's pieces recommended. Browse during trip creation filters by gender preference.
- A "bachelorette trip" is a women's event trip. A "golf trip" is a men's event trip. The trip type system is gender-neutral.
- Long term: couples can share a trip and each shop their own gender.
- Season/school trips could include both — a college student who shops men's and women's.

---

## Files That Will Need to Change

### Types
- `types/index.ts` — new Trip, TripItem interfaces; gender on Piece, Wardrobe; women's categories/sizes; gender_preference on Profile

### Database (Supabase)
- Migration: `add_gender_to_pieces_and_wardrobes`
- Migration: `add_gender_preference_to_profiles`
- Migration: `create_trips_and_trip_items`
- RLS policies for trips table (user owns their trips)

### App Screens (new)
- `app/trip/new.tsx` — 4-step wizard
- `app/trip/[id].tsx` — trip detail / packing list
- `app/trips.tsx` — all trips list

### App Screens (modified)
- `app/(tabs)/index.tsx` — "Plan a Trip" section on home
- `app/(tabs)/pieces.tsx` — gender toggle, women's categories
- `app/(tabs)/account.tsx` — My Trips section
- `app/(tabs)/suitcase.tsx` — trip context banner when suitcase came from a trip
- `app/(auth)/complete-profile.tsx` — gender preference step

### Components (new)
- `components/trip/TripCard.tsx` — trip preview card (used in account + home)
- `components/trip/TripItemRow.tsx` — packing list item row
- `components/trip/TripTypeSelector.tsx` — step 1 of wizard
- `components/trip/OccasionPicker.tsx` — step 3 multi-select
- `components/ui/GenderToggle.tsx` — Men / Women / All toggle

### Hooks (new)
- `hooks/useTrips.ts` — list user's trips
- `hooks/useTrip.ts` — single trip + items (with realtime?)

### Admin (modified)
- `admin/components/PieceForm.tsx` — gender selector, women's categories/sizes
- `admin/components/WardrobeForm.tsx` — gender tag

### Constants (modified)
- `constants/inventory.ts` — women's sizes by category, women's category groups

---

## What NOT to Build in v1

- AI packing suggestions (build the structure first, add AI later)
- Shared/collaborative trips (couples feature — later)
- Trip-aware pricing or bundles (current billing model works fine)
- Native calendar integration
- Push notifications for trip start/end

---

## WOMENS_ENABLED Feature Flag

All women's line code is fully implemented and gated behind a single constant:

```ts
// constants/features.ts
export const WOMENS_ENABLED = false
```

When `false` (current state):
- Gender toggle hidden on Browse screen
- Women's categories hidden in admin PieceForm
- Gender preference step hidden in onboarding
- All existing pieces default to `gender = 'men'`

When `true` (flip to launch):
- Gender toggle appears on Browse
- Women's categories/sizes available in admin
- Gender preference step shows in onboarding
- Browse defaults to user's saved preference

DB schema is fully built. Types are fully built. Only flip this constant when inventory is loaded.

---

## Prompt for New Session

Copy the block below into a new Claude Code session to start implementation:

```
I'm implementing "The Big Addition" for Davenport Wardrobe, an iOS rental clothing app (Expo SDK 56, Supabase, React Query, Zustand). 

Read /Users/benjamindavenport/Davenport/THE_BIG_ADDITION.md for the full plan. This is the source of truth — do not deviate from it without flagging me first.

Current state of the codebase:
- /Users/benjamindavenport/Davenport is the Expo app
- /Users/benjamindavenport/Davenport/admin is the Next.js admin panel
- /Users/benjamindavenport/Davenport/supabase/functions has all edge functions
- Types live in /Users/benjamindavenport/Davenport/types/index.ts
- Colors: /Users/benjamindavenport/Davenport/constants/colors.ts
- Layout: /Users/benjamindavenport/Davenport/constants/layout.ts
- Supabase project ID: rjplmjtydknascuqvyzq

CRITICAL RULES:
- DO NOT run `eas build` under any circumstances
- Run `npx tsc --noEmit` before finishing to confirm zero TypeScript errors
- Apply DB changes via the Supabase MCP tool (mcp__supabase__apply_migration)
- Match the existing code style exactly — no comments, Inter/PlayfairDisplay fonts, colors from constants

Start with Phase 1: DB schema (trips, trip_items tables + gender columns). Show me the SQL before applying, confirm, then apply. Then move to the types file. One phase at a time.
```
```
