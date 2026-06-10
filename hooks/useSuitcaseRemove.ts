import { useCallback } from 'react'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

// Removes an item from both the local store and the server suitcase.
// Use this instead of removeItem directly so removals are durable across sessions.
export function useSuitcaseRemove() {
  const removeItem = useSuitcaseStore(s => s.removeItem)
  const userId = useAuthStore(s => s.session?.user.id)

  return useCallback((pieceId: string, size: string) => {
    removeItem(pieceId, size)
    if (userId) {
      supabase.from('suitcase_items')
        .delete()
        .eq('user_id', userId)
        .eq('piece_id', pieceId)
        .eq('size', size)
        .then(({ error }) => {
          if (error) console.error('Failed to sync suitcase removal to server:', error.message)
        })
    }
  }, [removeItem, userId])
}
