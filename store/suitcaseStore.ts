import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { multiPieceDiscount } from '@/utils/pricing'
import { DEPOSIT_CENTS, HANDLING_CENTS } from '@/constants/billing'
import type { SuitcaseItem, Piece } from '@/types'

interface SuitcaseStore {
  items: SuitcaseItem[]
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  addItem: (piece: Piece, size: string) => void
  removeItem: (pieceId: string, size: string) => void
  clearSuitcase: () => void
  hasItem: (pieceId: string, size: string) => boolean
  monthlyTotalCents: () => number
  handlingFeeCents: () => number
  depositCents: (hasDepositOnFile: boolean) => number
}

export const useSuitcaseStore = create<SuitcaseStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addItem: (piece, size) => {
        if (get().hasItem(piece.id, size)) return
        set(s => ({
          items: [...s.items, {
            piece_id: piece.id, piece, size,
            rental_fee_cents: piece.rental_fee,
          }],
        }))
      },
      removeItem: (pieceId, size) =>
        set(s => ({ items: s.items.filter(i => !(i.piece_id === pieceId && i.size === size)) })),
      clearSuitcase: () => set({ items: [] }),
      hasItem: (pieceId, size) =>
        get().items.some(i => i.piece_id === pieceId && i.size === size),
      monthlyTotalCents: () =>
        get().items.reduce((sum, i) => sum + i.rental_fee_cents, 0),
      handlingFeeCents: () => HANDLING_CENTS,
      depositCents: (hasDepositOnFile) => hasDepositOnFile ? 0 : DEPOSIT_CENTS,
    }),
    {
      name: 'davenport-suitcase',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Suitcase store rehydration failed:', error)
        // state is undefined when AsyncStorage fails entirely — always force-set hydrated
        // so the Suitcase screen never gets permanently stuck on the skeleton
        if (state) {
          state.setHasHydrated(true)
        } else {
          useSuitcaseStore.getState().setHasHydrated(true)
        }
      },
    }
  )
)

export function useSuitcaseHydrated() {
  return useSuitcaseStore(s => s._hasHydrated)
}
