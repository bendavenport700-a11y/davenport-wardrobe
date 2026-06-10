import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Login page and API routes are always accessible
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const auth = req.cookies.get('admin-auth')?.value
  const password = process.env.ADMIN_PASSWORD

  if (!password || auth !== password) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
