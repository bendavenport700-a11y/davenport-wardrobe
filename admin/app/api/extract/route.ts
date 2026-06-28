import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSessionUser } from '@/lib/auth'

const PROMPT = `You are a fashion product data extractor for Davenport Wardrobe, a menswear rental company.

Given a retailer product URL and optional page content, extract structured product information and return ONLY valid JSON:
{
  "name": "product name (no brand prefix)",
  "brand": "brand name",
  "description": "1-2 sentence description for a rental listing. Focus on fit, fabric, occasions.",
  "category": one of: "shirt"|"polo"|"t-shirt"|"henley"|"sweater"|"hoodie"|"sweatshirt"|"cardigan"|"vest"|"pants"|"chinos"|"trousers"|"denim"|"joggers"|"shorts"|"outerwear"|"jacket"|"blazer"|"coat"|"bomber"|"fleece"|"shoes"|"accessories",
  "color": one of: "Navy"|"White"|"Black"|"Grey"|"Olive"|"Khaki"|"Tan"|"Brown"|"Blue"|"Light Blue"|"Green"|"Burgundy"|"Red"|"Pink"|"Orange"|"Yellow"|"Purple"|"Cream"|"Charcoal"|"Multi"|"Pattern",
  "sizes_available": array of sizes. Rules:
    - Tops (shirt/polo/t-shirt/henley/sweater/hoodie/sweatshirt/cardigan/vest/outerwear/jacket/blazer/coat/bomber/fleece): XS/S/M/L/XL/XXL
    - Bottoms — detect which system the product uses:
        • Waist + specific inseam (dress pants, jeans, structured trousers): use "WxL" format e.g. ["30x30","30x32","32x30","32x32"]. Include only combinations actually shown as available.
        • Waist + length designation (Short/Regular/Long/XL): use "W/Length" format e.g. ["30/Short","30/Regular","32/Regular","32/Long"]. Only include sizes shown on the page.
        • Performance/stretch bottoms without a second dimension (joggers, some chinos): waist only e.g. ["28","30","32","34"]
    - Shorts: if athletic/performance use XS/S/M/L/XL/XXL; if chino/dress/casual use waist 28-38
    - Shoes: 7 through 12 (including half sizes)
    - Accessories: ["One Size"]
    Detect from page content which sizing system the product uses. Include all sizes shown as available on the page.
  "cost_price_estimate_cents": estimated retail price in cents,
  "images": array of image URLs from the product page (up to 4),
  "source_retailer": retailer name (e.g. "Vuori", "Bonobos", "J.Crew")
}

Return ONLY the JSON object, no explanation.`

export async function POST(req: NextRequest) {
  if (!await getSessionUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url } = await req.json() as { url: string }
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    // Try to fetch page HTML for richer extraction
    let pageContent = ''
    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DavenportAdmin/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (pageRes.ok) {
        const html = await pageRes.text()
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 15000)
      }
    } catch {
      // Fall back to URL-only extraction
    }

    const userContent = pageContent
      ? `${PROMPT}\n\nProduct URL: ${url}\n\nPage content:\n${pageContent}`
      : `${PROMPT}\n\nProduct URL: ${url}\n\n(Page could not be fetched — extract from URL and knowledge of this retailer.)`

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI did not return valid JSON' }, { status: 500 })

    const product = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ok: true, product, source_url: url })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
