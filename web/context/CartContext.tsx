'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  piece_id: string
  size: string
  rental_fee_cents: number
  wear_count_at_rental: number
  buyout_price_snapshot: number
  piece: {
    name: string
    brand: string
    images: string[]
    sizes_available: string[]
  }
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (piece_id: string, size: string) => void
  clearCart: () => void
  count: number
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  count: 0,
})

const STORAGE_KEY = 'davenport_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  const persist = (next: CartItem[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.piece_id === item.piece_id && i.size === item.size)
      if (exists) return prev
      const next = [...prev, item]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeItem = useCallback((piece_id: string, size: string) => {
    setItems(prev => {
      const next = prev.filter(i => !(i.piece_id === piece_id && i.size === size))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    persist([])
  }, [])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, count: items.length }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
