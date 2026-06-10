import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PieceForm } from '@/components/PieceForm'
import type { Wardrobe } from '@/lib/types'

async function getWardrobes() {
  noStore()
  const { data } = await supabaseAdmin.from('wardrobes').select('id, name, slug').eq('is_active', true).order('sort_order')
  return (data ?? []) as Wardrobe[]
}

export default async function NewPiecePage() {
  const wardrobes = await getWardrobes()
  return (
    <div className="p-8">
      <div className="mb-6">
        <a href="/pieces" className="text-sm text-gray-500 hover:text-navy">← Pieces</a>
        <h1 className="text-2xl font-bold text-navy mt-1">Add Piece</h1>
      </div>
      <PieceForm wardrobes={wardrobes} />
    </div>
  )
}
