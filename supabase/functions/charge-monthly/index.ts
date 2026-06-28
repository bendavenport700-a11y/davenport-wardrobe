import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { multiPieceDiscount } from '../_shared/pricing.ts'

// Cron schedule: 0 9 * * *  (9am UTC daily — charges rentals whose next_billing_date is today or past)

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_STORE_URL  = 'https://apps.apple.com/app/davenport/id6778844291'

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
  active_rental_count?: number
}

// Advances a rental's billing date by 30 days from its scheduled date (not from today,
// so a missed-by-one-day cron still bills on the same rolling cycle).
function advancedBillingDate(currentDate: string): string {
  const d = new Date(currentDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 30)
  return d.toISOString().split('T')[0]
}

// Batch-updates next_billing_date +30 days for a set of rentals, grouped by current date
// so rentals on the same cycle get a single DB round-trip.
async function advanceRentalDates(rentals: RentalRow[]): Promise<void> {
  const byNextDate = new Map<string, string[]>()
  for (const r of rentals) {
    const nextDate = advancedBillingDate(r.next_billing_date)
    const group = byNextDate.get(nextDate) ?? []
    group.push(r.id)
    byNextDate.set(nextDate, group)
  }
  const now = new Date().toISOString()
  for (const [nextDate, ids] of byNextDate) {
    const { error } = await supabaseAdmin
      .from('rentals')
      .update({ last_billed_at: now, next_billing_date: nextDate })
      .in('id', ids)
    if (error) throw new Error(`advanceRentalDates failed for group ${nextDate}: ${error.message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  // Primary auth: verify_jwt validates the Supabase service-role key sent by pg_cron.
  // Optional extra layer: if CRON_SECRET env var is set AND x-cron-secret header is
  // provided, they must match. If either is absent the check is skipped.
  const cronSecret = Deno.env.get('CRON_SECRET')
  const provided   = req.headers.get('x-cron-secret')
  if (cronSecret && provided && provided !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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

  let successCount = 0
  let failCount    = 0

  for (const [userId, userRentals] of byUser) {
    // Hoist p so the catch block can reference it for the failure email
    let p: (ProfileRow & { email?: string; full_name?: string }) | null = null
    try {
      // Get profile with payment method, email, and total active piece count for discount
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, stripe_customer_id, stripe_payment_method_id, deposit_status, email, full_name, active_rental_count')
        .eq('id', userId)
        .single()

      p = profile as ProfileRow & { email?: string; full_name?: string } | null
      if (!p?.stripe_customer_id || !p?.stripe_payment_method_id) {
        console.error(`No payment method for user ${userId} — skipping`)
        failCount++
        await supabaseAdmin.from('billing_events').insert({
          user_id:      userId,
          type:         'recurring',
          amount_cents: userRentals.reduce((s, r) => s + r.rental_fee_cents, 0),
          status:       'failed',
          description:  '30-day charge failed: no payment method on file',
        }).catch(e => console.error('Failed to log missing-PM billing event:', e))
        if (p?.email) {
          sendEmail(
            p.email,
            'Action required — Davenport payment method missing',
            `<p>Hi ${p.full_name ?? 'there'},</p>
<p>We were unable to process your Davenport charge because no payment method is on file. Please open the Davenport app to add a payment method: <a href="${APP_STORE_URL}">davenport.rentals</a>.</p>
<p>— Davenport Wardrobe</p>`
          ).catch(e => console.error('Missing-PM email failed:', e))
        }
        continue
      }

      // Discount based on total active pieces, not just pieces due today.
      // A user with 3 pieces but only 1 renewing today still gets the 3-piece rate.
      const rawTotal    = userRentals.reduce((sum, r) => sum + r.rental_fee_cents, 0)
      const totalPieces = p.active_rental_count ?? userRentals.length
      const discount    = multiPieceDiscount(totalPieces)
      const chargeAmount = Math.round(rawTotal * (1 - discount))

      if (chargeAmount <= 0) {
        // No charge needed but still advance billing date so rental doesn't stay overdue
        await advanceRentalDates(userRentals)
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
        description:    `Davenport billing — ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''} (${today})`,
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
        description:              `30-day charge for ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''}`,
      })

      // Advance next_billing_date +30 days from each rental's own scheduled date
      await advanceRentalDates(userRentals)

      // Send billing receipt email (non-blocking)
      if (p.email) {
        sendEmail(
          p.email,
          `Davenport billing receipt — $${(chargeAmount / 100).toFixed(2)}`,
          `<p>Hi ${p.full_name ?? 'there'},</p>
<p>Your Davenport charge of <strong>$${(chargeAmount / 100).toFixed(2)}</strong> was processed successfully.</p>
<p>You're renting ${userRentals.length} piece${userRentals.length !== 1 ? 's' : ''}${totalPieces > userRentals.length ? ` (${totalPieces} total active)` : ''}. Your next charge is in 30 days.</p>
<p>To return a piece, open the Davenport app, go to Account, tap the piece, and tap Return. We'll email a prepaid label within 24 hours.</p>
<p>— Davenport Wardrobe</p>`
        ).catch(e => console.error('Billing receipt email failed:', e))
      }

      successCount++
    } catch (err) {
      console.error(`Charge failed for user ${userId}:`, err instanceof Error ? err.message : err)
      failCount++
      // Log failure
      await supabaseAdmin.from('billing_events').insert({
        user_id:      userId,
        type:         'recurring',
        amount_cents: userRentals.reduce((s, r) => s + r.rental_fee_cents, 0),
        status:       'failed',
        description:  `30-day charge failed: ${err instanceof Error ? err.message : 'unknown'}`,
      }).catch(e => console.error('Failed to log billing failure event:', e))

      // Send payment failure email (non-blocking)
      if (p?.email) {
        sendEmail(
          p.email,
          'Action required — Davenport payment failed',
          `<p>Hi ${p.full_name ?? 'there'},</p>
<p>We were unable to process your Davenport charge. Please open the Davenport app to update your payment method: <a href="${APP_STORE_URL}">Download the app</a>.</p>
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
