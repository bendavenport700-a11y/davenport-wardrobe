import { NextRequest, NextResponse } from 'next/server'
import { findUser, makeToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const user = await findUser(username?.trim(), password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true, name: user.name, role: user.role })
  res.cookies.set('admin-auth', makeToken(user.username, user.role), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  })
  return res
}
