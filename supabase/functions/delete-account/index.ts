import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Deletes the authenticated user's account and all associated data.
// Called from the Account screen. Requires a valid user JWT.
// Apple App Store guideline 5.1.1(v): apps with account creation must offer in-app account deletion.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const userId = user.id

    // Check for active rentals — don't allow deletion if pieces haven't been returned
    const { data: activeRentals } = await supabaseAdmin
      .from('rentals')
      .select('id')
      .eq('user_id', userId)
      .eq('billing_active', true)
      .limit(1)

    if (activeRentals && activeRentals.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You have active rentals. Please return all pieces before deleting your account. Email support@davenport.rentals for help.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete user data in order (foreign keys)
    await supabaseAdmin.from('suitcase_items').delete().eq('user_id', userId)
    await supabaseAdmin.from('billing_events').delete().eq('user_id', userId)
    await supabaseAdmin.from('email_log').delete().eq('user_id', userId)
    // Orders and rentals are kept for financial records but anonymized
    await supabaseAdmin.from('profiles').update({
      email: `deleted_${userId}@deleted.invalid`,
      full_name: 'Deleted User',
      shipping_address: null,
      stripe_customer_id: null,
      stripe_payment_method_id: null,
    }).eq('id', userId)

    // Delete the auth user last
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw new Error(`Failed to delete auth user: ${deleteError.message}`)

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
