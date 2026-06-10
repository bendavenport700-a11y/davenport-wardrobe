import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PieceForm } from '@/components/PieceForm'
import { incrementWearCount, deletePiece } from '@/lib/actions'
import type { Piece, Wardrobe } from '@/lib/types'

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

export default async function EditPiecePage({ params }: { params: { id: string } }) {
  const [piece, wardrobes] = await Promise.all([getPiece(params.id), getWardrobes()])
  if (!piece) notFound()

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href="/pieces" className="text-sm text-gray-500 hover:text-navy">← Pieces</a>
        <h1 className="text-2xl font-bold text-navy mt-1">{piece.brand} {piece.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {piece.wear_count} wear{piece.wear_count !== 1 ? 's' : ''} ·{' '}
          {piece.rental_fee ? `$${(piece.rental_fee / 100).toFixed(0)}/mo` : 'pricing pending'} ·{' '}
          buyout {piece.buyout_price ? `$${(piece.buyout_price / 100).toFixed(0)}` : '—'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8 p-4 bg-white rounded-xl border border-gray-100">
        <form action={async () => {
          'use server'
          await incrementWearCount(piece.id)
        }}>
          <button type="submit"
            className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:border-navy/40 transition-colors">
            +1 Wear
          </button>
        </form>
        <form action={async () => {
          'use server'
          await deletePiece(piece.id)
        }}>
          <button type="submit"
            className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Delete
          </button>
        </form>
      </div>

      <PieceForm piece={piece} wardrobes={wardrobes} />
    </div>
  )
}
