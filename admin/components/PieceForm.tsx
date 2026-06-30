'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPiece, updatePiece } from '@/lib/actions'
import { MEN_CATEGORIES, WOMEN_CATEGORIES, COLORS } from '@/lib/types'
import type { Piece, Wardrobe, PieceCategory, PieceColor, PieceGender } from '@/lib/types'

const TOPS         = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const WAIST_SIZES  = ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
const INSEAM_SIZES = ['28', '29', '30', '31', '32', '33', '34', '36']
const LENGTH_OPTS  = ['Short', 'Regular', 'Long', 'XL']
const SHORTS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '33', '34', '36', '38']
// Bottoms that support compound sizing (waist+inseam or waist+length)
const BOTTOM_CATS  = new Set(['pants', 'chinos', 'trousers', 'denim'])
const SIZE_SETS: Record<string, string[]> = {
  shirt: TOPS, polo: TOPS, 't-shirt': TOPS, henley: TOPS,
  sweater: TOPS, hoodie: TOPS, sweatshirt: TOPS, cardigan: TOPS, vest: TOPS,
  pants: WAIST_SIZES, chinos: WAIST_SIZES, trousers: WAIST_SIZES, denim: WAIST_SIZES,
  joggers: TOPS,
  shorts: SHORTS_SIZES,
  outerwear: TOPS, jacket: TOPS, blazer: TOPS, coat: TOPS, bomber: TOPS, fleece: TOPS,
  shoes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
  accessories: ['One Size'],
}

type BottomsSizingType = 'waist_only' | 'waist_inseam' | 'waist_length'

function detectSizingType(sizes: string[]): BottomsSizingType {
  if (sizes.some(s => s.includes('x'))) return 'waist_inseam'
  if (sizes.some(s => s.includes('/'))) return 'waist_length'
  return 'waist_only'
}

interface Props {
  piece?: Piece
  wardrobes: Wardrobe[]
  defaultWardrobeId?: string
  /** Current unit counts per size, fetched from piece_units. Used in edit mode. */
  unitCounts?: Record<string, number>
}

export function PieceForm({ piece, wardrobes, defaultWardrobeId = '', unitCounts = {} }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [extracting, setExtracting] = useState(false)
  const [extractUrl, setExtractUrl] = useState(piece?.source_url ?? '')
  const [extractError, setExtractError] = useState('')
  const [saveError, setSaveError] = useState('')

  // Quantity per size — how many units we want (new pieces start at 0, edit uses current counts)
  const [sizeQty, setSizeQty] = useState<Record<string, number>>(unitCounts)

  // Bottoms sizing type — inferred from existing sizes in edit mode
  const [bottomsSizingType, setBottomsSizingType] = useState<BottomsSizingType>(() =>
    BOTTOM_CATS.has(piece?.category ?? '') && Object.keys(unitCounts).length > 0
      ? detectSizingType(Object.keys(unitCounts))
      : 'waist_only'
  )

  const [fields, setFields] = useState({
    name:            piece?.name ?? '',
    brand:           piece?.brand ?? '',
    description:     piece?.description ?? '',
    category:        (piece?.category ?? 'shirt') as PieceCategory,
    color:           (piece?.color ?? null) as PieceColor | null,
    condition:       (piece?.condition ?? 'new') as 'new' | 'like_new' | 'good',
    gender:          (piece?.gender ?? 'men') as PieceGender,
    cost_price:      piece ? (piece.cost_price / 100).toFixed(0) : '',
    base_rental_rate: piece ? piece.base_rental_rate.toString() : '0.15',
    imageUrls:       piece?.images?.length ? piece.images : [''],
    wardrobe_id:     piece?.wardrobe_id ?? defaultWardrobeId,
    source_url:      piece?.source_url ?? '',
    source_retailer: piece?.source_retailer ?? '',
    is_featured:     piece?.is_featured ?? false,
    is_draft:        piece?.is_draft ?? true,
    is_available:    piece?.is_available ?? true,
    wear_count:      piece?.wear_count?.toString() ?? '0',
    discount_pct:    piece?.discount_pct?.toString() ?? '0',
  })

  function set<K extends keyof typeof fields>(key: K, value: typeof fields[K]) {
    setFields(f => ({ ...f, [key]: value }))
  }

  function adjustQty(size: string, delta: number) {
    setSizeQty(q => ({ ...q, [size]: Math.max(0, (q[size] ?? 0) + delta) }))
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
        cost_price:      p.cost_price_estimate_cents ? (p.cost_price_estimate_cents / 100).toFixed(0) : f.cost_price,
        imageUrls:       p.images?.length ? p.images : f.imageUrls,
        source_url:      extractUrl,
        source_retailer: p.source_retailer ?? f.source_retailer,
      }))
      // Pre-fill 1 unit per extracted size (only if no quantities set yet)
      if (p.sizes_available?.length) {
        // Detect and set the sizing type from extracted sizes
        if (BOTTOM_CATS.has(p.category ?? fields.category)) {
          const detectedType = detectSizingType(p.sizes_available)
          setBottomsSizingType(detectedType)
        }
        setSizeQty(q => {
          const hasAny = Object.values(q).some(v => v > 0)
          if (hasAny) return q
          const next: Record<string, number> = {}
          for (const s of p.sizes_available) next[s] = 1
          return next
        })
      }
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
      condition:       fields.condition,
      gender:          fields.gender,
      cost_price:      costCents,
      base_rental_rate: parseFloat(fields.base_rental_rate) || 0.15,
      images:          fields.imageUrls.map(u => u.trim()).filter(Boolean),
      wardrobe_id:     fields.wardrobe_id || null,
      source_url:      fields.source_url || null,
      source_retailer: fields.source_retailer || null,
      is_featured:     fields.is_featured,
      is_draft:        fields.is_draft,
      is_available:    fields.is_available,
      wear_count:      Math.max(0, parseInt(fields.wear_count) || 0),
      discount_pct:    Math.min(90, Math.max(0, parseInt(fields.discount_pct) || 0)),
    }

    const returnTo = fields.wardrobe_id ? `/wardrobes/${fields.wardrobe_id}` : '/pieces'

    startTransition(async () => {
      if (piece) {
        const result = await updatePiece(piece.id, input, sizeQty)
        if ('error' in result && result.error) { setSaveError(result.error); return }
        router.push(returnTo)
      } else {
        const result = await createPiece(input, sizeQty)
        if ('error' in result) { setSaveError(result.error); return }
        router.push(returnTo)
      }
    })
  }

  const categoryOptions = fields.gender === 'women' ? WOMEN_CATEGORIES
    : fields.gender === 'unisex' ? [...MEN_CATEGORIES, ...WOMEN_CATEGORIES]
    : MEN_CATEGORIES

  const sizeOptions = SIZE_SETS[fields.category] ?? SIZE_SETS.shirt

  function handleGenderChange(g: PieceGender) {
    set('gender', g)
    if (g === 'unisex') return
    const validCats = g === 'women' ? WOMEN_CATEGORIES : MEN_CATEGORIES
    if (!validCats.includes(fields.category as any)) {
      handleCategoryChange((g === 'women' ? 'dress' : 'shirt') as PieceCategory)
    }
  }

  // Reset qty keys when category changes so size options stay coherent
  function handleCategoryChange(cat: PieceCategory) {
    set('category', cat)
    if (BOTTOM_CATS.has(cat)) {
      setBottomsSizingType('waist_only')
    }
    const newSizes = SIZE_SETS[cat] ?? SIZE_SETS.shirt
    setSizeQty(q => {
      const next: Record<string, number> = {}
      for (const s of newSizes) next[s] = q[s] ?? 0
      return next
    })
  }

  function handleBottomsSizingTypeChange(type: BottomsSizingType) {
    setBottomsSizingType(type)
    setSizeQty({}) // clear all qty when switching sizing system
  }

  return (
    <div className="max-w-2xl space-y-8">

      {/* Wardrobe — at the top so context is clear before filling anything else */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <Field label="Wardrobe">
          <select value={fields.wardrobe_id} onChange={e => set('wardrobe_id', e.target.value)} className={input}>
            <option value="">No wardrobe (unassigned)</option>
            {wardrobes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
      </section>

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

        <div className="grid grid-cols-4 gap-4">
          <Field label="Gender">
            <select value={fields.gender} onChange={e => handleGenderChange(e.target.value as PieceGender)} className={input}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </Field>
          <Field label="Category">
            <select value={fields.category} onChange={e => handleCategoryChange(e.target.value as PieceCategory)} className={input}>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <select value={fields.color ?? ''} onChange={e => set('color', e.target.value as PieceColor || null)} className={input}>
              <option value="">— none —</option>
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Wear Count" hint="Number of times previously rented — sets condition tier and pricing">
            <input
              type="number"
              min="0"
              value={fields.wear_count}
              onChange={e => {
                set('wear_count', e.target.value)
                const n = parseInt(e.target.value) || 0
                set('condition', n === 0 ? 'new' : n <= 5 ? 'like_new' : 'good')
              }}
              className={input}
            />
          </Field>
          <Field label="Condition" hint="Auto-set when you change wear count">
            <select value={fields.condition} onChange={e => set('condition', e.target.value as typeof fields.condition)} className={input}>
              <option value="new">Pristine (0 wears)</option>
              <option value="like_new">Excellent (1–5 wears)</option>
              <option value="good">Well-Worn / Veteran (6+ wears)</option>
            </select>
          </Field>
        </div>

        {/* Inventory by size */}
        <Field label="Inventory by size" hint="units in stock per size">

          {/* Bottoms sizing type selector */}
          {BOTTOM_CATS.has(fields.category) && (
            <div className="flex gap-2 mb-4">
              {(['waist_only', 'waist_inseam', 'waist_length'] as BottomsSizingType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleBottomsSizingTypeChange(type)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    bottomsSizingType === type
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'
                  }`}
                >
                  {type === 'waist_only' ? 'Waist only' : type === 'waist_inseam' ? 'Waist × Inseam' : 'Waist × Length'}
                </button>
              ))}
            </div>
          )}

          {/* Waist × Inseam matrix */}
          {BOTTOM_CATS.has(fields.category) && bottomsSizingType === 'waist_inseam' && (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-gray-400 font-medium pr-3 pb-2">Waist ↓ / Inseam →</th>
                    {INSEAM_SIZES.map(inseam => (
                      <th key={inseam} className="text-center font-semibold text-gray-600 w-12 pb-2">{inseam}"</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WAIST_SIZES.map(waist => (
                    <tr key={waist}>
                      <td className="font-semibold text-gray-700 pr-3 py-1">{waist}"</td>
                      {INSEAM_SIZES.map(inseam => {
                        const key = `${waist}x${inseam}`
                        const qty = sizeQty[key] ?? 0
                        return (
                          <td key={inseam} className="text-center py-1 px-1">
                            <div className="flex flex-col items-center gap-0.5">
                              <button type="button" onClick={() => adjustQty(key, 1)}
                                className="w-6 h-5 text-xs rounded border border-gray-200 bg-white hover:border-navy/50 leading-none transition-colors">+</button>
                              <span className={`text-xs font-medium w-6 text-center ${qty > 0 ? 'text-navy font-bold' : 'text-gray-300'}`}>{qty}</span>
                              <button type="button" onClick={() => adjustQty(key, -1)} disabled={qty === 0}
                                className="w-6 h-5 text-xs rounded border border-gray-200 bg-white hover:border-navy/50 disabled:opacity-20 leading-none transition-colors">−</button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Waist × Length matrix */}
          {BOTTOM_CATS.has(fields.category) && bottomsSizingType === 'waist_length' && (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-gray-400 font-medium pr-3 pb-2">Waist ↓ / Length →</th>
                    {LENGTH_OPTS.map(len => (
                      <th key={len} className="text-center font-semibold text-gray-600 w-20 pb-2">{len}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WAIST_SIZES.map(waist => (
                    <tr key={waist}>
                      <td className="font-semibold text-gray-700 pr-3 py-1">{waist}"</td>
                      {LENGTH_OPTS.map(len => {
                        const key = `${waist}/${len}`
                        const qty = sizeQty[key] ?? 0
                        return (
                          <td key={len} className="text-center py-1 px-1">
                            <div className="flex flex-col items-center gap-0.5">
                              <button type="button" onClick={() => adjustQty(key, 1)}
                                className="w-6 h-5 text-xs rounded border border-gray-200 bg-white hover:border-navy/50 leading-none transition-colors">+</button>
                              <span className={`text-xs font-medium w-6 text-center ${qty > 0 ? 'text-navy font-bold' : 'text-gray-300'}`}>{qty}</span>
                              <button type="button" onClick={() => adjustQty(key, -1)} disabled={qty === 0}
                                className="w-6 h-5 text-xs rounded border border-gray-200 bg-white hover:border-navy/50 disabled:opacity-20 leading-none transition-colors">−</button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Flat list — waist only or non-bottom categories */}
          {(!BOTTOM_CATS.has(fields.category) || bottomsSizingType === 'waist_only') && (
            <div className="flex flex-wrap gap-3 mt-1">
              {sizeOptions.map(size => {
                const qty = sizeQty[size] ?? 0
                return (
                  <div key={size} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                    <span className={`text-xs font-semibold w-8 text-center ${qty > 0 ? 'text-navy' : 'text-gray-400'}`}>{size}</span>
                    <button type="button" onClick={() => adjustQty(size, -1)} disabled={qty === 0}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:border-navy/40 disabled:opacity-30 text-sm leading-none transition-colors">−</button>
                    <span className={`text-sm font-medium w-4 text-center ${qty > 0 ? 'text-navy' : 'text-gray-400'}`}>{qty}</span>
                    <button type="button" onClick={() => adjustQty(size, 1)}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:border-navy/40 text-sm leading-none transition-colors">+</button>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Total: {Object.values(sizeQty).reduce((s, v) => s + v, 0)} units across {Object.values(sizeQty).filter(v => v > 0).length} sizes
          </p>
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

      {/* Sale discount */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="font-semibold text-navy mb-1">Sale Discount</p>
        <p className="text-xs text-gray-400 mb-3">% off the rental fee shown to customers. 0 = no sale. Buyout price is unaffected.</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="90"
            value={fields.discount_pct}
            onChange={e => set('discount_pct', e.target.value)}
            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/15"
          />
          <span className="text-sm text-gray-500">% off rental</span>
          {parseInt(fields.discount_pct) > 0 && (
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Sale badge will show
            </span>
          )}
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
