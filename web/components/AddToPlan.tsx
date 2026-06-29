'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

interface Props {
  pieceId: string
  sizesAvailable: string[]
}

export function AddToPlan({ pieceId, sizesAvailable }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedSize, setSelectedSize] = useState(sizesAvailable[0] ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedPlanName, setSavedPlanName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (!uid) return
      supabase
        .from('trips')
        .select('id, name')
        .eq('user_id', uid)
        .eq('status', 'planning')
        .order('created_at', { ascending: false })
        .then(({ data: trips }) => {
          const list = trips ?? []
          setPlans(list)
          if (list.length > 0) setSelectedPlan(list[0].id)
        })
    })
  }, [])

  async function handleSave() {
    if (userId === null) {
      router.push(`/login?next=/piece/${pieceId}`)
      return
    }
    if (!selectedPlan || !selectedSize) return
    setSaving(true)
    setSaveError(null)
    const supabase = createSupabaseBrowser()
    const { error } = await supabase.from('trip_items').insert({
      trip_id: selectedPlan,
      piece_id: pieceId,
      size: selectedSize,
      sort_order: 0,
    })
    setSaving(false)
    if (error) {
      setSaveError('Could not save to plan. Try again.')
      return
    }
    const planName = plans.find(p => p.id === selectedPlan)?.name ?? 'plan'
    setSavedPlanName(planName)
    setSaved(true)
    setOpen(false)
  }

  if (sizesAvailable.length === 0) return null

  if (saved) {
    return (
      <div className="mt-3">
        <div className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span>✓ Saved to &ldquo;{savedPlanName}&rdquo;</span>
          <a href={`/plans`} className="text-xs text-green-800 underline underline-offset-2 ml-3">
            View plans →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => {
          if (userId === null) { router.push(`/login?next=/piece/${pieceId}`); return }
          if (userId === undefined) return
          setOpen(o => !o)
        }}
        className="w-full font-sans text-sm text-navy border border-navy/20 px-5 py-3 rounded-xl hover:bg-navy/5 transition-colors text-center"
      >
        {open ? 'Cancel' : 'Save to a Plan'}
      </button>

      {open && (
        <div className="mt-3 bg-white border border-sand rounded-xl p-5 space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-2">
              <p className="font-sans text-sm text-slate mb-3">You don&apos;t have any plans yet.</p>
              <a href="/plans/new" className="font-sans text-sm text-navy underline underline-offset-2">
                Create your first plan →
              </a>
            </div>
          ) : (
            <>
              {sizesAvailable.length > 1 && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-slate/50 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizesAvailable.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`font-sans text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          selectedSize === s
                            ? 'bg-navy text-cream border-navy'
                            : 'bg-white text-navy border-sand hover:border-navy/25'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-slate/50 mb-2">Plan</p>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  className="w-full font-sans text-sm border border-sand rounded-lg px-3 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-navy/15 bg-white"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 font-sans text-sm bg-navy text-cream px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save to Plan'}
                </button>
                <a
                  href="/plans/new"
                  className="font-sans text-xs text-slate hover:text-navy transition-colors px-3 flex items-center whitespace-nowrap"
                >
                  + New plan
                </a>
              </div>
              {saveError && (
                <p className="font-sans text-xs text-red-600">{saveError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
