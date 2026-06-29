import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 0

const TYPE_LABEL: Record<string, string> = {
  event: 'Event',
  vacation: 'Vacation',
  extended_stay: 'Extended Stay',
  season: 'Season',
}

export default async function PlansPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/plans')

  const { data: plans } = await supabase
    .from('trips')
    .select('id, name, type, start_date, end_date, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-slate/40 mb-3">My wardrobe</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-navy">Plans</h1>
              <p className="font-sans text-sm text-slate mt-3 max-w-sm leading-relaxed">
                Curate pieces for a trip, event, or season. Add everything to your suitcase when you&apos;re ready.
              </p>
            </div>
            <Link
              href="/plans/new"
              className="shrink-0 font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors font-medium"
            >
              + Create a plan
            </Link>
          </div>

          {!plans || plans.length === 0 ? (
            <div className="text-center py-24 border border-sand rounded-2xl">
              <p className="font-serif text-2xl text-navy mb-2">No plans yet</p>
              <p className="font-sans text-sm text-slate mb-8">
                Start by browsing pieces and saving them to a plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/plans/new"
                  className="font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors"
                >
                  Create your first plan
                </Link>
                <Link
                  href="/browse"
                  className="font-sans text-sm text-navy border border-navy/20 px-6 py-3 rounded-xl hover:bg-navy/5 transition-colors"
                >
                  Browse pieces →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(plans as any[]).map(plan => (
                <Link key={plan.id} href={`/plans/${plan.id}`} className="group block">
                  <div className="bg-white border border-sand rounded-2xl px-7 py-6 hover:border-navy/25 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <h2 className="font-serif text-xl font-semibold text-navy">{plan.name}</h2>
                          {plan.type && (
                            <span className="font-sans text-[10px] uppercase tracking-widest bg-sand text-slate/60 px-2.5 py-1 rounded-full">
                              {TYPE_LABEL[plan.type] ?? plan.type}
                            </span>
                          )}
                        </div>
                        {(plan.start_date || plan.end_date) && (
                          <p className="font-sans text-sm text-slate/50">
                            {plan.start_date}{plan.start_date && plan.end_date ? ' — ' : ''}{plan.end_date}
                          </p>
                        )}
                      </div>
                      <span className="font-sans text-sm text-slate/30 group-hover:text-navy transition-colors shrink-0">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
