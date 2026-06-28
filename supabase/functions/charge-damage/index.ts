import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Admin-triggered: charges a customer for damage that exceeds the $75 security deposit,
// or for any damage after the deposit has already been partially/fully captured.
// This creates a brand-new PaymentIntent — separate from the deposit hold.
// Body: { user_id: string, amount_cents: number, reason: string, rental_id?: string }

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
    const {
      user_id,
      amount_cents,
      reason,
      rental_id,
    }: { user_id: string; amount_cents: number; reason: string; rental_id?: string } = await req.json()

    if (!user_id)       throw new Error('user_id is required')
    if (!amount_cents || amount_cents < 50) throw new Error('amount_cents must be at least 50 (50 cents)')
    if (!reason)        throw new Error('reason is required — describe the damage')

    // Fetch customer payment info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id, email, full_name')
      .eq('id', user_id)
      .single()

    if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
      throw new Error('Customer has no payment method on file')
    }

    // Unique idempotency key — uses reason hash so the same damage charge cannot be
    // submitted twice by accident, but a legitimately different charge (different reason) goes through.
    const idempotencyBase = `damage_${user_id}_${rental_id ?? 'nrental'}_${amount_cents}_${reason.trim().slice(0, 40).replace(/\s+/g, '_')}`

    const paymentIntent = await stripe.paymentIntents.create({
      amount:         amount_cents,
      currency:       'usd',
      customer:       profile.stripe_customer_id,
      payment_method: profile.stripe_payment_method_id,
      confirm:        true,
      off_session:    true,
      description:    `Davenport damage charge — ${reason}`,
      metadata:       { user_id, rental_id: rental_id ?? '', type: 'damage_charge', admin_id: user.id },
    }, { idempotencyKey: idempotencyBase })

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Charge failed — Stripe status: ${paymentIntent.status}`)
    }

    // Log to billing_events
    await supabaseAdmin.from('billing_events').insert({
      user_id,
      rental_id: rental_id ?? null,
      type:                     'damage_charge',
      amount_cents,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id:         typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null,
      status:                   'succeeded',
      description:              reason,
    })

    // Email the customer (fire-and-forget)
    if (RESEND_API_KEY && profile.email) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: profile.email,
          subject: `Damage charge applied to your account`,
          html: `<p>Hi ${profile.full_name ?? 'there'},</p>
<p>Following an inspection of your returned item(s), a damage charge of <strong>$${(amount_cents / 100).toFixed(2)}</strong> has been applied to your saved payment method.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Per our <a href="https://davenport.rentals/rental-terms">Rental Terms (Section 4)</a>, damage beyond normal wear is charged to the renter. If you have any questions or believe this charge was applied in error, please reply to this email or contact <a href="mailto:support@davenport.rentals">support@davenport.rentals</a>.</p>
<p>— Davenport Wardrobe</p>`,
        }),
      })
        .then(r => { if (!r.ok) console.error('Damage charge email error:', r.status) })
        .catch(e => console.error('Damage charge email failed (non-fatal):', e))
    }

    return new Response(
      JSON.stringify({ ok: true, charged_cents: amount_cents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
