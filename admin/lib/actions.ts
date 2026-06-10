'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from './supabase'
import type { PieceCategory, PieceColor } from './types'

// ─── Pieces ────────────────────────────────────────────────────────────────

interface PieceInput {
  name: string
  brand: string
  description: string
  category: PieceCategory
  color: PieceColor | null
  sizes_available: string[]
  condition: 'new' | 'like_new' | 'good'
  cost_price: number
  base_rental_rate: number
  images: string[]
  wardrobe_id: string | null
  source_url: string | null
  source_retailer: string | null
  is_featured: boolean
  is_draft: boolean
  is_available?: boolean
}

export async function createPiece(input: PieceInput): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabaseAdmin
    .from('pieces')
    .insert(input)
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/pieces')
  return { id: data.id }
}

export async function updatePiece(id: string, input: Partial<PieceInput>): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('pieces').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/pieces')
  revalidatePath(`/pieces/${id}`)
  return {}
}

export async function deletePiece(id: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('pieces').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/pieces')
  return {}
}

export async function incrementWearCount(pieceId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.rpc('increment_wear_count', { p_piece_id: pieceId })
  if (error) return { error: error.message }
  revalidatePath('/pieces')
  revalidatePath(`/pieces/${pieceId}`)
  return {}
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function updateOrderNotes(orderId: string, notes: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('orders').update({ notes }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function updateRentalTracking(
  rentalId: string,
  tracking_number: string,
  carrier: string,
  status: string
): Promise<{ error?: string }> {
  const updates: Record<string, string | boolean> = { tracking_number, carrier, status }
  if (status === 'shipped')   updates.shipped_at   = new Date().toISOString()
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()
  if (status === 'returned')  updates.returned_at  = new Date().toISOString()

  const { data: rental, error: fetchError } = await supabaseAdmin
    .from('rentals').select('piece_id').eq('id', rentalId).single()
  if (fetchError) return { error: fetchError.message }

  const { error } = await supabaseAdmin.from('rentals').update(updates).eq('id', rentalId)
  if (error) return { error: error.message }

  // Re-enable piece inventory when item is confirmed returned
  if (status === 'returned' && rental?.piece_id) {
    await supabaseAdmin.from('pieces').update({ is_available: true }).eq('id', rental.piece_id)
  }

  revalidatePath('/orders')
  return {}
}

// ─── Wardrobes ─────────────────────────────────────────────────────────────

export async function updateWardrobe(
  id: string,
  updates: { name?: string; description?: string; cover_image_url?: string; is_active?: boolean; sort_order?: number }
): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('wardrobes').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  return {}
}

export async function createWardrobe(input: {
  name: string; description: string; slug: string; tags: string[]
}): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabaseAdmin.from('wardrobes').insert(input).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  return { id: data.id }
}
