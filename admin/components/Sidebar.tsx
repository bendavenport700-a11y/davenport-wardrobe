'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminRole } from '@/lib/auth'

// ── Icons ────────────────────────────────────────────────────────────────────

function Icon({ d, extra }: { d: string; extra?: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {extra && <path d={extra} />}
    </svg>
  )
}

const ICONS = {
  dashboard:     'M3 10.5L10 3l7 7.5M5 8.5V17h4v-4h2v4h4V8.5',
  orders:        'M4.5 3.5h11a1 1 0 011 1v12a1 1 0 01-1 1h-11a1 1 0 01-1-1v-12a1 1 0 011-1zM7.5 3.5v-1M12.5 3.5v-1M3.5 8.5h13',
  rentals:       'M14 4.5L16.5 7 14 9.5M16.5 7H7.5a5 5 0 000 10h1M6 15.5L3.5 13 6 10.5M3.5 13h9a5 5 0 000-10h-1',
  pieces:        'M9 2.5H5A2.5 2.5 0 002.5 5v3.5c0 .663.263 1.3.732 1.768l7 7a2.5 2.5 0 003.536 0l3-3a2.5 2.5 0 000-3.536l-7-7A2.5 2.5 0 009 2.5z',
  wardrobes:     'M2.5 7h15l-.75 9.25A1.5 1.5 0 0115.25 17.5H4.75a1.5 1.5 0 01-1.5-1.25L2.5 7zM2.5 7V6A1.5 1.5 0 014 4.5h4l2 2h6A1.5 1.5 0 0117.5 8',
  pricing:       'M4.5 15.5l11-11M6.5 4.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM13.5 11.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z',
  announcements: 'M3.5 7.5h3l5.5-4v11l-5.5-4h-3a1 1 0 01-1-1v-2a1 1 0 011-1zM6.5 14.5v2.5M15 6.5a4 4 0 010 7',
  team:          'M13 11a4 4 0 10-6 0M10 11v6M7 17h6M15.5 8a3 3 0 010 5.5',
  appsettings:   'M10 2.5a2 2 0 012 2v.3a5.5 5.5 0 011.3.76l.26-.15a2 2 0 012.73.73 2 2 0 01-.73 2.73l-.26.15a5.6 5.6 0 010 1.48l.26.15a2 2 0 01.73 2.73 2 2 0 01-2.73.73l-.26-.15A5.5 5.5 0 0112 15.2v.3a2 2 0 01-4 0v-.3a5.5 5.5 0 01-1.3-.76l-.26.15a2 2 0 01-2.73-.73 2 2 0 01.73-2.73l.26-.15a5.6 5.6 0 010-1.48l-.26-.15A2 2 0 013.44 6.6a2 2 0 012.73-.73l.26.15A5.5 5.5 0 018 5.3V5a2 2 0 012-2.5zM10 8a2 2 0 100 4 2 2 0 000-4z',
  signout:       'M12.5 3.5h3a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5h-3M8.5 13.5L12 10l-3.5-3.5M12 10H3',
}

// ── Nav structure ─────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: keyof typeof ICONS }

const OPERATIONS: NavItem[] = [
  { href: '/',        label: 'Dashboard', icon: 'dashboard' },
  { href: '/orders',  label: 'Orders',    icon: 'orders' },
  { href: '/rentals', label: 'Rentals',   icon: 'rentals' },
]

const CATALOG: NavItem[] = [
  { href: '/pieces',    label: 'Pieces',    icon: 'pieces' },
  { href: '/wardrobes', label: 'Wardrobes', icon: 'wardrobes' },
]

const SETTINGS: NavItem[] = [
  { href: '/users',         label: 'Team',          icon: 'team' },
  { href: '/pricing',       label: 'Pricing',       icon: 'pricing' },
  { href: '/announcements', label: 'Announcements', icon: 'announcements' },
  { href: '/settings',      label: 'App Settings',  icon: 'appsettings' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  user: { name: string; role: AdminRole } | null
}

export function Sidebar({ user }: Props) {
  const pathname  = usePathname()
  const isCatalog = user?.role === 'catalog'

  // Catalog-role users only see Pieces + Wardrobes
  const sections = isCatalog
    ? [{ label: 'Catalog', items: CATALOG }]
    : [
        { label: 'Operations', items: OPERATIONS },
        { label: 'Catalog',    items: CATALOG },
        { label: 'Settings',   items: SETTINGS },
      ]

  function NavLink({ href, label, icon }: NavItem) {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors duration-100 ${
          active
            ? 'bg-white/14 text-white font-medium'
            : 'text-white/40 hover:text-white/80 hover:bg-white/6'
        }`}
      >
        <Icon d={ICONS[icon]} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-52 shrink-0 bg-[#0f1b2d] min-h-screen flex flex-col border-r border-white/5">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <p className="text-white font-bold tracking-[0.2em] text-[13px]">DAVENPORT</p>
        <p className="text-white/30 text-[10px] mt-0.5 tracking-widest uppercase">Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-5 overflow-y-auto">
        {sections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/22 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => <NavLink key={item.href} {...item} />)}
            </div>
          </div>
        ))}

        {/* Quick action */}
        <div className="mt-auto pt-2 border-t border-white/8">
          <Link
            href="/pieces/new"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-white/50 hover:text-white/80 hover:bg-white/6 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add New Piece
          </Link>
        </div>
      </nav>

      {/* Signed-in user + logout */}
      <div className="px-4 py-4 border-t border-white/8">
        {user && (
          <div className="mb-2.5 px-1">
            <p className="text-white/70 text-[12px] font-medium leading-tight">{user.name}</p>
            <p className="text-white/25 text-[10px] capitalize">{user.role === 'admin' ? 'Full access' : 'Catalog access'}</p>
          </div>
        )}
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/6 text-[12px] transition-colors"
          >
            <Icon d={ICONS.signout} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
