'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Why Rent?', href: '/#why-rent' },
  { label: 'Support', href: '/support' },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-sand">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-navy tracking-[0.3em]">
          DAVENPORT
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-sans transition-colors ${
                pathname === link.href ? 'text-navy font-medium' : 'text-slate hover:text-navy'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://apps.apple.com/app/davenport/id6778844291"
            className="text-sm font-sans bg-navy text-cream px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors"
          >
            Get the App
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-navy"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-navy transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-navy transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-navy transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-sand bg-cream px-6 py-4 space-y-3">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block font-sans text-base text-navy py-1"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://apps.apple.com/app/davenport/id6778844291"
            onClick={() => setMenuOpen(false)}
            className="block font-sans text-sm bg-navy text-cream px-4 py-3 rounded-lg text-center mt-2"
          >
            Download the App
          </Link>
        </div>
      )}
    </nav>
  )
}
