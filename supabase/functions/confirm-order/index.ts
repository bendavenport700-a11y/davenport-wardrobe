import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { multiPieceDiscount } from '../_shared/pricing.ts'

const DEPOSIT_CENTS  = parseInt(Deno.env.get('DEPOSIT_AMOUNT_CENTS') ?? '7500')
const HANDLING_CENTS = parseInt(Deno.env.get('HANDLING_FEE_CENTS')   ?? '1400')
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'support@davenport.rentals'
const ADMIN_PANEL_URL = Deno.env.get('ADMIN_PANEL_URL') ?? 'http://localhost:3001'

interface OrderItem {
  piece_id: string
  size: string
  rental_fee_cents: number
  wear_count_at_rental: number
  buyout_price_snapshot: number
  prefer_worn?: boolean
}

// Fire-and-forget admin notification — fires after DB commit so the admin knows about new orders
async function sendAdminNotification(p: {
  customerName: string; customerEmail: string; customerPhone: string | null
  orderId: string; itemLines: string
  chargeToday: string; monthlyTotal: string
  address: { line1?: string; line2?: string; city?: string; state?: string; zip?: string } | null
}) {
  if (!RESEND_API_KEY) return
  const addr = p.address
  const addrHtml = addr
    ? [addr.line1, addr.line2, `${addr.city ?? ''}, ${addr.state ?? ''} ${addr.zip ?? ''}`]
        .filter(Boolean).join('<br>')
    : 'No address on file'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New order — ${p.customerName || p.customerEmail} — ${p.chargeToday}`,
      html: `<h2 style="font-family:sans-serif">New Davenport Order</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
<tr><td style="padding:4px 12px 4px 0;color:#666">Order ID</td><td><code>${p.orderId}</code></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Customer</td><td>${p.customerName || '—'}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${p.customerEmail}</td></tr>
${p.customerPhone ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td>${p.customerPhone}</td></tr>` : ''}
<tr><td style="padding:4px 12px 4px 0;color:#666">Ships to</td><td>${addrHtml}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Items</td><td><pre style="margin:0">${p.itemLines}</pre></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Charged today</td><td><strong>${p.chargeToday}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666">Monthly</td><td>${p.monthlyTotal}/mo</td></tr>
</table>
<p style="font-family:sans-serif;margin-top:20px;color:#666;font-size:13px">
  <a href="${ADMIN_PANEL_URL}/orders/${p.orderId}">Open order in admin →</a>
</p>`,
    }),
  })
}

// Fire-and-forget confirmation email via Resend — called after DB commit succeeds
async function sendConfirmationEmail(p: {
  to: string; name: string; orderId: string; itemLines: string
  monthlyTotal: string; chargeToday: string; city: string; state: string; depositHeld: string
}) {
  if (!RESEND_API_KEY || !p.to) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: p.to,
      subject: 'Your Davenport order is confirmed',
      html: `<p>Hi ${p.name || 'there'},</p>
<p>Your suitcase is confirmed. Your pieces ship within 1–2 weeks.</p>
<p><strong>What you ordered:</strong><br><pre>${p.itemLines}</pre></p>
<p><strong>Charged today:</strong> ${p.chargeToday} (first month + delivery${p.depositHeld ? ' + ' + p.depositHeld : ''})</p>
<p><strong>Ongoing:</strong> ${p.monthlyTotal}/month, charged every 30 days. Minimum 30 days per piece.</p>
${p.city ? `<p>Shipping to ${p.city}, ${p.state}.</p>` : ''}
<p>Questions? Email <a href="mailto:support@davenport.rentals">support@davenport.rentals</a> and a real person will respond.</p>
<p>- Davenport Wardrobe</p>`,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Resend error: ${JSON.stringify(err)}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { setup_intent_id, items, idempotency_key }: { setup_intent_id?: string; items: OrderItem[]; idempotency_key?: string } = await req.json()
    if (!items?.length) throw new Error('No items provided')
    // One or the other must be present — setup_intent_id for Path A, idempotency_key for Path B
    const idemKey = setup_intent_id ?? idempotency_key
    if (!idemKey) throw new Error('Missing idempotency key — provide setup_intent_id or idempotency_key')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (!profile) throw new Error('Profile not found')
    if (!profile.stripe_customer_id) throw new Error('No Stripe customer — call create-setup-intent first')
    if (!profile.shipping_address)   throw new Error('Shipping address required')

    // Resolve payment method:
    // Path A (new customer or updating card): extract from confirmed SetupIntent
    // Path B (returning customer): use stored payment method directly
    let paymentMethodId: string
    if (setup_intent_id) {
      const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id)
      if (setupIntent.status !== 'succeeded') throw new Error('Payment method not saved — SetupIntent not succeeded')
      if (setupIntent.customer !== profile.stripe_customer_id) throw new Error('SetupIntent does not belong to this customer')
      const pmId = typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : null
      if (!pmId) throw new Error('No payment method on SetupIntent')
      paymentMethodId = pmId
    } else {
      if (!profile.stripe_payment_method_id) throw new Error('No payment method on file — complete checkout with card entry first')
      paymentMethodId = profile.stripe_payment_method_id
    }

    const hasDepositOnFile = profile.deposit_status === 'held'

    // Discount is based on TOTAL active pieces after this order, matching charge-monthly.
    // profile.active_rental_count is the count BEFORE this order; add items.length for the new pieces.
    const rawMonthly    = items.reduce((sum, i) => sum + i.rental_fee_cents, 0)
    const totalPieces   = (profile.active_rental_count ?? 0) + items.length
    const discount      = multiPieceDiscount(totalPieces)
    const monthlyTotal  = Math.round(rawMonthly * (1 - discount))
    const chargeToday   = monthlyTotal + HANDLING_CENTS

    // 1. Charge first month + handling fee
    // idemKey = setup_intent_id (Path A) or client-generated UUID (Path B).
    // Stripe deduplicates on this key, so a retry can't double-charge.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeToday,
      currency: 'usd',
      customer: profile.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      description: `Davenport — first month (${items.length} piece${items.length !== 1 ? 's' : ''}) + handling`,
      metadata: { user_id: user.id },
    }, { idempotencyKey: idemKey })

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment failed — status: ${paymentIntent.status}`)
    }

    // 2. Hold deposit if not already on file (capture_method: manual = authorize only)
    let depositIntentId: string | null = null
    if (!hasDepositOnFile) {
      const depositIntent = await stripe.paymentIntents.create({
        amount: DEPOSIT_CENTS,
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: paymentMethodId,
        capture_method: 'manual',
        confirm: true,
        off_session: true,
        description: 'Davenport — refundable security deposit',
        metadata: { user_id: user.id, type: 'deposit' },
      }, { idempotencyKey: `${idemKey}_deposit` })

      if (depositIntent.status !== 'requires_capture') {
        throw new Error(`Deposit authorization failed — status: ${depositIntent.status}. Customer's card may not support authorization holds.`)
      }

      depositIntentId = depositIntent.id

      await supabaseAdmin
        .from('profiles')
        .update({
          deposit_status:             'held',
          deposit_amount:             DEPOSIT_CENTS,
          deposit_payment_intent_id:  depositIntentId,
          stripe_payment_method_id:   paymentMethodId,
        })
        .eq('id', user.id)

      await supabaseAdmin.from('billing_events').insert({
        user_id: user.id,
        type: 'deposit_hold',
        amount_cents: DEPOSIT_CENTS,
        stripe_payment_intent_id: depositIntentId,
        status: 'succeeded',
        description: 'Security deposit authorized (hold, not captured)',
      })
    } else {
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_payment_method_id: paymentMethodId })
        .eq('id', user.id)
    }

    // 3. Create order atomically in DB — pessimistic lock prevents double-booking
    const orderId = crypto.randomUUID()
    const { data: resultId, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_user_id:                   user.id,
      p_order_id:                  orderId,
      p_items:                     items,
      p_payment_intent_id:         paymentIntent.id,
      p_deposit_intent_id:         depositIntentId,
      p_has_deposit_on_file:       hasDepositOnFile,
      p_shipping_address:          profile.shipping_address,
      p_charged_today_cents:       chargeToday,
      p_handling_fee_cents:        HANDLING_CENTS,
      p_deposit_amount_cents:      hasDepositOnFile ? 0 : DEPOSIT_CENTS,
    })

    if (rpcError) {
      // Attempt to reverse Stripe charges before surfacing the error to the client
      let refundOk = true
      try {
        await stripe.refunds.create({ payment_intent: paymentIntent.id })
      } catch (refundErr) {
        refundOk = false
        console.error('CRITICAL: Auto-refund failed after RPC failure — manual reconciliation needed:', refundErr, { payment_intent_id: paymentIntent.id })
      }
      if (depositIntentId) {
        try {
          await stripe.paymentIntents.cancel(depositIntentId)
        } catch (cancelErr) {
          console.error('CRITICAL: Deposit cancel failed after RPC failure — manual reconciliation needed:', cancelErr, { depositIntentId })
        }
      }
      console.error('create_order_atomic failed after successful charge:', rpcError, {
        payment_intent_id: paymentIntent.id,
        order_id: orderId,
        user_id: user.id,
      })
      // Surface inventory errors with a specific code so the client can show a targeted message.
      // For these the refund is automatic; for other DB errors use the generic rpc_failed code.
      const rpcMsg = rpcError.message ?? ''
      if (rpcMsg.includes('PIECE_UNAVAILABLE') || rpcMsg.includes('PIECE_NOT_FOUND')) {
        throw new Error(refundOk ? 'PIECE_UNAVAILABLE' : `PIECE_UNAVAILABLE_REFUND_FAILED:${orderId}`)
      }
      if (rpcMsg.includes('SIZE_UNAVAILABLE')) {
        throw new Error(refundOk ? 'SIZE_UNAVAILABLE' : `PIECE_UNAVAILABLE_REFUND_FAILED:${orderId}`)
      }
      throw new Error(`rpc_failed:${orderId}`)
    }

    // 4. Send emails (non-blocking — failure doesn't affect checkout)
    const addr = profile.shipping_address as { line1?: string; line2?: string; city?: string; state?: string; zip?: string } | null

    // Fetch piece names for readable email notifications
    const { data: pieceRows } = await supabaseAdmin
      .from('pieces')
      .select('id, name, brand')
      .in('id', items.map(i => i.piece_id))
    const pieceMap = Object.fromEntries((pieceRows ?? []).map((p: { id: string; name: string; brand: string }) => [p.id, p]))
    const itemLines = items.map((i: OrderItem) => {
      const p = pieceMap[i.piece_id] as { brand: string; name: string } | undefined
      const label = p ? `${p.brand} ${p.name}` : i.piece_id.slice(0, 8)
      return `• ${label} · Size ${i.size} — $${(i.rental_fee_cents / 100).toFixed(0)}/mo`
    }).join('\n')

    sendAdminNotification({
      customerName:  (profile as any).full_name ?? '',
      customerEmail: (profile as any).email ?? user.email ?? '',
      customerPhone: (profile as any).phone ?? null,
      orderId,
      itemLines,
      chargeToday:  `$${(chargeToday / 100).toFixed(2)}`,
      monthlyTotal: `$${(monthlyTotal / 100).toFixed(2)}`,
      address: addr,
    }).catch(err => console.error('Admin notification failed (non-fatal):', err))

    sendConfirmationEmail({
      to: profile.email ?? user.email ?? '',
      name: (profile as any).full_name ?? '',
      orderId,
      itemLines,
      monthlyTotal: `$${(monthlyTotal / 100).toFixed(2)}`,
      chargeToday:  `$${(chargeToday / 100).toFixed(2)}`,
      city: addr?.city ?? '',
      state: addr?.state ?? '',
      depositHeld: !hasDepositOnFile ? `$${(DEPOSIT_CENTS / 100).toFixed(0)} refundable deposit held` : '',
    }).catch(err => console.error('Confirmation email failed (non-fatal):', err))

    return new Response(
      JSON.stringify({ order_id: resultId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
