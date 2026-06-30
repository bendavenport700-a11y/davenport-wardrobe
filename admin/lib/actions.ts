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
  condition: 'new' | 'like_new' | 'good'
  gender?: 'men' | 'women' | 'unisex'
  cost_price: number
  base_rental_rate: number
  wear_count?: number
  discount_pct?: number
  images: string[]
  wardrobe_id: string | null
  source_url: string | null
  source_retailer: string | null
  is_featured: boolean
  is_draft: boolean
  is_available?: boolean
}

/** Reconcile piece_units to match desired quantities, then sync sizes_available + is_available. */
async function syncPieceUnits(pieceId: string, targetQty: Record<string, number>, initialWearCount = 0): Promise<{ error?: string }> {
  // Fetch all existing units for this piece
  const { data: existingUnits, error: fetchErr } = await supabaseAdmin
    .from('piece_units')
    .select('id, size, is_available')
    .eq('piece_id', pieceId)

  if (fetchErr) return { error: fetchErr.message }

  const bySize: Record<string, { id: string; is_available: boolean }[]> = {}
  for (const u of existingUnits ?? []) {
    if (!bySize[u.size]) bySize[u.size] = []
    bySize[u.size].push(u)
  }

  const allSizes = new Set([...Object.keys(targetQty), ...Object.keys(bySize)])

  for (const size of allSizes) {
    const target  = targetQty[size] ?? 0
    const current = bySize[size] ?? []
    const diff    = target - current.length

    if (diff > 0) {
      // Add new units
      const rows = Array.from({ length: diff }, () => ({ piece_id: pieceId, size, is_available: true, wear_count: initialWearCount }))
      const { error } = await supabaseAdmin.from('piece_units').insert(rows)
      if (error) return { error: error.message }
    } else if (diff < 0) {
      // Remove only available units (never remove rented ones)
      const removable = current.filter(u => u.is_available).slice(0, Math.abs(diff))
      if (removable.length > 0) {
        const { error } = await supabaseAdmin
          .from('piece_units')
          .delete()
          .in('id', removable.map(u => u.id))
        if (error) return { error: error.message }
      }
    }
  }

  // Re-sync sizes_available and is_available on the piece
  const { data: allUnits } = await supabaseAdmin
    .from('piece_units')
    .select('size, is_available')
    .eq('piece_id', pieceId)

  const availSizes = [...new Set((allUnits ?? []).filter(u => u.is_available).map(u => u.size))].sort()
  await supabaseAdmin
    .from('pieces')
    .update({ sizes_available: availSizes, is_available: availSizes.length > 0 })
    .eq('id', pieceId)

  return {}
}

export async function createPiece(input: PieceInput, sizeQty: Record<string, number> = {}): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabaseAdmin
    .from('pieces')
    .insert({ ...input, sizes_available: [], is_available: false })
    .select('id')
    .single()
  if (error) return { error: error.message }

  const syncErr = await syncPieceUnits(data.id, sizeQty, input.wear_count ?? 0)
  if (syncErr.error) return { error: syncErr.error }

  revalidatePath('/pieces')
  return { id: data.id }
}

export async function updatePiece(id: string, input: Partial<PieceInput>, sizeQty?: Record<string, number>): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('pieces').update(input).eq('id', id)
  if (error) return { error: error.message }

  if (sizeQty) {
    const syncErr = await syncPieceUnits(id, sizeQty, input.wear_count ?? 0)
    if (syncErr.error) return { error: syncErr.error }
  }

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

export async function markOrderSourcing(orderId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('orders').update({ status: 'sourcing' }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function markRentalPackaged(orderId: string, rentalId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('rentals').update({ status: 'packaged' }).eq('id', rentalId)
  if (error) return { error: error.message }

  // Auto-advance order to 'packaged' when every rental is packaged
  const { data: order } = await supabaseAdmin.from('orders').select('rental_ids').eq('id', orderId).single()
  if (order?.rental_ids?.length) {
    const { data: rentals } = await supabaseAdmin.from('rentals').select('status').in('id', order.rental_ids)
    if ((rentals ?? []).every(r => r.status === 'packaged')) {
      await supabaseAdmin.from('orders').update({ status: 'packaged' }).eq('id', orderId)
    }
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/rentals')
  return {}
}

export async function shipOrder(
  orderId: string,
  rentalIds: string[],
  tracking: string,
  carrier: string,
): Promise<{ error?: string }> {
  const now = new Date().toISOString()
  const { error: orderErr } = await supabaseAdmin.from('orders').update({ status: 'shipped' }).eq('id', orderId)
  if (orderErr) return { error: orderErr.message }
  for (const id of rentalIds) {
    const { error: rentalErr } = await supabaseAdmin.from('rentals').update({ status: 'shipped', tracking_number: tracking, carrier, shipped_at: now }).eq('id', id)
    if (rentalErr) return { error: `Rental ${id}: ${rentalErr.message}` }
  }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function markOrderDelivered(orderId: string, rentalIds: string[]): Promise<{ error?: string }> {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('orders').update({ status: 'delivered' }).eq('id', orderId)
  if (error) return { error: error.message }
  for (const id of rentalIds) {
    const { error: rentalErr } = await supabaseAdmin.from('rentals').update({ status: 'delivered', delivered_at: now }).eq('id', id)
    if (rentalErr) return { error: `Rental ${id}: ${rentalErr.message}` }
  }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function markOrderComplete(orderId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('orders').update({ status: 'complete' }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function markRentalReturned(orderId: string, rentalId: string): Promise<{ error?: string }> {
  const now = new Date().toISOString()
  const { data: rental, error: fetchErr } = await supabaseAdmin
    .from('rentals').select('piece_id, piece_unit_id, created_at, delivered_at, billing_active, user_id, rental_fee_cents').eq('id', rentalId).single()
  if (fetchErr) return { error: fetchErr.message }

  const { error } = await supabaseAdmin
    .from('rentals')
    .update({ status: 'returned', returned_at: now, billing_active: false })
    .eq('id', rentalId)
  if (error) return { error: error.message }

  // If billing was still active (admin bypassing normal request-return flow), decrement counters now
  if (rental?.billing_active && rental.user_id) {
    await supabaseAdmin.rpc('decrement_rental_counters', {
      p_user_id:   rental.user_id,
      p_fee_cents: rental.rental_fee_cents ?? 0,
    })
  }

  let pieceCondition: 'new' | 'like_new' | 'good' | null = null

  if (rental?.piece_unit_id) {
    // 1 wear = 1 month rented from delivery (Davenport definition)
    const rentalStart = rental.delivered_at ?? rental.created_at
    const monthsRented = Math.max(1, Math.round(
      (Date.now() - new Date(rentalStart).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))

    const { data: unit } = await supabaseAdmin
      .from('piece_units')
      .select('wear_count')
      .eq('id', rental.piece_unit_id)
      .single()

    const newWearCount = (unit?.wear_count ?? 0) + monthsRented
    pieceCondition = newWearCount === 0 ? 'new' : newWearCount <= 3 ? 'like_new' : 'good'

    await supabaseAdmin
      .from('piece_units')
      .update({ is_available: true, wear_count: newWearCount, condition: pieceCondition })
      .eq('id', rental.piece_unit_id)
  }

  if (rental?.piece_id) {
    // Re-sync piece availability from units
    const { data: units } = await supabaseAdmin
      .from('piece_units')
      .select('size, is_available')
      .eq('piece_id', rental.piece_id)
    const availSizes = [...new Set((units ?? []).filter(u => u.is_available).map(u => u.size))].sort()
    const pieceUpdate: Record<string, unknown> = { sizes_available: availSizes, is_available: availSizes.length > 0 }
    if (pieceCondition) pieceUpdate.condition = pieceCondition
    await supabaseAdmin
      .from('pieces')
      .update(pieceUpdate)
      .eq('id', rental.piece_id)

    // Increment pieces.wear_count to trigger the pricing refresh — reduces buyout_price
    // and rental_fee for future rentals, reflecting the piece has been worn once more.
    await supabaseAdmin.rpc('increment_wear_count', { p_piece_id: rental.piece_id })
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/rentals')
  return {}
}


export async function refundOrder(orderId: string, reason: string): Promise<{ error?: string }> {
  const fnBase = process.env.SUPABASE_FUNCTIONS_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.supabase.co', '.functions.supabase.co')
  const res = await fetch(
    `${fnBase}/v1/admin-refund-order`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ order_id: orderId, reason }),
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error ?? 'Refund failed' }
  }
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return {}
}

// ─── Wardrobes ─────────────────────────────────────────────────────────────

export async function updateWardrobe(
  id: string,
  updates: { name?: string; description?: string; cover_image_url?: string; is_active?: boolean; sort_order?: number; gender?: 'men' | 'women' | 'unisex'; tags?: string[] }
): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('wardrobes').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  revalidatePath(`/wardrobes/${id}`)
  return {}
}

export async function createWardrobe(input: {
  name: string; description: string; slug: string; tags: string[]; gender?: 'men' | 'women' | 'unisex'
}): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabaseAdmin.from('wardrobes').insert(input).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  return { id: data.id }
}

export async function deleteWardrobe(id: string): Promise<{ error?: string }> {
  // Unassign all pieces from this wardrobe before deleting
  await supabaseAdmin.from('pieces').update({ wardrobe_id: null }).eq('wardrobe_id', id)
  const { error } = await supabaseAdmin.from('wardrobes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  revalidatePath('/pieces')
  return {}
}

export async function setPieceWardrobe(pieceId: string, wardrobeId: string | null): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('pieces').update({ wardrobe_id: wardrobeId }).eq('id', pieceId)
  if (error) return { error: error.message }
  revalidatePath('/wardrobes')
  revalidatePath('/pieces')
  return {}
}

// ─── Announcements ─────────────────────────────────────────────────────────

export async function createAnnouncement(input: {
  message: string
  icon: string
  sort_order: number
}): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('announcements').insert({ ...input, active: true })
  if (error) return { error: error.message }
  revalidatePath('/announcements')
  return {}
}

export async function toggleAnnouncement(id: string, active: boolean): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin
    .from('announcements')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/announcements')
  return {}
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/announcements')
  return {}
}
