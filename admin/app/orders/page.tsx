import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderStatusBadge } from '@/components/StatusBadge'
import type { Order } from '@/lib/types'

type OrderWithProfile = Order & { profile?: { email: string; full_name: string | null } }

async function getOrders(status?: string) {
  noStore()
  let q = supabaseAdmin
    .from('orders')
    .select('*, profile:profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) q = q.eq('status', status)
  const { data } = await q
  return (data ?? []) as OrderWithProfile[]
}

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'sourcing', 'shipped', 'delivered', 'complete']
const STATUS_LABELS: Record<string, string> = {
  '': 'All', pending: 'Pending', confirmed: 'Confirmed', sourcing: 'Sourcing',
  shipped: 'Shipped', delivered: 'Delivered', complete: 'Complete',
}

export default async function OrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? ''
  const orders = await getOrders(status || undefined)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Orders</h1>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {STATUS_FILTERS.map(s => (
          <Link
            key={s}
            href={s ? `/orders?status=${s}` : '/orders'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === s ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Items</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="font-mono text-xs text-navy hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="text-navy font-medium text-xs">{order.profile?.full_name ?? '—'}</p>
                  <p className="text-gray-400 text-xs">{order.profile?.email ?? order.user_id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-gray-600">{order.rental_ids.length}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">${(order.total_charged / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="text-navy/60 hover:text-navy text-xs font-medium">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No orders found</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}
