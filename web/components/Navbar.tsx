'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useCart } from '@/context/CartContext'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'Wardrobes', href: '/wardrobes' },
  { label: 'Plans', href: '/plans' },
  { label: 'Support', href: '/support' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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

          {/* Cart */}
          <Link href="/cart" className="relative text-slate hover:text-navy transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-navy text-cream text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/account" className="text-sm font-sans text-slate hover:text-navy transition-colors">
                Account
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-sans bg-navy text-cream px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors font-medium"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-sans text-slate hover:text-navy transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-sans bg-navy text-cream px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors font-medium"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <Link href="/cart" className="relative text-slate p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-navy text-cream text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button
            className="p-2 -mr-2 text-navy"
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
          <div className="pt-3 space-y-2">
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="block font-sans text-sm font-medium text-navy px-4 py-3 rounded-xl border border-navy/20 text-center"
                >
                  My Account
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut() }}
                  className="w-full font-sans text-sm font-medium bg-navy text-cream px-4 py-3.5 rounded-xl text-center"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block font-sans text-sm font-medium text-navy px-4 py-3 rounded-xl border border-navy/20 text-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block font-sans text-sm font-medium bg-navy text-cream px-4 py-3.5 rounded-xl text-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
