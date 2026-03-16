import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../use-cart-store'

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset Zustand store state between tests
    useCartStore.setState({
      items: [],
      taxRate: 0.16,
    })
  })

  it('adds a new item to the cart', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'ent-123', name: 'Premium Theme', price: 1000, quantity: 1 })
    
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0]?.name).toBe('Premium Theme')
  })

  it('increments quantity when adding an existing item', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'ent-123', name: 'Premium Theme', price: 1000, quantity: 1 })
    store.addItem({ id: 'ent-123', name: 'Premium Theme', price: 1000, quantity: 2 })
    
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0]?.quantity).toBe(3)
  })

  it('correctly computes subtotals and 16% taxes', () => {
    const store = useCartStore.getState()
    
    // Add 2 items at $100 each = $200 subtotal
    store.addItem({ id: 'item-1', name: 'Card', price: 100, quantity: 2 })
    
    const { subtotal, tax, total } = useCartStore.getState().getTotals()
    
    expect(subtotal).toBe(200)
    expect(tax).toBe(32) // 16% of 200
    expect(total).toBe(232)
  })

  it('can clear the cart completely', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'item-1', name: 'Card', price: 100, quantity: 1 })
    store.clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
