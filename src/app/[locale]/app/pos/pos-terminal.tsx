'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/stores/use-cart-store'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import { ProductGrid } from '@/components/pos/product-grid'
import { CartSidebar } from '@/components/pos/cart-sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useInventorySync } from '@/hooks/use-inventory-sync'
import type { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

export interface MenuItem {
  id: string
  data: Record<string, unknown>
  is_active: boolean | null
  [key: string]: unknown
}

interface POSTerminalProps {
  initialProducts: Product[]
  initialCustomers: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    loyalty_points: number;
  }[]
  currencySettings: {
    currencies: {
      currency_code: string;
      is_default?: boolean;
      business_id?: string;
    }[]
    rates: {
      from_currency: string;
      to_currency: string;
      rate: number;
    }[]
  }
  businessId: string
}

export function POSTerminal({ initialProducts, initialCustomers, currencySettings, businessId }: POSTerminalProps) {
  const t = useTranslations('pos')
  const addItem = useCartStore((s) => s.addItem)
  const [manualCode, setManualCode] = useState('')

  // 1. Activate Realtime Sync for the current business
  const currentProducts = useInventorySync(initialProducts, businessId)

  // 2. Transform the raw product data to the legacy MenuItem format for UI compatibility
  const menuItems: MenuItem[] = currentProducts.map(p => ({
    id: p.id,
    business_id: p.business_id,
    type: 'menu_item',
    data: {
      name: p.name,
      price: Number(p.price),
      description: p.description,
      category: p.category,
      stock_level: p.stock_quantity,
      image_url: p.image_url,
      barcode: p.barcode,
      sku: p.sku
    },
    is_active: p.is_active,
    sort_order: p.sort_order,
    created_at: p.created_at,
    updated_at: p.updated_at
  }))

  const [isHydrated, setIsHydrated] = useState(false)
  // Hydrate Zustand store from IndexedDB on mount
  useEffect(() => {
    const hydrate = async () => {
      await useCartStore.persist.rehydrate()
      setIsHydrated(true)
    }
    hydrate()
  }, [])

  // Intercept hardware scanner inputs
  useBarcodeScanner({
    onScan: (barcode) => {
      // Look up barcode in menu items
      const found = menuItems.find(
        (item) => item.id === barcode || (item.data as Record<string, unknown>)?.sku === barcode || (item.data as Record<string, unknown>)?.barcode === barcode
      )

      if (found) {
        addItem({
          id: found.id,
          name: (found.data as Record<string, unknown>)?.name as string || 'Unnamed',
          price: Number((found.data as Record<string, unknown>)?.price) || 0,
          quantity: 1,
        })
        toast.success(`Scanned: ${(found.data as Record<string, unknown>)?.name as string || barcode}`)
      } else {
        toast.error(`Product not found: ${barcode}`)
      }
    },
  })

  // Handle manual code entry
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    const found = menuItems.find(
      (item: MenuItem) =>
        item.id === manualCode ||
        (item.data as Record<string, unknown>)?.sku === manualCode ||
        ((item.data as Record<string, unknown>)?.name as string || '').toLowerCase().includes(manualCode.toLowerCase())
    )

    if (found) {
      addItem({
        id: found.id,
        name: (found.data as Record<string, unknown>)?.name as string || 'Unnamed',
        price: Number((found.data as Record<string, unknown>)?.price) || 0,
        quantity: 1,
      })
    } else {
      toast.error(`No match: ${manualCode}`)
    }
    setManualCode('')
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6" data-testid={isHydrated ? "pos-ready" : "pos-hydrating"}>
      {/* LEFT PANEL: Grid / Scanner Input */}
      <div className="flex-1 flex flex-col gap-4" data-testid="pos-grid">
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
          <form onSubmit={handleManualAdd} className="w-full flex gap-3">
            <Input
              placeholder={t('scanPlaceholder')}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">{t('checkout') === 'Checkout' ? 'Add' : 'Agregar'}</Button>
          </form>
        </div>

        <ProductGrid items={menuItems as MenuItem[]} />
      </div>

      {/* RIGHT PANEL: The Cart / Ticket */}
      <CartSidebar 
        customers={initialCustomers} 
        currencySettings={currencySettings} 
      />
    </div>
  )
}
