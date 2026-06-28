import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()
    if (profileError) throw new Error('Profile not found')

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
      if (updateErr) throw new Error(`Failed to save Stripe customer: ${updateErr.message}`)
    }

    const [setupIntent, ephemeralKey] = await Promise.all([
      stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      }),
      stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2024-06-20' }
      ),
    ])

    if (!setupIntent.client_secret) {
      throw new Error('Stripe did not return a client secret for the SetupIntent')
    }

    console.log('create-setup-intent ok:', {
      setup_intent_id: setupIntent.id,
      customer_id: customerId,
      livemode: setupIntent.livemode,
    })

    return new Response(
      JSON.stringify({
        client_secret:        setupIntent.client_secret,
        setup_intent_id:      setupIntent.id,
        customer_id:          customerId,
        ephemeral_key_secret: ephemeralKey.secret,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stripeCode = (err as any)?.code ?? null
    const stripeType = (err as any)?.type ?? null
    console.error('create-setup-intent error:', { message, stripeCode, stripeType })
    return new Response(
      JSON.stringify({ error: message, stripeCode, stripeType }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
