'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

const SOCIAL_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  tiktok:          { label: 'TikTok',    color: 'bg-black text-white',                                    emoji: '🎵' },
  instagram_reel:  { label: 'IG Reel',   color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', emoji: '🎬' },
  instagram_post:  { label: 'IG Post',   color: 'bg-pink-500 text-white',                                  emoji: '📸' },
}

const MARKETING_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  flyer:             { label: 'Flyer',         color: 'bg-amber-100 text-amber-800',     emoji: '📄' },
  partnership:       { label: 'Partnership',   color: 'bg-blue-100 text-blue-800',       emoji: '🤝' },
  email_campaign:    { label: 'Email',         color: 'bg-green-100 text-green-800',     emoji: '✉️' },
  local_outreach:    { label: 'Local',         color: 'bg-orange-100 text-orange-800',   emoji: '📍' },
  social_ad:         { label: 'Social Ad',     color: 'bg-purple-100 text-purple-800',   emoji: '📣' },
  linkedin:          { label: 'LinkedIn',      color: 'bg-sky-100 text-sky-800',         emoji: '💼' },
  community:         { label: 'Community',     color: 'bg-teal-100 text-teal-800',       emoji: '🏘️' },
  referral:          { label: 'Referral',      color: 'bg-rose-100 text-rose-800',       emoji: '🔗' },
}

function marketingLabel(platform: string) {
  return MARKETING_LABELS[platform] ?? { label: platform, color: 'bg-gray-100 text-gray-700', emoji: '💡' }
}

async function markUsed(id: string) {
  'use server'
  await supabaseAdmin.from('content_prompts').update({ used: true }).eq('id', id)
  revalidatePath('/content')
}

async function getPrompts() {
  noStore()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todaySocial }, { data: todayMarketing }, { data: recentSocial }, { data: recentMarketing }] = await Promise.all([
    supabaseAdmin.from('content_prompts').select('*').eq('prompt_date', today).eq('category', 'social_video').order('platform'),
    supabaseAdmin.from('content_prompts').select('*').eq('prompt_date', today).eq('category', 'marketing_idea').order('created_at'),
    supabaseAdmin.from('content_prompts').select('*').eq('category', 'social_video').lt('prompt_date', today).order('prompt_date', { ascending: false }).limit(9),
    supabaseAdmin.from('content_prompts').select('*').eq('category', 'marketing_idea').lt('prompt_date', today).order('prompt_date', { ascending: false }).limit(6),
  ])

  return {
    today,
    todaySocial:    todaySocial    ?? [],
    todayMarketing: todayMarketing ?? [],
    recentSocial:   recentSocial   ?? [],
    recentMarketing: recentMarketing ?? [],
  }
}

export default async function ContentPage() {
  const { today, todaySocial, todayMarketing, recentSocial, recentMarketing } = await getPrompts()

  const unusedSocial = todaySocial.filter(p => !p.used)
  const usedSocial   = todaySocial.filter(p => p.used)
  const unusedMarketing = todayMarketing.filter(p => !p.used)
  const usedMarketing   = todayMarketing.filter(p => p.used)

  const todayLabel = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Content Studio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Daily social scripts + marketing strategy ideas — generated fresh each morning
        </p>
      </div>

      {/* ── SOCIAL SCRIPTS ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold text-navy">Today&rsquo;s Social Scripts</h2>
          <span className="text-xs text-gray-400">{todayLabel}</span>
        </div>

        {todaySocial.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-gray-600 font-medium">No scripts yet for today</p>
            <p className="text-sm text-gray-400 mt-1">The Content routine generates 3 scripts every morning at 7 AM</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {unusedSocial.map(prompt => {
              const meta = SOCIAL_LABELS[prompt.platform] ?? { label: prompt.platform, color: 'bg-gray-200 text-gray-700', emoji: '📱' }
              return (
                <div key={prompt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    {prompt.theme && (
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{prompt.theme}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{prompt.prompt_text}</p>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <form action={markUsed.bind(null, prompt.id)}>
                      <button type="submit" className="text-xs text-gray-400 hover:text-navy transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        Mark as used ✓
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}

            {usedSocial.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-2 px-1">Used today</p>
                {usedSocial.map(prompt => {
                  const meta = SOCIAL_LABELS[prompt.platform] ?? { label: prompt.platform, color: 'bg-gray-200 text-gray-700', emoji: '📱' }
                  return (
                    <div key={prompt.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-2 opacity-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-gray-400">{meta.emoji} {meta.label}</span>
                        <span className="text-[10px] text-green-600">✓ Used</span>
                      </div>
                      <p className="text-xs text-gray-500">{prompt.prompt_text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── MARKETING STRATEGY IDEAS ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-navy">Today&rsquo;s Marketing Ideas</h2>
          <span className="text-xs text-gray-400">{todayLabel}</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Specific, actionable ideas for growing Davenport — flyers, partnerships, emails, outreach. Each doable in under 2 hours.
        </p>

        {todayMarketing.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-2xl mb-2">💡</p>
            <p className="text-gray-600 font-medium">No marketing ideas yet for today</p>
            <p className="text-sm text-gray-400 mt-1">The Marketing Ideas routine generates 3 ideas every morning at 7:05 AM</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {unusedMarketing.map(prompt => {
              const meta = marketingLabel(prompt.platform)
              return (
                <div key={prompt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    {prompt.theme && (
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{prompt.theme}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{prompt.prompt_text}</p>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <form action={markUsed.bind(null, prompt.id)}>
                      <button type="submit" className="text-xs text-gray-400 hover:text-navy transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        Mark as used ✓
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}

            {usedMarketing.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-2 px-1">Done today</p>
                {usedMarketing.map(prompt => {
                  const meta = marketingLabel(prompt.platform)
                  return (
                    <div key={prompt.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-2 opacity-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-gray-400">{meta.emoji} {meta.label}</span>
                        <span className="text-[10px] text-green-600">✓ Done</span>
                      </div>
                      <p className="text-xs text-gray-500">{prompt.prompt_text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── RECENT HISTORY ── */}
      {(recentSocial.length > 0 || recentMarketing.length > 0) && (
        <section>
          <h2 className="font-semibold text-navy mb-4">Previous Days</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Social history */}
            {recentSocial.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Social Scripts</p>
                <div className="flex flex-col gap-2">
                  {recentSocial.map(prompt => {
                    const meta = SOCIAL_LABELS[prompt.platform] ?? { label: prompt.platform, color: 'bg-gray-200 text-gray-700', emoji: '📱' }
                    return (
                      <div key={prompt.id} className={`bg-white rounded-xl border border-gray-100 p-4 ${prompt.used ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-gray-500">{meta.emoji} {meta.label}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(prompt.prompt_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {prompt.used && <span className="text-[10px] text-green-500">✓</span>}
                        </div>
                        <p className="text-xs text-gray-600 ">{prompt.prompt_text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Marketing ideas history */}
            {recentMarketing.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Marketing Ideas</p>
                <div className="flex flex-col gap-2">
                  {recentMarketing.map(prompt => {
                    const meta = marketingLabel(prompt.platform)
                    return (
                      <div key={prompt.id} className={`bg-white rounded-xl border border-gray-100 p-4 ${prompt.used ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-gray-500">{meta.emoji} {meta.label}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(prompt.prompt_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {prompt.used && <span className="text-[10px] text-green-500">✓</span>}
                        </div>
                        <p className="text-xs text-gray-600 ">{prompt.prompt_text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
