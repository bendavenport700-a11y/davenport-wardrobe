import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PieceCard } from '@/components/PieceCard'
import { getFeaturedPieces, getWardrobes } from '@/lib/supabase'

export const revalidate = 300

const APP_STORE_URL = 'https://apps.apple.com/app/davenport/id6778844291'

export default async function HomePage() {
  const [pieces, wardrobes] = await Promise.all([getFeaturedPieces(), getWardrobes()])

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="min-h-screen bg-navy flex flex-col justify-end px-8 md:px-16 pb-20 pt-32 relative overflow-hidden">

          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#F5F0E8 1px, transparent 1px), linear-gradient(90deg, #F5F0E8 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Eyebrow */}
          <p className="relative font-sans text-[11px] uppercase tracking-[0.4em] text-gold/60 mb-8">
            Fairfield County · Est. 2026
          </p>

          {/* Headline */}
          <div className="relative max-w-4xl">
            <h1 className="font-serif text-[clamp(3rem,8vw,7rem)] font-bold text-cream leading-[1.02] tracking-tight mb-8">
              Premium menswear,<br />
              <em className="not-italic text-gold">rented</em> monthly.
            </h1>
            <p className="font-sans text-base md:text-lg text-cream/50 leading-relaxed max-w-sm mb-10">
              Try before you commit. Keep what you love at a price that drops the longer you rent. Return the rest — no questions asked.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                href={APP_STORE_URL}
                className="inline-flex items-center justify-center gap-2.5 bg-cream text-navy font-sans font-semibold px-8 py-4 rounded-xl hover:bg-cream/92 transition-colors text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download on the App Store
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center font-sans text-sm text-cream/50 hover:text-cream/80 transition-colors px-4 py-4"
              >
                Browse the wardrobe →
              </Link>
            </div>
            <p className="font-sans text-xs text-cream/20 mt-5">iPhone only · Ships within Fairfield County, CT</p>
          </div>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-xl max-h-xl rounded-full bg-gold/[0.04] blur-3xl pointer-events-none" />
        </section>

        {/* ── Key facts strip ──────────────────────────────────────────── */}
        <div className="bg-sand/40 border-y border-sand">
          <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '$12',  label: 'per month from',       sub: 'Based on retail price' },
              { value: '18%',  label: 'bundle discount',      sub: 'Rent 3+ pieces together' },
              { value: '$75',  label: 'deposit — held',       sub: 'Returned when pieces ship back' },
              { value: '1–2',  label: 'weeks to your door',   sub: 'Ships within Fairfield County' },
            ].map((f, i) => (
              <div key={i}>
                <p className="font-serif text-3xl font-bold text-navy">{f.value}<span className="text-lg font-normal text-navy/40 ml-0.5"> </span></p>
                <p className="font-sans text-sm font-medium text-navy mt-0.5">{f.label}</p>
                <p className="font-sans text-xs text-slate/60 mt-0.5 leading-snug">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-8 md:px-16 bg-cream">
          <div className="max-w-6xl mx-auto">

            <div className="mb-16">
              <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-4">Simple by design</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy leading-tight">
                Rent first.<br />Decide later.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  n: '01',
                  title: 'Pick your pieces',
                  body: 'Browse the app. Choose what you want in your size — individually or from one of our curated wardrobes.',
                },
                {
                  n: '02',
                  title: 'Wear it for a month',
                  body: 'Ships to your door in 1–2 weeks. Every piece is dry cleaned and inspected before it reaches you.',
                  dark: true,
                },
                {
                  n: '03',
                  title: 'Keep or return — your call',
                  body: 'Love it? Buy it at a price that drops every month you rent. Not your thing? Ship it back, no questions asked.',
                },
              ].map(step => (
                <div
                  key={step.n}
                  className={`rounded-2xl p-8 flex flex-col gap-6 ${step.dark ? 'bg-navy' : 'bg-white border border-sand'}`}
                >
                  <p className={`font-sans text-[11px] font-semibold tracking-[0.35em] uppercase ${step.dark ? 'text-gold/50' : 'text-slate/40'}`}>
                    {step.n}
                  </p>
                  <div>
                    <h3 className={`font-serif text-xl font-bold mb-3 ${step.dark ? 'text-cream' : 'text-navy'}`}>{step.title}</h3>
                    <p className={`font-sans text-sm leading-relaxed ${step.dark ? 'text-cream/55' : 'text-slate'}`}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Buyout price drop callout */}
            <div className="mt-5 bg-navy/[0.04] border border-navy/8 rounded-2xl px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-widest text-slate/40 mb-2">Buyout price example</p>
                <p className="font-serif text-lg font-bold text-navy">The longer you rent, the less it costs to own.</p>
              </div>
              <div className="flex gap-6 shrink-0">
                {[
                  { label: 'Day one', price: '$72' },
                  { label: '3 months', price: '$53' },
                  { label: '5 months', price: '$40' },
                ].map((row, i) => (
                  <div key={i} className="text-center">
                    <p className="font-serif text-2xl font-bold text-navy">{row.price}</p>
                    <p className="font-sans text-xs text-slate/60 mt-0.5">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Pieces ───────────────────────────────────────────── */}
        {pieces.length > 0 && (
          <section className="py-24 px-8 md:px-16 bg-sand/25">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">Available now</p>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">Featured Pieces</h2>
                </div>
                <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors hidden sm:block">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pieces.map(piece => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/browse" className="font-sans text-sm text-navy underline underline-offset-4">
                  View all pieces →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── The Wardrobes ─────────────────────────────────────────────── */}
        {wardrobes.length > 0 && (
          <section className="py-24 px-8 md:px-16 bg-cream">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">Curated collections</p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">The Wardrobes</h2>
                <p className="font-sans text-sm text-slate mt-3 max-w-sm leading-relaxed">
                  Thoughtfully assembled pieces that work together. Pick a wardrobe or mix and match.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {wardrobes.map(w => (
                  <Link key={w.id} href={`/wardrobe/${w.slug}`} className="group block">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-navy relative">
                      {w.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.cover_image_url}
                          alt={w.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 opacity-70"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-7">
                        <h3 className="font-serif text-xl font-bold text-cream leading-tight">{w.name}</h3>
                        {w.description && (
                          <p className="font-sans text-sm text-cream/55 mt-1.5 line-clamp-2 leading-snug">{w.description}</p>
                        )}
                        <p className="font-sans text-xs text-gold/70 mt-3 tracking-wide">Browse wardrobe →</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 bg-navy">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-gold/50 mb-5">Ready to start</p>
              <h2 className="font-serif text-4xl md:text-6xl font-bold text-cream leading-[1.05] max-w-lg">
                Build the wardrobe<br />
                you actually want.
              </h2>
            </div>
            <div className="flex flex-col gap-4 shrink-0">
              <Link
                href={APP_STORE_URL}
                className="inline-flex items-center justify-center gap-2.5 bg-cream text-navy font-sans font-semibold px-8 py-4 rounded-xl hover:bg-cream/92 transition-colors text-sm whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download on the App Store
              </Link>
              <Link
                href="/browse"
                className="font-sans text-sm text-cream/40 hover:text-cream/70 transition-colors text-center"
              >
                Browse pieces first →
              </Link>
              <p className="font-sans text-xs text-cream/20 text-center">iPhone · Fairfield County, CT</p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
