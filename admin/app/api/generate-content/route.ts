import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type SlotConfig = {
  theme: string
  category: string
  system: string
  prompt: (inventory: string) => string
}

const SLOTS: Record<string, SlotConfig> = {
  // ── Video scripts ────────────────────────────────────────────────────────────
  'tiktok:script': {
    theme: 'tiktok-script',
    category: 'social_video',
    system: 'You write short, authentic TikTok scripts for Davenport Wardrobe — a luxury menswear rental in Connecticut (Vuori, Rhone, Faherty, Peter Millar, Bonobos). Voice: confident, real, like a stylish friend. NOT corporate, NOT salesy.',
    prompt: (inv) => `Write a 30-60 second TikTok script — actual words to say on camera.

Current inventory: ${inv}

Rules:
- Open with a scroll-stopping hook that lands in the first 3 seconds (the most specific, surprising, or relatable line wins)
- Speak like you're talking to one friend, not a crowd
- Reference at least one specific piece or brand by name
- Never say "In today's video..." — just start talking
- End with: "Check it out at davenport.rentals"
- No hashtags, no emojis — this is a spoken script

Return only the script text, nothing else.`,
  },

  'instagram_reel:script': {
    theme: 'reel-script',
    category: 'social_video',
    system: 'You write punchy Instagram Reel scripts for Davenport Wardrobe. Fast, visual, confident. Built for quick cuts.',
    prompt: (inv) => `Write a 15-30 second IG Reel script — fast and punchy, designed for quick cuts.

Current inventory: ${inv}

Rules:
- Hook in the first 2 seconds (most specific line wins — no generic openers)
- Short punchy sentences — each one should land
- Reference a specific piece from inventory
- End: "Link in bio — davenport.rentals"
- No hashtags in the script itself

Return only the script text, nothing else.`,
  },

  // ── ChatGPT prompts ──────────────────────────────────────────────────────────
  'tiktok:ai_prompt': {
    theme: 'tiktok-chatgpt',
    category: 'social_video',
    system: 'You write detailed, ready-to-paste ChatGPT prompts for creating TikTok content for Davenport Wardrobe.',
    prompt: (inv) => `Write a ChatGPT prompt that will generate a great TikTok script for Davenport Wardrobe. Ben will paste this directly into ChatGPT.

Current inventory: ${inv}

The prompt you write must include:
1. Brand voice: "Premium but real. Confident without being arrogant. Like a friend who dresses well — NOT corporate, NOT salesy. Connecticut menswear rental."
2. Specific pieces to reference from this inventory: ${inv}
3. A specific angle (pick one that's most compelling right now: rent-vs-buy math, piece spotlight, wardrobe philosophy, "this is how it works" explainer)
4. Format: 30-60 second TikTok script, hook in first 3 seconds, spoken naturally
5. Target: men 25-40, Connecticut/Northeast, professional but relaxed
6. End: "Check it out at davenport.rentals"

Return only the ChatGPT prompt — nothing else. Ben pastes this directly.`,
  },

  'instagram_post:ai_prompt': {
    theme: 'ig-post-chatgpt',
    category: 'social_video',
    system: 'You write detailed, ready-to-paste ChatGPT prompts for Instagram post captions for Davenport Wardrobe.',
    prompt: (inv) => `Write a ChatGPT prompt that will generate an Instagram post caption for Davenport Wardrobe. Ben will paste this directly into ChatGPT.

Current inventory: ${inv}

The prompt you write must ask ChatGPT to:
1. Write a caption: hook line + 2-3 body sentences + CTA
2. Feature one specific piece from this inventory (pick the most interesting): ${inv}
3. Voice: "Premium but real. Like a stylish friend mentioning something worth knowing — not a brand account."
4. Audience: men 25-40, Connecticut/Northeast
5. CTA: "Now available at davenport.rentals"
6. Add 3-5 hashtags at the end (relevant and real — no #luxury spam)
7. Total caption max 100 words

Return only the ChatGPT prompt — Ben pastes this directly.`,
  },

  'instagram_carousel:ai_prompt': {
    theme: 'carousel-chatgpt',
    category: 'social_video',
    system: 'You write detailed, ready-to-paste ChatGPT prompts for Instagram carousel posts for Davenport Wardrobe.',
    prompt: (inv) => `Write a ChatGPT prompt that will generate a 5-slide Instagram carousel for Davenport Wardrobe. Ben will paste this directly into ChatGPT.

Current inventory: ${inv}

Pick the most compelling angle for a carousel right now (choose one):
- "Why renting is smarter than buying in 2025"
- "The Davenport model — how it actually works"
- "What $X/month actually gets you" (use real price from inventory)
- "How to build a capsule wardrobe without buying anything"
- "New piece breakdown" (spotlight a specific item from inventory)

The prompt you write must specify:
1. 5 slides: Cover (hook) → 3 content slides → CTA slide
2. Each slide: headline (5 words max) + 1-2 sentence caption
3. Voice: "Premium but real. Confident. Like a stylish friend giving advice."
4. Audience: men 25-40, Northeast
5. Last slide: "Available now — davenport.rentals"
6. Inventory context to reference: ${inv}

Return only the ChatGPT prompt — Ben pastes this directly.`,
  },

  // ── Marketing ideas ──────────────────────────────────────────────────────────
  'marketing:ideas': {
    theme: 'marketing-batch',
    category: 'marketing_idea',
    system: 'You are a marketing advisor for Davenport Wardrobe, a luxury menswear rental in Connecticut. Clients: professional men 25–45 in Fairfield County. Brands: Vuori, Rhone, Faherty, Peter Millar, Bonobos, Alo Yoga, Katin.',
    prompt: (inv) => `Generate 3 specific, actionable marketing ideas for Davenport Wardrobe. Each must be completable in under 2 hours. Be concrete — name real places, real actions, real copy angles.

Current inventory to reference: ${inv}

Return ONLY a valid JSON array:
[
  {"platform":"flyer","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"},
  {"platform":"partnership","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"},
  {"platform":"community","theme":"short theme label","prompt_text":"specific idea with 2-3 concrete action steps"}
]

platform must be one of: flyer, partnership, email_campaign, local_outreach, social_ad, linkedin, community, referral`,
  },
}

export async function POST(req: NextRequest) {
  const jar = await cookies()
  const token = jar.get('admin-auth')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { platform, content_type } = await req.json()
  const key = `${platform}:${content_type}`
  const config = SLOTS[key]

  if (!config) {
    return NextResponse.json({ error: `Unknown slot: ${key}` }, { status: 400 })
  }

  // Fetch current inventory
  const { data: pieces } = await supabaseAdmin
    .from('pieces')
    .select('name, brand, category, rental_fee')
    .eq('is_draft', false)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const inventory = (pieces ?? [])
    .map((p: any) => `${p.brand} ${p.name} (${p.category}, $${Math.round((p.rental_fee ?? 0) / 100)}/mo)`)
    .join(', ')

  const today = new Date().toISOString().split('T')[0]

  // Marketing ideas return multiple rows
  if (key === 'marketing:ideas') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: config.system,
      messages: [{ role: 'user', content: config.prompt(inventory) }],
    })
    const rawText = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
    const jsonStart = rawText.indexOf('[')
    const jsonEnd = rawText.lastIndexOf(']') + 1
    const ideas = JSON.parse(rawText.slice(jsonStart, jsonEnd))
    const rows = ideas.map((p: any) => ({
      platform: p.platform,
      theme: p.theme,
      prompt_text: p.prompt_text,
      prompt_date: today,
      category: 'marketing_idea',
      content_type: 'ai_prompt',
    }))
    const { data: saved } = await supabaseAdmin.from('content_prompts').insert(rows).select()
    return NextResponse.json({ ok: true, prompts: saved ?? [] })
  }

  // Single content slot
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: config.system,
    messages: [{ role: 'user', content: config.prompt(inventory) }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

  const { data: saved, error } = await supabaseAdmin
    .from('content_prompts')
    .insert({
      platform,
      content_type,
      theme: config.theme,
      prompt_text: text,
      prompt_date: today,
      category: config.category,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, prompt: saved })
}
