'use client'

import { useState, useEffect, useTransition, FormEvent } from 'react'

interface AdminUser {
  id: string
  username: string
  display_name: string
  role: 'admin' | 'catalog'
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
      role === 'admin'
        ? 'bg-navy/10 text-navy'
        : 'bg-gray-100 text-gray-500'
    }`}>
      {role === 'admin' ? 'Full access' : 'Catalog access'}
    </span>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────

interface FormProps {
  initial?: AdminUser | null
  onSave: (user: AdminUser) => void
  onCancel: () => void
}

function UserForm({ initial, onSave, onCancel }: FormProps) {
  const [username,     setUsername]     = useState(initial?.username     ?? '')
  const [displayName,  setDisplayName]  = useState(initial?.display_name ?? '')
  const [password,     setPassword]     = useState('')
  const [role,         setRole]         = useState<'admin' | 'catalog'>(initial?.role ?? 'catalog')
  const [error,        setError]        = useState('')
  const [pending,      startTransition] = useTransition()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const body = initial
        ? { id: initial.id, display_name: displayName, role, ...(password ? { password } : {}) }
        : { username: username.trim(), password, display_name: displayName.trim(), role }

      const res = await fetch('/api/users', {
        method:  initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      onSave(data)
    })
  }

  const isEdit = !!initial

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            placeholder="alex"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <p className="text-[11px] text-gray-400 mt-1">Lowercase, no spaces. This is how they log in.</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
          placeholder="Alex Smith"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required={!isEdit}
          placeholder={isEdit ? '••••••••' : 'choose a password'}
          autoComplete={isEdit ? 'new-password' : 'new-password'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Access Level</label>
        <div className="flex gap-3">
          {(['catalog', 'admin'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${
                role === r
                  ? 'bg-navy text-white border-navy font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r === 'catalog' ? 'Catalog access' : 'Full access (admin)'}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          {role === 'catalog'
            ? 'Can view and edit pieces and wardrobes only.'
            : 'Can access everything including orders, pricing, and team management.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-navy text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add User'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,        setUsers]        = useState<AdminUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [loadError,    setLoadError]    = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editingUser,  setEditingUser]  = useState<AdminUser | null>(null)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) { setLoadError(data.error ?? 'Could not load users.'); return }
        setUsers(Array.isArray(data) ? data : [])
      })
      .catch(() => setLoadError('Network error. Refresh the page.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(user: AdminUser) {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === user.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = user
        return next
      }
      return [...prev, user]
    })
    setShowAdd(false)
    setEditingUser(null)
  }

  async function handleDelete(id: string) {
    setDeleteError('')
    setDeleting(true)
    const res  = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { setDeleteError(data.error ?? 'Could not delete user.'); setDeletingId(null); return }
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            People who can log into the Davenport admin.
          </p>
        </div>
        {!showAdd && !editingUser && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add Person
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">New User</h2>
          <UserForm onSave={handleSaved} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* Edit form */}
      {editingUser && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Edit {editingUser.display_name}</h2>
          <UserForm initial={editingUser} onSave={handleSaved} onCancel={() => setEditingUser(null)} />
        </div>
      )}

      {/* User list */}
      {loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">Loading…</div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-red-600 text-sm">{loadError}</div>
      ) : users.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">No users yet — add one above.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                <span className="text-navy font-semibold text-sm">
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.display_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
              </div>

              <RoleBadge role={user.role} />

              {/* Actions */}
              {deletingId === user.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">{deleting ? 'Removing…' : `Remove ${user.display_name}?`}</span>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    Yes, remove
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    disabled={deleting}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingUser(user); setShowAdd(false) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13.5 3.5l3 3-10 10H3.5v-3l10-10z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { setDeletingId(user.id); setDeleteError('') }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 5.5h11M8 5.5v-2h4v2M7 5.5l.5 11h5l.5-11" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteError && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-red-600 text-sm">
          {deleteError}
        </div>
      )}

      {/* Help text */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Sharing access with friends</p>
        <p className="text-sm text-blue-700 leading-relaxed">
          Add them here, then share the admin URL. If this admin is deployed to Vercel, they can log in from anywhere — even from home.
          Give friends <strong>Catalog access</strong> so they can only see pieces and wardrobes.
        </p>
      </div>
    </div>
  )
}
