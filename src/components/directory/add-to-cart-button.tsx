'use client'

import { useGuestCartStore } from '@/stores/use-guest-cart-store'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AddToCartButtonProps {
  item: {
    id: string
    name: string
    price: number
  }
}

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const t = useTranslations('common')
  const addItem = useGuestCartStore((state) => state.addItem)

  return (
    <Button 
      size="sm" 
      onClick={() => addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
      className="w-full mt-4"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {t('add')}
    </Button>
  )
}
