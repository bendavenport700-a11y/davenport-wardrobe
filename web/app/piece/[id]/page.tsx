import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { getPiece } from '@/lib/supabase'
import { formatCents, formatCentsPerMonth } from '@/lib/format'

export const revalidate = 300

function conditionLabel(wears: number) {
  if (wears === 0) return 'New'
  if (wears <= 3) return 'Like New'
  if (wears <= 8) return 'Good'
  return 'Well Loved'
}

export default async function PiecePage({ params }: { params: { id: string } }) {
  const piece = await getPiece(params.id)
  if (!piece) notFound()

  const image = piece.images?.[0]
  const rental = formatCentsPerMonth(piece.rental_fee)
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
                  <span className="font-serif text-2xl font-bold text-navy">{rental}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-sand">
                  <span className="font-sans text-sm text-slate">Buy outright today</span>
                  <span className="font-sans text-base font-semibold text-navy">{buyout}</span>
                </div>
                <p className="font-sans text-xs text-slate">Buyout price drops every month you rent.</p>
              </div>

              {/* Sizes */}
              {piece.sizes_available?.length > 0 && (
                <div className="mb-8">
                  <p className="font-sans text-xs uppercase tracking-widest text-slate mb-3">Available Sizes</p>
                  <div className="flex gap-2 flex-wrap">
                    {piece.sizes_available.map((s: string) => (
                      <span key={s} className="font-sans text-sm border border-navy/20 text-navy px-3 py-1.5 rounded-lg">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href="https://apps.apple.com/app/davenport/id6778844291"
                className="bg-navy text-cream font-sans font-semibold px-8 py-4 rounded-xl hover:bg-navy/90 transition-colors text-center text-base"
              >
                Rent in the App →
              </Link>
              <p className="font-sans text-xs text-slate text-center mt-3">
                Ships in 2–3 days · $75 deposit held, not charged
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
