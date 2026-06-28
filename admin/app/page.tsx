import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderStatusBadge } from '@/components/StatusBadge'

async function getStats() {
  noStore()
  const [pieces, orders, rentals] = await Promise.all([
    supabaseAdmin.from('pieces').select('id, is_available, is_draft'),
    supabaseAdmin.from('orders').select('id, status'),
    supabaseAdmin.from('rentals').select('id, status'),
  ])

  const TERMINAL_STATUSES = ['returned', 'cancelled', 'bought_out']

  const totalPieces     = (pieces.data ?? []).filter(p => !p.is_draft).length
  const availPieces     = (pieces.data ?? []).filter(p => p.is_available && !p.is_draft).length
  const pendingOrders   = (orders.data ?? []).filter(o => ['confirmed', 'sourcing', 'packaged'].includes(o.status)).length
  const activeRentals   = (rentals.data ?? []).filter(r => !TERMINAL_STATUSES.includes(r.status)).length
  const pendingReturns  = (rentals.data ?? []).filter(r => r.status === 'return_requested').length

  return { totalPieces, availPieces, pendingOrders, activeRentals, pendingReturns }
}

async function getRecentOrders() {
  noStore()
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_charged, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-navy mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Orders" value={stats.pendingOrders} sub="Needs attention" />
        <StatCard label="Active Rentals" value={stats.activeRentals} sub="Pieces with customers" />
        <StatCard label="Available Pieces" value={stats.availPieces} sub={`of ${stats.totalPieces} total`} />
        <StatCard label="Pending Returns" value={stats.pendingReturns} sub="Awaiting receipt" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Recent Orders</h2>
          <a href="/orders" className="text-sm text-navy/60 hover:text-navy">View all →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-semibold">Order ID</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Total</th>
              <th className="text-left px-5 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <a href={`/orders/${order.id}`} className="text-navy font-mono text-xs hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </a>
                </td>
                <td className="px-5 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-gray-700">${((order.total_charged ?? 0) / 100).toFixed(2)}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
