import Anthropic from 'npm:@anthropic-ai/sdk@0.27'
import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

// Admin tool: given a product URL, uses Claude to extract structured product info.
// Used in the admin inventory tool to auto-fill piece fields from a retailer URL.
// Body: { url: string }

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

const EXTRACT_PROMPT = `You are a fashion product data extractor for Davenport Wardrobe, a menswear rental company.

Given a retailer product URL, extract structured product information and return ONLY valid JSON with these fields:
{
  "name": "product name (no brand prefix)",
  "brand": "brand name",
  "description": "1-2 sentence description suitable for a rental listing. Focus on fit, fabric, and occasions.",
  "category": one of: "shirt" | "pants" | "shorts" | "outerwear" | "sweater" | "shoes" | "accessories",
  "color": one of: "Navy" | "White" | "Black" | "Grey" | "Olive" | "Khaki" | "Tan" | "Brown" | "Blue" | "Light Blue" | "Green" | "Burgundy" | "Red" | "Pink" | "Orange" | "Yellow" | "Purple" | "Cream" | "Charcoal" | "Multi" | "Pattern",
  "sizes_available": array of sizes (use standard sizing: XS/S/M/L/XL/XXL for tops, 28-42 waist for pants, 7-12 for shoes),
  "cost_price_estimate_cents": estimated retail price in cents (integer),
  "images": array of image URLs from the product page (up to 4),
  "source_retailer": retailer name (e.g. "Vuori", "Bonobos", "J.Crew")
}

If you cannot determine a field with confidence, use null. Return ONLY the JSON object, no explanation.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) throw new Error('Admin access required')

    const { url }: { url: string } = await req.json()
    if (!url) throw new Error('url is required')

    // Fetch the page HTML so Claude has actual content to parse, not just a URL
    let pageContent = ''
    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DavenportBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (pageRes.ok) {
        const html = await pageRes.text()
        // Strip scripts/styles and trim to avoid token overflow (~15k chars is plenty)
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 15000)
      }
    } catch {
      // If fetch fails (JS-rendered page, bot block, timeout) fall back to URL-only
    }

    const userContent = pageContent
      ? `${EXTRACT_PROMPT}\n\nProduct URL: ${url}\n\nPage content:\n${pageContent}`
      : `${EXTRACT_PROMPT}\n\nProduct URL: ${url}\n\n(Page could not be fetched — extract from URL and your knowledge of this retailer.)`

    // Use Claude to extract structured product data
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: userContent,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude did not return valid JSON')

    const extracted = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify({ ok: true, product: extracted, source_url: url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
