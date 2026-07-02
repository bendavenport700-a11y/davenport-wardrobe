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

  return `I'm attaching two images: the product photo and the Davenport logo (navy square with a silver D). Create a social media graphic using both.

PIECE:
• ${piece.brand} ${piece.name}
• ${piece.category}
• ${price}/mo to rent
• ${isNew ? 'Brand new — tags still on' : 'Pristine'}

Build the graphic with this exact layout:

BACKGROUND: Cream or off-white

HEADLINE (large, bold, dark navy): NEW INVENTORY
SUB-LINE (centered, below headline, with em-dashes): — JUST ADDED: ${piece.brand.toUpperCase()} —

PHOTO: Use the product photo I attached. Center it. Do not add a person or change the background.

DAVENPORT LOGO: Place it small in the bottom-left or bottom-right corner of the graphic.

INFO BOX (full-width bordered box below the photo, two columns):
Left column — hanger icon:
  RENT FOR ${price}
  ${isNew ? 'Brand new. Tags on.' : 'Pristine condition.'}
Right column — tag icon:
  Write a short 2-line phrase in this spirit: rent it first, wear it, then decide — buy it or send it back. No commitment. Something like "Rent it. Wear it." / "Buy it or send it back." — write a fresh version each time, keep it short and real.

FEATURE STRIP (three columns below the info box, small icons, mixed case):
Write 3 short phrases — fresh every time, 4–6 words each. These should subtly explain why renting beats buying outright. Think along the lines of: trying before committing, rotating your wardrobe without the cost, no long-term ties. Don't copy these examples exactly — write new ones each time. Style reference: "Fresh finds, always rotating" / "Swap when you're ready" / "No closet commitment"

BOTTOM BAR (dark navy background, two sides):
Left: a short punchy line — 4 to 6 words, something real, write a new one each time
Right: Download the app or visit davenport.rentals

---

After the graphic, give me the INSTAGRAM CAPTION separately (not in the image):
3 lines, no hashtags, keep it short.
Line 1: What just dropped — name the brand and item
Line 2: ${price}/mo. ${isNew ? 'Tags still on.' : 'Pristine.'} Rent it, wear it, buy it if you love it — or send it back.
Line 3: Download the Davenport app or shop at davenport.rentals`
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
