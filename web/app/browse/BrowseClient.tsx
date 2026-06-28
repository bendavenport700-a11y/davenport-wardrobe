'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PieceCard } from '@/components/PieceCard'

interface Piece {
  id: string
  name: string
  brand: string
  images: string[] | null
  rental_fee: number
  buyout_price: number
  wear_count: number
  category: string
  sizes_available: string[]
  color?: string | null
  description?: string | null
}

const CATEGORY_GROUPS = [
  { label: 'All', match: null },
  { label: 'Tops', match: ['shirt','polo','t-shirt','henley','sweater','hoodie','sweatshirt','cardigan','vest'] },
  { label: 'Bottoms', match: ['pants','chinos','trousers','denim','joggers'] },
  { label: 'Outerwear', match: ['outerwear','jacket','blazer','coat','bomber','fleece'] },
  { label: 'Shorts', match: ['shorts'] },
  { label: 'Shoes', match: ['shoes'] },
  { label: 'Accessories', match: ['accessories'] },
]

const SIZE_FOR_GROUP: Record<string, string[]> = {
  Tops:       ['XS','S','M','L','XL','XXL'],
  Bottoms:    ['28','29','30','31','32','33','34','36','38','40','42'],
  Outerwear:  ['XS','S','M','L','XL','XXL'],
  Shorts:     ['28','29','30','31','32','33','34','36','38'],
  Shoes:      ['7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12'],
  Accessories:['One Size'],
}

export function BrowseClient({ pieces }: { pieces: Piece[] }) {
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  const sizes = group ? (SIZE_FOR_GROUP[group] ?? []) : []

  const filtered = useMemo(() => {
    let result = [...pieces]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    if (group) {
      const cats = CATEGORY_GROUPS.find(g => g.label === group)?.match
      if (cats) result = result.filter(p => cats.includes(p.category))
    }
    if (size) {
      result = result.filter(p => p.sizes_available.includes(size))
    }
    if (sort === 'price_asc') result.sort((a, b) => a.rental_fee - b.rental_fee)
    else if (sort === 'price_desc') result.sort((a, b) => b.rental_fee - a.rental_fee)
    return result
  }, [pieces, search, group, size, sort])

  const hasFilters = !!(search || group || size)
  const clearAll = () => { setSearch(''); setGroup(null); setSize(null) }

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-cream border-b border-sand/60 px-6 pt-10 pb-8">
        <div className="max-w-6xl mx-auto">
          <p className="font-sans text-xs uppercase tracking-widest text-slate/50 mb-2">Davenport</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-navy">Browse</h1>
            <p className="font-sans text-sm text-slate/60 pb-1">{filtered.length} piece{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-cream/98 backdrop-blur-sm border-b border-sand/60 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brand, name, or style…"
            className="w-full bg-white border border-sand rounded-xl px-4 py-2.5 font-sans text-sm text-navy placeholder-slate/40 focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/30 transition-all"
          />

          {/* Category + sort row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {CATEGORY_GROUPS.map(({ label }) => (
              <button
                key={label}
                onClick={() => { setGroup(label === 'All' ? null : label); setSize(null) }}
                className={`whitespace-nowrap font-sans text-xs px-3.5 py-2 rounded-full border transition-colors ${
                  (label === 'All' && !group) || group === label
                    ? 'bg-navy text-cream border-navy'
                    : 'bg-white text-slate border-sand hover:border-navy/25 hover:text-navy'
                }`}
              >
                {label}
              </button>
            ))}

            <div className="ml-auto pl-3 border-l border-sand/60 flex items-center gap-1.5 shrink-0">
              {(['newest','price_asc','price_desc'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSort(opt)}
                  className={`whitespace-nowrap font-sans text-xs px-3 py-2 rounded-full border transition-colors ${
                    sort === opt ? 'bg-navy text-cream border-navy' : 'bg-white text-slate/70 border-sand hover:border-navy/25'
                  }`}
                >
                  {opt === 'newest' ? 'Newest' : opt === 'price_asc' ? 'Price ↑' : 'Price ↓'}
                </button>
              ))}
            </div>
          </div>

          {/* Size pills */}
          {sizes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="font-sans text-xs text-slate/50 shrink-0">Size:</span>
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(size === s ? null : s)}
                  className={`whitespace-nowrap font-sans text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    size === s ? 'bg-navy text-cream border-navy' : 'bg-white text-navy border-sand hover:border-navy/25'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Clear filters */}
          {hasFilters && (
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-slate/40">Filters active</span>
              <button onClick={clearAll} className="font-sans text-xs text-navy underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-sans text-slate/50 text-sm mb-6">
              {hasFilters ? 'No pieces match your filters.' : 'New inventory coming soon.'}
            </p>
            {hasFilters && (
              <button onClick={clearAll} className="font-sans text-sm text-navy underline underline-offset-4">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map(piece => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-16 text-center border-t border-sand pt-12">
            <p className="font-sans text-sm text-slate mb-4">
              Ready to rent? Download the app to add pieces to your suitcase.
            </p>
            <Link
              href="https://apps.apple.com/app/davenport/id6778844291"
              className="inline-block bg-navy text-cream font-sans font-medium text-sm px-8 py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
            >
              Download on the App Store
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
