import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { markRentalReturned } from '@/lib/actions'

type RentalRow = {
  id: string
  status: string
  size: string
  rental_fee_cents: number
  tracking_number: string | null
  carrier: string | null
  shipped_at: string | null
  delivered_at: string | null
  returned_at: string | null
  created_at: string
  billing_active: boolean
  min_rental_days: number
  piece: { name: string; brand: string; images: string[] } | null
  profile: { full_name: string | null; email: string } | null
  order_id: string | null
}

async function getRentals(filter: string) {
  noStore()

  // First fetch rentals with piece + profile
  let q = supabaseAdmin
    .from('rentals')
    .select('*, piece:pieces(name, brand, images), profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(300)

  if (filter === 'active') {
    q = q.not('status', 'in', '(returned,pending,sourcing,packaged,bought_out)')
  } else if (filter === 'returned') {
    q = q.eq('status', 'returned')
  } else if (filter === 'return_requested') {
    q = q.eq('status', 'return_requested')
  } else if (filter === 'bought_out') {
    q = q.eq('status', 'bought_out')
  }

  const { data: rentals } = await q
  if (!rentals?.length) return []

  // Attach order_id by looking up orders that contain each rental
  const rentalIds = rentals.map(r => r.id)
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, rental_ids')
    .overlaps('rental_ids', rentalIds)

  const rentalToOrder: Record<string, string> = {}
  for (const o of orders ?? []) {
    for (const rid of o.rental_ids ?? []) {
      rentalToOrder[rid] = o.id
    }
  }

  return rentals.map(r => ({ ...r, order_id: rentalToOrder[r.id] ?? null })) as RentalRow[]
}

const FILTERS = [
  { value: 'active',           label: 'Currently Out' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned',         label: 'Returned' },
  { value: 'bought_out',       label: 'Bought Out' },
  { value: '',                 label: 'All' },
]

const STATUS_STYLES: Record<string, string> = {
  pending:          'bg-gray-100 text-gray-500',
  sourcing:         'bg-orange-100 text-orange-700',
  packaged:         'bg-indigo-100 text-indigo-700',
  shipped:          'bg-blue-100 text-blue-700',
  delivered:        'bg-green-100 text-green-700',
  return_requested: 'bg-amber-100 text-amber-700',
  returned:         'bg-gray-100 text-gray-400',
  bought_out:       'bg-purple-100 text-purple-700',
}

function daysSince(dateStr: string | null) {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function daysOut(dateStr: string | null) {
  if (!dateStr) return '—'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export default async function RentalsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams.filter ?? 'active'
  const rentals = await getRentals(filter)

  const keeping  = rentals.filter(r => r.status === 'delivered')
  const returning = rentals.filter(r => r.status === 'return_requested')
  const returned = rentals.filter(r => r.status === 'returned')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Rentals</h1>
        <p className="text-gray-500 text-sm mt-1">What is out, coming back, and returned.</p>
      </div>

      {/* Summary chips — active view */}
      {filter === 'active' && (
        <div className="flex gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[110px]">
            <p className="text-2xl font-bold text-navy">{keeping.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">With customer</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[110px]">
            <p className="text-2xl font-bold text-amber-600">{returning.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Returning</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTERS.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/rentals?filter=${f.value}` : '/rentals'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold">Piece</th>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Time out</th>
              <th className="text-right px-4 py-3 font-semibold">Rate</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map(rental => (
              <tr key={rental.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {rental.piece?.images?.[0]
                      ? <img src={rental.piece.images[0]} alt="" className="w-8 h-10 object-cover rounded-md flex-shrink-0" />
                      : <div className="w-8 h-10 bg-navy/10 rounded-md flex-shrink-0" />}
                    <div>
                      <p className="text-navy font-medium text-xs leading-tight">{rental.piece?.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{rental.piece?.brand} · Size {rental.size}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-navy text-xs font-medium">{rental.profile?.full_name ?? '—'}</p>
                  <p className="text-gray-400 text-xs">{rental.profile?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[rental.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {rental.status.replace(/_/g, ' ')}
                  </span>
                  {rental.status === 'shipped' && rental.tracking_number && (
                    <p className="text-gray-400 text-[11px] font-mono mt-1">{rental.carrier} {rental.tracking_number}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {rental.delivered_at
                    ? daysOut(rental.delivered_at)
                    : rental.shipped_at
                      ? `Shipped ${daysSince(rental.shipped_at)}`
                      : rental.returned_at
                        ? `Returned ${daysSince(rental.returned_at)}`
                        : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs font-mono whitespace-nowrap">
                  ${(rental.rental_fee_cents / 100).toFixed(2)}/mo
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {/* Link to order */}
                    {rental.order_id && (
                      <Link
                        href={`/orders/${rental.order_id}`}
                        className="text-xs text-navy/60 hover:text-navy border border-navy/15 hover:border-navy/30 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
                      >
                        View order
                      </Link>
                    )}

                    {/* Mark returned — inline action */}
                    {(rental.status === 'return_requested' || rental.status === 'delivered') && rental.order_id && (
                      <form>
                        <button
                          formAction={async () => {
                            'use server'
                            await markRentalReturned(rental.order_id!, rental.id)
                          }}
                          className="text-xs text-white bg-navy hover:bg-navy/85 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
                        >
                          Mark returned
                        </button>
                      </form>
                    )}

                    {rental.status === 'returned' && rental.returned_at && (
                      <span className="text-xs text-gray-400">{daysSince(rental.returned_at)}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rentals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No rentals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 bg-gray-50">
          {rentals.length} rental{rentals.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
