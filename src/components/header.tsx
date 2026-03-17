'use client'

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchBar } from "@/components/search-bar"
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { CurrencySwitcher } from "@/components/currency-switcher"

interface AppHeaderProps {
  businessName?: string
}

function UtcClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toUTCString().slice(17, 25))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {time} <span className="text-muted-foreground/60">UTC</span>
    </span>
  )
}

function LiveIndicator() {
  const t = useTranslations('header')
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-success">{t('live')}</span>
    </div>
  )
}

export function AppHeader({ businessName = 'Dashboard' }: AppHeaderProps) {
  return (
    <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b border-white/5 bg-card/80 backdrop-blur-xl px-6 sticky top-0 z-50">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h1 className="font-semibold text-base text-foreground truncate">{businessName}</h1>
        <div className="hidden md:flex items-center gap-3 ml-2">
          <LiveIndicator />
          <div className="h-4 w-px bg-white/10" />
          <UtcClock />
        </div>
      </div>

      <div className="hidden md:block flex-1 max-w-md">
        <SearchBar />
      </div>

      <div className="flex items-center gap-3">
        <CurrencySwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
