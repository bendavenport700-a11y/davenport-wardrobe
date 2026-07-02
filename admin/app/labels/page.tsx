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
      <LabelsClient units={units} />
    </div>
  )
}
