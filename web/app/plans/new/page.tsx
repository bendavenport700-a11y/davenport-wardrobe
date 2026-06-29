'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const PLAN_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'extended_stay', label: 'Extended Stay' },
  { value: 'season', label: 'Season' },
]

export default function NewPlanPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('event')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createSupabaseBrowser().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login?next=/plans/new'); return }
      setUserId(data.user.id)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Give your plan a name.'); return }
    if (!userId) { router.replace('/login?next=/plans/new'); return }
    setSaving(true)
    setError('')
    const supabase = createSupabaseBrowser()
    const { data, error: dbError } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        name: name.trim(),
        type,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
        status: 'planning',
      })
      .select('id')
      .single()
    if (dbError || !data) {
      setError('Something went wrong. Try again.')
      setSaving(false)
      return
    }
    router.push(`/plans/${data.id}`)
  }

  const input = 'w-full font-sans text-sm border border-sand rounded-xl px-4 py-3 text-navy placeholder-slate/40 focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/30 transition-all bg-white'

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <div className="max-w-xl mx-auto px-6 py-16">
          <Link href="/plans" className="font-sans text-sm text-slate hover:text-navy transition-colors mb-8 inline-block">
            ← My Plans
          </Link>
          <h1 className="font-serif text-4xl font-bold text-navy mb-2">New Plan</h1>
          <p className="font-sans text-sm text-slate mb-10">
            Name it, set the dates, then browse pieces to add.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-slate/50 block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Austin Conference, Summer Rotation, Ski Weekend"
                className={input}
                autoFocus
              />
            </div>

            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-slate/50 block mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {PLAN_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`font-sans text-sm px-4 py-3 rounded-xl border transition-colors text-left ${
                      type === t.value
                        ? 'bg-navy text-cream border-navy'
                        : 'bg-white text-slate border-sand hover:border-navy/25 hover:text-navy'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs uppercase tracking-widest text-slate/50 block mb-2">Start date <span className="normal-case tracking-normal">(optional)</span></label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={input} />
              </div>
              <div>
                <label className="font-sans text-xs uppercase tracking-widest text-slate/50 block mb-2">End date <span className="normal-case tracking-normal">(optional)</span></label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={input} />
              </div>
            </div>

            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-slate/50 block mb-2">Notes <span className="normal-case tracking-normal">(optional)</span></label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anything you want to remember about this plan"
                rows={3}
                className={`${input} resize-none`}
              />
            </div>

            {error && <p className="font-sans text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full font-sans text-sm font-medium bg-navy text-cream px-6 py-4 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Plan →'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
