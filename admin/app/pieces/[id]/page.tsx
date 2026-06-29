import { notFound, redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PieceForm } from '@/components/PieceForm'
import { deletePiece } from '@/lib/actions'
import type { Piece, PieceUnit, Wardrobe } from '@/lib/types'

async function getPiece(id: string) {
  noStore()
  const { data } = await supabaseAdmin.from('pieces').select('*').eq('id', id).single()
  return data as Piece | null
}

async function getWardrobes() {
  noStore()
  const { data } = await supabaseAdmin.from('wardrobes').select('id, name, slug').eq('is_active', true).order('sort_order')
  return (data ?? []) as Wardrobe[]
}

async function getPieceUnits(pieceId: string) {
  noStore()
  const { data } = await supabaseAdmin
    .from('piece_units')
    .select('*')
    .eq('piece_id', pieceId)
    .order('size')
    .order('created_at')
  return (data ?? []) as PieceUnit[]
}

const CONDITION_LABEL: Record<string, string> = {
  new:      'Pristine',
  like_new: 'Excellent',
  good:     'Well-Worn / Veteran',
}

const CONDITION_COLOR: Record<string, string> = {
  new:      'bg-emerald-100 text-emerald-700',
  like_new: 'bg-blue-100 text-blue-700',
  good:     'bg-amber-100 text-amber-700',
}

export default async function EditPiecePage({ params }: { params: { id: string } }) {
  const [piece, wardrobes, units] = await Promise.all([
    getPiece(params.id),
    getWardrobes(),
    getPieceUnits(params.id),
  ])
  if (!piece) notFound()

  // Count total units per size (for the form's stepper initial state)
  const unitCounts: Record<string, number> = {}
  for (const u of units) {
    unitCounts[u.size] = (unitCounts[u.size] ?? 0) + 1
  }

  // Group units by size for the inventory table
  const unitsBySize: Record<string, PieceUnit[]> = {}
  for (const u of units) {
    if (!unitsBySize[u.size]) unitsBySize[u.size] = []
    unitsBySize[u.size].push(u)
  }

  const availableCount = units.filter(u => u.is_available).length
  const totalCount     = units.length

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href="/pieces" className="text-sm text-gray-500 hover:text-navy">← Pieces</a>
        <h1 className="text-2xl font-bold text-navy mt-1">{piece.brand} {piece.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {availableCount}/{totalCount} units available ·{' '}
          {piece.rental_fee ? `$${(piece.rental_fee / 100).toFixed(0)}/mo` : 'pricing pending'} ·{' '}
          buyout {piece.buyout_price ? `$${(piece.buyout_price / 100).toFixed(0)}` : '—'}
        </p>
      </div>

      {/* Inventory overview */}
      {units.length > 0 && (
        <div className="mb-8 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory Units</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-semibold">Size</th>
                <th className="text-left px-4 py-2 font-semibold">Wears</th>
                <th className="text-left px-4 py-2 font-semibold">Condition</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 font-medium text-navy">{u.size}</td>
                  <td className="px-4 py-2 text-gray-600">{u.wear_count}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CONDITION_COLOR[u.condition] ?? ''}`}>
                      {CONDITION_LABEL[u.condition]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.is_available
                      ? <span className="text-xs text-emerald-600 font-medium">Available</span>
                      : <span className="text-xs text-amber-600 font-medium">Rented out</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-8 p-4 bg-white rounded-xl border border-gray-100">
        <form action={async () => {
          'use server'
          await deletePiece(piece.id)
          redirect('/pieces')
        }}>
          <button type="submit"
            className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Delete
          </button>
        </form>
      </div>

      <PieceForm piece={piece} wardrobes={wardrobes} unitCounts={unitCounts} />
    </div>
  )
}
