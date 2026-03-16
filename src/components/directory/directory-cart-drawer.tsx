'use client'

import { useState } from 'react'
import { useGuestCartStore } from '@/stores/use-guest-cart-store'
import { createGuestCheckoutPreference } from '@/lib/actions/guest-checkout'
import { Button } from '@/components/ui/button'
import { ShoppingCart, X, Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'

interface DirectoryCartDrawerProps {
  businessId: string
}

export function DirectoryCartDrawer({ businessId }: DirectoryCartDrawerProps) {
  const locale = useLocale()
  const { items, getTotals, updateQuantity, removeItem } = useGuestCartStore()
  const { total, itemCount } = getTotals()
  const [isOpen, setIsOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  if (itemCount === 0) return null

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const checkoutItems = items.map(i => ({
        entity_id: i.id,
        item_name: i.name,
        price_at_time: i.price,
        quantity: i.quantity
      }))
      
      const result = await createGuestCheckoutPreference(businessId, checkoutItems, locale)
      if (result.init_point) {
        window.location.href = result.init_point
      } else {
        toast.error('Failed to initiate checkout: ' + (result.error || 'Unknown error'))
        setIsCheckingOut(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to checkout: ' + message)
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg h-14 px-6 font-bold"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Cart • {itemCount}
          </Button>
        </div>
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center bg-muted/30">
          <h2 className="font-semibold text-lg flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Your Order
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-muted-foreground text-sm">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-4 text-center text-sm">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-muted/10 space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full text-lg h-12" 
            onClick={handleCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isCheckingOut ? 'Loading...' : 'Pay with MercadoPago'}
          </Button>
        </div>
      </div>
    </>
  )
}
