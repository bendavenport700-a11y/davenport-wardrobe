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
  if (wears === 0) return 'New'
  if (wears <= 3) return 'Like New'
  if (wears <= 8) return 'Good'
  return 'Well Loved'
}

export function PieceCard({ piece }: { piece: Piece }) {
  const image = piece.images?.[0]
  const rental = formatCents(piece.rental_fee)
  const buyout = formatCents(piece.buyout_price)

  return (
    <Link href={`/piece/${piece.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-sand hover:border-navy/30 transition-colors">
        {/* Image */}
        <div className="aspect-[3/4] bg-sand relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={`${piece.brand} ${piece.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-4xl text-navy/20">D</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="text-xs font-sans bg-white/90 backdrop-blur-sm text-navy px-2 py-1 rounded-full">
              {conditionLabel(piece.wear_count)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs font-sans text-slate uppercase tracking-wider mb-1">{piece.brand}</p>
          <p className="font-serif text-base font-semibold text-navy leading-snug mb-3">{piece.name}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-serif font-bold text-navy">{rental}<span className="text-sm font-sans font-normal text-slate">/mo</span></p>
              <p className="text-xs font-sans text-slate mt-0.5">Buy for {buyout}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {piece.sizes_available?.slice(0, 3).map(s => (
                <span key={s} className="text-xs font-sans bg-sand text-navy px-1.5 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
