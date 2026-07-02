// Davenport AI Routines — single Edge Function handling all scheduled maintenance jobs.
// Called by pg_cron via pg_net on a schedule. Body: { "routine": "routine-name" }
// Routines: content-prompts | marketing-prompts | error-monitor | sweeper
//           inventory-qa | wardrobe-sorter | tag-manager | description-writer | featured-rotation

import Anthropic from 'npm:@anthropic-ai/sdk@0.27'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

async function log(name: string, status: 'ok' | 'warning' | 'error', summary: string) {
  await supabase.from('routine_logs').insert({ routine_name: name, status, summary })
}

// ── Wardrobe IDs ──────────────────────────────────────────────────────────────
const WARDROBES: Record<string, string> = {
  'Crown Crafted':   '63903670-26b4-4c6d-9157-28133963d3ec',
  'The July Pipeline': '4b9f6047-738a-4ad5-8be1-72230c5b97ee',
  'The NYC Interview': '8fd2bd1c-ebc9-4159-8e6a-2b9aee908989',
  'The Fairfield Look': '5b935c0d-7cfb-4038-8941-783e11cae05a',
  'The 203':         '207c14c0-f7ba-4822-b498-a0170e8a1e68',
  'Happy Valley':    '71c30c52-4ca0-49cb-9756-10df4bad427f',
}

function assignWardrobe(brand: string, category: string): string | null {
  const b = brand.toLowerCase()
  const c = category.toLowerCase()
  if (b.includes('peter millar')) return WARDROBES['Crown Crafted']
  if (b.includes('faherty') || b.includes('alo yoga') || b.includes('alo')) return WARDROBES['The 203']
  if (b.includes('vuori')) return WARDROBES['Happy Valley']
  if (b.includes('rhone')) {
    if (['hoodie','sweatshirt','fleece','joggers'].includes(c)) return WARDROBES['Happy Valley']
    if (['shorts','polo','t-shirt','henley','shirt'].includes(c)) return WARDROBES['The Fairfield Look']
    return null
  }
  if (['blazer','trousers','pants','chinos','dress'].some(w => c.includes(w))) return WARDROBES['The NYC Interview']
  if (b.includes('bonobos') || b.includes('katin')) return WARDROBES['The Fairfield Look']
  if (['polo','shirt','shorts'].includes(c) && !['hoodie','fleece'].includes(c)) return WARDROBES['The July Pipeline']
  return null
}

// ── Routines ──────────────────────────────────────────────────────────────────

async function contentPrompts() {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase.from('content_prompts').select('id').eq('prompt_date', today).eq('category', 'social_video').limit(1)
  if (existing && existing.length > 0) {
    await log('Daily Content Prompts', 'ok', `Content prompts already exist for ${today} — skipping`)
    return
  }

  const { data: pieces } = await supabase.from('pieces').select('name,brand,category,rental_fee')
    .eq('is_available', true).eq('is_draft', false).order('created_at', { ascending: false }).limit(8)
  const inventory = (pieces ?? []).map((p: any) =>
    `${p.brand} ${p.name} (${p.category}, $${Math.round((p.rental_fee ?? 0) / 100)}/mo)`
  ).join(', ')

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Generate daily social content for Davenport Wardrobe — luxury menswear rental, Connecticut, men 25-40. Brands: Vuori, Rhone, Faherty, Peter Millar, Bonobos, Alo Yoga. Voice: premium but real, like a stylish friend.

Current inventory: ${inventory}

Generate exactly 5 items — one per slot. For "script" types, write actual spoken words for camera. For "ai_prompt" types, write a detailed, ready-to-paste ChatGPT prompt (include brand voice + audience context in the prompt itself).

Return ONLY a valid JSON array with exactly 5 objects:
[
  {"platform":"tiktok","content_type":"script","theme":"short theme","prompt_text":"30-60 sec TikTok script. Hook in first 3 sec. Reference a specific piece. End: 'Check it out at davenport.rentals'. No hashtags."},
  {"platform":"instagram_reel","content_type":"script","theme":"short theme","prompt_text":"15-30 sec IG Reel script. Fast, punchy, quick cuts. Reference a specific piece. End: 'Link in bio — davenport.rentals'."},
  {"platform":"tiktok","content_type":"ai_prompt","theme":"short theme","prompt_text":"Full ChatGPT prompt. Include: brand voice (premium but real, like a friend who dresses well — NOT corporate), specific piece from inventory to spotlight, angle to take, format (30-60 sec TikTok script), target (CT men 25-40). End: 'davenport.rentals'."},
  {"platform":"instagram_post","content_type":"ai_prompt","theme":"short theme","prompt_text":"Full ChatGPT prompt. Include: brand voice, piece to feature, caption structure (hook + 2-3 sentences + CTA: 'Now available at davenport.rentals'), 3-5 hashtags, max 100 words total."},
  {"platform":"instagram_carousel","content_type":"ai_prompt","theme":"short theme","prompt_text":"Full ChatGPT prompt for 5-slide carousel. Pick a compelling angle (rent vs buy math, how it works, piece spotlight, value breakdown). Specify: Cover slide + 3 content slides + CTA slide. Each slide: 5-word headline + 1-2 sentence caption. Last slide: 'Available now — davenport.rentals'."}
]`
    }]
  })

  const rawText = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
  const jsonStart = rawText.indexOf('[')
  const jsonEnd = rawText.lastIndexOf(']') + 1
  const prompts = JSON.parse(rawText.slice(jsonStart, jsonEnd))

  const rows = prompts.map((p: any) => ({
    platform: p.platform,
    theme: p.theme,
    prompt_text: p.prompt_text,
    prompt_date: today,
    category: 'social_video',
    content_type: p.content_type,
  }))
  await supabase.from('content_prompts').insert(rows)
  const scripts = rows.filter((r: any) => r.content_type === 'script').length
  const aiPrompts = rows.filter((r: any) => r.content_type === 'ai_prompt').length
  await log('Daily Content Prompts', 'ok', `Wrote ${rows.length} content prompts for ${today} (${scripts} scripts, ${aiPrompts} AI prompts)`)
}

async function marketingPrompts() {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase.from('content_prompts').select('id').eq('prompt_date', today).eq('category', 'marketing_idea').limit(1)
  if (existing && existing.length > 0) {
    await log('Daily Marketing Ideas', 'ok', `Marketing ideas already exist for ${today} — skipping`)
    return
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1400,
    messages: [{
      role: 'user',
      content: `You are a marketing advisor for Davenport Wardrobe, a luxury menswear rental in Connecticut. Clients: professional men 25–45 in Fairfield County. Brands: Vuori, Rhone, Faherty, Peter Millar, Bonobos, Alo Yoga, Katin.

Generate 3 specific, actionable marketing ideas for today. Each must be completable in under 2 hours. Be concrete — name real places, real actions, real copy angles.

Return ONLY a valid JSON array, no other text:
[
  {"platform":"flyer","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"},
  {"platform":"partnership","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"},
  {"platform":"email_campaign","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"}
]

platform must be one of: flyer, partnership, email_campaign, local_outreach, social_ad, linkedin, community, referral`
    }]
  })

  const rawText = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
  const jsonStart = rawText.indexOf('[')
  const jsonEnd = rawText.lastIndexOf(']') + 1
  const prompts = JSON.parse(rawText.slice(jsonStart, jsonEnd))

  const rows = prompts.map((p: any) => ({
    platform: p.platform,
    theme: p.theme,
    prompt_text: p.prompt_text,
    prompt_date: today,
    category: 'marketing_idea',
    content_type: 'ai_prompt',
  }))
  await supabase.from('content_prompts').insert(rows)
  await log('Daily Marketing Ideas', 'ok', `Wrote ${rows.length} marketing ideas for ${today}`)
}

async function sweeper() {
  const issues: string[] = []
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()

  // 1. Overdue billing — charge-monthly missed a renewal cycle
  const { data: overdueBilling } = await supabase
    .from('rentals')
    .select('id')
    .eq('billing_active', true)
    .lt('next_billing_date', today)
  if (overdueBilling && overdueBilling.length > 0) {
    issues.push(`${overdueBilling.length} rental(s) overdue for billing (next_billing_date in the past)`)
  }

  // 2. Return SLA — return_requested rentals >7 days old (label should be sent within 24h)
  const { data: stalledReturns } = await supabase
    .from('rentals')
    .select('id')
    .eq('status', 'return_requested')
    .lt('updated_at', sevenDaysAgo)
  if (stalledReturns && stalledReturns.length > 0) {
    issues.push(`${stalledReturns.length} rental(s) stuck in return_requested >7 days — label may not have been sent`)
  }

  // 3. Active renters without a held deposit
  const { data: activeRenters } = await supabase
    .from('profiles')
    .select('id, deposit_status')
    .gt('active_rental_count', 0)
  const missingDeposit = (activeRenters ?? []).filter((p: any) => !['held', 'captured'].includes(p.deposit_status ?? ''))
  if (missingDeposit.length > 0) {
    issues.push(`${missingDeposit.length} active renter(s) have no deposit held (deposit_status not 'held' or 'captured')`)
  }

  // 4. Active renters missing a saved payment method — recurring billing will fail
  const { data: noPaymentMethod } = await supabase
    .from('profiles')
    .select('id')
    .gt('active_rental_count', 0)
    .is('stripe_payment_method_id', null)
  if (noPaymentMethod && noPaymentMethod.length > 0) {
    issues.push(`${noPaymentMethod.length} active renter(s) missing Stripe payment method — next billing cycle will fail`)
  }

  // 5. Scheduler health — check daily routines haven't gone silent
  // Only meaningful after 11am UTC (all daily routines run 6–10am UTC)
  if (now.getUTCHours() >= 11) {
    const { data: recentLogs } = await supabase
      .from('routine_logs')
      .select('routine_name')
      .gte('created_at', twentyFiveHoursAgo)
    const logged = new Set((recentLogs ?? []).map((l: any) => l.routine_name))
    const dailyRoutines = ['Daily Content Prompts', 'Inventory QA', 'Description Writer', 'Tag & Category Manager']
    const silent = dailyRoutines.filter(r => !logged.has(r))
    if (silent.length > 0) {
      issues.push(`Scheduler silence: ${silent.join(', ')} have not logged in 25h — pg_cron may have an issue`)
    }
  }

  if (issues.length === 0) {
    await log('Sweeper', 'ok', 'All clear — billing, deposits, returns, payment methods, and scheduler healthy')
  } else {
    await log('Sweeper', 'error', `${issues.length} issue(s): ${issues.join(' | ')}`)
  }
}

async function errorMonitor() {
  const issues: string[] = []
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stuckOrders } = await supabase.from('orders').select('id').eq('status', 'pending').lt('created_at', twoDaysAgo)
  if (stuckOrders && stuckOrders.length > 0) issues.push(`${stuckOrders.length} orders stuck pending >48h`)

  const { data: badRentals } = await supabase.from('rentals').select('id').eq('billing_active', true).in('status', ['returned', 'complete', 'bought_out'])
  if (badRentals && badRentals.length > 0) issues.push(`${badRentals.length} rentals still billing after completion`)

  const { data: availPieces } = await supabase.from('pieces').select('id,name').eq('is_available', true).eq('is_draft', false)
  for (const piece of (availPieces ?? [])) {
    const { data: units } = await supabase.from('piece_units').select('id').eq('piece_id', piece.id).eq('is_available', true).limit(1)
    if (!units || units.length === 0) issues.push(`${(piece as any).name} marked available but has no available units`)
  }

  if (issues.length === 0) {
    await log('Error Monitor', 'ok', 'All systems healthy — no data integrity issues found')
  } else {
    await log('Error Monitor', 'error', issues.join('; '))
  }
}

async function inventoryQA() {
  const issues: string[] = []
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: pieces } = await supabase.from('pieces').select('id,name,brand,images,description,is_available,is_draft,wardrobe_id,created_at').eq('is_draft', false)
  const allPieces = pieces ?? []

  const noImages = allPieces.filter((p: any) => !p.images || p.images.length === 0)
  if (noImages.length > 0) issues.push(`${noImages.length} pieces missing images`)

  const noDesc = allPieces.filter((p: any) => !p.description)
  if (noDesc.length > 0) issues.push(`${noDesc.length} pieces missing description`)

  const noWardrobe = allPieces.filter((p: any) => p.is_available && !p.wardrobe_id)
  if (noWardrobe.length > 0) issues.push(`${noWardrobe.length} available pieces without a wardrobe`)

  const { data: staleDrafts } = await supabase.from('pieces').select('id,name').eq('is_draft', true).lt('created_at', threeDaysAgo)
  if (staleDrafts && staleDrafts.length > 0) issues.push(`${staleDrafts.length} stale drafts >3 days old`)

  const total = allPieces.length
  const available = allPieces.filter((p: any) => p.is_available).length

  const summary = issues.length === 0
    ? `Inventory healthy: ${total} pieces, ${available} available — all checks passed`
    : `${total} pieces (${available} available) — issues: ${issues.join('; ')}`

  await log('Inventory QA', issues.length > 0 ? 'warning' : 'ok', summary)
}

async function wardrobeSorter() {
  const { data: unassigned } = await supabase.from('pieces').select('id,name,brand,category').eq('is_draft', false).eq('is_available', true).is('wardrobe_id', null)
  let assigned = 0

  for (const piece of (unassigned ?? [])) {
    const wardrobeId = assignWardrobe((piece as any).brand, (piece as any).category)
    if (wardrobeId) {
      await supabase.from('pieces').update({ wardrobe_id: wardrobeId }).eq('id', (piece as any).id)
      assigned++
    }
  }

  const checked = (unassigned ?? []).length
  await log('Wardrobe Sorter', 'ok', checked === 0
    ? 'All pieces already have wardrobes assigned'
    : `Checked ${checked} unassigned pieces, assigned ${assigned} to wardrobes, left ${checked - assigned} unassigned (no clear fit)`)
}

async function tagManager() {
  const VALID_CATEGORIES = ['shirt','polo','t-shirt','henley','sweater','hoodie','sweatshirt','cardigan','vest','pants','chinos','trousers','denim','joggers','outerwear','jacket','blazer','coat','bomber','fleece','shorts','shoes','accessories']
  const { data: pieces } = await supabase.from('pieces').select('id,name,brand,category').eq('is_draft', false)
  let fixed = 0
  const flags: string[] = []

  for (const piece of (pieces ?? [])) {
    const cat = ((piece as any).category ?? '').toLowerCase()
    if (!VALID_CATEGORIES.includes(cat)) {
      flags.push(`${(piece as any).name}: invalid category "${cat}"`)
    }
  }

  await log('Tag & Category Manager', flags.length > 0 ? 'warning' : 'ok',
    flags.length === 0
      ? `Checked ${(pieces ?? []).length} pieces — all categories valid`
      : `Checked ${(pieces ?? []).length} pieces, ${fixed} fixed, flagged: ${flags.slice(0, 3).join('; ')}${flags.length > 3 ? ` (+${flags.length - 3} more)` : ''}`)
}

async function descriptionWriter() {
  const { data: pieces } = await supabase.from('pieces').select('id,name,brand,category,color,description').eq('is_draft', false)
  const needsDesc = (pieces ?? []).filter((p: any) => !p.description || p.description.length < 40)

  if (needsDesc.length === 0) {
    await log('Description Writer', 'ok', 'All pieces already have descriptions — nothing to write')
    return
  }

  let written = 0
  for (const piece of needsDesc.slice(0, 8)) {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a 2-3 sentence description for this rental piece. Voice: elevated, experiential, confident. Never start with "This is a". Focus on feel, occasion, fabric quality.

Piece: ${(piece as any).brand} ${(piece as any).name} | Category: ${(piece as any).category} | Color: ${(piece as any).color ?? 'unknown'}

Return only the description text, nothing else.`
      }]
    })
    const desc = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    if (desc.length > 20) {
      await supabase.from('pieces').update({ description: desc }).eq('id', (piece as any).id)
      written++
    }
  }

  await log('Description Writer', 'ok', `Wrote ${written} new descriptions for pieces that were missing them`)
}

async function featuredRotation() {
  // Deprecated: homepage now shows New Arrivals (newest pieces by created_at), not a featured shelf
  await log('Featured Rotation', 'ok', 'Deprecated — homepage now uses New Arrivals (created_at DESC), no featured shelf to manage')
}

// ── Router ────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })

  try {
    const { routine } = await req.json()
    switch (routine) {
      case 'content-prompts':    await contentPrompts();    break
      case 'marketing-prompts':  await marketingPrompts();  break
      case 'sweeper':            await sweeper();           break
      case 'error-monitor':      await errorMonitor();      break
      case 'inventory-qa':       await inventoryQA();       break
      case 'wardrobe-sorter':    await wardrobeSorter();    break
      case 'tag-manager':        await tagManager();        break
      case 'description-writer': await descriptionWriter(); break
      case 'featured-rotation':  await featuredRotation();  break
      default: return new Response(JSON.stringify({ error: `Unknown routine: ${routine}` }), { status: 400 })
    }
    return new Response(JSON.stringify({ ok: true, routine }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Routine error:', message)
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
