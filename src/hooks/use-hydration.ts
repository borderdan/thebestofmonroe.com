'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/use-cart-store'

/**
 * Hook to safely hydrate the Zustand cart store from IndexedDB.
 * Prevents SSR hydration mismatch by only hydrating on the client.
 * 
 * @returns true once the store is hydrated from IndexedDB
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    // Trigger rehydration
    useCartStore.persist.rehydrate()

    // If already hydrated (e.g., synchronous storage)
    if (useCartStore.persist.hasHydrated()) {
      queueMicrotask(() => setHydrated(true))
    }

    return () => {
      unsubFinishHydration()
    }
  }, [])

  return hydrated
}
