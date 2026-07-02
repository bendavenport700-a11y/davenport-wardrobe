import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import LabelsClient, { type UnitWithPiece } from './LabelsClient'

async function getUnitsWithPieces(): Promise<UnitWithPiece[]> {
  noStore()
  const { data, error } = await supabaseAdmin
    .from('piece_units')
    .select(`
      id,
      piece_id,
      size,
      wear_count,
      condition,
      is_available,
      piece:pieces (
        id,
        name,
        brand
      )
    `)
    .order('piece_id')
    .order('size')

  if (error) {
    console.error('Failed to fetch piece units:', error)
    return []
  }

  // Supabase returns piece as object (not array) for many-to-one joins
  return (data ?? []).map((row: any) => ({
    id: row.id,
    piece_id: row.piece_id,
    size: row.size,
    wear_count: row.wear_count,
    condition: row.condition,
    is_available: row.is_available,
    piece: Array.isArray(row.piece) ? row.piece[0] : row.piece,
  })) as UnitWithPiece[]
}

export default async function LabelsPage() {
  const units = await getUnitsWithPieces()

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Explainer */}
      <div className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy mb-1">QR Labels</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Print these and stick one on each physical piece (or its bag/hanger tag). Every label has a unique QR code tied to that exact unit —
          size, condition, wear count, everything. When you scan it, you instantly know which unit you're holding without digging through the system.
          Use it when packing orders, checking in returns, or doing inventory counts.
        </p>
        <div className="mt-3 flex gap-3 text-xs text-gray-400">
          <span>🟢 Green dot = pristine / never worn</span>
          <span>🔵 Blue dot = excellent</span>
          <span>🟡 Amber dot = well-worn</span>
        </div>
      </div>
      <LabelsClient units={units} />
    </div>
  )
}
