export const formatCents = (cents: number | null | undefined): string => {
  if (cents == null || isNaN(cents)) return '$—'
  const d = cents / 100
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`
}
export const formatCentsPerMonth = (cents: number | null | undefined): string => `${formatCents(cents)}/mo`

// ── Wear tier display ──────────────────────────────────────────────────────────
// Four tiers with brand-appropriate names. The DB stores 'new'/'like_new'/'good'
// for pieces; display always derives from the numeric wear_count.

export function wearTierLabel(wearCount: number): string {
  if (wearCount === 0)  return 'Pristine'
  if (wearCount <= 5)   return 'Excellent'
  if (wearCount <= 10)  return 'Well-Worn'
  return 'Veteran'
}

export function wearTierDescription(wearCount: number): string {
  if (wearCount === 0)  return 'Never worn · tags attached'
  if (wearCount <= 5)   return `${wearCount} previous renter${wearCount > 1 ? 's' : ''} · dry cleaned`
  if (wearCount <= 10)  return `${wearCount} previous renters · dry cleaned`
  return `${wearCount} previous renters · inspected & cleaned`
}

export const wearCountLabel = (n: number): string => wearTierDescription(n)

export const conditionLabel = (c: string): string =>
  ({ new: 'Pristine · never worn', like_new: 'Seasoned · dry cleaned', good: 'Refined · dry cleaned' }[c] ?? c)

export const conditionShort = (c: string): string =>
  ({ new: 'Pristine', like_new: 'Seasoned', good: 'Refined' }[c] ?? c)

export const conditionBadgeLabel = (condition: string, wearCount: number): string =>
  wearTierLabel(wearCount)

export const statusLabel = (s: string): string =>
  ({ pending: 'Order Placed', confirmed: 'Confirmed', sourcing: 'Sourcing', packaged: 'Packaged', shipped: 'Shipped',
     delivered: 'Delivered', complete: 'Complete', refunded: 'Refunded',
     refund_requested: 'Refund Pending', return_requested: 'Return Requested',
     returned: 'Returned', bought_out: 'Purchased' }[s] ?? s)
export const statusColor = (s: string): string =>
  ({ pending: '#F59E0B', confirmed: '#F59E0B', sourcing: '#F59E0B', packaged: '#F59E0B', shipped: '#3B82F6',
     delivered: '#22C55E', complete: '#22C55E', refunded: '#9CA3AF',
     refund_requested: '#F59E0B', return_requested: '#F59E0B',
     returned: '#9CA3AF', bought_out: '#9CA3AF' }[s] ?? '#9CA3AF')
export const formatDate = (iso: string, _short?: boolean): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
export const formatNextBilling = (date: string | null): string => {
  if (!date) return ''
  return `Next billing: ${formatDate(date)}`
}
