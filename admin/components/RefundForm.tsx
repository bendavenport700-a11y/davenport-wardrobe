'use client'

import { useState } from 'react'
import { refundOrder } from '@/lib/actions'

export function RefundForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-green-700 font-medium text-sm">Refund issued successfully.</p>
        <p className="text-green-600 text-xs mt-0.5">The customer will receive their money within 5–10 business days.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Refund This Order
      </button>
    )
  }

  async function handleRefund() {
    if (!reason.trim()) { setError('Please enter a reason.'); return }
    setLoading(true)
    setError(null)
    const result = await refundOrder(orderId, reason.trim())
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
  }

  return (
    <div className="border-2 border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-red-700">Confirm Refund</p>
      <p className="text-xs text-gray-500">
        This will refund the first-month charge, cancel the deposit hold, free up the pieces, and mark the order refunded. This cannot be undone.
      </p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason (e.g. item out of stock, unable to source)"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleRefund}
          disabled={loading}
          className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Refunding…' : 'Yes, Refund Order'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null) }}
          disabled={loading}
          className="px-4 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
