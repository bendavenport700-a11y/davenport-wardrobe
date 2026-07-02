'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useCart, type CartItem } from '@/context/CartContext'

type SizeStock = { pristine: number; worn: number; total: number }

const SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
  '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42',
  'Short', 'Regular', 'Long',
  '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12',
  'One Size',
]

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a)
    const bi = SIZE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

interface Props {
  piece: {
    id: string
    name: string
    brand: string
    images: string[]
    sizes_available: string[]
    rental_fee: number
    buyout_price: number
    wear_count: number
  }
  unitsBySize?: Record<string, SizeStock>
}

export function AddToSuitcase({ piece, unitsBySize }: Props) {
  const router = useRouter()
  const { addItem, items } = useCart()
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
      setAuthChecked(true)
    })
  }, [])

  const alreadyInCart = items.some(i => i.piece_id === piece.id && i.size === (selectedSize ?? ''))

  function handleAdd() {
    if (!isLoggedIn) {
      router.push(`/login?next=/piece/${piece.id}`)
      return
    }
    if (!selectedSize) return

    const item: CartItem = {
      piece_id: piece.id,
      size: selectedSize,
      rental_fee_cents: piece.rental_fee,
      wear_count_at_rental: piece.wear_count,
      buyout_price_snapshot: piece.buyout_price,
      piece: {
        name: piece.name,
        brand: piece.brand,
        images: piece.images ?? [],
        sizes_available: piece.sizes_available ?? [],
      },
    }
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (!authChecked || piece.sizes_available?.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Size selector */}
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-slate mb-3">Select size</p>
        <div className="flex gap-2 flex-wrap">
          {sortSizes(piece.sizes_available).map(s => {
            const inCart = items.some(i => i.piece_id === piece.id && i.size === s)
            const stock = unitsBySize?.[s]
            const stockLabel = stock
              ? stock.pristine > 0 && stock.worn === 0
                ? `${stock.total} pristine`
                : `${stock.total} in stock`
              : null
            const allPristine = stock ? stock.worn === 0 : false
            return (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`font-sans text-sm px-3 py-2 rounded-lg border transition-colors flex flex-col items-center gap-0.5 ${
                  selectedSize === s
                    ? 'bg-navy text-cream border-navy'
                    : inCart
                    ? 'bg-sand/60 text-slate border-sand cursor-not-allowed'
                    : 'border-navy/20 text-navy hover:bg-sand/40'
                }`}
                disabled={inCart}
                title={inCart ? 'Already in your suitcase' : undefined}
              >
                <span>{s}</span>
                {stockLabel && (
                  <span className={`text-[10px] leading-none font-sans ${
                    selectedSize === s
                      ? 'text-cream/70'
                      : allPristine
                      ? 'text-emerald-600'
                      : 'text-slate/70'
                  }`}>
                    {stockLabel}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!selectedSize || alreadyInCart}
        className={`w-full font-sans font-semibold py-4 rounded-xl transition-all text-base ${
          added
            ? 'bg-green-600 text-white'
            : alreadyInCart
            ? 'bg-sand text-slate cursor-not-allowed'
            : !selectedSize
            ? 'bg-navy/50 text-cream cursor-not-allowed'
            : isLoggedIn
            ? 'bg-navy text-cream hover:bg-navy/90'
            : 'bg-navy text-cream hover:bg-navy/90'
        }`}
      >
        {added
          ? '✓ Added to suitcase'
          : alreadyInCart
          ? 'Already in suitcase'
          : !isLoggedIn
          ? 'Sign in to add to suitcase'
          : !selectedSize
          ? 'Select a size'
          : 'Add to suitcase'}
      </button>

      {added && (
        <p className="text-center text-sm font-sans text-slate">
          <button onClick={() => router.push('/cart')} className="text-navy font-medium hover:underline">
            View suitcase →
          </button>
        </p>
      )}
    </div>
  )
}
