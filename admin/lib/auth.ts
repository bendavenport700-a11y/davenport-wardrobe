import { createHmac, createHash } from 'crypto'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'

export type AdminRole = 'admin' | 'catalog'

export interface AdminUser {
  id?: string
  username: string
  password: string
  name: string
  role: AdminRole
}

// ── Password hashing ─────────────────────────────────────────────────────────
// SHA-256(secret + ':' + username + ':' + password)
// Username acts as a per-user salt. Hashes are 64-char hex strings.
// Plaintext passwords are never 64-char hex, so we can distinguish them.

export function hashPassword(username: string, password: string): string {
  const secret = process.env.ADMIN_SECRET ?? 'fallback'
  return createHash('sha256').update(`${secret}:${username}:${password}`).digest('hex')
}

function isHashed(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value)
}

// ── Env fallback (bootstrap before any DB users exist) ────────────────────────

function listEnvUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS ?? ''
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const [username, password, name, role] = entry.split(':')
      return { username, password, name: name ?? username, role: (role ?? 'catalog') as AdminRole }
    })
}

// ── DB-backed user list ───────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .order('created_at')

  if (error || !data?.length) return listEnvUsers()

  return data.map(row => ({
    id:       row.id,
    username: row.username,
    password: row.password,
    name:     row.display_name,
    role:     row.role as AdminRole,
  }))
}

export async function findUser(username: string, password: string): Promise<AdminUser | null> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (data) {
    const stored = data.password as string
    const hashed = hashPassword(username, password)

    // Compare against hash first; fall back to plaintext for legacy accounts
    const match = stored === hashed || (!isHashed(stored) && stored === password)
    if (!match) return null

    // Upgrade plaintext passwords to hash on next login
    if (!isHashed(stored)) {
      await supabaseAdmin
        .from('admin_users')
        .update({ password: hashed })
        .eq('id', data.id)
    }

    return { id: data.id, username: data.username, password: hashed, name: data.display_name, role: data.role as AdminRole }
  }

  // Env-var fallback (passwords here may be plaintext — that's the operator's choice)
  const envUser = listEnvUsers().find(u => u.username === username && u.password === password)
  return envUser ?? null
}

// ── Token: "username|role.HMAC24(username|role)" ─────────────────────────────

function sign(payload: string): string {
  const secret = process.env.ADMIN_SECRET ?? 'fallback'
  return createHmac('sha256', secret).update(payload).digest('hex').slice(0, 24)
}

export function makeToken(username: string, role: AdminRole): string {
  const payload = `${username}|${role}`
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token: string): { username: string; role: AdminRole } | null {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const sig     = token.slice(dot + 1)
  if (sig !== sign(payload)) return null
  const [username, role] = payload.split('|')
  if (!username || !role) return null
  return { username, role: role as AdminRole }
}

// ── Session helper (server components only) ───────────────────────────────────

export async function getSessionUser(): Promise<AdminUser | null> {
  const jar   = await cookies()
  const token = jar.get('admin-auth')?.value
  if (!token) return null
  const parsed = verifyToken(token)
  if (!parsed) return null

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('display_name, role')
    .eq('username', parsed.username)
    .maybeSingle()

  if (data) {
    return { username: parsed.username, password: '', name: data.display_name, role: data.role as AdminRole }
  }

  const envUser = listEnvUsers().find(u => u.username === parsed.username)
  return envUser ? { ...envUser, role: parsed.role } : null
}

export const CATALOG_PATHS = ['/pieces', '/wardrobes', '/api/']
