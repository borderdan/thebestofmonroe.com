import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface GuestCartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface GuestCartState {
  items: GuestCartItem[]
  addItem: (item: GuestCartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotals: () => { total: number; itemCount: number }
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id
                  ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }] }
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotals: () => {
        const { items } = get()
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
        return { total, itemCount }
      },
    }),
    {
      name: 'guest-cart-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
