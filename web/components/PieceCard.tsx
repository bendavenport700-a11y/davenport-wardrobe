import Image from 'next/image'
import Link from 'next/link'
import { formatCents } from '@/lib/format'

interface Piece {
  id: string
  name: string
  brand: string
  images: string[] | null
  rental_fee: number
  buyout_price: number
  wear_count: number
  category: string
  sizes_available: string[]
}

function conditionLabel(wears: number) {
  if (wears === 0)  return 'Pristine'
  if (wears <= 5)   return 'Seasoned'
  if (wears <= 10)  return 'Refined'
  return 'Veteran'
}

export function PieceCard({ piece }: { piece: Piece }) {
  const image = piece.images?.[0]
  const rental = formatCents(piece.rental_fee)

  return (
    <Link href={`/piece/${piece.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 hover:border-navy/20 hover:shadow-md transition-all duration-300">
        {/* Image */}
        <div className="aspect-[3/4] bg-sand/50 relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={`${piece.brand} ${piece.name}`}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-5xl text-navy/15">D</span>
            </div>
          )}
          {/* Condition badge */}
          {piece.wear_count === 0 && (
            <div className="absolute top-2.5 left-2.5">
              <span className="text-xs font-sans font-medium bg-navy text-cream px-2.5 py-1 rounded-full">
                Pristine
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs font-sans text-slate/70 uppercase tracking-wider mb-0.5">{piece.brand}</p>
          <p className="font-sans text-sm font-semibold text-navy leading-snug mb-3 line-clamp-1">{piece.name}</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-serif text-xl font-bold text-navy">{rental}</span>
              <span className="font-sans text-xs text-slate">/mo</span>
            </div>
            {piece.sizes_available?.length > 0 && (
              <span className="font-sans text-xs text-slate/60">
                {piece.sizes_available.length} size{piece.sizes_available.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
