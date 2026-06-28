import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PieceForm } from '@/components/PieceForm'
import type { Wardrobe } from '@/lib/types'

async function getWardrobes() {
  noStore()
  const { data } = await supabaseAdmin.from('wardrobes').select('id, name, slug').eq('is_active', true).order('sort_order')
  return (data ?? []) as Wardrobe[]
}

export default async function NewPiecePage({ searchParams }: { searchParams: { wardrobe?: string } }) {
  const wardrobes = await getWardrobes()
  const defaultWardrobeId = searchParams.wardrobe ?? ''
  const defaultWardrobe = wardrobes.find(w => w.id === defaultWardrobeId)

  return (
    <div className="p-8">
      <div className="mb-6">
        {defaultWardrobe ? (
          <a href={`/wardrobes/${defaultWardrobeId}`} className="text-sm text-gray-500 hover:text-navy">
            ← {defaultWardrobe.name}
          </a>
        ) : (
          <a href="/pieces" className="text-sm text-gray-500 hover:text-navy">← Pieces</a>
        )}
        <h1 className="text-2xl font-bold text-navy mt-1">Add Piece</h1>
        {defaultWardrobe && (
          <p className="text-sm text-navy/60 mt-0.5">Adding to: <span className="font-medium text-navy">{defaultWardrobe.name}</span></p>
        )}
      </div>
      <PieceForm wardrobes={wardrobes} defaultWardrobeId={defaultWardrobeId} />
    </div>
  )
}
