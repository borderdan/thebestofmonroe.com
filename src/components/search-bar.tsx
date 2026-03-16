'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value: controlledValue, onChange, placeholder, className = '' }: SearchBarProps) {
  const t = useTranslations('search')
  const [internalValue, setInternalValue] = useState('')
  
  const value = controlledValue ?? internalValue
  const handleChange = (v: string) => {
    if (onChange) onChange(v)
    else setInternalValue(v)
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? t('nlp_placeholder')}
        className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
      />
    </div>
  )
}
