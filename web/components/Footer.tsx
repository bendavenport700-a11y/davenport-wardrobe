import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy text-cream">
      {/* App download strip */}
      <div className="border-b border-cream/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-serif text-2xl font-bold text-cream mb-1">Ready to start?</p>
            <p className="font-sans text-sm text-cream/60">Browse pieces, build your suitcase, and rent monthly.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/browse"
              className="bg-cream text-navy font-sans font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-cream/90 transition-colors whitespace-nowrap"
            >
              Shop the collection →
            </Link>
            <Link
              href="https://apps.apple.com/app/davenport/id6778844291"
              className="font-sans text-xs text-cream/35 hover:text-cream/60 transition-colors whitespace-nowrap"
            >
              Download on App Store
            </Link>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="font-serif text-lg font-bold tracking-[0.35em] mb-3">DAVENPORT</p>
          <p className="text-sm text-cream/50 leading-relaxed">
            Wardrobe flexibility.<br />
            Est. 2026
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-sans uppercase tracking-widest text-cream/35 mb-4">Explore</p>
          <Link href="/browse" className="block text-sm text-cream/65 hover:text-cream transition-colors">Browse Pieces</Link>
          <Link href="/#how-it-works" className="block text-sm text-cream/65 hover:text-cream transition-colors">How It Works</Link>
          <Link href="/support" className="block text-sm text-cream/65 hover:text-cream transition-colors">Support & FAQ</Link>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-sans uppercase tracking-widest text-cream/35 mb-4">Legal</p>
          <Link href="/rental-terms" className="block text-sm text-cream/65 hover:text-cream transition-colors">Rental Terms</Link>
          <Link href="/privacy" className="block text-sm text-cream/65 hover:text-cream transition-colors">Privacy Policy</Link>
          <a href="mailto:support@davenport.rentals" className="block text-sm text-cream/65 hover:text-cream transition-colors">support@davenport.rentals</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-8 border-t border-cream/10 pt-6">
        <p className="text-xs text-cream/25 font-sans">© {new Date().getFullYear()} Davenport Wardrobe LLC. All rights reserved.</p>
      </div>
    </footer>
  )
}
