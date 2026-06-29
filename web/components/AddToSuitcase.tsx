'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useCart, type CartItem } from '@/context/CartContext'

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
}

export function AddToSuitcase({ piece }: Props) {
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
          {piece.sizes_available.map(s => {
            const inCart = items.some(i => i.piece_id === piece.id && i.size === s)
            return (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`font-sans text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedSize === s
                    ? 'bg-navy text-cream border-navy'
                    : inCart
                    ? 'bg-sand/60 text-slate border-sand cursor-not-allowed'
                    : 'border-navy/20 text-navy hover:bg-sand/40'
                }`}
                disabled={inCart}
                title={inCart ? 'Already in your suitcase' : undefined}
              >
                {s}
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
