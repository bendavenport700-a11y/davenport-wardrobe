import { NextRequest, NextResponse } from 'next/server'

// Edge runtime — must use Web Crypto API (globalThis.crypto.subtle), not Node's crypto module

async function hmac24(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}

// Token format: "username|role.HMAC24(username|role)"
async function verifyToken(token: string): Promise<{ username: string; role: string } | null> {
  const secret = process.env.ADMIN_SECRET ?? 'fallback'
  const dot    = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload  = token.slice(0, dot)
  const sig      = token.slice(dot + 1)
  const expected = await hmac24(payload, secret)
  if (sig !== expected) return null
  const [username, role] = payload.split('|')
  if (!username || !role) return null
  return { username, role }
}

const CATALOG_ALLOWED = ['/pieces', '/wardrobes', '/api/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/login' || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  const token  = req.cookies.get('admin-auth')?.value
  const parsed = token ? await verifyToken(token) : null

  if (!parsed) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (parsed.role === 'catalog') {
    const allowed = CATALOG_ALLOWED.some(p => pathname.startsWith(p))
    if (!allowed) {
      return NextResponse.redirect(new URL('/pieces', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
