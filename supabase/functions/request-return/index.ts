import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'support@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Customer requests a return for any delivered rental.
// Stops billing immediately and notifies admin to send a prepaid label within 24h.
// The physical unit is NOT freed here — it's freed when admin marks the piece received back.
// Body: { rental_id: string, reason?: string }

const RETURN_SHIP_WINDOW_DAYS = 21

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { rental_id, reason }: { rental_id: string; reason?: string } = await req.json()
    if (!rental_id) throw new Error('rental_id is required')

    // Fetch rental — must belong to this user and be in a returnable state
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('id, piece_id, piece_unit_id, billing_active, created_at, min_rental_days, status, rental_fee_cents, size, next_billing_date')
      .eq('id', rental_id)
      .eq('user_id', user.id)
      .single()

    if (rentalError || !rental) throw new Error('Rental not found')
    if (rental.status === 'return_requested') throw new Error('A return has already been requested for this rental')
    if (rental.status === 'returned')         throw new Error('This rental has already been returned')
    if (rental.status === 'bought_out')       throw new Error('This rental has been purchased — no return needed')
    if (!['delivered', 'shipped'].includes(rental.status)) {
      throw new Error(`Cannot request a return for a rental with status: ${rental.status}. For pre-shipment cancellations, use the refund request flow.`)
    }

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(rental.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    const minDays  = rental.min_rental_days ?? 30
    const isEarly  = daysSinceStart < minDays
    const deadline = new Date(Date.now() + RETURN_SHIP_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

    // Stop billing and mark as return_requested.
    // NOTE: piece_units.is_available stays false — the unit is freed by admin when they
    // confirm the piece has been physically received back at the warehouse.
    const { error: rentalUpdateErr } = await supabaseAdmin
      .from('rentals')
      .update({ billing_active: false, status: 'return_requested' })
      .eq('id', rental_id)
    if (rentalUpdateErr) throw new Error(`Failed to update rental: ${rentalUpdateErr.message}`)

    // Atomically decrement profile counters.
    // Using an RPC avoids the stale read-then-write race of read-modify-write.
    await supabaseAdmin.rpc('decrement_rental_counters', {
      p_user_id:   user.id,
      p_fee_cents: rental.rental_fee_cents ?? 0,
    })

    // Fetch profile for email copy only
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    // Fetch piece name for email copy
    const { data: piece } = await supabaseAdmin
      .from('pieces')
      .select('name, brand')
      .eq('id', rental.piece_id)
      .single()

    const pieceName   = [piece?.brand, piece?.name].filter(Boolean).join(' ') || 'Your rental piece'
    const customerEmail = profile?.email ?? ''
    const customerName  = profile?.full_name ?? 'Customer'
    const rentalId8     = rental_id.slice(0, 8).toUpperCase()

    const earlyNote = isEarly
      ? `<p><strong>Note:</strong> You requested this return within your 30-day minimum period. Since billing has already stopped, no further charges will apply.</p>`
      : ''

    if (RESEND_API_KEY) {
      // Customer confirmation
      if (customerEmail) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: `Return requested — ${pieceName}`,
            html: `<p>Hi ${customerName},</p>
<p>We've received your return request for <strong>${pieceName}</strong> (Size ${rental.size}).</p>
${earlyNote}
<p><strong>What happens next:</strong></p>
<ol>
  <li>We'll email you a prepaid return label within 24 hours.</li>
  <li>Pack the piece securely and drop it off within 21 days (by <strong>${deadline}</strong>).</li>
  <li>We'll confirm receipt and release your security deposit when all pieces are back.</li>
</ol>
${reason ? `<p><em>Your reason: ${reason}</em></p>` : ''}
<p>Questions? Reply to this email or contact <a href="mailto:support@davenport.rentals">support@davenport.rentals</a>.</p>
<p>— Davenport Wardrobe</p>`,
          }),
        })
          .then(r => { if (!r.ok) console.error('Customer return confirmation error:', r.status) })
          .catch(e => console.error('Customer return email failed (non-fatal):', e))
      }

      // Admin notification
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `Return requested — ${pieceName} (${rentalId8})`,
          html: `<p><strong>Return request received</strong></p>
<p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
<p><strong>Piece:</strong> ${pieceName}, Size ${rental.size}</p>
<p><strong>Rental ID:</strong> ${rentalId8}</p>
<p><strong>Days rented:</strong> ${daysSinceStart} days ${isEarly ? `(early return — ${minDays - daysSinceStart} days before minimum)` : ''}</p>
${reason ? `<p><strong>Customer reason:</strong> ${reason}</p>` : ''}
<p><strong>Action required:</strong> Email the customer a prepaid return label within 24 hours. Shipping deadline: ${deadline}.</p>
<p>When the piece arrives back, mark it as received in the admin panel to free the unit for new rentals.</p>`,
        }),
      })
        .then(r => { if (!r.ok) console.error('Admin return notification error:', r.status) })
        .catch(e => console.error('Admin return email failed (non-fatal):', e))
    }

    return new Response(
      JSON.stringify({ ok: true, status: 'return_requested', ship_by: deadline }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
