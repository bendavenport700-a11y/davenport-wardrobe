'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import ContentInventorySection from './ContentInventorySection'
import ContentStudio, { type ContentPrompt, type MarketingIdea } from './ContentStudio'

// ── Slot keys that ContentStudio renders ──────────────────────────────────────

const CONTENT_SLOTS: Array<{ platform: string; content_type: string; key: string }> = [
  { platform: 'tiktok',             content_type: 'script',    key: 'tiktok:script' },
  { platform: 'instagram_reel',     content_type: 'script',    key: 'instagram_reel:script' },
  { platform: 'tiktok',             content_type: 'ai_prompt', key: 'tiktok:ai_prompt' },
  { platform: 'instagram_post',     content_type: 'ai_prompt', key: 'instagram_post:ai_prompt' },
  { platform: 'instagram_carousel', content_type: 'ai_prompt', key: 'instagram_carousel:ai_prompt' },
]

// ── Server actions ─────────────────────────────────────────────────────────────

async function markUsed(id: string) {
  'use server'
  await supabaseAdmin.from('content_prompts').update({ used: true }).eq('id', id)
  revalidatePath('/content')
}

async function markAnnounced(pieceId: string) {
  'use server'
  const { data } = await supabaseAdmin.from('pieces').select('announced_at').eq('id', pieceId).single()
  const value = data?.announced_at ? null : new Date().toISOString()
  await supabaseAdmin.from('pieces').update({ announced_at: value }).eq('id', pieceId)
  revalidatePath('/content')
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getLatestPerSlot(): Promise<Record<string, ContentPrompt | null>> {
  noStore()
  const { data } = await supabaseAdmin
    .from('content_prompts')
    .select('*')
    .eq('category', 'social_video')
    .order('created_at', { ascending: false })
    .limit(50)

  const result: Record<string, ContentPrompt | null> = {}
  for (const slot of CONTENT_SLOTS) result[slot.key] = null

  for (const row of (data ?? [])) {
    const key = `${row.platform}:${row.content_type}`
    if (key in result && !result[key]) {
      result[key] = row as ContentPrompt
    }
  }

  return result
}

async function getMarketingIdeas(): Promise<MarketingIdea[]> {
  noStore()
  const { data } = await supabaseAdmin
    .from('content_prompts')
    .select('*')
    .eq('category', 'marketing_idea')
    .order('used', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(12)
  return (data ?? []) as MarketingIdea[]
}

async function getNewInventory() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('pieces')
    .select('id, name, brand, images, rental_fee, wear_count, category, created_at, announced_at')
    .eq('is_draft', false)
    .gte('created_at', since)
    .order('announced_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
  return data ?? []
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ContentPage() {
  const [latestContent, marketingIdeas, newInventory] = await Promise.all([
    getLatestPerSlot(),
    getMarketingIdeas(),
    getNewInventory(),
  ])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-navy">Content Studio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate scripts and prompts on demand. Hit Refresh on any card to get a fresh one.
        </p>
      </div>

      {/* ── NEW INVENTORY POSTS ── */}
      <ContentInventorySection pieces={newInventory} onMarkAnnounced={markAnnounced} />

      {/* ── STUDIO (Video Scripts + ChatGPT Prompts + Marketing Ideas) ── */}
      <ContentStudio
        initialContent={latestContent}
        initialMarketing={marketingIdeas}
        onMarkUsed={markUsed}
      />
    </div>
  )
}
