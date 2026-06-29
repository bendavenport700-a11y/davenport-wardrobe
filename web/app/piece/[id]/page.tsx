import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AddToSuitcase } from '@/components/AddToSuitcase'
import { AddToPlan } from '@/components/AddToPlan'
import { getPiece } from '@/lib/supabase'
import { formatCents, formatCentsPerMonth } from '@/lib/format'

export const revalidate = 300

function conditionLabel(wears: number) {
  if (wears === 0)  return 'Pristine'
  if (wears <= 5)   return 'Excellent'
  if (wears <= 10)  return 'Well-Worn'
  return 'Veteran'
}

export default async function PiecePage({ params }: { params: { id: string } }) {
  const piece = await getPiece(params.id)
  if (!piece) notFound()

  const image = piece.images?.[0]
  const onSale = (piece.discount_pct ?? 0) > 0
  const discountedFee = onSale
    ? Math.round((piece.rental_fee ?? 0) * (1 - (piece.discount_pct ?? 0) / 100))
    : null
  const rental = formatCentsPerMonth(discountedFee ?? piece.rental_fee)
  const buyout = formatCents(piece.buyout_price)

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors mb-8 inline-block">
            ← Back to Browse
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
            {/* Image */}
            <div className="aspect-[3/4] bg-sand rounded-2xl overflow-hidden relative">
              {image ? (
                <Image src={image} alt={`${piece.brand} ${piece.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-6xl text-navy/20">D</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
              <p className="font-sans text-xs uppercase tracking-widest text-slate mb-2">{piece.brand}</p>
              <h1 className="font-serif text-4xl font-bold text-navy mb-2">{piece.name}</h1>
              <p className="font-sans text-sm text-slate mb-6">
                {conditionLabel(piece.wear_count)} · Rented {piece.wear_count}×
              </p>

              {piece.description && (
                <p className="font-sans text-base text-slate leading-relaxed mb-8">{piece.description}</p>
              )}

              {/* Pricing */}
              <div className="bg-sand/50 rounded-2xl p-6 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-slate">Monthly rental</span>
                  <div className="flex items-baseline gap-2">
                    {onSale && (
                      <span className="font-sans text-sm text-slate/50 line-through">
                        {formatCentsPerMonth(piece.rental_fee)}
                      </span>
                    )}
                    <span className={`font-serif text-2xl font-bold ${onSale ? 'text-accent' : 'text-navy'}`}>
                      {rental}
                    </span>
                    {onSale && (
                      <span className="text-[10px] font-sans font-bold bg-accent text-cream px-2 py-0.5 rounded-full">
                        {piece.discount_pct}% OFF
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-sand">
                  <span className="font-sans text-sm text-slate">Buy outright today</span>
                  <span className="font-sans text-base font-semibold text-navy">{buyout}</span>
                </div>
                <p className="font-sans text-xs text-slate">Buyout price drops every month you rent.</p>
              </div>

              {/* Add to suitcase */}
              <AddToSuitcase piece={{
                id: piece.id,
                name: piece.name,
                brand: piece.brand,
                images: piece.images ?? [],
                sizes_available: piece.sizes_available ?? [],
                rental_fee: piece.rental_fee,
                buyout_price: piece.buyout_price,
                wear_count: piece.wear_count,
              }} />
              <AddToPlan pieceId={piece.id} sizesAvailable={piece.sizes_available ?? []} />

              <div className="grid grid-cols-2 gap-2 mt-6">
                {[
                  'Ships in 1–2 weeks',
                  '$75 deposit held, not charged',
                  'Professionally cleaned',
                  'Cancel anytime after 30 days',
                ].map(note => (
                  <p key={note} className="font-sans text-xs text-slate/60 flex items-start gap-1.5">
                    <span className="text-gold/60 mt-0.5">✦</span>{note}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
