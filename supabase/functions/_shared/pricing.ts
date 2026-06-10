export function multiPieceDiscount(count: number): number {
  if (count <= 1) return 0
  if (count <= 2) return 0.08
  if (count <= 4) return 0.18
  if (count <= 6) return 0.25
  return 0.30
}
