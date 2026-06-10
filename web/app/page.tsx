import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PieceCard } from '@/components/PieceCard'
import { getFeaturedPieces, getWardrobes } from '@/lib/supabase'

export const revalidate = 300 // revalidate every 5 minutes

export default async function HomePage() {
  const [pieces, wardrobes] = await Promise.all([getFeaturedPieces(), getWardrobes()])

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ── */}
        <section className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2a3f6a_0%,_#1B2A4A_60%)]" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="font-sans text-xs uppercase tracking-[0.4em] text-gold mb-6">
              Fairfield County · Est. 2026
            </p>
            <h1 className="font-serif text-6xl md:text-8xl font-bold text-cream leading-[1.05] mb-6">
              Your wardrobe,<br />on your terms.
            </h1>
            <p className="font-sans text-lg md:text-xl text-cream/70 leading-relaxed max-w-xl mx-auto mb-10">
              Rent premium pieces monthly. Wear them, love them, decide if you want to keep them.
              Buy at a lower price — or return with no questions asked.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="https://apps.apple.com/app/davenport/id6778844291"
                className="bg-cream text-navy font-sans font-semibold px-8 py-4 rounded-xl hover:bg-cream/90 transition-colors text-base"
              >
                Download the App
              </Link>
              <Link
                href="/browse"
                className="border border-cream/30 text-cream font-sans px-8 py-4 rounded-xl hover:bg-cream/10 transition-colors text-base"
              >
                Browse Pieces
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/30">
            <span className="font-sans text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-8 bg-cream/20" />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-24 px-6 bg-cream">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-16">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-4">
                Rent first. Decide later.
              </h2>
              <p className="font-sans text-slate text-lg leading-relaxed">
                Try before you commit. Buy what you love at a price that&apos;s already come down.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: '01', title: 'Pick your pieces', body: 'Browse curated pieces from top brands. Choose your size.' },
                { n: '02', title: 'Rent monthly', body: 'Ships to your door in 2–3 days. Keep it as long as you want.' },
                { n: '03', title: 'Love it? Buy it.', body: 'The buyout price drops every month you rent. Own it whenever you\'re ready.', highlight: true },
                { n: '04', title: 'Not for you? Return it.', body: 'Send it back, no questions asked. Swap for something else.' },
              ].map(step => (
                <div key={step.n} className={`rounded-2xl p-7 ${step.highlight ? 'bg-navy text-cream' : 'bg-white border border-sand'}`}>
                  <p className={`font-sans text-xs font-semibold tracking-widest uppercase mb-4 ${step.highlight ? 'text-gold' : 'text-slate'}`}>{step.n}</p>
                  <h3 className={`font-serif text-xl font-semibold mb-3 ${step.highlight ? 'text-cream' : 'text-navy'}`}>{step.title}</h3>
                  <p className={`font-sans text-sm leading-relaxed ${step.highlight ? 'text-cream/70' : 'text-slate'}`}>{step.body}</p>
                </div>
              ))}
            </div>

            {/* Buyout explainer */}
            <div className="mt-8 bg-navy/5 border border-navy/10 rounded-2xl p-7 max-w-lg">
              <h3 className="font-serif text-lg font-semibold text-navy mb-4">The buyout price drops as you rent.</h3>
              <div className="space-y-3">
                {[
                  { label: 'New piece — example $80 item', price: '$72', sub: 'Day one' },
                  { label: 'After 3 months renting', price: '$53', sub: 'Still loving it?' },
                  { label: 'After 5 months renting', price: '$40', sub: 'At this point, it\'s yours.' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                    <div>
                      <p className="font-sans text-sm text-navy">{row.label}</p>
                      <p className="font-sans text-xs text-slate mt-0.5">{row.sub}</p>
                    </div>
                    <p className="font-serif text-lg font-bold text-navy">{row.price}</p>
                  </div>
                ))}
              </div>
              <p className="font-sans text-xs text-slate mt-4 leading-relaxed">
                Rent it, wear it, and if you love it — buy at a price that reflects how long you&apos;ve had it.
              </p>
            </div>
          </div>
        </section>

        {/* ── Featured Pieces ── */}
        {pieces.length > 0 && (
          <section className="py-24 px-6 bg-sand/30">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <h2 className="font-serif text-4xl font-bold text-navy">Featured Pieces</h2>
                <Link href="/browse" className="font-sans text-sm text-slate hover:text-navy transition-colors">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {pieces.map(piece => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Wardrobes ── */}
        {wardrobes.length > 0 && (
          <section className="py-24 px-6 bg-cream">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-4xl font-bold text-navy mb-12">The Wardrobes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {wardrobes.map(w => (
                  <Link key={w.id} href={`/wardrobe/${w.slug}`} className="group">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-navy relative">
                      {w.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.cover_image_url}
                          alt={w.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                        />
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="font-serif text-2xl font-bold text-cream">{w.name}</h3>
                        {w.description && (
                          <p className="font-sans text-sm text-cream/70 mt-1 line-clamp-2">{w.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Why Rent ── */}
        <section id="why-rent" className="py-24 px-6 bg-navy text-cream">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-16">
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Why rent instead of buy?
              </h2>
              <p className="font-sans text-cream/70 text-lg leading-relaxed">
                Traditional retail asks you to predict what you&apos;ll like, what will fit, and pay upfront.
                Davenport removes those burdens entirely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  title: 'Your style changes. Your wardrobe should too.',
                  body: 'Renting means you\'re never stuck with something that stopped fitting your life.',
                },
                {
                  title: 'Try it before you commit.',
                  body: 'Wear a piece for a month before deciding if it\'s worth owning. Buy at a lower price if you love it.',
                },
                {
                  title: 'No closet clutter.',
                  body: 'Return what doesn\'t get worn. Only keep what earns its place.',
                },
                {
                  title: 'Pay as your wardrobe grows.',
                  body: 'Build slowly, rent what you need now, and buy your favorites over time — no big upfront spend.',
                },
              ].map((item, i) => (
                <div key={i} className="border border-cream/10 rounded-2xl p-7 hover:border-cream/20 transition-colors">
                  <h3 className="font-serif text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="font-sans text-sm text-cream/60 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6 bg-cream text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-4">
              Ready to start?
            </h2>
            <p className="font-sans text-slate text-lg leading-relaxed mb-10">
              Download the app and browse the wardrobe. No commitment until you check out.
            </p>
            <Link
              href="https://apps.apple.com/app/davenport/id6778844291"
              className="inline-block bg-navy text-cream font-sans font-semibold px-10 py-4 rounded-xl hover:bg-navy/90 transition-colors text-base"
            >
              Download on the App Store
            </Link>
            <p className="font-sans text-xs text-slate mt-6">
              Available for iPhone · Fairfield County, CT
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
