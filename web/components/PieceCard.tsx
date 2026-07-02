import Image from 'next/image'
import Link from 'next/link'
import { formatCentsPerMonth } from '@/lib/format'

interface Piece {
  id: string
  name: string
  brand: string
  images: string[] | null
  rental_fee: number
  buyout_price: number
  wear_count: number
  discount_pct?: number
  category: string
  sizes_available: string[]
}

function conditionLabel(wears: number) {
  if (wears === 0)  return 'Pristine'
  if (wears <= 5)   return 'Excellent'
  if (wears <= 10)  return 'Well-Worn'
  return 'Veteran'
}

export function PieceCard({ piece }: { piece: Piece }) {
  const image = piece.images?.[0]
  const onSale = (piece.discount_pct ?? 0) > 0
  const discountedFee = onSale
    ? Math.round(piece.rental_fee * (1 - (piece.discount_pct ?? 0) / 100))
    : null

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
          {/* Sale badge */}
          {onSale && (
            <div className="absolute top-2.5 right-2.5">
              <span className="text-[10px] font-sans font-bold bg-accent text-cream px-2.5 py-1 rounded-full tracking-wide">
                {piece.discount_pct}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-3 pt-2.5 pb-3">
          <p className="text-[10px] font-sans text-slate/60 uppercase tracking-widest mb-0.5">{piece.brand}</p>
          <p className="font-sans text-[13px] font-bold text-navy leading-snug mb-1.5 line-clamp-2">{piece.name}</p>
          {onSale ? (
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-serif text-[17px] font-bold text-accent">
                {formatCentsPerMonth(discountedFee)}
              </span>
              <span className="font-sans text-[11px] text-slate/40 line-through">
                {formatCentsPerMonth(piece.rental_fee)}
              </span>
            </div>
          ) : (
            <p className="font-serif text-[17px] font-bold text-navy mt-1.5">
              {formatCentsPerMonth(discountedFee ?? piece.rental_fee)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
