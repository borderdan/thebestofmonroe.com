'use client'

import * as React from 'react'
import { Search } from 'lucide-react'

export function CommandBar() {
  return (
    <div className="relative group w-full max-w-xl hidden md:flex items-center ml-4">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      </div>
      <input 
        type="text"
        placeholder="Search businesses, jobs, data... (Cmd+K)"
        className="w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/40 focus:border-primary/50 rounded-lg h-9 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 shadow-sm focus:shadow-md"
      />
      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-background/50 border border-border/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  )
}
