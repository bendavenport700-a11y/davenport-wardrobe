import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderStatusBadge, RentalStatusBadge } from '@/components/StatusBadge'
import {
  markOrderSourcing, markRentalPackaged, shipOrder,
  markOrderDelivered, markOrderComplete, markRentalReturned, updateOrderNotes,
} from '@/lib/actions'
import { RefundForm } from '@/components/RefundForm'
import { CopyButton } from '@/components/CopyButton'
import type { Order, Rental } from '@/lib/types'

type RentalPiece = { id: string; name: string; brand: string; images: string[]; source_url: string | null }
type FullOrder = Order & {
  profile?: { email: string; full_name: string | null; phone: string | null }
  rentals: (Rental & { piece?: RentalPiece })[]
}

async function getOrder(id: string): Promise<FullOrder | null> {
  noStore()
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, profile:profiles(email, full_name, phone)')
    .eq('id', id)
    .single()
  if (!order) return null

  const rentalIds: string[] = order.rental_ids ?? []
  const { data: rentals } = rentalIds.length
    ? await supabaseAdmin.from('rentals').select('*, piece:pieces(id, name, brand, images, source_url)').in('id', rentalIds)
    : { data: [] }

  return { ...order, rentals: rentals ?? [] } as FullOrder
}

const STEPS = ['confirmed', 'sourcing', 'packaged', 'shipped', 'delivered', 'complete'] as const
type Step = typeof STEPS[number]

function stepIndex(status: string) {
  const i = STEPS.indexOf(status as Step)
  return i === -1 ? 0 : i
}

function StepBar({ status }: { status: string }) {
  const current = stepIndex(status)
  const labels = ['Confirmed', 'Sourcing', 'Packaged', 'Shipped', 'Delivered', 'Complete']
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                done ? 'bg-navy border-navy text-white' :
                active ? 'bg-white border-navy text-navy' :
                'bg-white border-gray-200 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-navy' : done ? 'text-navy/60' : 'text-gray-400'}`}>
                {labels[i]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-navy' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const addr = order.shipping_address as { line1?: string; line2?: string; city?: string; state?: string; zip?: string }
  const addrText = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.zip}`].filter(Boolean).join('\n')
  const rentalIds = order.rentals.map(r => r.id)
  const isRefunded = order.status === 'refunded'
  const current = stepIndex(order.status)

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-5">
        <a href="/orders" className="text-sm text-gray-400 hover:text-navy">← Orders</a>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-navy">#{order.id.slice(0, 8).toUpperCase()}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-gray-400 text-sm mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
      </div>

      {/* Step progress */}
      {!isRefunded && <StepBar status={order.status} />}

      {/* Step action card */}
      {!isRefunded && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          {/* Confirmed: move to sourcing */}
          {order.status === 'confirmed' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Next step</p>
              <p className="text-navy font-semibold text-base mb-3">Source the item and prepare for shipment</p>
              <div className="space-y-2 mb-4">
                {order.rentals.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {r.piece?.images?.[0]
                      ? <img src={r.piece.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                      : <div className="w-10 h-12 bg-navy/10 rounded" />}
                    <div className="flex-1">
                      <p className="font-medium text-navy text-sm">{r.piece?.name}</p>
                      <p className="text-gray-500 text-xs">{r.piece?.brand} · Size {r.size}</p>
                    </div>
                    {r.piece?.source_url && (
                      <a href={r.piece.source_url} target="_blank" rel="noreferrer"
                        className="text-xs text-navy/60 hover:text-navy underline">
                        Source link
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <form>
                <button
                  formAction={async () => {
                    'use server'
                    await markOrderSourcing(order.id)
                  }}
                  className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Mark as Sourcing
                </button>
              </form>
            </div>
          )}

          {/* Sourcing: mark items as they arrive */}
          {order.status === 'sourcing' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sourcing</p>
              <p className="text-navy font-semibold text-base mb-1">Mark each piece as packaged when it arrives</p>
              <p className="text-gray-400 text-xs mb-4">Once every piece is packaged, you can create a shipping label and ship.</p>
              <div className="space-y-2">
                {order.rentals.map(r => {
                  const isPackaged = r.status === 'packaged'
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {r.piece?.images?.[0]
                        ? <img src={r.piece.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                        : <div className="w-10 h-12 bg-navy/10 rounded" />}
                      <div className="flex-1">
                        <p className="font-medium text-navy text-sm">{r.piece?.name}</p>
                        <p className="text-gray-500 text-xs">{r.piece?.brand} · Size {r.size}</p>
                      </div>
                      {isPackaged ? (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Packaged ✓</span>
                      ) : (
                        <form>
                          <button
                            formAction={async () => {
                              'use server'
                              await markRentalPackaged(order.id, r.id)
                            }}
                            className="text-xs font-medium text-navy border border-navy/20 hover:bg-navy hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Mark packaged
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {order.rentals.filter(r => r.status === 'packaged').length} of {order.rentals.length} piece{order.rentals.length !== 1 ? 's' : ''} packaged
                {order.rentals.every(r => r.status === 'packaged') ? ' — advancing to Packaged...' : ''}
              </p>
            </div>
          )}

          {/* Packaged: all items ready, create label and ship */}
          {order.status === 'packaged' && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">All items packaged</p>
              <p className="text-navy font-semibold text-base mb-4">Create a label and ship to customer</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Ship to</p>
                <p className="text-navy font-medium text-sm">{order.profile?.full_name}</p>
                <p className="text-gray-600 text-sm">{addr.line1}</p>
                {addr.line2 && <p className="text-gray-600 text-sm">{addr.line2}</p>}
                <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                <div className="flex gap-2 mt-3">
                  <CopyButton text={addrText} label="Copy address" />
                  <a href="https://www.usps.com/ship/click-n-ship.htm" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-navy hover:border-navy/30 transition-colors">
                    Open USPS
                  </a>
                  <a href="https://www.pirateship.com" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-navy hover:border-navy/30 transition-colors">
                    Open Pirateship
                  </a>
                </div>
              </div>

              <form className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                  <select name="carrier" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-gray-500 mb-1">Tracking number</label>
                  <input name="tracking" placeholder="e.g. 9400111899223397658239"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <button
                  formAction={async (fd: FormData) => {
                    'use server'
                    await shipOrder(order.id, rentalIds, fd.get('tracking') as string, fd.get('carrier') as string)
                  }}
                  className="bg-navy text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Mark as Shipped
                </button>
              </form>
            </div>
          )}

          {/* Shipped: waiting for delivery */}
          {order.status === 'shipped' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">In transit</p>
              <p className="text-navy font-semibold text-base mb-3">Package is on its way</p>
              {order.rentals.map(r => r.tracking_number && (
                <div key={r.id} className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                  <span className="text-gray-500">{r.carrier}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="font-mono text-navy">{r.tracking_number}</span>
                </div>
              ))}
              <form>
                <button
                  formAction={async () => {
                    'use server'
                    await markOrderDelivered(order.id, rentalIds)
                  }}
                  className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Mark as Delivered
                </button>
              </form>
            </div>
          )}

          {/* Delivered: complete or return */}
          {order.status === 'delivered' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Delivered</p>
              <p className="text-navy font-semibold text-base mb-4">Customer received the order</p>
              <div className="flex gap-3 flex-wrap">
                <form>
                  <button
                    formAction={async () => {
                      'use server'
                      await markOrderComplete(order.id)
                    }}
                    className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors"
                  >
                    Mark Complete
                  </button>
                </form>
              </div>

              {/* Return section */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Customer returning a piece?</p>
                <div className="space-y-2">
                  {order.rentals.filter(r => r.status !== 'returned').map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-navy">{r.piece?.name}</p>
                        <p className="text-xs text-gray-500">{r.piece?.brand} · Size {r.size}</p>
                      </div>
                      <form>
                        <button
                          formAction={async () => {
                            'use server'
                            await markRentalReturned(order.id, r.id)
                          }}
                          className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Mark returned
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Complete */}
          {order.status === 'complete' && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Complete</p>
              <p className="text-navy font-semibold text-base mb-3">Order fulfilled</p>

              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Customer returning a piece?</p>
                <div className="space-y-2">
                  {order.rentals.filter(r => r.status !== 'returned').map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-navy">{r.piece?.name}</p>
                        <p className="text-xs text-gray-500">{r.piece?.brand} · Size {r.size}</p>
                      </div>
                      <form>
                        <button
                          formAction={async () => {
                            'use server'
                            await markRentalReturned(order.id, r.id)
                          }}
                          className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Mark returned
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer + Address */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Customer</p>
          <p className="font-medium text-navy">{order.profile?.full_name ?? 'Unknown'}</p>
          <p className="text-gray-500 text-sm">{order.profile?.email}</p>
          {order.profile?.phone && <p className="text-gray-500 text-sm">{order.profile.phone}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Ships to</p>
          <p className="text-navy text-sm">{addr.line1}</p>
          {addr.line2 && <p className="text-navy text-sm">{addr.line2}</p>}
          <p className="text-navy text-sm">{addr.city}, {addr.state} {addr.zip}</p>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-3">Payment</p>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-gray-500">First month</span><span>${(order.first_month_total / 100).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Handling</span><span>${(order.handling_fee_cents / 100).toFixed(2)}</span></div>
          {order.deposit_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Deposit held</span><span>${(order.deposit_amount / 100).toFixed(2)}</span></div>}
          <div className="flex justify-between font-semibold border-t border-gray-100 pt-1.5 mt-1.5">
            <span>Charged today</span><span>${(order.total_charged / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 mb-4">
        <p className="px-4 py-3 border-b border-gray-100 font-semibold text-navy text-sm">
          Items ({order.rentals.length})
        </p>
        <div className="divide-y divide-gray-50">
          {order.rentals.map(rental => (
            <div key={rental.id} className="px-4 py-4 flex items-center gap-3">
              {rental.piece?.images?.[0]
                ? <img src={rental.piece.images[0]} alt="" className="w-10 h-12 object-cover rounded" />
                : <div className="w-10 h-12 bg-navy/10 rounded" />}
              <div className="flex-1">
                <p className="font-medium text-navy text-sm">{rental.piece?.name}</p>
                <p className="text-gray-500 text-xs">{rental.piece?.brand} · Size {rental.size} · ${(rental.rental_fee_cents / 100).toFixed(0)}/mo</p>
                {rental.tracking_number && (
                  <p className="text-xs text-gray-400 mt-0.5">{rental.carrier} {rental.tracking_number}</p>
                )}
              </div>
              <RentalStatusBadge status={rental.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Notes</p>
        <form>
          <textarea name="notes" defaultValue={order.notes ?? ''} rows={3}
            placeholder="Internal notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
          <button
            formAction={async (fd: FormData) => {
              'use server'
              await updateOrderNotes(order.id, fd.get('notes') as string)
            }}
            className="mt-2 text-xs text-navy/60 hover:text-navy transition-colors"
          >
            Save notes
          </button>
        </form>
      </div>

      {/* Refund */}
      {!isRefunded && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <RefundForm orderId={order.id} />
        </div>
      )}
    </div>
  )
}
