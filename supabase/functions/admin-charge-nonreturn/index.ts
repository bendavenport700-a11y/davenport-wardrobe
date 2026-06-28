import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Admin-triggered: charges a customer the buyout price for an item they never returned.
// Called once per unreturned rental. For multiple unreturned pieces, call once per rental_id.
// Body: { rental_id: string, reason?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Admin-only: validate JWT and is_admin flag
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { rental_id, reason }: { rental_id: string; reason?: string } = await req.json()
    if (!rental_id) throw new Error('rental_id is required')

    // Fetch rental
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('*, piece:pieces(id, name)')
      .eq('id', rental_id)
      .single()
    if (rentalError || !rental) throw new Error('Rental not found')
    if (rental.bought_out) throw new Error('Rental has already been bought out')
    if (rental.status === 'returned') throw new Error('Item has already been returned — cannot charge non-return')

    const buyoutPrice = rental.buyout_price_snapshot
    if (!buyoutPrice || buyoutPrice < 50) {
      throw new Error('Buyout price is not set on this rental — update it before charging')
    }

    // Fetch customer payment info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id, email, full_name')
      .eq('id', rental.user_id)
      .single()

    if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
      throw new Error('Customer has no payment method on file')
    }

    const pieceName = (rental.piece as { name: string } | null)?.name ?? rental_id
    const chargeReason = reason ?? `Non-return — item not received after 90+ days`

    // Charge buyout amount. Idempotency key: nonreturn_{rental_id} prevents double-charge on retry.
    const paymentIntent = await stripe.paymentIntents.create({
      amount:         buyoutPrice,
      currency:       'usd',
      customer:       profile.stripe_customer_id,
      payment_method: profile.stripe_payment_method_id,
      confirm:        true,
      off_session:    true,
      description:    `Davenport non-return buyout — ${pieceName}`,
      metadata:       { rental_id, type: 'nonreturn_buyout', admin_id: user.id },
    }, { idempotencyKey: `nonreturn_buyout_${rental_id}` })

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Charge failed — Stripe status: ${paymentIntent.status}`)
    }

    // Mark rental as bought out and stop billing
    const { error: rentalUpdateErr } = await supabaseAdmin
      .from('rentals')
      .update({
        bought_out:           true,
        billing_active:       false,
        status:               'bought_out',
        buyout_charged_cents: buyoutPrice,
        notes:                chargeReason,
      })
      .eq('id', rental_id)
    if (rentalUpdateErr) throw new Error(`Stripe charge succeeded but rental update failed — manual fix required: ${rentalUpdateErr.message}`)

    // Log to billing_events
    await supabaseAdmin.from('billing_events').insert({
      user_id:                  rental.user_id,
      rental_id,
      type:                     'buyout',
      amount_cents:             buyoutPrice,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id:         typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null,
      status:                   'succeeded',
      description:              `Non-return buyout — ${pieceName}: ${chargeReason}`,
    })

    // Atomically decrement active rental counters — avoids stale read-then-write race
    await supabaseAdmin.rpc('decrement_rental_counters', {
      p_user_id:   rental.user_id,
      p_fee_cents: rental.rental_fee_cents ?? 0,
    })

    // Email the customer (fire-and-forget)
    if (RESEND_API_KEY && profile.email) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: profile.email,
          subject: `Important: charge applied for unreturned item`,
          html: `<p>Hi ${profile.full_name ?? 'there'},</p>
<p>We have not received <strong>${pieceName}</strong> within the required return window.</p>
<p>Per our <a href="https://davenport.rentals/rental-terms">Rental Terms (Section 9)</a>, your card has been charged the buyout price of <strong>$${(buyoutPrice / 100).toFixed(2)}</strong>. The item is now yours to keep.</p>
<p>If you believe this is an error or have already shipped the item, please contact us immediately at <a href="mailto:support@davenport.rentals">support@davenport.rentals</a>.</p>
<p>— Davenport Wardrobe</p>`,
        }),
      })
        .then(r => { if (!r.ok) console.error('Non-return email error:', r.status) })
        .catch(e => console.error('Non-return email failed (non-fatal):', e))
    }

    return new Response(
      JSON.stringify({ ok: true, charged_cents: buyoutPrice }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
