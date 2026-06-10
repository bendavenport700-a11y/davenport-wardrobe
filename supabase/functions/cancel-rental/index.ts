import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Customer cancels a rental (after the 30-day minimum period).
// Marks rental inactive, frees up the piece for new rentals.
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

    const { rental_id }: { rental_id: string } = await req.json()
    if (!rental_id) throw new Error('rental_id is required')

    // Fetch rental — must belong to this user
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('id, piece_id, billing_active, created_at, min_rental_days, status, rental_fee_cents')
      .eq('id', rental_id)
      .eq('user_id', user.id)
      .single()

    if (rentalError || !rental) throw new Error('Rental not found')
    if (!rental.billing_active) throw new Error('Rental is already inactive')
    if (rental.status === 'bought_out') throw new Error('Rental has been bought out')

    // Enforce minimum rental period
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(rental.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    const minDays = rental.min_rental_days ?? 30
    if (daysSinceStart < minDays) {
      throw new Error(`Minimum rental period is ${minDays} days. ${minDays - daysSinceStart} days remaining.`)
    }

    // Stop billing and mark as return_requested
    await supabaseAdmin
      .from('rentals')
      .update({
        billing_active: false,
        status:         'return_requested',
      })
      .eq('id', rental_id)

    // Free the piece for new rentals
    await supabaseAdmin
      .from('pieces')
      .update({ is_available: true })
      .eq('id', rental.piece_id)

    // Decrement active_rental_count on profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('active_rental_count, monthly_total')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({
          active_rental_count: Math.max(0, (profile.active_rental_count ?? 0) - 1),
          monthly_total:       Math.max(0, (profile.monthly_total ?? 0) - (rental.rental_fee_cents ?? 0)),
        })
        .eq('id', user.id)
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
