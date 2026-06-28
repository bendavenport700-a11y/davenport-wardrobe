import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Admin-triggered: cancels the deposit hold when all rentals are returned in good condition.
// Body: { user_id: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    // Only admins can trigger deposit releases
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!callerProfile?.is_admin) throw new Error('Admin access required')

    const { user_id }: { user_id: string } = await req.json()
    if (!user_id) throw new Error('user_id is required')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('deposit_payment_intent_id, deposit_status, deposit_amount')
      .eq('id', user_id)
      .single()

    if (!profile?.deposit_payment_intent_id) throw new Error('No deposit on file for this user')
    if (!['held', 'partially_captured'].includes(profile.deposit_status ?? '')) {
      throw new Error(`Deposit status is '${profile.deposit_status}' — nothing to release`)
    }

    if (profile.deposit_status === 'held') {
      // Cancel the PaymentIntent — releases the authorization hold with no charge
      await stripe.paymentIntents.cancel(profile.deposit_payment_intent_id)
    }
    // If partially_captured: Stripe already released the remainder when the partial capture occurred.
    // No Stripe call needed — just update the DB.

    await supabaseAdmin
      .from('profiles')
      .update({ deposit_status: 'refunded' })
      .eq('id', user_id)

    await supabaseAdmin.from('billing_events').insert({
      user_id,
      type:                     'deposit_release',
      amount_cents:             profile.deposit_amount ?? 0,
      stripe_payment_intent_id: profile.deposit_payment_intent_id,
      status:                   'refunded',
      description:              'Security deposit released — all items returned',
    })

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
