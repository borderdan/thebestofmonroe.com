import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// Custom IndexedDB storage adapter for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

interface CartState {
  items: CartItem[]
  taxRate: number // Default tax rate (e.g., 0.16 for 16% IVA)
  currentCurrency: string // Multi-currency support
  
  // Actions
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setTaxRate: (rate: number) => void
  setCurrentCurrency: (currency: string) => void
  
  // Computed (accessed via getters in components, but standard in Zustand as derived state if needed)
  getTotals: () => { subtotal: number; tax: number; total: number }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      taxRate: 0.16, // 16% Mexican IVA default
      currentCurrency: 'MXN', // Default to MXN

      addItem: (newItem) => {
        const price = Number(newItem.price) || 0
        const quantity = Number(newItem.quantity) || 1
        
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id
                  ? { ...i, quantity: i.quantity + quantity, price } // Allow price update too
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...newItem, price, quantity }] }
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

      setTaxRate: (rate) => set({ taxRate: rate }),

      setCurrentCurrency: (currency) => set({ currentCurrency: currency }),

      getTotals: () => {
        const { items, taxRate } = get()
        const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
        const tax = subtotal * (taxRate || 0.16)
        const total = subtotal + tax
        return {
          subtotal,
          tax,
          total,
        }
      },
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() => idbStorage),
      // Skip hydration during SSR to avoid mismatch errors
      skipHydration: true, 
    }
  )
)
