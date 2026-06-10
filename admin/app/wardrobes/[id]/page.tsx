import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { setPieceWardrobe } from '@/lib/actions'
import type { Piece, Wardrobe } from '@/lib/types'

async function getData(id: string) {
  noStore()
  const [{ data: wardrobe }, { data: pieces }, { data: allWardrobes }] = await Promise.all([
    supabaseAdmin.from('wardrobes').select('*').eq('id', id).single(),
    supabaseAdmin.from('pieces').select('*').eq('wardrobe_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('wardrobes').select('id, name').order('sort_order'),
  ])
  return {
    wardrobe: wardrobe as Wardrobe | null,
    pieces: (pieces ?? []) as Piece[],
    allWardrobes: (allWardrobes ?? []) as { id: string; name: string }[],
  }
}

export default async function WardrobeDetailPage({ params }: { params: { id: string } }) {
  const { wardrobe, pieces, allWardrobes } = await getData(params.id)
  if (!wardrobe) notFound()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/wardrobes" className="text-sm text-gray-500 hover:text-navy">← Wardrobes</Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-navy">{wardrobe.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wardrobe.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {wardrobe.is_active ? 'Active' : 'Hidden'}
          </span>
        </div>
        {wardrobe.description && (
          <p className="text-gray-500 text-sm mt-1">{wardrobe.description}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">{pieces.length} piece{pieces.length !== 1 ? 's' : ''}</p>
      </div>

      {pieces.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No pieces in this wardrobe yet.</p>
          <Link href="/pieces/new" className="text-navy text-sm font-medium hover:underline mt-2 inline-block">
            Add a piece →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {pieces.map(piece => (
            <div key={piece.id} className="flex items-center gap-4 px-4 py-3">
              {/* Image */}
              {piece.images?.[0] ? (
                <img src={piece.images[0]} alt="" className="w-12 h-14 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-12 h-14 bg-navy/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-navy font-bold text-xs">D</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-navy text-sm truncate">{piece.name}</p>
                <p className="text-gray-500 text-xs">{piece.brand} · {piece.category} · Size {piece.sizes_available?.join(', ')}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {piece.rental_fee ? (
                    <span className="text-xs text-gray-600">${(piece.rental_fee / 100).toFixed(0)}/mo</span>
                  ) : null}
                  {!piece.is_available && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">rented</span>}
                  {piece.is_draft && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">draft</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Move to different wardrobe */}
                <form>
                  <select
                    name="wardrobe_id"
                    defaultValue={piece.wardrobe_id ?? ''}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy/30 max-w-[140px]"
                  >
                    <option value="">— No wardrobe —</option>
                    {allWardrobes.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <button
                    formAction={async (fd: FormData) => {
                      'use server'
                      const newWardrobeId = fd.get('wardrobe_id') as string || null
                      await setPieceWardrobe(piece.id, newWardrobeId)
                    }}
                    className="ml-1.5 text-xs text-navy/60 hover:text-navy transition-colors"
                  >
                    Move
                  </button>
                </form>

                <Link
                  href={`/pieces/${piece.id}`}
                  className="text-xs text-navy/60 hover:text-navy font-medium transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick-add unassigned pieces */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-navy mb-3">Add pieces to this wardrobe</h2>
        <UnassignedPieces wardrobeId={wardrobe.id} allWardrobes={allWardrobes} />
      </div>
    </div>
  )
}

async function UnassignedPieces({ wardrobeId, allWardrobes }: { wardrobeId: string; allWardrobes: { id: string; name: string }[] }) {
  noStore()
  const { data } = await supabaseAdmin
    .from('pieces')
    .select('id, name, brand, category, images, wardrobe_id')
    .is('wardrobe_id', null)
    .eq('is_draft', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const pieces = (data ?? []) as Partial<Piece>[]
  if (pieces.length === 0) return (
    <p className="text-sm text-gray-400">No unassigned pieces.</p>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
      {pieces.map(piece => (
        <div key={piece.id} className="flex items-center gap-3 px-4 py-2.5">
          {piece.images?.[0] ? (
            <img src={piece.images[0]} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
          ) : (
            <div className="w-8 h-10 bg-navy/10 rounded shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-navy font-medium truncate">{piece.name}</p>
            <p className="text-xs text-gray-500">{piece.brand} · {piece.category}</p>
          </div>
          <form>
            <button
              formAction={async () => {
                'use server'
                await setPieceWardrobe(piece.id!, wardrobeId)
              }}
              className="text-xs bg-navy text-white px-3 py-1 rounded-lg hover:bg-navy/90 transition-colors"
            >
              Add to wardrobe
            </button>
          </form>
        </div>
      ))}
    </div>
  )
}
