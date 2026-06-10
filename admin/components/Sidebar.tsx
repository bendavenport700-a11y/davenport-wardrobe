'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',          label: 'Dashboard',  icon: '◾' },
  { href: '/pieces',    label: 'Pieces',      icon: '🧥' },
  { href: '/orders',    label: 'Orders',      icon: '📦' },
  { href: '/wardrobes', label: 'Wardrobes',   icon: '🗂' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-navy min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-white font-bold tracking-[0.2em] text-sm">DAVENPORT</p>
        <p className="text-white/40 text-xs mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <form action="/api/logout" method="POST" className="px-4 pb-6">
        <button
          type="submit"
          className="w-full text-left px-3 py-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </form>
    </aside>
  )
}
