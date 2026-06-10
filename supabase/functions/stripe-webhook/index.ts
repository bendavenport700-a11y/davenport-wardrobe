import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Stripe webhooks must NOT use corsHeaders — they come from Stripe servers, not the browser.
// The raw body must be read before any JSON parsing for signature verification.

Deno.serve(async (req) => {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook signature error: ${err instanceof Error ? err.message : err}`, { status: 400 })
  }

  try {
    switch (event.type) {

      // Card saved via SetupIntent — store payment method on profile
      case 'setup_intent.succeeded': {
        const si = event.data.object as { customer: string; payment_method: string }
        if (!si.customer || !si.payment_method) break

        await supabaseAdmin
          .from('profiles')
          .update({ stripe_payment_method_id: si.payment_method })
          .eq('stripe_customer_id', si.customer as string)
        break
      }

      // Payment succeeded — log billing event if not already logged by confirm-order / charge-monthly
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; amount: number; customer: string; metadata: Record<string, string> }
        // Deposits and buyouts are already logged by their respective functions
        if (pi.metadata?.type === 'deposit' || pi.metadata?.type === 'buyout') break

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', pi.customer as string)
          .single()
        if (!profile) break

        // Only insert if not already logged (avoids double-logging first_month charges)
        const { data: existing } = await supabaseAdmin
          .from('billing_events')
          .select('id')
          .eq('stripe_payment_intent_id', pi.id)
          .maybeSingle()

        if (!existing) {
          await supabaseAdmin.from('billing_events').insert({
            user_id:                  profile.id,
            type:                     'recurring',
            amount_cents:             pi.amount,
            stripe_payment_intent_id: pi.id,
            status:                   'succeeded',
            description:              'Monthly charge (webhook fallback log)',
          })
        }
        break
      }

      // Payment failed — always log (failures are never pre-logged)
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; amount: number; customer: string; last_payment_error?: { message?: string } }

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', pi.customer as string)
          .single()
        if (!profile) break

        await supabaseAdmin.from('billing_events').insert({
          user_id:                  profile.id,
          type:                     'recurring',
          amount_cents:             pi.amount,
          stripe_payment_intent_id: pi.id,
          status:                   'failed',
          description:              pi.last_payment_error?.message ?? 'Payment failed',
        })

        console.error(`Payment failed for customer ${pi.customer}: ${pi.last_payment_error?.message}`)
        break
      }

      // Deposit authorized (amount_capturable_updated fires when manual-capture PI is authorized)
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as { id: string; amount_capturable: number; customer: string; metadata: Record<string, string> }
        if (pi.metadata?.type !== 'deposit') break

        await supabaseAdmin
          .from('profiles')
          .update({ deposit_status: 'held', deposit_payment_intent_id: pi.id })
          .eq('stripe_customer_id', pi.customer as string)
        break
      }

      // Refund processed — log it
      case 'charge.refunded': {
        const charge = event.data.object as { payment_intent: string; amount_refunded: number; customer: string }

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', charge.customer as string)
          .single()
        if (!profile) break

        await supabaseAdmin.from('billing_events').insert({
          user_id:                  profile.id,
          type:                     'refund',
          amount_cents:             charge.amount_refunded,
          stripe_payment_intent_id: charge.payment_intent as string,
          status:                   'refunded',
          description:              'Refund processed',
        })
        break
      }

      default:
        // Unhandled event type — safe to ignore
        break
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Return 200 so Stripe doesn't retry — we log the error instead
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
