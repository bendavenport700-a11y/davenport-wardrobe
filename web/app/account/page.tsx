import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { formatCents, formatCentsPerMonth } from '@/lib/format'

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
    supabase.from('profiles').select('full_name, email, shipping_address, monthly_total, deposit_status').eq('id', user.id).single(),
    supabase.from('orders').select('id, status, created_at, first_month_total, total_charged, rentals(id, status, rental_fee_cents, piece_id, pieces(name, brand))').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const profile = profileRes.data
  const orders = (ordersRes.data ?? []) as any[]

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
              <p className="font-sans text-sm text-navy capitalize">{profile?.deposit_status === 'held' ? '✓ $75 held' : profile?.deposit_status ?? 'None'}</p>
            </div>
          </div>

          {/* Orders */}
          <h2 className="font-sans font-semibold text-navy mb-5 text-sm uppercase tracking-wide">Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sand p-10 text-center">
              <p className="font-sans text-slate mb-4">No orders yet.</p>
              <Link href="/browse" className="inline-block bg-navy text-cream font-sans font-semibold px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors text-sm">
                Browse pieces →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-2xl border border-sand p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-mono text-xs text-slate mb-1">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="font-sans text-xs text-slate/60">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLOR[order.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  {(order.rentals ?? []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {order.rentals.map((rental: any) => (
                        <div key={rental.id} className="flex justify-between text-sm font-sans text-slate">
                          <span>{rental.pieces?.brand} {rental.pieces?.name}</span>
                          <span>{formatCentsPerMonth(rental.rental_fee_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-sans font-semibold text-navy pt-3 border-t border-sand">
                    <span>Charged</span>
                    <span>{formatCents(order.total_charged)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="font-sans text-xs text-slate/60 text-center mt-10">
            To return a piece, email{' '}
            <a href="mailto:returns@davenport.rentals" className="text-navy hover:underline">returns@davenport.rentals</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
