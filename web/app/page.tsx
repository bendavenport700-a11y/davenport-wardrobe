import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PieceCard } from '@/components/PieceCard'
import { getNewArrivals, getWardrobes } from '@/lib/supabase'

export const revalidate = 300

const APP_STORE_URL = 'https://apps.apple.com/app/davenport/id6778844291'

export default async function HomePage() {
  const [pieces, wardrobes] = await Promise.all([getNewArrivals(), getWardrobes()])

  // Use first 4 featured piece images for hero mosaic
  const heroImages = pieces.slice(0, 4).map(p => p.images?.[0]).filter(Boolean) as string[]

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-navy pt-16 overflow-hidden">
          <div className="max-w-6xl mx-auto px-8 md:px-16 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

              {/* Left: text + CTAs */}
              <div className="relative z-10">
                <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-gold/60 mb-6">
                  Premium menswear rental · Est. 2026
                </p>
                <h1 className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-bold text-cream leading-[1.04] tracking-tight mb-6">
                  Wear better<br />
                  clothes for{' '}
                  <em className="not-italic text-gold">less.</em>
                </h1>
                <p className="font-sans text-base text-cream/55 leading-relaxed max-w-sm mb-8">
                  Try it. Rent it. Own it if you want to. Keep what you love at a price that drops every month. Return the rest — no questions asked.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/browse"
                    className="inline-flex items-center justify-center bg-cream text-navy font-sans font-semibold px-8 py-4 rounded-xl hover:bg-cream/92 transition-colors text-sm"
                  >
                    Shop the collection →
                  </Link>
                  <Link
                    href={APP_STORE_URL}
                    className="inline-flex items-center justify-center gap-2 font-sans text-sm text-cream/45 hover:text-cream/70 transition-colors px-4 py-4"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Download on App Store
                  </Link>
                </div>
              </div>

              {/* Right: piece image mosaic */}
              {heroImages.length >= 2 ? (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {heroImages.slice(0, 4).map((src, i) => (
                    <Link
                      key={i}
                      href="/browse"
                      className={`relative rounded-2xl overflow-hidden bg-navy/60 group ${i === 0 ? 'row-span-2' : ''}`}
                      style={{ aspectRatio: i === 0 ? '3/4' : '1/1' }}
                    >
                      <Image
                        src={src}
                        alt="Davenport piece"
                        fill
                        className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                /* Fallback when no pieces loaded yet */
                <div className="hidden md:grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`rounded-2xl bg-cream/5 ${i === 0 ? 'row-span-2' : ''}`}
                      style={{ aspectRatio: i === 0 ? '3/4' : '1/1' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Key facts strip ──────────────────────────────────────────── */}
        <div className="bg-sand/40 border-y border-sand">
          <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '$12',   label: 'per month from',     sub: 'Based on retail price' },
              { value: '30%',   label: 'bundle discount',    sub: 'Rent 2 or more pieces together' },
              { value: '$75',   label: 'deposit — held',     sub: 'Returned when pieces ship back' },
              { value: '1–2',   label: 'weeks to your door', sub: 'Every piece cleaned and inspected' },
            ].map((f, i) => (
              <div key={i}>
                <p className="font-serif text-3xl font-bold text-navy">{f.value}</p>
                <p className="font-sans text-sm font-medium text-navy mt-0.5">{f.label}</p>
                <p className="font-sans text-xs text-slate/60 mt-0.5 leading-snug">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Arrivals ──────────────────────────────────────────────── */}
        {pieces.length > 0 && (
          <section className="py-20 px-8 md:px-16 bg-sand/25">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">Just added</p>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">New Arrivals</h2>
                </div>
                <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors hidden sm:block">
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pieces.map(piece => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/browse"
                  className="inline-block font-sans text-sm font-medium text-navy border border-navy/20 px-8 py-3.5 rounded-xl hover:bg-navy/5 transition-colors"
                >
                  Browse all pieces →
                </Link>
              </div>
            </div>
          </section>
        )}

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
                  body: 'Browse pieces on the web or in the app. Choose your size — individually or from one of our curated wardrobes.',
                },
                {
                  n: '02',
                  title: 'Wear it for a month',
                  body: 'Ships to your door in 1–2 weeks. Every piece is professionally cleaned and inspected before it reaches you.',
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

        {/* ── The Wardrobes ─────────────────────────────────────────────── */}
        {wardrobes.length > 0 && (
          <section className="py-24 px-8 md:px-16 bg-sand/25">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12 flex items-end justify-between gap-4">
                <div>
                  <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">Curated collections</p>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">The Wardrobes</h2>
                  <p className="font-sans text-sm text-slate mt-3 max-w-sm leading-relaxed">
                    Curated collections built around how you actually live. Pick a wardrobe or mix and match.
                  </p>
                </div>
                <Link href="/wardrobes" className="font-sans text-sm text-slate hover:text-navy transition-colors whitespace-nowrap pb-1">
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {wardrobes.map((w, i) => (
                  <Link key={w.id} href={`/wardrobe/${w.slug}`} className="group block">
                    <div className={`aspect-[3/4] rounded-2xl overflow-hidden relative flex flex-col justify-between p-8 ${i % 2 === 0 ? 'bg-navy' : 'bg-[#1f3560]'}`}>
                      <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-cream/25">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-cream leading-tight mb-3">{w.name}</h3>
                        {w.description && (
                          <p className="font-sans text-sm text-cream/50 line-clamp-3 leading-relaxed">{w.description}</p>
                        )}
                        <p className="font-sans text-xs text-cream/30 group-hover:text-cream/60 transition-colors mt-6 tracking-wide">Browse wardrobe →</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Why rent ──────────────────────────────────────────────────── */}
        <section className="py-24 px-8 md:px-16 bg-navy">
          <div className="max-w-6xl mx-auto">
            <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-gold/50 mb-4">Why rent</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream mb-12">
              Clothes built for how<br />life actually works.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { heading: 'Try it first',          body: "Wear a piece for a month. Buy at a lower price if you love it. Return it if you don't." },
                { heading: 'Wear better brands',    body: 'A $150 piece for $18/mo. Quality that used to require a big purchase upfront.' },
                { heading: 'Style that adapts',     body: "Trends shift. Life shifts. Never get stuck with a closet that doesn't fit anymore." },
                { heading: 'Buyout price drops',    body: 'Keep renting and the path to ownership gets cheaper every month, automatically.' },
                { heading: 'No closet clutter',     body: "Return what you don't reach for. Only keep what earns its place." },
                { heading: 'Sustainable by design', body: 'More wears per piece. Less demand for new production. The more conscious choice.' },
              ].map((item, i) => (
                <div key={i} className="bg-cream/[0.06] rounded-2xl p-6 border border-cream/[0.08]">
                  <p className="font-sans font-semibold text-cream mb-2 text-sm">{item.heading}</p>
                  <p className="font-sans text-sm text-cream/50 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder note ──────────────────────────────────────────────── */}
        <section className="py-20 px-8 md:px-16 bg-cream">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-sand p-8 md:p-12">
            <p className="font-sans text-[11px] uppercase tracking-widest text-slate/40 mb-5">From the founder</p>
            <p className="font-serif text-2xl font-bold text-navy mb-5 leading-snug">
              A small business, built from scratch.
            </p>
            <p className="font-sans text-base text-slate leading-relaxed mb-4">
              I built Davenport because I was spending $200 on clothes I wore twice, then letting them sit. There had to be a better way to dress well.
            </p>
            <p className="font-sans text-base text-slate leading-relaxed mb-8">
              We're still small — every customer matters and I read every message. If something isn't right, email me directly.
            </p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="font-sans text-sm text-slate/60">— Ben Davenport</span>
              <a
                href="mailto:ben@davenport.rentals"
                className="inline-flex items-center gap-2 font-sans text-sm font-medium text-navy border border-navy/20 px-5 py-2.5 rounded-lg hover:bg-navy/5 transition-colors"
              >
                Email me →
              </a>
            </div>
          </div>
        </section>

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
            <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center bg-cream text-navy font-sans font-semibold px-8 py-4 rounded-xl hover:bg-cream/92 transition-colors text-sm whitespace-nowrap"
              >
                Shop the collection →
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center border border-cream/20 text-cream font-sans font-medium px-8 py-3.5 rounded-xl hover:bg-cream/8 transition-colors text-sm whitespace-nowrap"
              >
                Create an account
              </Link>
              <Link
                href={APP_STORE_URL}
                className="font-sans text-xs text-cream/30 hover:text-cream/50 transition-colors text-center pt-1"
              >
                Download on the App Store →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
