export function formatCents(cents: number | null | undefined): string {
  if (cents == null || isNaN(cents)) return '$—'
  const d = cents / 100
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`
}

export function formatCentsPerMonth(cents: number | null | undefined): string {
  return `${formatCents(cents)}/mo`
}
