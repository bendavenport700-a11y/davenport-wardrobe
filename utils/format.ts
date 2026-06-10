export const formatCents = (cents: number | null | undefined): string => {
  if (cents == null || isNaN(cents)) return '$—'
  const d = cents / 100
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`
}
export const formatCentsPerMonth = (cents: number | null | undefined): string => `${formatCents(cents)}/mo`
export const wearCountLabel = (n: number): string =>
  n === 0 ? 'Brand new · tags attached' : n === 1 ? '1 previous renter · dry cleaned' : `${n} previous renters · dry cleaned`
export const conditionLabel = (c: string): string =>
  ({ new: 'Brand new', like_new: 'Like new · professionally cleaned', good: 'Gently worn · professionally cleaned' }[c] ?? c)

export const conditionShort = (c: string): string =>
  ({ new: 'New', like_new: 'Like New', good: 'Gently Worn' }[c] ?? c)

export const conditionBadgeLabel = (condition: string, wearCount: number): string =>
  wearCount === 0 ? 'New' : `${conditionShort(condition)} · ${wearCount}× rented`
export const statusLabel = (s: string): string =>
  ({ pending: 'Order Placed', confirmed: 'Confirmed', sourcing: 'Sourcing', shipped: 'Shipped',
     delivered: 'Delivered', complete: 'Complete',
     return_requested: 'Return Requested', returned: 'Returned', bought_out: 'Purchased' }[s] ?? s)
export const statusColor = (s: string): string =>
  ({ pending: '#F59E0B', confirmed: '#F59E0B', sourcing: '#F59E0B', shipped: '#3B82F6',
     delivered: '#22C55E', complete: '#22C55E',
     return_requested: '#F59E0B', returned: '#9CA3AF', bought_out: '#9CA3AF' }[s] ?? '#9CA3AF')
export const formatDate = (iso: string, _short?: boolean): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
export const formatNextBilling = (date: string | null): string => {
  if (!date) return ''
  return `Next billing: ${formatDate(date)}`
}
