'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

/**
 * useInventorySync hook:
 * Manages the real-time state of products for a specific business.
 * Listens to INSERT, UPDATE, and DELETE events on the 'products' table.
 */
export function useInventorySync(initialProducts: Product[], businessId: string) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const supabase = createClient()

  useEffect(() => {
    if (!businessId) return

    console.log(`[REALTIME] Subscribing to products for business: ${businessId}`)

    // 1. Set up the Realtime subscription
    const channel = supabase
      .channel(`products_realtime_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('[REALTIME] Received change:', payload)

          if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as Product
            setProducts((prev) => [...prev, newProduct])
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as Product
            setProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            )
          } 
          else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            setProducts((prev) => prev.filter((p) => p.id !== deletedId))
          }
        }
      )
      .subscribe((status) => {
        console.log(`[REALTIME] Subscription status for ${businessId}:`, status)
      })

    // 2. Clean up the subscription on unmount
    return () => {
      console.log(`[REALTIME] Unsubscribing from products for ${businessId}`)
      supabase.removeChannel(channel)
    }
  }, [businessId, supabase])

  return products
}
