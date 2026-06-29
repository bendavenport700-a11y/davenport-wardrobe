import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 0

const TYPE_LABEL: Record<string, string> = {
  event:         'Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Season',
}

const TYPE_COLOR: Record<string, string> = {
  event:         'bg-gold/10 text-gold/80',
  vacation:      'bg-blue-50 text-blue-700',
  extended_stay: 'bg-sand text-slate',
  season:        'bg-green-50 text-green-700',
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export default async function PlansPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/plans')

  const { data: plans } = await supabase
    .from('trips')
    .select('id, name, type, start_date, end_date, status, trip_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typedPlans = (plans ?? []) as Array<{
    id: string
    name: string
    type: string
    start_date: string | null
    end_date: string | null
    status: string
    trip_items: { count: number }[]
  }>

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-6 py-14">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-12">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-slate/35 mb-3">Davenport</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-navy">Plans</h1>
              <p className="font-sans text-sm text-slate/60 mt-3 max-w-xs leading-relaxed">
                Curate pieces for a trip, event, or season. Add everything to your suitcase when you&apos;re ready.
              </p>
            </div>
            <Link
              href="/plans/new"
              className="shrink-0 font-sans text-sm font-semibold bg-navy text-cream px-6 py-3.5 rounded-2xl hover:bg-navy/90 active:scale-[0.98] transition-all"
            >
              + New Plan
            </Link>
          </div>

          {typedPlans.length === 0 ? (
            /* Empty state */
            <div className="bg-white border border-sand rounded-3xl p-12 text-center">
              <div className="w-14 h-14 bg-sand/60 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </div>
              <p className="font-serif text-2xl font-bold text-navy mb-2">No plans yet</p>
              <p className="font-sans text-sm text-slate/50 mb-8 max-w-xs mx-auto leading-relaxed">
                Start by creating a plan, then browse pieces and save them to it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/plans/new"
                  className="font-sans text-sm font-semibold bg-navy text-cream px-7 py-3.5 rounded-2xl hover:bg-navy/90 transition-colors"
                >
                  Create your first plan
                </Link>
                <Link
                  href="/browse"
                  className="font-sans text-sm text-navy border border-navy/20 px-7 py-3.5 rounded-2xl hover:bg-navy/5 transition-colors"
                >
                  Browse pieces →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {typedPlans.map(plan => {
                const count = plan.trip_items?.[0]?.count ?? 0
                const dateRange = formatDateRange(plan.start_date, plan.end_date)
                return (
                  <Link key={plan.id} href={`/plans/${plan.id}`} className="group block">
                    <div className="bg-white border border-sand rounded-2xl p-6 hover:border-navy/25 hover:shadow-sm transition-all flex items-center gap-5">
                      {/* Piece count bubble */}
                      <div className="w-14 h-14 rounded-xl bg-sand/60 flex flex-col items-center justify-center shrink-0">
                        <span className="font-serif text-xl font-bold text-navy leading-none">{count}</span>
                        <span className="font-sans text-[9px] uppercase tracking-widest text-slate/50 mt-0.5">
                          {count === 1 ? 'piece' : 'pieces'}
                        </span>
                      </div>

                      {/* Plan info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-serif text-lg font-semibold text-navy truncate">{plan.name}</h2>
                          {plan.type && (
                            <span className={`shrink-0 font-sans text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold ${TYPE_COLOR[plan.type] ?? 'bg-sand text-slate/60'}`}>
                              {TYPE_LABEL[plan.type] ?? plan.type}
                            </span>
                          )}
                        </div>
                        {dateRange ? (
                          <p className="font-sans text-xs text-slate/50 flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            {dateRange}
                          </p>
                        ) : (
                          <p className="font-sans text-xs text-slate/40">No dates set</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg className="w-4 h-4 text-slate/25 group-hover:text-navy/50 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {typedPlans.length > 0 && (
            <div className="mt-6 text-center">
              <Link href="/browse" className="font-sans text-sm text-slate/50 hover:text-navy transition-colors">
                Browse more pieces →
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
