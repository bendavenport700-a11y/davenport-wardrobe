import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PieceCard } from '@/components/PieceCard'
import { getWardrobe, getPiecesByWardrobe } from '@/lib/supabase'

export const revalidate = 300

export default async function WardrobePage({ params }: { params: { slug: string } }) {
  const wardrobe = await getWardrobe(params.slug)
  if (!wardrobe) notFound()
  const pieces = await getPiecesByWardrobe(wardrobe.id)

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <div className="relative h-64 md:h-96 bg-navy overflow-hidden">
          {wardrobe.cover_image_url && (
            <Image
              src={wardrobe.cover_image_url}
              alt={wardrobe.name}
              fill
              className="object-cover opacity-60"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <Link href="/browse" className="font-sans text-sm text-cream/60 hover:text-cream mb-3 inline-block transition-colors">
              ← All Pieces
            </Link>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream">{wardrobe.name}</h1>
            {wardrobe.description && (
              <p className="font-sans text-cream/70 text-lg mt-2 max-w-xl">{wardrobe.description}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {wardrobe.tags?.length > 0 && (
          <div className="bg-cream border-b border-sand px-6 py-4">
            <div className="max-w-6xl mx-auto flex gap-2 flex-wrap">
              {wardrobe.tags.map((tag: string) => (
                <span key={tag} className="font-sans text-xs bg-navy/8 text-navy px-3 py-1.5 rounded-full border border-navy/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pieces */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {pieces.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-serif text-2xl text-navy mb-2">New pieces coming soon.</p>
              <p className="font-sans text-slate mb-6">This wardrobe is being curated right now.</p>
              <Link href="/browse" className="font-sans text-sm bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors">
                Browse All Pieces →
              </Link>
            </div>
          ) : (
            <>
              <p className="font-sans text-slate text-sm mb-8">{pieces.length} piece{pieces.length !== 1 ? 's' : ''} available</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {pieces.map(piece => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
