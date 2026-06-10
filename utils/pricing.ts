// Revised per MASTERPLAN.md Part III — Section 13/15.
// Base rate reduced from 30% → 15% to support adoption and multi-piece wardrobe building.
// Buyout starts at 90% of cost (vs 100%) — customer tested it risk-free; small discount is fair.
const BASE_RENTAL_RATE = 0.15
const BUYOUT_START_MULT = 0.90
const WEAR_DISCOUNT    = 0.010
const BUYOUT_DISCOUNT  = 0.08
const MIN_RENTAL_RATE  = 0.05
const MIN_BUYOUT_MULT  = 0.30
const RETIRE_THRESHOLD = 400

// Multi-piece discount tiers — applied to combined monthly billing (server-side).
// Stored here as a reference for client-side preview; canonical logic lives in Edge Functions.
export const MULTI_PIECE_DISCOUNTS: Record<number, number> = {
  1: 0,
  2: 0.08,
  3: 0.18,
  4: 0.18,
  5: 0.25,
  6: 0.25,
  7: 0.30,
}

export function multiPieceDiscount(count: number): number {
  if (count <= 1) return 0
  if (count <= 2) return MULTI_PIECE_DISCOUNTS[2]
  if (count <= 4) return MULTI_PIECE_DISCOUNTS[3]
  if (count <= 6) return MULTI_PIECE_DISCOUNTS[5]
  return MULTI_PIECE_DISCOUNTS[7]
}

export function computeBuyoutPrice(costCents: number, wearCount: number): number {
  const mult = Math.max(MIN_BUYOUT_MULT, BUYOUT_START_MULT - BUYOUT_DISCOUNT * wearCount)
  return Math.round(costCents * mult)
}

export function computeRentalFee(costCents: number, wearCount: number): number {
  const buyout = computeBuyoutPrice(costCents, wearCount)
  const rate = Math.max(MIN_RENTAL_RATE, BASE_RENTAL_RATE - WEAR_DISCOUNT * wearCount)
  return Math.round(buyout * rate)
}

export function shouldRetire(costCents: number, wearCount: number): boolean {
  return computeRentalFee(costCents, wearCount) < RETIRE_THRESHOLD
}

export function previewNewPiece(costCents: number) {
  return {
    buyout:       computeBuyoutPrice(costCents, 0),
    rentalFee:    computeRentalFee(costCents, 0),
    willRetireAt: Math.ceil((BASE_RENTAL_RATE - MIN_RENTAL_RATE) / WEAR_DISCOUNT),
  }
}

// Loyalty buyout bonus — 5% off after 6+ continuous months of renting the same item.
// Applied server-side at buyout time; surfaced here for UI preview only.
export const LOYALTY_BUYOUT_BONUS_MONTHS = 6
export const LOYALTY_BUYOUT_BONUS_PCT    = 0.05

export function computeLoyaltyBuyoutPrice(
  costCents: number,
  wearCount: number,
  loyaltyMonths: number,
): number {
  const standard = computeBuyoutPrice(costCents, wearCount)
  if (loyaltyMonths < LOYALTY_BUYOUT_BONUS_MONTHS) return standard
  const discounted = Math.round(standard * (1 - LOYALTY_BUYOUT_BONUS_PCT))
  return Math.max(Math.round(costCents * MIN_BUYOUT_MULT), discounted)
}
