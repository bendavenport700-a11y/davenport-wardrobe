import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Transactional email sender via Resend.
// Called server-side by other Edge Functions — not directly from the client.
// Body: { to: string, template: EmailTemplate, data: Record<string, unknown> }

type EmailTemplate =
  | 'order_confirmed'
  | 'order_shipped'
  | 'billing_receipt'
  | 'return_instructions'
  | 'buyout_confirmed'
  | 'payment_failed'
  | 'deposit_released'

interface EmailPayload {
  to: string
  template: EmailTemplate
  data: Record<string, unknown>
  // Optional: caller-supplied user_id for logging when using service-role auth
  user_id?: string
}

const FROM = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_STORE_URL = 'https://apps.apple.com/app/davenport/id6778844291'

function buildEmail(template: EmailTemplate, data: Record<string, unknown>): { subject: string; html: string } {
  switch (template) {
    case 'order_shipped':
      return {
        subject: 'Your Davenport order has shipped',
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>Great news — your order is on its way.</p>
<p><strong>Carrier:</strong> ${data.carrier}</p>
<p><strong>Tracking:</strong> ${data.tracking_number}</p>
<p>Orders typically arrive within 3–7 business days. You can track your order in the Davenport app or at <a href="https://davenport.rentals">davenport.rentals</a>.</p>
<p>Questions? Email <a href="mailto:support@davenport.rentals">support@davenport.rentals</a></p>
<p>— The Davenport Team</p>`,
      }
    case 'order_confirmed':
      return {
        subject: 'Your Davenport order is confirmed',
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>Your order is confirmed. We're sourcing your pieces — expect delivery in 1–2 weeks.</p>
<p><strong>Order ID:</strong> ${data.order_id}</p>
<p><strong>Monthly total:</strong> ${data.monthly_total}</p>
<p>Track your order at <a href="https://davenport.rentals">davenport.rentals</a>.</p>
<p>— The Davenport Team</p>`,
      }
    case 'billing_receipt':
      return {
        subject: `Davenport billing receipt — ${data.date}`,
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>Your monthly Davenport charge of <strong>${data.amount}</strong> was processed successfully.</p>
<p>Next billing date: <strong>${data.next_billing_date}</strong></p>
<p>— The Davenport Team</p>`,
      }
    case 'return_instructions':
      return {
        subject: 'Your Davenport return is ready',
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>We've received your return request. Your prepaid shipping label is attached to this email.</p>
<p>Please ship within 7 days. Your final month's billing has been stopped.</p>
<p>Questions? Email <a href="mailto:returns@davenport.rentals">returns@davenport.rentals</a></p>
<p>— The Davenport Team</p>`,
      }
    case 'buyout_confirmed':
      return {
        subject: `It's yours — buyout confirmed`,
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>Congrats — <strong>${data.piece_name}</strong> is officially yours. Your card was charged <strong>${data.amount}</strong>.</p>
<p>No need to return it. Enjoy the piece.</p>
<p>— The Davenport Team</p>`,
      }
    case 'payment_failed':
      return {
        subject: 'Action required — Davenport payment failed',
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>We weren't able to process your monthly payment of <strong>${data.amount}</strong>.</p>
<p>Please open the Davenport app to update your payment method: <a href="${APP_STORE_URL}">Download the app</a>.</p>
<p>— The Davenport Team</p>`,
      }
    case 'deposit_released':
      return {
        subject: 'Your Davenport deposit has been released',
        html: `<p>Hi ${data.name ?? 'there'},</p>
<p>Your <strong>${data.deposit_amount ?? '$75'} security deposit</strong> has been released. The authorization hold will clear from your card within 5–10 business days.</p>
<p>Thanks for being a Davenport customer.</p>
<p>— The Davenport Team</p>`,
      }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const isServiceRole = !!serviceRoleKey && token === serviceRoleKey

    let resolvedUserId: string | null = null
    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) throw new Error('Unauthorized')
      resolvedUserId = user.id
    }

    const { to, template, data, user_id }: EmailPayload = await req.json()
    if (!to || !template) throw new Error('to and template are required')
    if (isServiceRole) resolvedUserId = user_id ?? null

    const { subject, html } = buildEmail(template, data)

    if (!RESEND_API_KEY) {
      // Resend not configured yet — log and return success so callers don't fail
      console.log(`[send-email] RESEND_API_KEY not set. Would have sent '${template}' to ${to}`)
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.message ?? 'Resend API error')

    // Log to email_log table
    await supabaseAdmin.from('email_log').insert({
      user_id:   resolvedUserId,
      to_email:  to,
      type:      template,
      subject,
      resend_id: result.id ?? null,
      status:    'sent',
    }).catch(err => console.error('Failed to log email to email_log:', err))

    return new Response(
      JSON.stringify({ ok: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
