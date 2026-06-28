import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// INTERNAL / ADMIN USE: Hard-cancels a rental and immediately frees the unit.
// Customer-facing return requests go through `request-return` instead, which does NOT
// free the unit until admin confirms physical receipt of the piece.
// Body: { rental_id: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    // Admin-only guard: this function frees piece_units immediately.
    // Customers must use request-return, which does NOT free inventory.
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!callerProfile?.is_admin) throw new Error('Admin access required')

    const { rental_id }: { rental_id: string } = await req.json()
    if (!rental_id) throw new Error('rental_id is required')

    // Fetch rental — must belong to this user
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('id, user_id, piece_id, piece_unit_id, billing_active, created_at, min_rental_days, status, rental_fee_cents')
      .eq('id', rental_id)
      .single()

    if (rentalError || !rental) throw new Error('Rental not found')
    if (rental.status === 'bought_out') throw new Error('Rental has been bought out')
    if (rental.status === 'returned')   throw new Error('Rental is already returned')

    // Stop billing and mark as return_requested (idempotent — safe to repeat)
    const { error: updateErr } = await supabaseAdmin
      .from('rentals')
      .update({
        billing_active: false,
        status:         'return_requested',
      })
      .eq('id', rental_id)
    if (updateErr) throw new Error(`Failed to update rental: ${updateErr.message}`)

    // Free the specific unit and recompute piece availability
    if (rental.piece_unit_id) {
      await supabaseAdmin
        .from('piece_units')
        .update({ is_available: true })
        .eq('id', rental.piece_unit_id)
    }

    const { data: availUnits } = await supabaseAdmin
      .from('piece_units')
      .select('size')
      .eq('piece_id', rental.piece_id)
      .eq('is_available', true)

    const availSizes = [...new Set((availUnits ?? []).map(u => u.size))].sort()
    await supabaseAdmin
      .from('pieces')
      .update({ sizes_available: availSizes, is_available: availSizes.length > 0 })
      .eq('id', rental.piece_id)

    // Only decrement counters if billing was still active (avoid double-decrement)
    if (rental.billing_active) {
      await supabaseAdmin.rpc('decrement_rental_counters', {
        p_user_id:   rental.user_id,
        p_fee_cents: rental.rental_fee_cents ?? 0,
      })
    }

    return new Response(
      JSON.stringify({ ok: true, status: 'return_requested' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
