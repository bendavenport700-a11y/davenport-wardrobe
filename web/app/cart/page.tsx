'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { formatCents, formatCentsPerMonth } from '@/lib/format'
import { calcOrderTotals, HANDLING_FEE_CENTS, DEPOSIT_CENTS } from '@/lib/pricing'

export default function CartPage() {
  const { items, removeItem, loaded: cartLoaded } = useCart()
  const router = useRouter()

  if (!cartLoaded) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen" />
        <Footer />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen">
          <div className="max-w-2xl mx-auto px-6 py-24 text-center">
            <p className="font-serif text-2xl text-navy mb-4">Your suitcase is empty.</p>
            <p className="font-sans text-sm text-slate mb-8">Browse the collection and add pieces to get started.</p>
            <Link href="/browse" className="inline-block bg-navy text-cream font-sans font-semibold px-8 py-4 rounded-xl hover:bg-navy/90 transition-colors">
              Browse pieces →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const { rawMonthly, discount, monthlyTotal, chargeToday } = calcOrderTotals(items)

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="font-serif text-3xl font-bold text-navy mb-2">Your suitcase</h1>
          <p className="font-sans text-sm text-slate mb-10">{items.length} piece{items.length !== 1 ? 's' : ''} selected</p>

          <div className="space-y-4 mb-10">
            {items.map(item => (
              <div key={`${item.piece_id}-${item.size}`} className="bg-white rounded-2xl border border-sand p-4 flex gap-4 items-center">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-sand shrink-0 relative">
                  {item.piece.images[0] ? (
                    <Image src={item.piece.images[0]} alt={item.piece.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-2xl text-navy/20">D</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs uppercase tracking-widest text-slate mb-0.5">{item.piece.brand}</p>
                  <p className="font-sans font-medium text-navy truncate">{item.piece.name}</p>
                  <p className="font-sans text-sm text-slate">Size {item.size}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-lg font-bold text-navy">{formatCentsPerMonth(item.rental_fee_cents)}</p>
                  <button
                    onClick={() => removeItem(item.piece_id, item.size)}
                    className="font-sans text-xs text-slate hover:text-red-600 transition-colors mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-sand p-6 mb-6">
            <h2 className="font-sans font-semibold text-navy mb-4 text-sm uppercase tracking-wide">Order summary</h2>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between text-slate">
                <span>Monthly subtotal</span>
                <span>{formatCentsPerMonth(rawMonthly)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>{Math.round(discount * 100)}% bundle discount</span>
                  <span>−{formatCents(rawMonthly - monthlyTotal)}/mo</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-navy pt-2 border-t border-sand">
                <span>Monthly total</span>
                <span>{formatCentsPerMonth(monthlyTotal)}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Delivery & handling (one-time)</span>
                <span>{formatCents(HANDLING_FEE_CENTS)}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Security deposit (held, not charged)</span>
                <span>{formatCents(DEPOSIT_CENTS)}</span>
              </div>
              <div className="flex justify-between font-bold text-navy text-base pt-3 border-t border-sand">
                <span>Charged today</span>
                <span>{formatCents(chargeToday)}</span>
              </div>
            </div>
            <p className="font-sans text-xs text-slate/70 mt-4 leading-relaxed">
              Deposit is a hold on your card — it is released when pieces are returned in good condition. Monthly charge continues until you return.
            </p>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-navy text-cream font-sans font-semibold py-4 rounded-xl hover:bg-navy/90 transition-colors text-base"
          >
            Proceed to checkout →
          </button>

          <p className="text-center mt-4">
            <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors">
              ← Continue browsing
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
