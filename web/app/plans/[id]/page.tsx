import { notFound, redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PlanClient } from './PlanClient'

export const revalidate = 0

export default async function PlanPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/plans/${params.id}`)

  const [planRes, itemsRes] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('trip_items')
      .select('id, size, sort_order, pieces(id, name, brand, images, rental_fee, discount_pct, buyout_price, condition, wear_count, sizes_available)')
      .eq('trip_id', params.id)
      .order('sort_order'),
  ])

  if (!planRes.data) notFound()

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-cream">
        <PlanClient plan={planRes.data as any} items={(itemsRes.data ?? []) as any[]} />
      </main>
      <Footer />
    </>
  )
}
