"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowUpRight, Activity } from "lucide-react"
import Link from "next/link"

interface BusinessData {
  id: string
  slug: string
  name: string
  category: string
  city: string
  contact?: {
    phone?: string
    website?: string
  }
}

export function BusinessCardDetailed({ 
  business, 
  rank, 
  locale, 
  clickCount = 0 
}: { 
  business: BusinessData
  rank: number
  locale: string
  clickCount?: number 
}) {
  const isTopRanked = rank <= 3;
  const description = `"${business.name} — Proudly serving ${business.city}!"`;

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-card/60 backdrop-blur-xl border-border/40 hover:border-primary/50 dark:bg-zinc-900/60 z-0">
      {/* Animated subtle gradient background that appears on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
      
      {/* Top Ranked decorative glow */}
      {isTopRanked && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 group-hover:bg-primary/30 transition-all duration-700 -z-10" />
      )}

      <div className={`absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold shadow-md transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 ${isTopRanked ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-white border border-amber-300/50' : 'bg-muted/80 backdrop-blur-md text-muted-foreground border border-border/50'}`}>
        #{rank}
      </div>
      
      <CardHeader className="pb-4 pr-16 relative z-10">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate drop-shadow-sm">
          {business.name}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground mt-2 gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-secondary/60 hover:bg-secondary border-none backdrop-blur-md">
            {business.category}
          </Badge>
          <div className="flex items-center px-2 py-0.5 rounded-full bg-muted/30 backdrop-blur-sm border border-border/30 text-xs">
            <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-80 text-primary" />
            <span className="truncate font-medium">{business.city}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed mb-6 italic border-l-2 border-primary/20 pl-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
          {clickCount !== undefined ? (
            <div className="flex items-center text-xs font-semibold text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-full shadow-sm">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500 dark:text-blue-400 animate-pulse-slow" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{clickCount} interactions</span>
            </div>
          ) : <div />}
          
          <Link 
            href={`/${locale}/${business.city}/${business.slug}`}
            className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-full shadow-md hover:shadow-lg transition-all transform group-hover:scale-105 active:scale-95"
          >
            Explore
            <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
