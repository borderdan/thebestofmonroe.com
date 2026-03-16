'use client'

import { useEffect } from 'react'
import { useGuestCartStore } from '@/stores/use-guest-cart-store'

export function ClearGuestCart() {
  const clearCart = useGuestCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return null
}
