'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Support', href: '/support' },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hash links belong to the homepage; match by pathname only
  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-cream/98 backdrop-blur-md shadow-sm' : 'bg-cream/95 backdrop-blur-sm'
    } border-b border-sand/60`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-bold text-navy tracking-[0.35em] hover:opacity-75 transition-opacity">
          DAVENPORT
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-sans transition-colors ${
                isActive(link.href) ? 'text-navy font-medium' : 'text-slate hover:text-navy'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://apps.apple.com/app/davenport/id6778844291"
            className="text-sm font-sans bg-navy text-cream px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors font-medium"
          >
            Download App
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2 text-navy"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="3" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="3" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-sand/60 bg-cream/98 backdrop-blur-md px-6 py-5 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block font-sans text-base py-2.5 border-b border-sand/40 last:border-0 ${
                isActive(link.href) ? 'text-navy font-medium' : 'text-slate'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3">
            <Link
              href="https://apps.apple.com/app/davenport/id6778844291"
              onClick={() => setMenuOpen(false)}
              className="block font-sans text-sm font-medium bg-navy text-cream px-4 py-3.5 rounded-xl text-center"
            >
              Download the App
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
