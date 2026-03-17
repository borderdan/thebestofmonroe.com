'use client'

import { useCartStore } from '@/stores/use-cart-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const currencies = [
  { value: 'MXN', label: 'MXN' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
]

export function CurrencySwitcher() {
  const currentCurrency = useCartStore((s) => s.currentCurrency)
  const setCurrentCurrency = useCartStore((s) => s.setCurrentCurrency)

  return (
    <Select value={currentCurrency} onValueChange={(val) => val && setCurrentCurrency(val)}>
      <SelectTrigger className="w-[80px] h-8 bg-card text-xs">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value} className="text-xs">
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
