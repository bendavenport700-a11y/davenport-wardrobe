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
  tip: string
  isPrompt: boolean
}

const VIDEO_SLOTS: SlotDef[] = [
  { key: 'tiktok:script',         platform: 'tiktok',         content_type: 'script',    label: 'TikTok Script',  tip: 'Say this on camera',  isPrompt: false },
  { key: 'instagram_reel:script', platform: 'instagram_reel', content_type: 'script',    label: 'IG Reel Script', tip: 'Say this on camera',  isPrompt: false },
]

const PROMPT_SLOTS: SlotDef[] = [
  { key: 'tiktok:ai_prompt',             platform: 'tiktok',             content_type: 'ai_prompt', label: 'TikTok',     tip: 'Paste into ChatGPT', isPrompt: true },
  { key: 'instagram_post:ai_prompt',     platform: 'instagram_post',     content_type: 'ai_prompt', label: 'IG Post',    tip: 'Paste into ChatGPT', isPrompt: true },
  { key: 'instagram_carousel:ai_prompt', platform: 'instagram_carousel', content_type: 'ai_prompt', label: 'Carousel',   tip: 'Paste into ChatGPT', isPrompt: true },
]

const MKT_META: Record<string, { label: string; color: string }> = {
  flyer:          { label: 'Flyer',       color: 'bg-amber-100 text-amber-700' },
  partnership:    { label: 'Partnership', color: 'bg-blue-100 text-blue-700' },
  email_campaign: { label: 'Email',       color: 'bg-green-100 text-green-700' },
  local_outreach: { label: 'Local',       color: 'bg-orange-100 text-orange-700' },
  social_ad:      { label: 'Social Ad',   color: 'bg-purple-100 text-purple-700' },
  linkedin:       { label: 'LinkedIn',    color: 'bg-sky-100 text-sky-700' },
  community:      { label: 'Community',   color: 'bg-teal-100 text-teal-700' },
  referral:       { label: 'Referral',    color: 'bg-rose-100 text-rose-700' },
}

// ── Shared components ─────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy/90 transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function RefreshBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-navy flex items-center gap-1 transition-colors disabled:opacity-40"
    >
      <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
      {loading ? 'Generating…' : 'Refresh'}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
}

// ── Slot card ─────────────────────────────────────────────────────────────────

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

  async function handleRefresh() {
    setLoading(true)
    try { await onRefresh(slot) } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-bold text-navy">{slot.label}</p>
          <p className="text-[11px] text-gray-400">{slot.tip}</p>
        </div>
        <RefreshBtn onClick={handleRefresh} loading={loading} />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {prompt ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line flex-1 min-h-[80px]">
              {prompt.prompt_text}
            </p>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-gray-300">
                {new Date(prompt.prompt_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              {slot.isPrompt && <CopyBtn text={prompt.prompt_text} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
            <p className="text-sm text-gray-400">Nothing generated yet</p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-sm font-semibold bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  initialContent: Record<string, ContentPrompt | null>
  initialMarketing: MarketingIdea[]
  onMarkUsed: (id: string) => Promise<void>
}

export default function ContentStudio({ initialContent, initialMarketing, onMarkUsed }: Props) {
  const [content, setContent] = useState<Record<string, ContentPrompt | null>>(initialContent)
  const [marketing, setMarketing] = useState<MarketingIdea[]>(initialMarketing)
  const [refreshingMarketing, setRefreshingMarketing] = useState(false)
  const [dismissedIdeas, setDismissedIdeas] = useState<Set<string>>(new Set())

  async function handleRefreshSlot(slot: SlotDef) {
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: slot.platform, content_type: slot.content_type }),
    })
    const data = await res.json()
    if (data.prompt) setContent(prev => ({ ...prev, [slot.key]: data.prompt }))
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
        setDismissedIdeas(new Set())
      }
    } finally {
      setRefreshingMarketing(false)
    }
  }

  function handleDismissIdea(id: string) {
    setDismissedIdeas(prev => new Set([...prev, id]))
    onMarkUsed(id)
  }

  const visibleIdeas = marketing.filter(m => !m.used && !dismissedIdeas.has(m.id))

  return (
    <div className="space-y-10">

      {/* ── VIDEO SCRIPTS ─────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Video Scripts — say these on camera</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {VIDEO_SLOTS.map(slot => (
            <SlotCard key={slot.key} slot={slot} prompt={content[slot.key] ?? null} onRefresh={handleRefreshSlot} />
          ))}
        </div>
      </section>

      {/* ── CHATGPT PROMPTS ───────────────────────────────────────────────── */}
      <section>
        <SectionLabel>ChatGPT Prompts — copy, paste, post</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PROMPT_SLOTS.map(slot => (
            <SlotCard key={slot.key} slot={slot} prompt={content[slot.key] ?? null} onRefresh={handleRefreshSlot} />
          ))}
        </div>
      </section>

      {/* ── MARKETING IDEAS ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Marketing Ideas</SectionLabel>
          <button
            onClick={handleRefreshMarketing}
            disabled={refreshingMarketing}
            className="text-xs text-gray-400 hover:text-navy flex items-center gap-1 transition-colors disabled:opacity-40"
          >
            <span className={refreshingMarketing ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            {refreshingMarketing ? 'Generating…' : 'New ideas'}
          </button>
        </div>

        {visibleIdeas.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              {marketing.length === 0 ? 'No ideas yet' : 'All done for today'}
            </p>
            <button
              onClick={handleRefreshMarketing}
              disabled={refreshingMarketing}
              className="text-sm font-semibold bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {refreshingMarketing ? 'Generating…' : 'Generate ideas'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleIdeas.map(idea => {
              const meta = MKT_META[idea.platform] ?? { label: idea.platform, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={idea.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      {idea.theme && <span className="text-[11px] text-gray-400">{idea.theme}</span>}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{idea.prompt_text}</p>
                  </div>
                  <button
                    onClick={() => handleDismissIdea(idea.id)}
                    className="shrink-0 text-xs text-gray-300 hover:text-green-600 transition-colors font-medium pt-0.5"
                  >
                    Done
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
