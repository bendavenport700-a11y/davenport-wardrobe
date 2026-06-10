'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPiece, updatePiece } from '@/lib/actions'
import { CATEGORIES, COLORS } from '@/lib/types'
import type { Piece, Wardrobe, PieceCategory, PieceColor } from '@/lib/types'

const TOPS        = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BOTTOMS     = ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
// Shorts use both systems — athletic brands (Vuori, Nike) use XS-XXL, chino shorts use waist sizes
const SHORTS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '33', '34', '36', '38']
const SIZE_SETS: Record<string, string[]> = {
  shirt: TOPS, polo: TOPS, 't-shirt': TOPS, henley: TOPS,
  sweater: TOPS, hoodie: TOPS, sweatshirt: TOPS, cardigan: TOPS, vest: TOPS,
  pants: BOTTOMS, chinos: BOTTOMS, trousers: BOTTOMS, denim: BOTTOMS, joggers: BOTTOMS,
  shorts: SHORTS_SIZES,
  outerwear: TOPS, jacket: TOPS, blazer: TOPS, coat: TOPS, bomber: TOPS, fleece: TOPS,
  shoes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
  accessories: ['One Size'],
}

interface Props {
  piece?: Piece
  wardrobes: Wardrobe[]
}

export function PieceForm({ piece, wardrobes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [extracting, setExtracting] = useState(false)
  const [extractUrl, setExtractUrl] = useState(piece?.source_url ?? '')
  const [extractError, setExtractError] = useState('')
  const [saveError, setSaveError] = useState('')

  const [fields, setFields] = useState({
    name:            piece?.name ?? '',
    brand:           piece?.brand ?? '',
    description:     piece?.description ?? '',
    category:        (piece?.category ?? 'shirt') as PieceCategory,
    color:           (piece?.color ?? null) as PieceColor | null,
    sizes_available: piece?.sizes_available ?? [],
    condition:       (piece?.condition ?? 'new') as 'new' | 'like_new' | 'good',
    cost_price:      piece ? (piece.cost_price / 100).toFixed(0) : '',
    base_rental_rate: piece ? piece.base_rental_rate.toString() : '0.15',
    imageUrls:       piece?.images?.length ? piece.images : [''],
    wardrobe_id:     piece?.wardrobe_id ?? '',
    source_url:      piece?.source_url ?? '',
    source_retailer: piece?.source_retailer ?? '',
    is_featured:     piece?.is_featured ?? false,
    is_draft:        piece?.is_draft ?? true,
    is_available:    piece?.is_available ?? true,
  })

  function set<K extends keyof typeof fields>(key: K, value: typeof fields[K]) {
    setFields(f => ({ ...f, [key]: value }))
  }

  function toggleSize(size: string) {
    set('sizes_available',
      fields.sizes_available.includes(size)
        ? fields.sizes_available.filter(s => s !== size)
        : [...fields.sizes_available, size]
    )
  }

  async function handleExtract() {
    if (!extractUrl) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: extractUrl }),
      })
      const data = await res.json()
      if (!res.ok || !data.product) {
        setExtractError(data.error ?? 'Extraction failed')
        return
      }
      const p = data.product
      setFields(f => ({
        ...f,
        name:            p.name ?? f.name,
        brand:           p.brand ?? f.brand,
        description:     p.description ?? f.description,
        category:        p.category ?? f.category,
        color:           p.color ?? f.color,
        sizes_available: p.sizes_available?.length ? p.sizes_available : f.sizes_available,
        cost_price:      p.cost_price_estimate_cents ? (p.cost_price_estimate_cents / 100).toFixed(0) : f.cost_price,
        imageUrls:       p.images?.length ? p.images : f.imageUrls,
        source_url:      extractUrl,
        source_retailer: p.source_retailer ?? f.source_retailer,
      }))
    } catch {
      setExtractError('Network error during extraction')
    } finally {
      setExtracting(false)
    }
  }

  function handleSave() {
    setSaveError('')
    const costCents = Math.round(parseFloat(fields.cost_price) * 100)
    if (!fields.name || !fields.brand || !fields.category || !costCents) {
      setSaveError('Name, brand, category, and cost price are required.')
      return
    }

    const input = {
      name:            fields.name,
      brand:           fields.brand,
      description:     fields.description,
      category:        fields.category,
      color:           fields.color,
      sizes_available: fields.sizes_available,
      condition:       fields.condition,
      cost_price:      costCents,
      base_rental_rate: parseFloat(fields.base_rental_rate) || 0.15,
      images:          fields.imageUrls.map(u => u.trim()).filter(Boolean),
      wardrobe_id:     fields.wardrobe_id || null,
      source_url:      fields.source_url || null,
      source_retailer: fields.source_retailer || null,
      is_featured:     fields.is_featured,
      is_draft:        fields.is_draft,
      is_available:    fields.is_available,
    }

    startTransition(async () => {
      if (piece) {
        const result = await updatePiece(piece.id, input)
        if ('error' in result && result.error) { setSaveError(result.error); return }
        router.push('/pieces')
      } else {
        const result = await createPiece(input)
        if ('error' in result) { setSaveError(result.error); return }
        router.push('/pieces')
      }
    })
  }

  const sizeOptions = SIZE_SETS[fields.category] ?? SIZE_SETS.shirt

  return (
    <div className="max-w-2xl space-y-8">

      {/* AI Extraction */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="font-semibold text-navy mb-3">Extract from URL</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={extractUrl}
            onChange={e => setExtractUrl(e.target.value)}
            placeholder="https://vuori.com/products/..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !extractUrl}
            className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {extracting ? 'Extracting…' : 'Fill with AI'}
          </button>
        </div>
        {extractError && <p className="text-red-600 text-sm mt-2">{extractError}</p>}
      </section>

      {/* Core fields */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="font-semibold text-navy">Product Info</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand">
            <input value={fields.brand} onChange={e => set('brand', e.target.value)}
              placeholder="Vuori" className={input} />
          </Field>
          <Field label="Name">
            <input value={fields.name} onChange={e => set('name', e.target.value)}
              placeholder="Ripstop Climber Pant" className={input} />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={fields.description} onChange={e => set('description', e.target.value)}
            rows={2} placeholder="1-2 sentences for the listing…" className={input} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Category">
            <select value={fields.category} onChange={e => set('category', e.target.value as PieceCategory)} className={input}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <select value={fields.color ?? ''} onChange={e => set('color', e.target.value as PieceColor || null)} className={input}>
              <option value="">— none —</option>
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select value={fields.condition} onChange={e => set('condition', e.target.value as typeof fields.condition)} className={input}>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
            </select>
          </Field>
        </div>

        {/* Sizes */}
        <Field label="Sizes available">
          <div className="flex flex-wrap gap-2 mt-1">
            {sizeOptions.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  fields.sizes_available.includes(size)
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </Field>
      </section>

      {/* Pricing */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="font-semibold text-navy">Pricing</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost price (USD)" hint="What you paid the retailer">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" value={fields.cost_price} onChange={e => set('cost_price', e.target.value)}
                placeholder="80" className={`${input} pl-7`} />
            </div>
          </Field>
          <Field label="Base rental rate" hint="Default 0.15 (15%)">
            <input type="number" value={fields.base_rental_rate} onChange={e => set('base_rental_rate', e.target.value)}
              step="0.01" min="0.05" max="0.50" className={input} />
          </Field>
        </div>
        <p className="text-xs text-gray-400">
          Rental fee and buyout price are computed automatically by the DB trigger when saved.
        </p>
      </section>

      {/* Media & Sourcing */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="font-semibold text-navy">Media & Sourcing</p>

        {/* Per-row image URL inputs */}
        <Field label="Images" hint="one URL per row — drag to reorder">
          <div className="space-y-2">
            {fields.imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {url.trim() && (
                    <img
                      src={url.trim()}
                      alt={`Preview ${i + 1}`}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-10 h-12 object-cover rounded border border-gray-200 bg-gray-100 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                    />
                  )}
                  <input
                    type="url"
                    value={url}
                    onChange={e => {
                      const next = [...fields.imageUrls]
                      next[i] = e.target.value
                      set('imageUrls', next)
                    }}
                    placeholder={`Image ${i + 1} URL — https://...`}
                    className={input}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = fields.imageUrls.filter((_, j) => j !== i)
                    set('imageUrls', next.length ? next : [''])
                  }}
                  className="text-red-400 hover:text-red-600 text-lg leading-none px-1 pt-2 transition-colors"
                  title="Remove image"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('imageUrls', [...fields.imageUrls, ''])}
              className="text-sm text-navy/60 hover:text-navy border border-dashed border-gray-300 hover:border-navy/40 rounded-lg px-3 py-1.5 w-full transition-colors"
            >
              + Add another image
            </button>
          </div>
        </Field>
        <p className="text-xs text-gray-400">
          If a preview appears faded, the retailer blocks hotlinking — open the image in a new tab and copy that URL instead.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source URL">
            <input value={fields.source_url} onChange={e => set('source_url', e.target.value)}
              placeholder="https://..." className={input} />
          </Field>
          <Field label="Retailer">
            <input value={fields.source_retailer} onChange={e => set('source_retailer', e.target.value)}
              placeholder="Vuori" className={input} />
          </Field>
        </div>
        <Field label="Wardrobe">
          <select value={fields.wardrobe_id} onChange={e => set('wardrobe_id', e.target.value)} className={input}>
            <option value="">— No wardrobe —</option>
            {wardrobes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
      </section>

      {/* Visibility */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="font-semibold text-navy mb-3">Visibility</p>
        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={fields.is_draft} onChange={e => set('is_draft', e.target.checked)}
              className="w-4 h-4 accent-navy" />
            <span className="text-sm text-gray-700">Draft (hidden from customers)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={fields.is_featured} onChange={e => set('is_featured', e.target.checked)}
              className="w-4 h-4 accent-navy" />
            <span className="text-sm text-gray-700">Featured on home screen</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={fields.is_available} onChange={e => set('is_available', e.target.checked)}
              className="w-4 h-4 accent-navy" />
            <span className="text-sm text-gray-700">Available for rent</span>
          </label>
        </div>
      </section>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{saveError}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-navy/90 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Saving…' : piece ? 'Save Changes' : 'Add Piece'}
        </button>
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {hint && <span className="font-normal text-gray-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
