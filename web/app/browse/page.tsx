import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BrowseClient } from './BrowseClient'
import { getAllPieces, getReadyToOwnPieces } from '@/lib/supabase'
import { formatCents, formatCentsPerMonth } from '@/lib/format'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300

export default async function BrowsePage() {
  const [pieces, readyToOwn] = await Promise.all([
    getAllPieces(),
    getReadyToOwnPieces(),
  ])

  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* Ready to Own shelf */}
        {readyToOwn.length > 0 && (
          <section className="border-b border-sand/50 bg-navy py-10 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-sans font-bold bg-accent text-cream px-2 py-0.5 rounded uppercase tracking-widest">
                      Deal
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-cream tracking-tight">
                      Ready to Own
                    </h2>
                  </div>
                  <p className="font-sans text-sm text-sand/70">
                    Veteran pieces at their lowest buyout price — rent it, love it, keep it cheap
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {readyToOwn.map(piece => {
                  const image = piece.images?.[0]
                  return (
                    <Link key={piece.id} href={`/piece/${piece.id}`} className="group block">
                      <div className="bg-ink rounded-xl overflow-hidden border border-sand/15 hover:border-accent/40 transition-colors">
                        <div className="aspect-[3/4] relative overflow-hidden">
                          {image ? (
                            <Image
                              src={image}
                              alt={`${piece.brand} ${piece.name}`}
                              fill
                              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-serif text-5xl text-cream/10">D</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-ink/80 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <span className="text-accent text-[9px]">★</span>
                            <span className="font-sans text-[10px] text-cream font-medium">
                              {piece.wear_count} wears
                            </span>
                          </div>
                        </div>
                        <div className="p-3 space-y-0.5">
                          <p className="font-sans text-[10px] text-sand/60 uppercase tracking-wider truncate">
                            {piece.brand}
                          </p>
                          <p className="font-sans text-sm font-semibold text-cream leading-snug line-clamp-1">
                            {piece.name}
                          </p>
                          <p className="font-sans text-xs text-sand/60 pt-1">
                            <span className="text-accent font-semibold">
                              {formatCents(piece.buyout_price)}
                            </span>
                            {' '}to own · {formatCentsPerMonth(piece.rental_fee)} to rent
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <BrowseClient pieces={pieces} />
      </main>
      <Footer />
    </>
  )
}
