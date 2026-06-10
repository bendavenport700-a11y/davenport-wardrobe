import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy text-cream py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="font-serif text-xl font-bold tracking-[0.3em] mb-3">DAVENPORT</p>
          <p className="text-sm text-cream/60 leading-relaxed">
            A wardrobe flexibility platform.<br />
            Fairfield County, CT.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-sans uppercase tracking-widest text-cream/40 mb-3">Navigation</p>
          <Link href="/browse" className="block text-sm text-cream/70 hover:text-cream transition-colors">Browse Pieces</Link>
          <Link href="/#how-it-works" className="block text-sm text-cream/70 hover:text-cream transition-colors">How It Works</Link>
          <Link href="/#why-rent" className="block text-sm text-cream/70 hover:text-cream transition-colors">Why Rent?</Link>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-sans uppercase tracking-widest text-cream/40 mb-3">Support</p>
          <Link href="/privacy" className="block text-sm text-cream/70 hover:text-cream transition-colors">Privacy Policy</Link>
          <Link href="/rental-terms" className="block text-sm text-cream/70 hover:text-cream transition-colors">Rental Terms</Link>
          <a href="mailto:support@davenport.rentals" className="block text-sm text-cream/70 hover:text-cream transition-colors">support@davenport.rentals</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-10 pt-8 border-t border-cream/10">
        <p className="text-xs text-cream/30 font-sans">© {new Date().getFullYear()} Davenport Wardrobe LLC. All rights reserved.</p>
      </div>
    </footer>
  )
}
