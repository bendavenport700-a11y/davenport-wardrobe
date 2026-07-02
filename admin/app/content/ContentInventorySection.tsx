'use client'

import { useState, useTransition } from 'react'

interface InventoryPiece {
  id: string
  name: string
  brand: string
  images: string[] | null
  rental_fee: number
  wear_count: number
  category: string
  created_at: string
  announced_at: string | null
}

function buildPrompt(piece: InventoryPiece): string {
  const priceDollars = Math.round(piece.rental_fee / 100)
  const price = `$${priceDollars}/mo`
  const isNew = piece.wear_count === 0

  return `You're helping me build a Canva graphic and Instagram caption for a new inventory drop at Davenport Wardrobe — a premium menswear rental in Connecticut.

NEW PIECE:
• Brand: ${piece.brand}
• Item: ${piece.name}
• Category: ${piece.category}
• Rental rate: ${price}
• Condition: ${isNew ? 'Brand new — tags still on' : 'Pristine'}

PHOTO: I'm using the product photo as-is — just the garment on a clean background. Do NOT describe or suggest adding a person. The photo is already chosen.

---

Give me the full post in two labeled sections:

SECTION 1 — CANVA TEXT OVERLAY
Use this exact layout structure (I'm building it in Canva):

TOP HEADLINE: NEW INVENTORY (bold, large — or "NEW INVENTORY ALERT", use one or the other)

BRAND LINE (directly below headline): JUST ADDED: ${piece.brand.toUpperCase()}

INFO BOX (two columns, sits below the photo):
• Left column — Hanger icon + rental line:
  Line 1: RENT FOR ${price}
  Line 2: ${isNew ? 'Brand new. Tags on.' : 'Pristine condition.'}
• Right column — Tag icon + buyout line:
  Line 1: LOVE IT?
  Line 2: BUY IT AT A DISCOUNT.

FEATURE STRIP (three short phrases in a row below the info box — write fresh copy each time, keep the 3-column structure):
• [Benefit about variety/newness, e.g. "New styles every month"]
• [Benefit about flexibility, e.g. "Swap or cancel anytime"]
• [Benefit about no commitment, e.g. "No long-term commitments"]
Change the exact wording to feel fresh — don't reuse the same phrases every post.

CTA BAR (bottom strip, dark background):
[Punchy 4–5 word tagline — write a new one each time]. LINK IN BIO TO GET STARTED. →
Example format: "Look good. Spend less." — write a fresh version, same structure.

---

SECTION 2 — INSTAGRAM CAPTION
Keep it short — 3 lines max, no hashtags.

Line 1: [Announce the drop — name the brand and item, make it feel like news]
Line 2: [Price + one key detail — e.g. "${price}. ${isNew ? 'Tags still on.' : 'Pristine.'}  Love it? Buy it at a discount."]
Line 3: Download Davenport. Link in bio.

---

Brand voice: Direct, premium, real. Like a stylish friend texting you about a find — not a brand account.`
}

function PieceCard({
  piece,
  onMarkAnnounced,
  onDismiss,
}: {
  piece: InventoryPiece
  onMarkAnnounced: (id: string) => Promise<void>
  onDismiss: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const imageUrl = piece.images?.[0] ?? ''
  const prompt = buildPrompt(piece)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMark() {
    onDismiss(piece.id)
    startTransition(async () => {
      await onMarkAnnounced(piece.id)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${piece.brand} ${piece.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-5xl">👔</span>
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{piece.brand}</p>
          <p className="text-sm font-bold text-navy leading-snug mt-0.5">{piece.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">${(piece.rental_fee / 100).toFixed(0)}/mo · {piece.category}</p>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-navy text-white hover:bg-navy/90'
          }`}
        >
          {copied ? '✓ Copied to clipboard' : 'Copy ChatGPT Prompt'}
        </button>

        <button
          onClick={handleMark}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1 disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Mark as posted'}
        </button>
      </div>
    </div>
  )
}

export default function ContentInventorySection({
  pieces,
  onMarkAnnounced,
}: {
  pieces: InventoryPiece[]
  onMarkAnnounced: (id: string) => Promise<void>
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = pieces.filter(p => !p.announced_at && !dismissed.has(p.id))

  function handleDismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
  }

  if (pieces.filter(p => !p.announced_at).length === 0) {
    return (
      <section className="mb-10">
        <SectionHeader title="New Inventory" count={0} />
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-10 text-center">
          <p className="text-navy font-semibold mb-1">All caught up</p>
          <p className="text-sm text-gray-400">Add new pieces in the Pieces page — they'll show up here ready to post.</p>
        </div>
      </section>
    )
  }

  if (visible.length === 0) {
    return (
      <section className="mb-10">
        <SectionHeader title="New Inventory" count={0} />
        <div className="bg-green-50 rounded-2xl border border-green-100 px-6 py-8 text-center">
          <p className="text-green-700 font-semibold">All new pieces posted ✓</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <SectionHeader title="New Inventory" count={visible.length} badge="to post" />
      <p className="text-xs text-gray-400 mb-5">
        Copy the prompt → paste into ChatGPT → post the image with the output. Mark as posted when done.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(piece => (
          <PieceCard
            key={piece.id}
            piece={piece}
            onMarkAnnounced={onMarkAnnounced}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </section>
  )
}

export function SectionHeader({
  title,
  count,
  badge,
}: {
  title: string
  count: number
  badge?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-bold text-navy text-base">{title}</h2>
      {count > 0 && badge && (
        <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {count} {badge}
        </span>
      )}
    </div>
  )
}
