export const HANDLING_FEE_CENTS = 1400
export const DEPOSIT_CENTS = 7500

export function multiPieceDiscount(count: number): number {
  if (count <= 1) return 0
  if (count <= 2) return 0.08
  if (count <= 4) return 0.18
  if (count <= 6) return 0.25
  return 0.30
}

export function calcOrderTotals(items: { rental_fee_cents: number }[], existingRentalCount = 0) {
  const rawMonthly = items.reduce((sum, i) => sum + i.rental_fee_cents, 0)
  const totalPieces = existingRentalCount + items.length
  const discount = multiPieceDiscount(totalPieces)
  const monthlyTotal = Math.round(rawMonthly * (1 - discount))
  const chargeToday = monthlyTotal + HANDLING_FEE_CENTS
  return { rawMonthly, discount, monthlyTotal, chargeToday }
}
