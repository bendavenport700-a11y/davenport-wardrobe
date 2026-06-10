'use client'
import { useState, useMemo } from 'react'
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

  const sizes = group ? (SIZE_FOR_GROUP[group] ?? []) : ['XS','S','M','L','XL','XXL','30','32','34','36']

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-8">
        <h1 className="font-serif text-5xl font-bold text-navy">Browse</h1>
        <p className="font-sans text-slate text-sm">{filtered.length} piece{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by brand, name, or style…"
        className="w-full bg-white border border-sand rounded-xl px-5 py-3 font-sans text-navy placeholder-slate/50 focus:outline-none focus:ring-2 focus:ring-navy/20 mb-6"
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-start gap-4 mb-8">
        {/* Category groups */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_GROUPS.map(({ label }) => (
            <button
              key={label}
              onClick={() => { setGroup(label === 'All' ? null : label); setSize(null) }}
              className={`font-sans text-sm px-4 py-2 rounded-full border transition-colors ${
                (label === 'All' && !group) || group === label
                  ? 'bg-navy text-cream border-navy'
                  : 'bg-white text-slate border-sand hover:border-navy/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Size pills */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sizes.map(s => (
              <button
                key={s}
                onClick={() => setSize(size === s ? null : s)}
                className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  size === s
                    ? 'bg-navy text-cream border-navy'
                    : 'bg-white text-navy border-sand hover:border-navy/30'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-sans text-xs text-slate">Sort:</span>
          {(['newest','price_asc','price_desc'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setSort(opt)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                sort === opt ? 'bg-navy text-cream border-navy' : 'bg-white text-slate border-sand hover:border-navy/30'
              }`}
            >
              {opt === 'newest' ? 'Newest' : opt === 'price_asc' ? 'Price ↑' : 'Price ↓'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-serif text-2xl text-navy mb-3">
            {hasFilters ? 'No pieces match your filters.' : 'New inventory coming soon.'}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setGroup(null); setSize(null) }}
              className="font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(piece => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  )
}
