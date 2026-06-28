'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    })
    if (res.ok) {
      router.replace('/')
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Invalid username or password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1b2d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-white font-bold tracking-[0.28em] text-xl">DAVENPORT</p>
          <p className="text-white/35 text-xs mt-1 tracking-wider uppercase">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-navy font-bold text-lg mb-1">Sign in</h1>
          <p className="text-gray-400 text-sm mb-7">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
              <input
                type="text"
                autoComplete="username"
                placeholder="yourname"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/25 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/25 text-gray-900"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="bg-navy text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">
          Contact Ben if you need access.
        </p>
      </div>
    </div>
  )
}
