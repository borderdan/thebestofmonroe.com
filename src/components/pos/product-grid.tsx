/* eslint-disable @next/next/no-img-element */
'use client'

import { useCartStore, CartItem } from '@/stores/use-cart-store'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface MenuItem {
  id: string
  data: {
    name?: string
    price?: number
    image_url?: string
    category?: string
    stock?: number
    [key: string]: unknown
  }
  is_active: boolean | null
}

interface ProductGridProps {
  items: MenuItem[]
}

export function ProductGrid({ items }: ProductGridProps) {
  const t = useTranslations('pos')
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      id: item.id,
      name: (item.data?.name as string) || 'Unnamed',
      price: Number(item.data?.price) || 0,
      quantity: 1,
      category: (item.data?.category as string) || undefined,
    }
    addItem(cartItem)
    toast.success(`${cartItem.name} added`)
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 bg-muted/30 rounded-xl border border-dashed flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-lg">{t('noItemsFound')}</p>
          <p className="text-muted-foreground text-sm">
            {t('noItemsSub')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((item) => {
          const name = (item.data?.name as string) || 'Unnamed'
          const price = Number(item.data?.price) || 0
          const imageUrl = item.data?.image_url as string | undefined
          const stock = (item.data?.stock_level != null ? Number(item.data.stock_level) : (item.data?.stock != null ? Number(item.data.stock) : null))
          const isOutOfStock = stock !== null && stock <= 0

          return (
            <button
              key={item.id}
              onClick={() => handleAddToCart(item)}
              disabled={isOutOfStock}
              data-testid="product-card"
              className="group relative flex flex-col items-center rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Image */}
              <div className="w-full aspect-square rounded-lg bg-muted/50 mb-2 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-3xl text-muted-foreground/40">
                    🍽️
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="w-full space-y-1">
                <p className="font-medium text-sm leading-tight truncate">{name}</p>
                <p className="text-primary font-bold text-base">${price.toFixed(2)}</p>
              </div>

              {/* Stock badge */}
              {stock !== null && (
                <span className={`absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-destructive/10 text-destructive'
                    : stock <= 5
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {isOutOfStock ? 'Out' : `${stock}`}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
