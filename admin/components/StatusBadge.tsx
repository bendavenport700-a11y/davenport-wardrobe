const ORDER_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  confirmed:        'bg-blue-100 text-blue-800',
  sourcing:         'bg-orange-100 text-orange-800',
  packaged:         'bg-indigo-100 text-indigo-800',
  shipped:          'bg-purple-100 text-purple-800',
  delivered:        'bg-green-100 text-green-800',
  complete:         'bg-gray-100 text-gray-600',
  refund_requested: 'bg-red-100 text-red-700',
  refunded:         'bg-gray-100 text-gray-500',
}

const RENTAL_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  sourcing:         'bg-orange-100 text-orange-800',
  shipped:          'bg-purple-100 text-purple-800',
  delivered:        'bg-green-100 text-green-800',
  return_requested: 'bg-red-100 text-red-700',
  returned:         'bg-gray-100 text-gray-600',
  bought_out:       'bg-emerald-100 text-emerald-800',
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide capitalize ${ORDER_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function RentalStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${RENTAL_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function ConditionBadge({ condition }: { condition: string }) {
  const colors = { new: 'bg-green-100 text-green-800', like_new: 'bg-emerald-100 text-emerald-700', good: 'bg-blue-100 text-blue-700' }
  const labels: Record<string, string> = { new: 'Pristine', like_new: 'Excellent', good: 'Well-Worn / Veteran' }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${colors[condition as keyof typeof colors] ?? 'bg-gray-100'}`}>
      {labels[condition] ?? condition.replace('_', ' ')}
    </span>
  )
}
