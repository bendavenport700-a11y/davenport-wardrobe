import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { ConditionBadge } from '@/components/StatusBadge'
import type { Piece } from '@/lib/types'

async function getPieces(filter: string) {
  noStore()
  let q = supabaseAdmin.from('pieces').select('*').order('created_at', { ascending: false })
  if (filter === 'available')   q = q.eq('is_available', true).eq('is_draft', false).is('retired_at', null)
  if (filter === 'retired')     q = q.not('retired_at', 'is', null)
  if (filter === 'draft')       q = q.eq('is_draft', true)
  if (filter === 'featured')    q = q.eq('is_featured', true)
  if (filter === 'unavailable') q = q.eq('is_available', false).eq('is_draft', false).is('retired_at', null)
  const { data } = await q
  return (data ?? []) as Piece[]
}

export default async function PiecesPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const filter = searchParams.filter ?? 'available'
  const pieces = await getPieces(filter)

  const filters = [
    { key: 'available',   label: 'Available' },
    { key: 'unavailable', label: 'Rented Out' },
    { key: 'retired',     label: 'Retired' },
    { key: 'draft',       label: 'Drafts' },
    { key: 'featured',    label: 'Featured' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Pieces</h1>
        <Link
          href="/pieces/new"
          className="bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors"
        >
          + Add Piece
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {filters.map(f => (
          <Link
            key={f.key}
            href={`/pieces?filter=${f.key}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold">Piece</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold">Condition</th>
              <th className="text-left px-4 py-3 font-semibold">Cost</th>
              <th className="text-left px-4 py-3 font-semibold">Fee/mo</th>
              <th className="text-left px-4 py-3 font-semibold">Wears</th>
              <th className="text-left px-4 py-3 font-semibold">Flags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pieces.map(piece => (
              <tr key={piece.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {piece.images?.[0] ? (
                      <img src={piece.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-12 bg-navy/10 rounded flex items-center justify-center text-navy font-bold text-xs">D</div>
                    )}
                    <div>
                      <p className="font-medium text-navy">{piece.name}</p>
                      <p className="text-gray-500 text-xs">{piece.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{piece.category}</td>
                <td className="px-4 py-3"><ConditionBadge condition={piece.condition} /></td>
                <td className="px-4 py-3 text-gray-600">${(piece.cost_price / 100).toFixed(0)}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">
                  {piece.rental_fee ? `$${(piece.rental_fee / 100).toFixed(0)}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">{piece.wear_count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {piece.is_featured && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">featured</span>}
                    {piece.is_draft && <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">draft</span>}
                    {piece.retired_at && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded">retired</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/pieces/${piece.id}`} className="text-navy/60 hover:text-navy text-xs font-medium">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {pieces.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No pieces found</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {pieces.length} piece{pieces.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
