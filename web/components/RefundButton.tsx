'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const FN_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.supabase.co', '.functions.supabase.co')

export function RefundButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleRefund() {
    if (!confirm('Request a refund for this order? Our team reviews requests within 3–5 business days and will email you the outcome.')) return
    setState('loading')
    try {
      const supabase = createSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const res = await fetch(`${FN_BASE}/v1/request-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ order_id: orderId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Request failed')
      setState('done')
    } catch (e: any) {
      setErrMsg(e.message ?? 'Something went wrong. Email support@davenport.rentals.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p className="font-sans text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
        Refund request received — we'll respond within 3–5 business days.
      </p>
    )
  }

  if (state === 'error') {
    return (
      <p className="font-sans text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
        {errMsg}
      </p>
    )
  }

  return (
    <button
      onClick={handleRefund}
      disabled={state === 'loading'}
      className="font-sans text-xs text-slate hover:text-red-600 transition-colors disabled:opacity-60"
    >
      {state === 'loading' ? 'Requesting…' : 'Request refund'}
    </button>
  )
}
