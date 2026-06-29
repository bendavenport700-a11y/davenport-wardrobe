import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

const PIECE_COLS = 'id, name, brand, images, rental_fee, buyout_price, wear_count, discount_pct, category, sizes_available, is_featured, is_available, description, color, condition'

export async function getFeaturedPieces() {
  const { data } = await supabase
    .from('pieces')
    .select(PIECE_COLS)
    .eq('is_available', true)
    .eq('is_featured', true)
    .eq('is_draft', false)
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

export async function getAllPieces(gender?: string) {
  let q = supabase
    .from('pieces')
    .select(PIECE_COLS)
    .eq('is_available', true)
    .eq('is_draft', false)
  if (gender && gender !== 'all') q = q.eq('gender', gender)
  const { data } = await q.order('created_at', { ascending: false })
  return data ?? []
}

export async function getReadyToOwnPieces() {
  const { data } = await supabase
    .from('pieces')
    .select(PIECE_COLS)
    .gte('wear_count', 7)
    .eq('is_available', true)
    .eq('is_draft', false)
    .order('wear_count', { ascending: false })
    .limit(8)
  return data ?? []
}

export async function getPiece(id: string) {
  const { data } = await supabase
    .from('pieces')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getWardrobes() {
  const { data } = await supabase
    .from('wardrobes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

export async function getWardrobe(slug: string) {
  const { data } = await supabase
    .from('wardrobes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export async function getPiecesByWardrobe(wardrobeId: string) {
  const { data } = await supabase
    .from('pieces')
    .select(PIECE_COLS)
    .eq('wardrobe_id', wardrobeId)
    .eq('is_available', true)
    .eq('is_draft', false)
    .order('created_at', { ascending: false })
  return data ?? []
}
