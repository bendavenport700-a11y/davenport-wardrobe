import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Customer requests to buy a piece they're currently renting.
// Charges the current buyout_price_snapshot (adjusted for loyalty bonus if applicable).
// Body: { rental_id: string }

const LOYALTY_MONTHS     = 6
const LOYALTY_BONUS_PCT  = 0.05

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { rental_id }: { rental_id: string } = await req.json()
    if (!rental_id) throw new Error('rental_id is required')

    // Fetch rental — must belong to this user and be active
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('*, piece:pieces(id, name)')
      .eq('id', rental_id)
      .eq('user_id', user.id)
      .eq('billing_active', true)
      .eq('bought_out', false)
      .single()

    if (rentalError || !rental) throw new Error('Rental not found or not eligible for buyout')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id, active_rental_count, monthly_total, email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
      throw new Error('No payment method on file')
    }

    // Calculate loyalty bonus if rented 6+ continuous months
    const monthsRented = Math.floor(
      (Date.now() - new Date(rental.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    let buyoutPrice = rental.buyout_price_snapshot
    if (monthsRented >= LOYALTY_MONTHS) {
      buyoutPrice = Math.round(buyoutPrice * (1 - LOYALTY_BONUS_PCT))
    }

    // Stripe minimum charge is 50 cents — guard against corrupted/unseeded snapshot
    if (!buyoutPrice || buyoutPrice < 50) {
      throw new Error('Buyout price is not set correctly on this rental — contact support')
    }

    // Charge buyout amount
    // Idempotency key: rental_id ensures a network retry can't double-charge the same buyout
    const paymentIntent = await stripe.paymentIntents.create({
      amount:         buyoutPrice,
      currency:       'usd',
      customer:       profile.stripe_customer_id,
      payment_method: profile.stripe_payment_method_id,
      confirm:        true,
      off_session:    true,
      description:    `Davenport buyout — ${(rental.piece as { name: string })?.name ?? rental_id}`,
      metadata:       { user_id: user.id, rental_id, type: 'buyout' },
    }, { idempotencyKey: `buyout_${rental_id}` })

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Buyout payment failed — status: ${paymentIntent.status}`)
    }

    // Update rental and piece
    await supabaseAdmin
      .from('rentals')
      .update({
        bought_out:              true,
        billing_active:          false,
        status:                  'bought_out',
        buyout_charged_cents:    buyoutPrice,
      })
      .eq('id', rental_id)

    await supabaseAdmin
      .from('billing_events')
      .insert({
        user_id:                  user.id,
        rental_id,
        type:                     'buyout',
        amount_cents:             buyoutPrice,
        stripe_payment_intent_id: paymentIntent.id,
        status:                   'succeeded',
        description:              `Buyout${monthsRented >= LOYALTY_MONTHS ? ' (loyalty discount applied)' : ''}`,
      })

    // Decrement active_rental_count and monthly_total using already-fetched profile
    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({
          active_rental_count: Math.max(0, (profile.active_rental_count ?? 0) - 1),
          monthly_total:       Math.max(0, (profile.monthly_total ?? 0) - (rental.rental_fee_cents ?? 0)),
        })
        .eq('id', user.id)
    }

    // Send buyout confirmation email (fire-and-forget — must not throw into outer try/catch)
    if (RESEND_API_KEY && (profile as any).email) {
      const pieceName = (rental.piece as { name: string } | null)?.name ?? 'your piece'
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: (profile as any).email,
          subject: `It's yours — buyout confirmed`,
          html: `<p>Hi ${(profile as any).full_name ?? 'there'},</p>
<p>Congrats — <strong>${pieceName}</strong> is officially yours. Your card was charged <strong>$${(buyoutPrice / 100).toFixed(2)}</strong>.</p>
${monthsRented >= LOYALTY_MONTHS ? '<p>Your 5% loyalty discount was applied — thanks for being a long-term Davenport customer.</p>' : ''}
<p>No need to return it. Enjoy the piece.</p>
<p>— Davenport Wardrobe</p>`,
        }),
      })
        .then(r => { if (!r.ok) console.error('Buyout email Resend error:', r.status) })
        .catch(e => console.error('Buyout email failed (non-fatal):', e))
    }

    return new Response(
      JSON.stringify({ ok: true, charged_cents: buyoutPrice, loyalty_applied: monthsRented >= LOYALTY_MONTHS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
