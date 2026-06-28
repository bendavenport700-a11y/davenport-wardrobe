import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Admin-only: validate JWT and check is_admin flag
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authToken = authHeader.replace('Bearer ', '')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  // Accept service role key (server-to-server from admin Next.js) OR a user JWT with is_admin=true
  if (!serviceRoleKey || authToken !== serviceRoleKey) {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authToken)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const { order_id, reason }: { order_id: string; reason?: string } = await req.json()
    if (!order_id) throw new Error('order_id is required')

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, stripe_payment_intent_id, deposit_intent_id, rental_ids, user_id, notes')
      .eq('id', order_id)
      .single()
    if (orderError || !order) throw new Error('Order not found')
    if (order.status === 'refunded') throw new Error('Order already refunded')
    if (!order.stripe_payment_intent_id) throw new Error('No payment intent on record — refund manually in Stripe')

    // 1. Refund the first-month charge
    await stripe.refunds.create(
      { payment_intent: order.stripe_payment_intent_id },
      { idempotencyKey: `refund_order_${order_id}` }
    )

    // 2. Cancel the deposit hold if this order created it (capture_method: manual).
    // Also reset profile.deposit_status so future orders correctly re-collect the deposit.
    if (order.deposit_intent_id) {
      let depositCancelled = false
      try {
        await stripe.paymentIntents.cancel(order.deposit_intent_id)
        depositCancelled = true
      } catch {
        // Already cancelled, expired, or captured — only reset fields if cancel succeeded
      }
      if (depositCancelled) {
        await supabaseAdmin
          .from('profiles')
          .update({ deposit_status: null, deposit_payment_intent_id: null, deposit_amount: 0 })
          .eq('id', order.user_id)
      }
    }

    // 3. Get rental info before updating
    const rentalIds: string[] = order.rental_ids ?? []
    let totalRentalFees = 0
    const pieceUnitsToFree: { unitId: string; pieceId: string }[] = []

    if (rentalIds.length > 0) {
      const { data: rentals } = await supabaseAdmin
        .from('rentals')
        .select('piece_id, piece_unit_id, rental_fee_cents')
        .in('id', rentalIds)

      if (rentals) {
        totalRentalFees = rentals.reduce((sum, r) => sum + (r.rental_fee_cents ?? 0), 0)
        for (const r of rentals) {
          if (r.piece_unit_id) {
            pieceUnitsToFree.push({ unitId: r.piece_unit_id, pieceId: r.piece_id })
          }
        }
      }

      // Deactivate rentals — 'cancelled' since inventory is freed immediately below
      await supabaseAdmin
        .from('rentals')
        .update({ billing_active: false, status: 'cancelled' })
        .in('id', rentalIds)

      // Free each piece_unit and recompute sizes_available per piece
      for (const { unitId, pieceId } of pieceUnitsToFree) {
        await supabaseAdmin
          .from('piece_units')
          .update({ is_available: true })
          .eq('id', unitId)

        const { data: availUnits } = await supabaseAdmin
          .from('piece_units')
          .select('size')
          .eq('piece_id', pieceId)
          .eq('is_available', true)

        const availSizes = [...new Set((availUnits ?? []).map((u: { size: string }) => u.size))].sort()
        await supabaseAdmin
          .from('pieces')
          .update({ sizes_available: availSizes, is_available: availSizes.length > 0 })
          .eq('id', pieceId)
      }

      // Atomically decrement profile counters (bulk: N rentals at once)
      await supabaseAdmin.rpc('decrement_rental_counters', {
        p_user_id:   order.user_id,
        p_fee_cents: totalRentalFees,
        p_count:     rentalIds.length,
      })
    }

    // 4. Mark order as refunded — append to existing notes to preserve audit trail
    const newNote  = reason ? `REFUNDED: ${reason}` : 'REFUNDED'
    const allNotes = [order.notes, newNote].filter(Boolean).join('\n')
    await supabaseAdmin
      .from('orders')
      .update({ status: 'refunded', notes: allNotes })
      .eq('id', order_id)

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
