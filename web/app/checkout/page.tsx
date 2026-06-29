'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StripeProvider } from '@/components/StripeProvider'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useCart } from '@/context/CartContext'
import { formatCents, formatCentsPerMonth } from '@/lib/format'
import { calcOrderTotals, HANDLING_FEE_CENTS, DEPOSIT_CENTS } from '@/lib/pricing'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const FN_BASE = SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co')

interface Profile {
  full_name: string | null
  shipping_address: { line1: string; line2?: string; city: string; state: string; zip: string } | null
  stripe_payment_method_id: string | null
  deposit_status: string
}

function CheckoutForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { items, clearCart } = useCart()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Address form state
  const [line1, setLine1]   = useState('')
  const [line2, setLine2]   = useState('')
  const [city, setCity]     = useState('')
  const [state, setState]   = useState('')
  const [zip, setZip]       = useState('')

  useEffect(() => {
    if (items.length === 0) { router.replace('/cart'); return }

    const supabase = createSupabaseBrowser()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace(`/login?next=/checkout`); return }
      setAccessToken(session.access_token)

      const { data } = await supabase
        .from('profiles')
        .select('full_name, shipping_address, stripe_payment_method_id, deposit_status')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfile(data)
        const addr = data.shipping_address as Profile['shipping_address']
        if (addr) {
          setLine1(addr.line1 ?? '')
          setLine2(addr.line2 ?? '')
          setCity(addr.city ?? '')
          setState(addr.state ?? '')
          setZip(addr.zip ?? '')
        }
      }
      setLoading(false)
    })
  }, [items, router])

  const { monthlyTotal, chargeToday, discount, rawMonthly } = calcOrderTotals(items)
  const hasPaymentMethod = !!profile?.stripe_payment_method_id
  const needsAddress = !profile?.shipping_address

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !accessToken) return
    setError('')
    setSubmitting(true)

    try {
      const supabase = createSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired — please sign in again.')

      // 1. Save shipping address if not already set
      if (needsAddress || line1) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            shipping_address: { line1, line2: line2 || undefined, city, state: state.toUpperCase(), zip },
            full_name: profile?.full_name || undefined,
          })
          .eq('id', session.user.id)
        if (profileErr) throw new Error('Failed to save address.')
      }

      const orderItems = items.map(i => ({
        piece_id: i.piece_id,
        size: i.size,
        rental_fee_cents: i.rental_fee_cents,
        wear_count_at_rental: i.wear_count_at_rental,
        buyout_price_snapshot: i.buyout_price_snapshot,
      }))

      let orderId: string

      if (hasPaymentMethod) {
        // Path B — returning customer
        const idempotency_key = crypto.randomUUID()
        const res = await fetch(`${FN_BASE}/v1/confirm-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ items: orderItems, idempotency_key }),
        })
        const json = await res.json()
        if (!res.ok || json.error) throw new Error(json.error ?? 'Order failed.')
        orderId = json.order_id
      } else {
        // Path A — new customer: create setup intent, confirm card, then confirm order
        const siRes = await fetch(`${FN_BASE}/v1/create-setup-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        })
        const siJson = await siRes.json()
        if (!siRes.ok || siJson.error) throw new Error(siJson.error ?? 'Card setup failed.')

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) throw new Error('Card element not ready.')

        const { error: stripeErr } = await stripe.confirmCardSetup(siJson.client_secret, {
          payment_method: { card: cardElement },
        })
        if (stripeErr) throw new Error(stripeErr.message ?? 'Card setup failed.')

        const orderRes = await fetch(`${FN_BASE}/v1/confirm-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ setup_intent_id: siJson.setup_intent_id, items: orderItems }),
        })
        const orderJson = await orderRes.json()
        if (!orderRes.ok || orderJson.error) throw new Error(orderJson.error ?? 'Order failed.')
        orderId = orderJson.order_id
      }

      clearCart()
      router.push(`/checkout/confirmation?order_id=${orderId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (msg === 'PIECE_UNAVAILABLE' || msg === 'SIZE_UNAVAILABLE') {
        setError('One or more pieces in your suitcase are no longer available in the selected size. Please update your suitcase and try again.')
      } else {
        setError(msg)
      }
      setSubmitting(false)
    }
  }

  const INPUT = 'w-full border border-sand rounded-xl px-4 py-3 text-sm font-sans text-navy bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 placeholder:text-slate/40'
  const LABEL = 'block text-xs font-sans font-semibold text-slate uppercase tracking-wide mb-1.5'

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <p className="font-sans text-slate">Loading…</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="font-serif text-3xl font-bold text-navy mb-10">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
            {/* Left: address + card */}
            <div className="space-y-8">
              {/* Shipping address */}
              <div className="bg-white rounded-2xl border border-sand p-6">
                <h2 className="font-sans font-semibold text-navy mb-5">Shipping address</h2>
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Street address</label>
                    <input required value={line1} onChange={e => setLine1(e.target.value)} placeholder="123 Main St" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Apt / suite <span className="normal-case font-normal text-slate/60">(optional)</span></label>
                    <input value={line2} onChange={e => setLine2(e.target.value)} placeholder="Apt 2B" className={INPUT} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className={LABEL}>City</label>
                      <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Greenwich" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>State</label>
                      <input required maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} placeholder="CT" className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>ZIP</label>
                    <input required value={zip} onChange={e => setZip(e.target.value)} placeholder="06830" className={INPUT} style={{ maxWidth: 160 }} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-sand p-6">
                <h2 className="font-sans font-semibold text-navy mb-5">Payment</h2>
                {hasPaymentMethod ? (
                  <div className="flex items-center gap-3 bg-sand/40 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 text-navy/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <span className="font-sans text-sm text-navy">Card on file — you will be charged {formatCents(chargeToday)} today</span>
                  </div>
                ) : (
                  <div>
                    <label className={LABEL}>Card details</label>
                    <div className="border border-sand rounded-xl px-4 py-3.5 bg-white">
                      <CardElement options={{
                        style: {
                          base: {
                            fontSize: '14px',
                            color: '#1B2A4A',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            '::placeholder': { color: '#9CA3AF' },
                          },
                        },
                        hidePostalCode: true,
                      }} />
                    </div>
                    <p className="font-sans text-xs text-slate/60 mt-2">Your card is saved securely via Stripe. We never store card numbers.</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>

            {/* Right: order summary */}
            <div>
              <div className="bg-white rounded-2xl border border-sand p-6 sticky top-24">
                <h2 className="font-sans font-semibold text-navy mb-4 text-sm uppercase tracking-wide">Order summary</h2>

                <div className="space-y-3 mb-5">
                  {items.map(item => (
                    <div key={`${item.piece_id}-${item.size}`} className="flex justify-between text-sm font-sans text-slate gap-2">
                      <span className="truncate">{item.piece.brand} {item.piece.name} · {item.size}</span>
                      <span className="shrink-0">{formatCentsPerMonth(item.rental_fee_cents)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm font-sans border-t border-sand pt-4">
                  {discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>{Math.round(discount * 100)}% bundle discount</span>
                      <span>−{formatCents(rawMonthly - monthlyTotal)}/mo</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate">
                    <span>Monthly</span>
                    <span className="font-semibold text-navy">{formatCentsPerMonth(monthlyTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate">
                    <span>Handling</span>
                    <span>{formatCents(HANDLING_FEE_CENTS)}</span>
                  </div>
                  <div className="flex justify-between text-slate">
                    <span>Deposit (hold)</span>
                    <span>{formatCents(DEPOSIT_CENTS)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-navy text-base pt-2 border-t border-sand">
                    <span>Charged today</span>
                    <span>{formatCents(chargeToday)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !stripe}
                  className="w-full mt-6 bg-navy text-cream font-sans font-semibold py-4 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60 text-sm"
                >
                  {submitting ? 'Placing order…' : `Place order · ${formatCents(chargeToday)}`}
                </button>

                <p className="font-sans text-xs text-slate/60 text-center mt-3 leading-relaxed">
                  By placing your order you agree to the <a href="/rental-terms" target="_blank" className="underline">Rental Terms</a>.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <StripeProvider>
      <CheckoutForm />
    </StripeProvider>
  )
}
