import * as React from 'react'
import { Star, MapPin, ExternalLink, Phone } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'

export interface Business {
  id: string
  name: string
  slug: string
  city: string
  category: string
  rating: number
  review_count: number
  logo_url: string | null
  cover_url: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contact: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any
}

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <Card className="flex flex-col sm:flex-row h-full overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-muted/60">
      {/* Image Section - Left side on desktop, top on mobile */}
      <div 
        className="h-48 sm:h-auto sm:w-64 sm:shrink-0 bg-muted relative overflow-hidden"
        style={{
          backgroundImage: business.cover_url ? `url(${business.cover_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
        {!business.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
            <span className="text-5xl opacity-20 font-bold tracking-tight">{business.name.charAt(0)}</span>
          </div>
        )}
      </div>
      
      {/* Content Section - Right side on desktop, bottom on mobile */}
      <div className="flex flex-col flex-1 p-5 lg:p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {business.category}
              </span>
            </div>
            <h3 className="font-semibold text-xl line-clamp-1 group-hover:text-primary transition-colors" title={business.name}>
              {business.name}
            </h3>
          </div>
          
          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold text-sm">{business.rating}</span>
            <span className="text-xs opacity-70 ml-0.5">({business.review_count})</span>
          </div>
        </div>
        
        <div className="flex items-start text-sm text-foreground/80 mt-3 flex-1">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 mr-2 text-muted-foreground" />
          <span className="line-clamp-2">
            {business.location?.street ? `${business.location.street}, ` : ''}{business.city}
            {business.location?.zipcode ? ` ${business.location.zipcode}` : ''}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-border/40">
          {business.contact?.phone && (
            <a 
              href={`tel:${business.contact.phone}`} 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-4 h-4 mr-1.5" />
              {business.contact.phone}
            </a>
          )}
          
          {business.contact?.website && (
            <a
              href={business.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
              <ExternalLink className="w-4 h-4 ml-1.5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
