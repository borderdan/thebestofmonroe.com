'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['All', 'Medical', 'Gastronomy', 'Marketing', 'Accommodation', 'Wellness', 'Nightlife', 'Services', 'Creators', 'Other']

export function CategoryFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || 'All'

  const handleSelect = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-8">
      {CATEGORIES.map(cat => (
        <Button
          key={cat}
          variant={currentCategory === cat ? 'default' : 'outline'}
          size="sm"
          className="rounded-full shadow-sm"
          onClick={() => handleSelect(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  )
}
