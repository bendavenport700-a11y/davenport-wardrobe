import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { formatCents, formatCentsPerMonth } from '@/lib/format'
import { ActiveRentals } from '@/components/ActiveRentals'
import { RefundButton } from '@/components/RefundButton'

export const revalidate = 0

const STATUS_LABEL: Record<string, string> = {
  pending:          'Pending',
  sourcing:         'Sourcing',
  packaged:         'Packaged',
  shipped:          'Shipped',
  delivered:        'Active',
  return_requested: 'Return requested',
  returned:         'Returned',
  cancelled:        'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
  sourcing:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  packaged:         'bg-blue-50 text-blue-700 border-blue-200',
  shipped:          'bg-blue-50 text-blue-700 border-blue-200',
  delivered:        'bg-green-50 text-green-700 border-green-200',
  return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
  returned:         'bg-gray-50 text-gray-500 border-gray-200',
  cancelled:        'bg-gray-50 text-gray-500 border-gray-200',
}

export default async function AccountPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email, shipping_address, monthly_total, deposit_status, deposit_amount').eq('id', user.id).single(),
    supabase.from('orders').select('id, status, created_at, first_month_total, total_charged, rental_ids').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const profile = profileRes.data
  const rawOrders = (ordersRes.data ?? []) as any[]

  // orders.rental_ids is uuid[] — not a FK, so PostgREST can't join through it. Fetch separately.
  const allRentalIds = rawOrders.flatMap((o: any) => o.rental_ids ?? [])
  const rentalsData = allRentalIds.length > 0
    ? (await supabase.from('rentals').select('id, status, rental_fee_cents, pieces(name, brand)').in('id', allRentalIds)).data ?? []
    : []

  const rentalMap = new Map(rentalsData.map((r: any) => [r.id, r]))
  const orders = rawOrders.map((o: any) => ({
    ...o,
    rentals: (o.rental_ids ?? []).map((rid: string) => rentalMap.get(rid)).filter(Boolean),
  }))

  const addr = profile?.shipping_address as { line1?: string; city?: string; state?: string; zip?: string } | null

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy">My account</h1>
              {profile?.full_name && (
                <p className="font-sans text-sm text-slate mt-1">{profile.full_name}</p>
              )}
            </div>
            <Link href="/plans" className="font-sans text-sm text-navy border border-navy/20 px-5 py-2.5 rounded-xl hover:bg-navy/5 transition-colors">
              My Plans →
            </Link>
          </div>

          {/* Profile summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-sand p-5">
              <p className="font-sans text-xs uppercase tracking-widest text-slate mb-2">Email</p>
              <p className="font-sans text-sm text-navy">{profile?.email ?? user.email}</p>
            </div>
            <div className="bg-white rounded-2xl border border-sand p-5">
              <p className="font-sans text-xs uppercase tracking-widest text-slate mb-2">Shipping address</p>
              {addr ? (
                <p className="font-sans text-sm text-navy leading-relaxed">
                  {addr.line1}<br />{addr.city}, {addr.state} {addr.zip}
                </p>
              ) : (
                <p className="font-sans text-sm text-slate italic">Not set — add at checkout</p>
              )}
            </div>
            {profile?.monthly_total ? (
              <div className="bg-white rounded-2xl border border-sand p-5">
                <p className="font-sans text-xs uppercase tracking-widest text-slate mb-2">Monthly total</p>
                <p className="font-serif text-2xl font-bold text-navy">{formatCentsPerMonth(profile.monthly_total)}</p>
              </div>
            ) : null}
            <div className="bg-white rounded-2xl border border-sand p-5">
              <p className="font-sans text-xs uppercase tracking-widest text-slate mb-2">Deposit</p>
              <p className="font-sans text-sm text-navy capitalize">
                {profile?.deposit_status === 'held'
                  ? `✓ ${formatCents(profile.deposit_amount ?? 7500)} held`
                  : profile?.deposit_status ?? 'None'}
              </p>
            </div>
          </div>

          {/* Active Rentals — client component handles fetch + return/buyout actions */}
          <h2 className="font-sans font-semibold text-navy mb-4 text-sm uppercase tracking-wide">Active Rentals</h2>
          <ActiveRentals />

          {/* Past Orders */}
          {orders.length > 0 && (
            <>
              <h2 className="font-sans font-semibold text-navy mb-4 mt-10 text-sm uppercase tracking-wide">Past Orders</h2>
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-sand p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-mono text-xs text-slate/50 mb-0.5">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="font-sans text-xs text-slate/50">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLOR[order.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    {(order.rentals ?? []).length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {order.rentals.map((rental: any) => (
                          <div key={rental.id} className="flex justify-between text-sm font-sans text-slate">
                            <span>{rental.pieces?.brand} {rental.pieces?.name}</span>
                            <span className="text-slate/60">{formatCentsPerMonth(rental.rental_fee_cents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-sans font-semibold text-navy pt-3 border-t border-sand">
                      <span>Charged</span>
                      <span>{formatCents(order.total_charged)}</span>
                    </div>
                    {(() => {
                      const daysSince = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000)
                      const canRefund = daysSince <= 30 && !['refunded', 'refund_requested', 'cancelled'].includes(order.status)
                      return canRefund ? <RefundButton orderId={order.id} /> : null
                    })()}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
