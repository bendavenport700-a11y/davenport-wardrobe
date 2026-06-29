'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useCart } from '@/context/CartContext'
import { formatCentsPerMonth } from '@/lib/format'

const TYPE_LABEL: Record<string, string> = {
  event: 'Event',
  vacation: 'Vacation',
  extended_stay: 'Extended Stay',
  season: 'Season',
}

interface PlanItem {
  id: string
  size: string
  sort_order: number
  pieces: {
    id: string
    name: string
    brand: string
    images: string[] | null
    rental_fee: number
    buyout_price: number
    condition: string
    wear_count: number
    sizes_available: string[]
  } | null
}

interface Plan {
  id: string
  name: string
  type: string
  start_date: string | null
  end_date: string | null
  notes: string | null
  status: string
}

export function PlanClient({ plan, items: initialItems }: { plan: Plan; items: PlanItem[] }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [items, setItems] = useState<PlanItem[]>(initialItems)
  const [addingAll, setAddingAll] = useState(false)
  const [addedAll, setAddedAll] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function removeItem(itemId: string) {
    const supabase = createSupabaseBrowser()
    await supabase.from('trip_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function addAllToSuitcase() {
    setAddingAll(true)
    for (const item of items) {
      if (!item.pieces) continue
      addItem({
        piece_id: item.pieces.id,
        size: item.size,
        rental_fee_cents: item.pieces.rental_fee,
        wear_count_at_rental: item.pieces.wear_count,
        buyout_price_snapshot: item.pieces.buyout_price,
        piece: {
          name: item.pieces.name,
          brand: item.pieces.brand,
          images: item.pieces.images ?? [],
          sizes_available: item.pieces.sizes_available,
        },
      })
    }
    setAddingAll(false)
    setAddedAll(true)
  }

  async function deletePlan() {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('trips').delete().eq('id', plan.id)
    router.push('/plans')
  }

  const validItems = items.filter(i => i.pieces)

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <Link href="/plans" className="font-sans text-sm text-slate hover:text-navy transition-colors mb-8 inline-block">
        ← My Plans
      </Link>

      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-4xl font-bold text-navy">{plan.name}</h1>
            {plan.type && (
              <span className="font-sans text-[10px] uppercase tracking-widest bg-sand text-slate/60 px-2.5 py-1.5 rounded-full">
                {TYPE_LABEL[plan.type] ?? plan.type}
              </span>
            )}
          </div>
          {(plan.start_date || plan.end_date) && (
            <p className="font-sans text-sm text-slate/50 mt-1">
              {plan.start_date}{plan.start_date && plan.end_date ? ' — ' : ''}{plan.end_date}
            </p>
          )}
          {plan.notes && (
            <p className="font-sans text-sm text-slate mt-2 max-w-lg">{plan.notes}</p>
          )}
        </div>

        {validItems.length > 0 && (
          <div className="shrink-0">
            {addedAll ? (
              <div className="text-center">
                <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-2">
                  ✓ Added to suitcase
                </p>
                <Link href="/cart" className="font-sans text-xs text-navy underline underline-offset-2">
                  View suitcase →
                </Link>
              </div>
            ) : (
              <button
                onClick={addAllToSuitcase}
                disabled={addingAll}
                className="font-sans text-sm font-medium bg-navy text-cream px-7 py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {addingAll ? 'Adding…' : `Add all to suitcase (${validItems.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pieces */}
      {validItems.length === 0 ? (
        <div className="text-center py-24 border border-sand rounded-2xl">
          <p className="font-serif text-2xl text-navy mb-2">No pieces yet</p>
          <p className="font-sans text-sm text-slate mb-8">
            Browse pieces and save them to this plan.
          </p>
          <Link
            href="/browse"
            className="font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors"
          >
            Browse pieces →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map(item => {
            if (!item.pieces) return null
            const p = item.pieces
            return (
              <div key={item.id} className="group relative">
                <Link href={`/piece/${p.id}`} className="block">
                  <div className="aspect-[3/4] bg-sand rounded-2xl overflow-hidden relative mb-3">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={`${p.brand} ${p.name}`}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-4xl text-navy/20">D</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="font-sans text-[10px] bg-white/90 text-navy px-2 py-1 rounded-md font-medium">
                        {item.size}
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-slate/50 mb-0.5">{p.brand}</p>
                  <p className="font-sans text-sm font-medium text-navy line-clamp-1">{p.name}</p>
                  <p className="font-sans text-sm text-slate/70">{formatCentsPerMonth(p.rental_fee)}</p>
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate/50 hover:text-red-500 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="Remove from plan"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Browse + delete */}
      <div className="mt-16 pt-10 border-t border-sand flex items-center justify-between">
        <Link
          href="/browse"
          className="font-sans text-sm text-navy border border-navy/20 px-6 py-3 rounded-xl hover:bg-navy/5 transition-colors"
        >
          + Add more pieces
        </Link>
        <button
          onClick={deletePlan}
          disabled={deleting}
          className="font-sans text-xs text-slate/40 hover:text-red-500 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Delete plan'}
        </button>
      </div>
    </div>
  )
}
