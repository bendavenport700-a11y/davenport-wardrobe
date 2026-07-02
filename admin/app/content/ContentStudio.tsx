'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContentPrompt {
  id: string
  platform: string
  content_type: string
  theme: string | null
  prompt_text: string
  prompt_date: string
  used: boolean
}

export interface MarketingIdea {
  id: string
  platform: string
  theme: string | null
  prompt_text: string
  prompt_date: string
  used: boolean
}

interface SlotDef {
  key: string
  platform: string
  content_type: 'script' | 'ai_prompt'
  label: string
  emoji: string
  tip: string
}

const VIDEO_SLOTS: SlotDef[] = [
  { key: 'tiktok:script',         platform: 'tiktok',         content_type: 'script',    label: 'TikTok Script',  emoji: '🎵', tip: 'Say this on camera' },
  { key: 'instagram_reel:script', platform: 'instagram_reel', content_type: 'script',    label: 'IG Reel Script', emoji: '🎬', tip: 'Say this on camera' },
]

const PROMPT_SLOTS: SlotDef[] = [
  { key: 'tiktok:ai_prompt',         platform: 'tiktok',             content_type: 'ai_prompt', label: 'TikTok Prompt',  emoji: '🎵', tip: 'Paste into ChatGPT' },
  { key: 'instagram_post:ai_prompt', platform: 'instagram_post',     content_type: 'ai_prompt', label: 'IG Post Prompt', emoji: '📸', tip: 'Paste into ChatGPT' },
  { key: 'instagram_carousel:ai_prompt', platform: 'instagram_carousel', content_type: 'ai_prompt', label: 'Carousel Prompt', emoji: '🎠', tip: 'Paste into ChatGPT' },
]

const MARKETING_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  flyer:          { label: 'Flyer',       color: 'bg-amber-100 text-amber-800',   emoji: '📄' },
  partnership:    { label: 'Partnership', color: 'bg-blue-100 text-blue-800',     emoji: '🤝' },
  email_campaign: { label: 'Email',       color: 'bg-green-100 text-green-800',   emoji: '✉️' },
  local_outreach: { label: 'Local',       color: 'bg-orange-100 text-orange-800', emoji: '📍' },
  social_ad:      { label: 'Social Ad',   color: 'bg-purple-100 text-purple-800', emoji: '📣' },
  linkedin:       { label: 'LinkedIn',    color: 'bg-sky-100 text-sky-800',       emoji: '💼' },
  community:      { label: 'Community',   color: 'bg-teal-100 text-teal-800',     emoji: '🏘️' },
  referral:       { label: 'Referral',    color: 'bg-rose-100 text-rose-800',     emoji: '🔗' },
}

function mktLabel(platform: string) {
  return MARKETING_LABELS[platform] ?? { label: platform, color: 'bg-gray-100 text-gray-700', emoji: '💡' }
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${className ?? 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'}`}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ── Content slot card ─────────────────────────────────────────────────────────

function SlotCard({
  slot,
  prompt,
  onRefresh,
}: {
  slot: SlotDef
  prompt: ContentPrompt | null
  onRefresh: (slot: SlotDef) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const isAiPrompt = slot.content_type === 'ai_prompt'

  async function handleRefresh() {
    setLoading(true)
    try { await onRefresh(slot) } finally { setLoading(false) }
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm flex flex-col ${isAiPrompt ? 'border-blue-100' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isAiPrompt ? 'border-blue-50 bg-blue-50/40' : 'border-gray-50 bg-gray-50/60'} rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{slot.emoji}</span>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">{slot.label}</p>
            <p className="text-[10px] text-gray-400">{slot.tip}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          title="Generate a fresh one"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy px-2.5 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          {loading ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {prompt ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line flex-1">
              {prompt.prompt_text}
            </p>
            {isAiPrompt && (
              <div className="flex justify-end">
                <CopyBtn
                  text={prompt.prompt_text}
                  className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                />
              </div>
            )}
            <p className="text-[10px] text-gray-300">
              Generated {new Date(prompt.prompt_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-gray-400 text-sm mb-3">No content yet</p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating…' : '+ Generate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialContent: Record<string, ContentPrompt | null>
  initialMarketing: MarketingIdea[]
  onMarkUsed: (id: string) => Promise<void>
}

export default function ContentStudio({ initialContent, initialMarketing, onMarkUsed }: Props) {
  const [content, setContent] = useState<Record<string, ContentPrompt | null>>(initialContent)
  const [marketing, setMarketing] = useState<MarketingIdea[]>(initialMarketing)
  const [refreshingMarketing, setRefreshingMarketing] = useState(false)

  async function handleRefreshSlot(slot: SlotDef) {
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: slot.platform, content_type: slot.content_type }),
    })
    const data = await res.json()
    if (data.prompt) {
      setContent(prev => ({ ...prev, [slot.key]: data.prompt }))
    }
  }

  async function handleRefreshMarketing() {
    setRefreshingMarketing(true)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'marketing', content_type: 'ideas' }),
      })
      const data = await res.json()
      if (data.prompts) {
        setMarketing(data.prompts)
      }
    } finally {
      setRefreshingMarketing(false)
    }
  }

  const unusedMarketing = marketing.filter(m => !m.used)
  const usedMarketing   = marketing.filter(m => m.used)

  return (
    <div className="space-y-12">

      {/* ── VIDEO SCRIPTS ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold text-navy text-lg">🎬 Video Scripts</h2>
          <p className="text-xs text-gray-400 mt-0.5">Say these words on camera — no AI needed. Hit Refresh any time for a fresh script.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {VIDEO_SLOTS.map(slot => (
            <SlotCard
              key={slot.key}
              slot={slot}
              prompt={content[slot.key] ?? null}
              onRefresh={handleRefreshSlot}
            />
          ))}
        </div>
      </section>

      {/* ── CHATGPT PROMPTS ────────────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold text-navy text-lg">🤖 ChatGPT Prompts</h2>
          <p className="text-xs text-gray-400 mt-0.5">Copy → paste into ChatGPT → edit the output → post. Hit Refresh for a new angle.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PROMPT_SLOTS.map(slot => (
            <SlotCard
              key={slot.key}
              slot={slot}
              prompt={content[slot.key] ?? null}
              onRefresh={handleRefreshSlot}
            />
          ))}
        </div>
      </section>

      {/* ── MARKETING IDEAS ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-navy text-lg">💡 Marketing Ideas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Starting points — add your own spin. These need a human to execute well.</p>
          </div>
          <button
            onClick={handleRefreshMarketing}
            disabled={refreshingMarketing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy px-3 py-1.5 rounded-lg border border-gray-200 hover:border-navy/30 transition-colors disabled:opacity-40"
          >
            <span className={refreshingMarketing ? 'animate-spin' : ''}>↻</span>
            {refreshingMarketing ? 'Generating…' : 'New ideas'}
          </button>
        </div>

        {marketing.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">No marketing ideas yet</p>
            <button
              onClick={handleRefreshMarketing}
              disabled={refreshingMarketing}
              className="text-sm font-medium bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {refreshingMarketing ? 'Generating…' : '+ Generate ideas'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {unusedMarketing.map(idea => {
              const meta = mktLabel(idea.platform)
              return (
                <div key={idea.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.emoji} {meta.label}</span>
                      {idea.theme && <span className="text-[11px] text-gray-400">{idea.theme}</span>}
                    </div>
                    <form action={onMarkUsed.bind(null, idea.id)}>
                      <button type="submit" className="text-xs text-gray-400 hover:text-green-600 whitespace-nowrap transition-colors">✓ Done</button>
                    </form>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{idea.prompt_text}</p>
                </div>
              )
            })}
            {usedMarketing.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-300 mb-2 px-1">Completed</p>
                {usedMarketing.map(idea => {
                  const meta = mktLabel(idea.platform)
                  return (
                    <div key={idea.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-2 opacity-40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-500">{meta.emoji} {meta.label}</span>
                        <span className="text-[10px] text-green-500">✓ Done</span>
                      </div>
                      <p className="text-xs text-gray-500">{idea.prompt_text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
