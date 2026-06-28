import { supabaseAdmin } from '../_shared/supabase.ts'

// Runs daily at 10am UTC via pg_cron.
// Sends three types of retention nudges — each tracked in email_log so they fire only once.

const FROM = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@davenport.rentals'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = 'https://davenport.rentals'
const APP_STORE_URL = 'https://apps.apple.com/app/davenport/id6778844291'
const UNSUBSCRIBE_MAILTO = 'mailto:support@davenport.rentals?subject=Unsubscribe'

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[retention] RESEND_API_KEY not set — would have sent '${subject}' to ${to}`)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`Resend error for ${to}:`, err)
      return false
    }
    return true
  } catch (e) {
    console.error(`sendEmail fetch failed for ${to}:`, e)
    return false
  }
}

async function alreadySent(userId: string, type: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_log')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .limit(1)
    if (error) { console.error('alreadySent query error:', error); return false }
    return (data?.length ?? 0) > 0
  } catch (e) {
    console.error('alreadySent threw:', e)
    return false
  }
}

async function logEmail(userId: string, to: string, type: string, subject: string) {
  await supabaseAdmin.from('email_log').insert({
    user_id: userId, to_email: to, type, subject, status: 'sent',
  }).catch(e => console.error('email_log insert failed:', e))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  // Primary auth: pg_cron sends a valid Supabase service-role Authorization header.
  // Optional extra layer: if CRON_SECRET env var is set AND x-cron-secret header is
  // provided, they must match. If either is absent the check is skipped.
  const cronSecret = Deno.env.get('CRON_SECRET')
  const provided   = req.headers.get('x-cron-secret')
  if (cronSecret && provided && provided !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const today = new Date()
    let sent = 0

    // ── 1. Onboarding nudge ──────────────────────────────────────────────────
    // New users (signed up 2–7 days ago) with 0 active rentals.
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twoDaysAgo   = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const { data: newUsers, error: newUsersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, active_rental_count, created_at')
      .gte('created_at', sevenDaysAgo)
      .lte('created_at', twoDaysAgo)
      .eq('active_rental_count', 0)

    if (newUsersError) console.error('newUsers query error:', newUsersError)

    for (const user of newUsers ?? []) {
      if (!user.email) continue
      if (await alreadySent(user.id, 'onboarding_nudge')) continue
      const name = user.full_name ?? 'there'
      const subject = 'Your wardrobe is waiting, ' + name.split(' ')[0]
      const html = `<p>Hi ${name},</p>
<p>You signed up for Davenport but haven't added your first piece yet.</p>
<p>We source pieces from Vuori, Bonobos, J.Crew, and more — starting at <strong>$12/month</strong>.</p>
<p><a href="${APP_STORE_URL}" style="background:#1B2A4A;color:#F5F0E8;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Open the app →</a></p>
<p style="margin-top:8px;font-size:13px"><a href="${SITE_URL}/browse">Or browse the wardrobe on the web →</a></p>
<p style="margin-top:24px;font-size:13px;color:#999">You're receiving this because you signed up at davenport.rentals. <a href="${UNSUBSCRIBE_MAILTO}">Unsubscribe</a></p>`
      const ok = await sendEmail(user.email, subject, html)
      if (ok) { await logEmail(user.id, user.email, 'onboarding_nudge', subject); sent++ }
    }

    // ── 2. 3-month buyout nudge ───────────────────────────────────────────────
    const day88 = new Date(today.getTime() - 88 * 24 * 60 * 60 * 1000).toISOString()
    const day92 = new Date(today.getTime() - 92 * 24 * 60 * 60 * 1000).toISOString()

    const { data: rentals3m, error: rentals3mError } = await supabaseAdmin
      .from('rentals')
      .select('id, user_id, created_at, buyout_price_snapshot, size, piece:pieces(name, brand)')
      .eq('billing_active', true)
      .eq('bought_out', false)
      .gte('created_at', day92)
      .lte('created_at', day88)

    if (rentals3mError) console.error('rentals3m query error:', rentals3mError)

    for (const rental of rentals3m ?? []) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('email, full_name').eq('id', rental.user_id).single()
      if (!profile?.email) continue
      if (await alreadySent(rental.user_id, `buyout_nudge_3m_${rental.id}`)) continue
      const name = profile.full_name ?? 'there'
      const piece = Array.isArray(rental.piece) ? rental.piece[0] : rental.piece
      const pieceName = [piece?.brand, piece?.name].filter(Boolean).join(' ') || 'your piece'
      const price = rental.buyout_price_snapshot
        ? `$${(rental.buyout_price_snapshot / 100).toFixed(2)}`
        : 'a reduced price'
      const subject = `Still loving it? Own ${piece?.name ?? 'it'} for ${price}`
      const html = `<p>Hi ${name},</p>
<p>You've been renting <strong>${pieceName}</strong> for 3 months — we hope you love it.</p>
<p>The buyout price has dropped to <strong>${price}</strong>. Buy it now and keep it forever — no more monthly charge.</p>
<p><a href="${APP_STORE_URL}" style="background:#1B2A4A;color:#F5F0E8;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Open the app to buy it →</a></p>
<p style="font-size:13px;color:#666;margin-top:16px">Or keep renting — the price keeps dropping the longer you hold it.</p>
<p style="margin-top:24px;font-size:13px;color:#999"><a href="${UNSUBSCRIBE_MAILTO}">Unsubscribe</a></p>`
      const ok = await sendEmail(profile.email, subject, html)
      if (ok) { await logEmail(rental.user_id, profile.email, `buyout_nudge_3m_${rental.id}`, subject); sent++ }
    }

    // ── 3. 6-month loyalty nudge ─────────────────────────────────────────────
    const day178 = new Date(today.getTime() - 178 * 24 * 60 * 60 * 1000).toISOString()
    const day182 = new Date(today.getTime() - 182 * 24 * 60 * 60 * 1000).toISOString()

    const { data: rentals6m, error: rentals6mError } = await supabaseAdmin
      .from('rentals')
      .select('id, user_id, created_at, buyout_price_snapshot, size, piece:pieces(name, brand)')
      .eq('billing_active', true)
      .eq('bought_out', false)
      .gte('created_at', day182)
      .lte('created_at', day178)

    if (rentals6mError) console.error('rentals6m query error:', rentals6mError)

    for (const rental of rentals6m ?? []) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('email, full_name').eq('id', rental.user_id).single()
      if (!profile?.email) continue
      if (await alreadySent(rental.user_id, `buyout_nudge_6m_${rental.id}`)) continue
      const name = profile.full_name ?? 'there'
      const piece = Array.isArray(rental.piece) ? rental.piece[0] : rental.piece
      const pieceName = [piece?.brand, piece?.name].filter(Boolean).join(' ') || 'your piece'
      const loyaltyPrice = rental.buyout_price_snapshot
        ? Math.round(rental.buyout_price_snapshot * 0.95)
        : null
      const priceStr = loyaltyPrice ? `$${(loyaltyPrice / 100).toFixed(2)}` : 'a special price'
      const subject = `★ Loyalty reward — ${piece?.name ?? 'your piece'} at ${priceStr}`
      const html = `<p>Hi ${name},</p>
<p>Six months with <strong>${pieceName}</strong> — you've earned a loyalty discount.</p>
<p>As a thank-you, we're offering you an extra <strong>5% off</strong> the buyout price: <strong>${priceStr}</strong>.</p>
<p><a href="${APP_STORE_URL}" style="background:#1B2A4A;color:#F5F0E8;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Open the app to claim →</a></p>
<p style="font-size:13px;color:#666;margin-top:16px">This price is locked in — it won't go lower, but it's available whenever you're ready.</p>
<p style="margin-top:24px;font-size:13px;color:#999"><a href="${UNSUBSCRIBE_MAILTO}">Unsubscribe</a></p>`
      const ok = await sendEmail(profile.email, subject, html)
      if (ok) { await logEmail(rental.user_id, profile.email, `buyout_nudge_6m_${rental.id}`, subject); sent++ }
    }

    return new Response(
      JSON.stringify({ sent, date: today.toISOString().split('T')[0] }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-retention-emails unhandled error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
