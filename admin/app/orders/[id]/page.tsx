import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderStatusBadge, RentalStatusBadge } from '@/components/StatusBadge'
import { updateOrderStatus, updateOrderNotes, updateRentalTracking } from '@/lib/actions'
import type { Order, Rental } from '@/lib/types'

type FullOrder = Order & {
  profile?: { email: string; full_name: string | null; phone: string | null }
  rentals: (Rental & { piece?: { name: string; brand: string; images: string[] } })[]
}

async function getOrder(id: string): Promise<FullOrder | null> {
  noStore()
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, profile:profiles(email, full_name, phone)')
    .eq('id', id)
    .single()
  if (!order) return null

  // rentals table has no order_id FK — fetch by rental_ids[] array
  const rentalIds: string[] = order.rental_ids ?? []
  const { data: rentals } = rentalIds.length
    ? await supabaseAdmin.from('rentals').select('*, piece:pieces(name, brand, images)').in('id', rentalIds)
    : { data: [] }

  return { ...order, rentals: rentals ?? [] } as FullOrder
}

const ORDER_STATUSES = ['pending', 'confirmed', 'sourcing', 'shipped', 'delivered', 'complete']
const RENTAL_STATUSES = ['pending', 'sourcing', 'shipped', 'delivered', 'return_requested', 'returned']
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL']

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const addr = order.shipping_address

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <a href="/orders" className="text-sm text-gray-500 hover:text-navy">← Orders</a>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-navy">#{order.id.slice(0, 8).toUpperCase()}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-gray-500 text-sm mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Customer</p>
          <p className="font-medium text-navy">{order.profile?.full_name ?? '—'}</p>
          <p className="text-gray-500 text-sm">{order.profile?.email}</p>
          {order.profile?.phone && <p className="text-gray-500 text-sm">{order.profile.phone}</p>}
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Ships to</p>
          <p className="text-navy text-sm">{addr.line1}</p>
          {addr.line2 && <p className="text-navy text-sm">{addr.line2}</p>}
          <p className="text-navy text-sm">{addr.city}, {addr.state} {addr.zip}</p>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Payment</p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">First month</span><span>${(order.first_month_total / 100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Handling</span><span>${(order.handling_fee_cents / 100).toFixed(2)}</span></div>
            {order.deposit_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Deposit held</span><span>${(order.deposit_amount / 100).toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total charged</span><span>${(order.total_charged / 100).toFixed(2)}</span></div>
          </div>
        </div>

        {/* Update status */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Update Order Status</p>
          <form className="flex gap-2">
            <select name="status" defaultValue={order.status}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              formAction={async (fd: FormData) => {
                'use server'
                await updateOrderStatus(order.id, fd.get('status') as string)
              }}
              className="bg-navy text-white text-xs px-3 py-1.5 rounded-lg hover:bg-navy/90 transition-colors"
            >
              Save
            </button>
          </form>
          <form className="mt-3">
            <textarea name="notes" defaultValue={order.notes ?? ''} rows={2}
              placeholder="Internal notes…"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
            <button
              formAction={async (fd: FormData) => {
                'use server'
                await updateOrderNotes(order.id, fd.get('notes') as string)
              }}
              className="mt-1.5 text-xs text-navy/60 hover:text-navy transition-colors"
            >
              Save notes
            </button>
          </form>
        </div>
      </div>

      {/* Rental items */}
      <div className="bg-white rounded-xl border border-gray-100">
        <p className="px-4 py-3 border-b border-gray-100 font-semibold text-navy text-sm">
          Items ({order.rentals.length})
        </p>
        <div className="divide-y divide-gray-50">
          {order.rentals.map(rental => (
            <div key={rental.id} className="px-4 py-4">
              <div className="flex items-start gap-3 mb-3">
                {rental.piece?.images?.[0]
                  ? <img src={rental.piece.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                  : <div className="w-10 h-12 bg-navy/10 rounded" />
                }
                <div className="flex-1">
                  <p className="font-medium text-navy text-sm">{rental.piece?.name}</p>
                  <p className="text-gray-500 text-xs">{rental.piece?.brand} · Size {rental.size}</p>
                  <p className="text-gray-500 text-xs">${(rental.rental_fee_cents / 100).toFixed(0)}/mo</p>
                </div>
                <RentalStatusBadge status={rental.status} />
              </div>

              <form className="flex flex-wrap gap-2 items-center">
                <select name="status" defaultValue={rental.status}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30">
                  {RENTAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input name="carrier" defaultValue={rental.carrier ?? ''} list="carriers-list"
                  placeholder="Carrier" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                <datalist id="carriers-list">{CARRIERS.map(c => <option key={c} value={c} />)}</datalist>
                <input name="tracking" defaultValue={rental.tracking_number ?? ''}
                  placeholder="Tracking #" className="border border-gray-200 rounded-lg px-2 py-1 text-xs flex-1 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-navy/30" />
                <button
                  formAction={async (fd: FormData) => {
                    'use server'
                    await updateRentalTracking(
                      rental.id,
                      fd.get('tracking') as string,
                      fd.get('carrier') as string,
                      fd.get('status') as string
                    )
                  }}
                  className="bg-navy text-white text-xs px-3 py-1 rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Update
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
