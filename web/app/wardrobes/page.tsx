import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { getWardrobes } from '@/lib/supabase'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Wardrobes — Davenport',
  description: 'Curated collections built around how you actually live. Pick a wardrobe or mix and match individual pieces.',
}

export default async function WardrobesPage() {
  const wardrobes = await getWardrobes()

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">Curated collections</p>
          <div className="flex items-end justify-between gap-4 mb-12">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-navy">The Wardrobes</h1>
              <p className="font-sans text-sm text-slate mt-3 max-w-sm leading-relaxed">
                Built around how you actually live. Pick one and rent the whole look, or mix and match individual pieces.
              </p>
            </div>
            <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors whitespace-nowrap pb-1">
              Browse all pieces →
            </Link>
          </div>

          {wardrobes.length === 0 ? (
            <div className="text-center py-32">
              <p className="font-serif text-2xl text-navy mb-2">New wardrobes coming soon.</p>
              <p className="font-sans text-slate mb-8">Check back shortly — we're curating something good.</p>
              <Link href="/browse" className="font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors">
                Browse all pieces →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {wardrobes.map((w: any, i: number) => (
                <Link key={w.id} href={`/wardrobe/${w.slug}`} className="group block">
                  <div className={`aspect-[3/4] rounded-2xl overflow-hidden relative flex flex-col justify-between p-8 ${i % 2 === 0 ? 'bg-navy' : 'bg-[#1f3560]'}`}>
                    <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-cream/25">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-cream leading-tight mb-3">{w.name}</h2>
                      {w.description && (
                        <p className="font-sans text-sm text-cream/50 line-clamp-3 leading-relaxed">{w.description}</p>
                      )}
                      <p className="font-sans text-xs text-cream/30 group-hover:text-cream/60 transition-colors mt-6 tracking-wide">Browse wardrobe →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
