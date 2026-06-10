import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { multiPieceDiscount } from '../_shared/pricing.ts'

// Cron schedule: 0 9 1 * *  (9am UTC on the 1st of every month)
// Charges all active rentals that are due for billing.

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
}

interface RentalRow {
  id: string
  user_id: string
  rental_fee_cents: number
  next_billing_date: string
}

interface ProfileRow {
  id: string
  stripe_customer_id: string
  stripe_payment_method_id: string
  deposit_status: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  // Require a shared secret so this endpoint can't be triggered by anyone who knows the URL.
  // Set CRON_SECRET in Supabase secrets. The Supabase scheduler passes it as a header.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Fetch all active rentals due today or overdue
  const { data: rentals, error: rentalsError } = await supabaseAdmin
    .from('rentals')
    .select('id, user_id, rental_fee_cents, next_billing_date')
    .eq('billing_active', true)
    .lte('next_billing_date', today)

  if (rentalsError) {
    console.error('Failed to fetch rentals:', rentalsError)
    return new Response(JSON.stringify({ error: rentalsError.message }), { status: 500 })
  }

  if (!rentals?.length) {
    return new Response(JSON.stringify({ charged: 0, message: 'No rentals due' }), { status: 200 })
  }

  // Group rentals by user
  const byUser = new Map<string, RentalRow[]>()
  for (const r of rentals as RentalRow[]) {
    const list = byUser.get(r.user_id) ?? []
    list.push(r)
    byUser.set(r.user_id, list)
  }

  const nextBillingDate = getNextFirstOfMonth()
  let successCount = 0
  let failCount    = 0

  for (const [userId, userRentals] of byUser) {
    // Hoist p so the catch block can reference it for the failure email
    let p: (ProfileRow & { email?: string; full_name?: string }) | null = null
    try {
      // Get profile with payment method and email for receipts
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, stripe_customer_id, stripe_payment_method_id, deposit_status, email, full_name')
        .eq('id', userId)
        .single()

      p = profile as ProfileRow & { email?: string; full_name?: string } | null
      if (!p?.stripe_customer_id || !p?.stripe_payment_method_id) {
        console.error(`No payment method for user ${userId} — skipping`)
        failCount++
        continue
      }

      // Apply multi-piece discount
      const rawTotal   = userRentals.reduce((sum, r) => sum + r.rental_fee_cents, 0)
      const discount   = multiPieceDiscount(userRentals.length)
      const chargeAmount = Math.round(rawTotal * (1 - discount))

      if (chargeAmount <= 0) {
        // No charge needed but still advance billing date so this rental doesn't stay overdue
        const rentalIds = userRentals.map(r => r.id)
        await supabaseAdmin
          .from('rentals')
          .update({ last_billed_at: new Date().toISOString(), next_billing_date: nextBillingDate })
          .in('id', rentalIds)
        successCount++
        continue
      }

      // Charge the payment method
      // Idempotency key: userId + billing date — safe to retry if cron fires twice same day
      const paymentIntent = await stripe.paymentIntents.create({
        amount:         chargeAmount,
        currency:       'usd',
        customer:       p.stripe_customer_id,
        payment_method: p.stripe_payment_method_id,
        confirm:        true,
        off_session:    true,
        description:    `Davenport monthly — ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''} (${today})`,
        metadata:       { user_id: userId, billing_date: today },
      }, { idempotencyKey: `monthly_${userId}_${today}` })

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`PaymentIntent status: ${paymentIntent.status}`)
      }

      // Log billing event
      await supabaseAdmin.from('billing_events').insert({
        user_id:                  userId,
        type:                     'recurring',
        amount_cents:             chargeAmount,
        stripe_payment_intent_id: paymentIntent.id,
        status:                   'succeeded',
        description:              `Monthly charge for ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''}`,
      })

      // Advance next_billing_date for all charged rentals
      const rentalIds = userRentals.map(r => r.id)
      await supabaseAdmin
        .from('rentals')
        .update({ last_billed_at: new Date().toISOString(), next_billing_date: nextBillingDate })
        .in('id', rentalIds)

      // Send billing receipt email (non-blocking)
      if (p.email) {
        sendEmail(
          p.email,
          `Davenport billing receipt — $${(chargeAmount / 100).toFixed(2)}`,
          `<p>Hi ${p.full_name ?? 'there'},</p>
<p>Your monthly Davenport charge of <strong>$${(chargeAmount / 100).toFixed(2)}</strong> was processed successfully.</p>
<p>You're renting ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''}. Next billing date: <strong>${nextBillingDate}</strong>.</p>
<p>To return a piece, email <a href="mailto:returns@davenport.rentals">returns@davenport.rentals</a> with your order number.</p>
<p>— Davenport Wardrobe</p>`
        ).catch(e => console.error('Billing receipt email failed:', e))
      }

      successCount++
    } catch (err) {
      console.error(`Charge failed for user ${userId}:`, err instanceof Error ? err.message : err)
      failCount++
      // Log failure
      await supabaseAdmin.from('billing_events').insert({
        user_id:     userId,
        type:        'recurring',
        amount_cents: userRentals.reduce((s, r) => s + r.rental_fee_cents, 0),
        status:      'failed',
        description: `Monthly charge failed: ${err instanceof Error ? err.message : 'unknown'}`,
      }).catch(e => console.error('Failed to log billing failure event:', e))

      // Send payment failure email (non-blocking)
      if (p?.email) {
        sendEmail(
          p.email,
          'Action required — Davenport payment failed',
          `<p>Hi ${p.full_name ?? 'there'},</p>
<p>We were unable to process your monthly Davenport charge. Please update your payment method at <a href="https://davenport.rentals/account">davenport.rentals/account</a>.</p>
<p>— Davenport Wardrobe</p>`
        ).catch(e => console.error('Payment failure email failed:', e))
      }
    }
  }

  return new Response(
    JSON.stringify({ charged: successCount, failed: failCount, date: today }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

function getNextFirstOfMonth(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toISOString().split('T')[0]
}
