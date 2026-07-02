import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderStatusBadge } from '@/components/StatusBadge'

async function getStats() {
  noStore()
  const [pieces, orders, rentals, profiles] = await Promise.all([
    supabaseAdmin.from('pieces').select('id, is_available, is_draft'),
    supabaseAdmin.from('orders').select('id, status, total_charged'),
    supabaseAdmin.from('rentals').select('id, status'),
    supabaseAdmin.from('profiles').select('id').gt('active_rental_count', 0),
  ])

  const TERMINAL = ['returned', 'cancelled', 'bought_out', 'complete', 'refunded']

  const totalPieces    = (pieces.data ?? []).filter(p => !p.is_draft).length
  const availPieces    = (pieces.data ?? []).filter(p => p.is_available && !p.is_draft).length
  const pendingOrders  = (orders.data ?? []).filter(o => ['pending', 'confirmed', 'sourcing', 'packaged'].includes(o.status)).length
  const shippedOrders  = (orders.data ?? []).filter(o => o.status === 'shipped').length
  const activeRentals  = (rentals.data ?? []).filter(r => !TERMINAL.includes(r.status)).length
  const pendingReturns = (rentals.data ?? []).filter(r => r.status === 'return_requested').length
  const activeCustomers = (profiles.data ?? []).length

  const mrr = (rentals.data ?? [])
    .filter(r => r.status === 'delivered')
    .reduce((sum: number, r: any) => sum + (r.rental_fee_cents ?? 0), 0)

  return { totalPieces, availPieces, pendingOrders, shippedOrders, activeRentals, pendingReturns, activeCustomers, mrr }
}

async function getRecentOrders() {
  noStore()
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_charged, created_at, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

async function getNewInventoryCount() {
  noStore()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('pieces')
    .select('id', { count: 'exact', head: true })
    .eq('is_draft', false)
    .gte('created_at', since)
    .is('announced_at', null)
  return count ?? 0
}

function StatCard({
  label, value, sub, href, urgent,
}: {
  label: string; value: string | number; sub?: string; href: string; urgent?: boolean
}) {
  return (
    <Link href={href} className={`block bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all group ${
      urgent && Number(value) > 0 ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'
    }`}>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 group-hover:text-navy/60 transition-colors">{label}</p>
      <p className={`text-2xl font-bold mt-2 tracking-tight ${urgent && Number(value) > 0 ? 'text-amber-600' : 'text-navy'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  )
}

export default async function DashboardPage() {
  const [stats, recentOrders, unpostedCount] = await Promise.all([
    getStats(), getRecentOrders(), getNewInventoryCount(),
  ])

  const needsAttention = stats.pendingOrders > 0 || stats.pendingReturns > 0 || unpostedCount > 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <Link href="/pieces/new" className="text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors">
          + Add Piece
        </Link>
      </div>

      {/* Needs attention banner */}
      {needsAttention && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Needs attention</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {stats.pendingOrders > 0 && (
              <Link href="/orders?status=pending" className="text-sm text-amber-700 hover:text-amber-900 hover:underline">
                {stats.pendingOrders} order{stats.pendingOrders !== 1 ? 's' : ''} to fulfill →
              </Link>
            )}
            {stats.pendingReturns > 0 && (
              <Link href="/rentals?filter=return_requested" className="text-sm text-amber-700 hover:text-amber-900 hover:underline">
                {stats.pendingReturns} return{stats.pendingReturns !== 1 ? 's' : ''} requested →
              </Link>
            )}
            {unpostedCount > 0 && (
              <Link href="/content" className="text-sm text-amber-700 hover:text-amber-900 hover:underline">
                {unpostedCount} new piece{unpostedCount !== 1 ? 's' : ''} not yet posted →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats — all clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          sub="Click to fulfill"
          href="/orders?status=pending"
          urgent
        />
        <StatCard
          label="Pieces Out"
          value={stats.activeRentals}
          sub={`${stats.pendingReturns} returning`}
          href="/rentals?filter=active"
        />
        <StatCard
          label="Available Pieces"
          value={stats.availPieces}
          sub={`of ${stats.totalPieces} total`}
          href="/pieces"
        />
        <StatCard
          label="Active Customers"
          value={stats.activeCustomers}
          sub="Currently renting"
          href="/rentals?filter=active"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Shipped"
          value={stats.shippedOrders}
          sub="In transit"
          href="/orders?status=shipped"
        />
        <StatCard
          label="Returns Requested"
          value={stats.pendingReturns}
          sub="Send label ASAP"
          href="/rentals?filter=return_requested"
          urgent
        />
        <StatCard
          label="To Post"
          value={unpostedCount}
          sub="New pieces, not announced"
          href="/content"
          urgent
        />
        <StatCard
          label="Content Studio"
          value="→"
          sub="Generate scripts & prompts"
          href="/content"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-navy/60 hover:text-navy">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-semibold">Order</th>
              <th className="text-left px-5 py-3 font-semibold">Customer</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Total</th>
              <th className="text-left px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order: any) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/orders/${order.id}`} className="text-navy font-mono text-xs hover:underline font-semibold">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs font-medium text-navy">{order.profile?.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{order.profile?.email ?? ''}</p>
                </td>
                <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                <td className="px-5 py-3 text-gray-700 text-xs">${((order.total_charged ?? 0) / 100).toFixed(2)}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/orders/${order.id}`} className="text-xs text-navy/60 hover:text-navy font-medium">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
