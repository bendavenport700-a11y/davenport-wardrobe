'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const PLAN_TYPES = [
  {
    value: 'event',
    label: 'Event',
    desc: 'Wedding, conference, dinner, occasion',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    value: 'vacation',
    label: 'Vacation',
    desc: 'Travel, weekend getaway, trip',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    value: 'extended_stay',
    label: 'Extended Stay',
    desc: 'Semester, work assignment, relocation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    value: 'season',
    label: 'Season',
    desc: 'Seasonal rotation, wardrobe refresh',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
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

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <div className="max-w-lg mx-auto px-6 py-14">
          <Link href="/plans" className="inline-flex items-center gap-1.5 font-sans text-sm text-slate/60 hover:text-navy transition-colors mb-10">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            My Plans
          </Link>

          <h1 className="font-serif text-3xl font-bold text-navy mb-1">New Plan</h1>
          <p className="font-sans text-sm text-slate/60 mb-10 leading-relaxed">
            Name it and set the dates. Browse pieces to build out your wardrobe, then add them all to your suitcase when you&apos;re ready.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Name */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-slate/40 block mb-3">
                Plan name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Austin Conference, Summer Rotation, Ski Weekend…"
                className="w-full bg-white border border-sand rounded-2xl px-5 py-4 font-sans text-base text-navy placeholder-slate/30 focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40 transition-all"
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-slate/40 block mb-3">
                What kind of plan?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PLAN_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      type === t.value
                        ? 'bg-navy border-navy text-cream shadow-sm'
                        : 'bg-white border-sand text-navy hover:border-navy/30 hover:shadow-sm'
                    }`}
                  >
                    <div className={`mb-2 ${type === t.value ? 'text-cream/70' : 'text-slate/50'}`}>
                      {t.icon}
                    </div>
                    <p className={`font-sans text-sm font-semibold mb-0.5 ${type === t.value ? 'text-cream' : 'text-navy'}`}>
                      {t.label}
                    </p>
                    <p className={`font-sans text-xs leading-snug ${type === t.value ? 'text-cream/55' : 'text-slate/50'}`}>
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-slate/40 block mb-3">
                Dates <span className="normal-case font-normal tracking-normal text-slate/30">— optional</span>
              </label>
              <div className="bg-white border border-sand rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-sand">
                  <div className="p-4">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-slate/40 mb-1.5">Start</p>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full font-sans text-sm text-navy focus:outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-slate/40 mb-1.5">End</p>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full font-sans text-sm text-navy focus:outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-slate/40 block mb-3">
                Notes <span className="normal-case font-normal tracking-normal text-slate/30">— optional</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Dress code, weather forecast, vibe…"
                rows={2}
                className="w-full bg-white border border-sand rounded-2xl px-5 py-4 font-sans text-sm text-navy placeholder-slate/30 focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40 transition-all resize-none"
              />
            </div>

            {error && (
              <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full font-sans text-sm font-semibold bg-navy text-cream px-6 py-4 rounded-2xl hover:bg-navy/90 active:scale-[0.99] transition-all disabled:opacity-50"
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
