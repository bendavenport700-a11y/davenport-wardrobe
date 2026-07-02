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
  const price = `$${(piece.rental_fee / 100).toFixed(0)}/mo`
  return `Help me create a new inventory drop post for Davenport Wardrobe on Instagram.

New piece: ${piece.brand} ${piece.name}
Category: ${piece.category}
Monthly rental: ${price}
Condition: Pristine — never rented

I have a product photo of this piece. I need two things:

1. CANVA TEXT OVERLAY — what to put on top of the photo (keep it minimal, the photo is the hero):
   • Headline (4-6 words, bold — make it stop the scroll)
   • Price or value line (e.g. "${price}/mo" or "Rent before you own")
   • Badge or accent (e.g. "New Arrival" or "Now Renting")

2. INSTAGRAM CAPTION — to post alongside the image:
   • 2-3 punchy sentences
   • Hook in line 1
   • Mention the rental model naturally
   • End: "Now available at davenport.rentals"
   • 3-5 relevant hashtags at the end

Brand voice: Premium but real. Confident without being arrogant. Like a stylish friend telling you about a great find. Target: men 25-40, Connecticut.`
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-navy transition-colors"
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

function PieceCard({
  piece,
  onMarkAnnounced,
}: {
  piece: InventoryPiece
  onMarkAnnounced: (id: string) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const imageUrl = piece.images?.[0] ?? ''
  const prompt = buildPrompt(piece)
  const isAnnounced = !!piece.announced_at

  const daysAgo = Math.floor(
    (Date.now() - new Date(piece.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const freshnessLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`

  const announcedDaysAgo = piece.announced_at
    ? Math.floor((Date.now() - new Date(piece.announced_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  function handleMark() {
    startTransition(async () => {
      await onMarkAnnounced(piece.id)
    })
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-opacity ${isAnnounced ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
      {/* Image */}
      <div className="relative">
        {imageUrl ? (
          <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={`${piece.brand} ${piece.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-4xl">👔</span>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
          Added {freshnessLabel}
        </span>
        {isAnnounced && (
          <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              ✓ Posted {announcedDaysAgo === 0 ? 'today' : announcedDaysAgo === 1 ? 'yesterday' : `${announcedDaysAgo}d ago`}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{piece.brand}</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{piece.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-navy">${(piece.rental_fee / 100).toFixed(0)}/mo</span>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[10px] text-gray-400">{piece.category}</span>
          </div>
        </div>

        {/* Copy image URL */}
        {imageUrl && (
          <CopyButton text={imageUrl} label="Copy image URL" />
        )}

        {/* ChatGPT prompt */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">ChatGPT Caption Prompt</p>
            <CopyButton text={prompt} label="Copy prompt" />
          </div>
          <textarea
            readOnly
            value={prompt}
            rows={5}
            className="w-full text-[11px] text-gray-600 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-2.5 resize-none font-mono focus:outline-none focus:border-gray-300 cursor-text"
          />
        </div>

        {/* Mark as posted */}
        {!isAnnounced ? (
          <button
            onClick={handleMark}
            disabled={isPending}
            className="w-full text-sm font-medium py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-navy hover:text-white hover:border-navy transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving…' : '✓ Mark as Posted'}
          </button>
        ) : (
          <button
            onClick={handleMark}
            disabled={isPending}
            className="w-full text-xs py-2 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
          >
            {isPending ? '…' : 'Undo'}
          </button>
        )}
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
  const unannounced = pieces.filter(p => !p.announced_at)
  const announced   = pieces.filter(p => p.announced_at)

  if (pieces.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold text-navy">New Inventory Posts</h2>
          <span className="text-xs text-gray-400">Last 30 days</span>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-2xl mb-2">👔</p>
          <p className="text-gray-600 font-medium">No new pieces in the last 30 days</p>
          <p className="text-sm text-gray-400 mt-1">Add pieces to generate post prompts</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="font-semibold text-navy">New Inventory Posts</h2>
        {unannounced.length > 0 && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
            {unannounced.length} to post
          </span>
        )}
        {announced.length > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            {announced.length} posted ✓
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Copy a prompt into ChatGPT → get a caption → post with the piece image. Check it off when done.
      </p>

      {unannounced.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {unannounced.map(piece => (
            <PieceCard key={piece.id} piece={piece} onMarkAnnounced={onMarkAnnounced} />
          ))}
        </div>
      )}

      {announced.length > 0 && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Posted</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announced.map(piece => (
              <PieceCard key={piece.id} piece={piece} onMarkAnnounced={onMarkAnnounced} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
