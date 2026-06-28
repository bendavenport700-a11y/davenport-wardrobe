import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'support@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Customer-triggered: flags an order for refund review and notifies the admin.
// The admin reviews and approves/denies via the admin panel or admin-refund-order function.
// Body: { order_id: string, reason?: string }

const REFUND_WINDOW_DAYS = 30

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { order_id, reason }: { order_id: string; reason?: string } = await req.json()
    if (!order_id) throw new Error('order_id is required')

    // Fetch the order — must belong to this user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at, total_charged, user_id, notes')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.status === 'refunded') throw new Error('This order has already been refunded')
    if (order.status === 'refund_requested') throw new Error('A refund request is already pending for this order')

    // Enforce 30-day refund window
    const daysSinceOrder = Math.floor(
      (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceOrder > REFUND_WINDOW_DAYS) {
      throw new Error(`Refund requests must be submitted within ${REFUND_WINDOW_DAYS} days of ordering. This order is ${daysSinceOrder} days old.`)
    }

    const refundNote = reason
      ? `REFUND_REQUESTED: ${reason}`
      : 'REFUND_REQUESTED: No reason provided'

    // Update order status — append to existing notes rather than overwrite
    const existingNotes = order.notes ?? ''
    const updatedNotes = [existingNotes, refundNote].filter(Boolean).join('\n')
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'refund_requested', notes: updatedNotes })
      .eq('id', order_id)
    if (updateError) throw new Error(`Failed to update order status: ${updateError.message}`)

    // Fetch customer profile for emails
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const customerEmail = profile?.email ?? ''
    const customerName  = profile?.full_name ?? 'Customer'
    const orderId8      = order_id.slice(0, 8).toUpperCase()
    const amountDisplay = `$${((order.total_charged ?? 0) / 100).toFixed(2)}`

    // Send emails (fire-and-forget — must not block the response or throw)
    if (RESEND_API_KEY) {
      // Admin notification
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `Refund request — Order #${orderId8}`,
          html: `<p><strong>Refund request received</strong></p>
<p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
<p><strong>Order ID:</strong> ${orderId8}</p>
<p><strong>Amount charged:</strong> ${amountDisplay}</p>
<p><strong>Order placed:</strong> ${daysSinceOrder} days ago</p>
<p><strong>Reason:</strong> ${reason ?? 'Not provided'}</p>
<p>To approve, use the admin panel or trigger admin-refund-order with order_id: ${order_id}</p>`,
        }),
      })
        .then(r => { if (!r.ok) console.error('Admin refund notification error:', r.status) })
        .catch(e => console.error('Admin refund email failed (non-fatal):', e))

      // Customer confirmation
      if (customerEmail) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: `Refund request received — Order #${orderId8}`,
            html: `<p>Hi ${customerName},</p>
<p>We've received your refund request for Order #${orderId8} (${amountDisplay}).</p>
<p>Our team will review it within 3–5 business days. If approved, the refund will be credited to your original payment method.</p>
${reason ? `<p><strong>Your reason:</strong> ${reason}</p>` : ''}
<p>If you have any questions, reply to this email or contact <a href="mailto:support@davenport.rentals">support@davenport.rentals</a>.</p>
<p>— Davenport Wardrobe</p>`,
          }),
        })
          .then(r => { if (!r.ok) console.error('Customer refund confirmation error:', r.status) })
          .catch(e => console.error('Customer refund email failed (non-fatal):', e))
      }
    }

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
