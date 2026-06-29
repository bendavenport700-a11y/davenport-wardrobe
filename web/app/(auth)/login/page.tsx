'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/account'

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowser()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  const INPUT = 'w-full border border-sand rounded-xl px-4 py-3 text-sm font-sans text-navy bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 placeholder:text-slate/50'

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl font-bold text-navy mb-2">Sign in</h1>
      <p className="text-sm font-sans text-slate mb-8">Access your suitcase and active rentals.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-sans font-semibold text-slate uppercase tracking-wide mb-1.5">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs font-sans font-semibold text-slate uppercase tracking-wide mb-1.5">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={INPUT}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-cream font-sans font-semibold py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60 text-sm mt-2"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm font-sans text-slate text-center mt-6">
        No account?{' '}
        <Link href={`/signup${next !== '/account' ? `?next=${next}` : ''}`} className="text-navy font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
