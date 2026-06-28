import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Admin-triggered: captures (charges) the deposit hold for damage or non-return.
// Capture can be partial (e.g. one damaged item out of several).
// Body: { user_id: string, amount_cents?: number, reason: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!callerProfile?.is_admin) throw new Error('Admin access required')

    const { user_id, amount_cents, reason }: { user_id: string; amount_cents?: number; reason: string } = await req.json()
    if (!user_id) throw new Error('user_id is required')
    if (!reason)  throw new Error('reason is required')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('deposit_payment_intent_id, deposit_status, deposit_amount')
      .eq('id', user_id)
      .single()

    if (!profile?.deposit_payment_intent_id) throw new Error('No deposit on file for this user')
    if (profile.deposit_status === 'partially_captured') {
      throw new Error(
        'Deposit was already partially captured. The remaining authorization was released by Stripe. ' +
        'Use the charge-damage function to charge additional damage amounts.'
      )
    }
    if (profile.deposit_status !== 'held') throw new Error(`Deposit status is '${profile.deposit_status}', not 'held'`)

    const captureAmount = amount_cents ?? profile.deposit_amount
    if (captureAmount <= 0) throw new Error('amount_cents must be greater than 0')
    if (captureAmount > profile.deposit_amount) throw new Error(`amount_cents (${captureAmount}) cannot exceed deposit on file (${profile.deposit_amount})`)
    const isPartial = captureAmount < profile.deposit_amount

    const captured = await stripe.paymentIntents.capture(profile.deposit_payment_intent_id, {
      amount_to_capture: captureAmount,
    }, { idempotencyKey: `capture_deposit_${user_id}_${profile.deposit_payment_intent_id}_${captureAmount}` })

    if (captured.status !== 'succeeded') {
      throw new Error(`Deposit capture returned status '${captured.status}' — verify in Stripe dashboard`)
    }

    const newStatus = isPartial ? 'partially_captured' : 'forfeited'
    await supabaseAdmin
      .from('profiles')
      .update({ deposit_status: newStatus })
      .eq('id', user_id)

    await supabaseAdmin.from('billing_events').insert({
      user_id,
      type:                     'deposit_capture',
      amount_cents:             captureAmount,
      stripe_payment_intent_id: profile.deposit_payment_intent_id,
      stripe_charge_id:         typeof captured.latest_charge === 'string' ? captured.latest_charge : null,
      status:                   'succeeded',
      description:              reason,
    })

    return new Response(
      JSON.stringify({ ok: true, captured_cents: captureAmount, status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
