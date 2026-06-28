import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, hashPassword } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!await requireAdmin()) return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, username, display_name, role, created_at')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return unauthorized()

  const { username, password, display_name, role } = await req.json()

  if (!username?.trim() || !password || !display_name?.trim()) {
    return NextResponse.json({ error: 'Username, password, and name are required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert({ username: username.trim(), password: hashPassword(username.trim(), password), display_name: display_name.trim(), role: role ?? 'catalog' })
    .select('id, username, display_name, role, created_at')
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'That username is already taken.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return unauthorized()

  const { id, display_name, password, role } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (display_name?.trim()) updates.display_name = display_name.trim()
  if (role)                 updates.role          = role
  if (password) {
    // Fetch username for per-user salt
    const { data: target } = await supabaseAdmin.from('admin_users').select('username').eq('id', id).single()
    if (target?.username) updates.password = hashPassword(target.username, password)
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('id, username, display_name, role, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return unauthorized()

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  // Prevent self-deletion
  const { data: target } = await supabaseAdmin
    .from('admin_users')
    .select('username')
    .eq('id', id)
    .single()

  if (target?.username === caller.username) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
