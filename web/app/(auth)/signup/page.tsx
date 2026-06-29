'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

function SignupForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/account'

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [terms, setTerms]         = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!terms) { setError('Please accept the Rental Terms to continue.'); return }
    setLoading(true)

    const supabase = createSupabaseBrowser()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/auth/callback?next=${next}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setDone(true)
      return
    }

    // Email confirmation disabled — update profile then redirect
    if (data.session) {
      await supabase.from('profiles').update({
        full_name: fullName,
        terms_accepted_at: new Date().toISOString(),
      }).eq('id', data.user!.id)
      window.location.href = next
    }
  }

  const INPUT = 'w-full border border-sand rounded-xl px-4 py-3 text-sm font-sans text-navy bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 placeholder:text-slate/50'

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-navy/8 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy mb-3">Check your email</h1>
        <p className="text-sm font-sans text-slate leading-relaxed">
          We sent a confirmation link to <strong className="text-navy">{email}</strong>. Click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="inline-block mt-8 text-sm font-sans font-medium text-navy hover:underline">
          Back to sign in →
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl font-bold text-navy mb-2">Create account</h1>
      <p className="text-sm font-sans text-slate mb-8">Start renting in minutes.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-sans font-semibold text-slate uppercase tracking-wide mb-1.5">Full name</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ben Davenport"
            className={INPUT}
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={INPUT}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={e => setTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-navy shrink-0"
          />
          <span className="text-sm font-sans text-slate leading-snug">
            I agree to the{' '}
            <Link href="/rental-terms" target="_blank" className="text-navy font-medium hover:underline">
              Rental Terms
            </Link>
            , including the 30-day minimum and $75 refundable deposit.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-cream font-sans font-semibold py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60 text-sm mt-2"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm font-sans text-slate text-center mt-6">
        Already have an account?{' '}
        <Link href={`/login${next !== '/account' ? `?next=${next}` : ''}`} className="text-navy font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
