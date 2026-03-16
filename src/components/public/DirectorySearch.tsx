'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, Loader2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BusinessCard, { Business } from './BusinessCard'

const ITEMS_PER_PAGE = 12

export default function DirectorySearch({ locale }: { locale: string }) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const supabase = createClient()

  // Fetch unique categories once
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('businesses')
        .select('category')
        .eq('is_visible', true)
      
      if (!error && data) {
        // Extract unique categories
        const unique = Array.from(new Set(data.map(d => d.category)))
          .filter(Boolean)
          .sort()
        setCategories(unique as string[])
      }
    }
    fetchCategories()
  }, [])

  const fetchBusinesses = useCallback(async (reset: boolean = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page
    const from = currentPage * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' })
      .eq('is_visible', true)

    if (searchQuery) {
      // Use pg_trgm for fuzzy text search on name, or just ilike
      query = query.ilike('name', `%${searchQuery}%`)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Sorting
    if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false }).order('review_count', { ascending: false })
    } else if (sortBy === 'reviews') {
      query = query.order('review_count', { ascending: false }).order('rating', { ascending: false })
    } else if (sortBy === 'name') {
      query = query.order('name', { ascending: true })
    }

    const { data, error, count } = await query.range(from, to)

    if (!error && data) {
      if (reset) {
        setBusinesses(data as Business[])
      } else {
        setBusinesses(prev => [...prev, ...(data as Business[])])
      }
      setHasMore(count !== null && from + data.length < count)
      if (reset) setPage(1)
      else setPage(currentPage + 1)
    }
    setLoading(false)
  }, [category, page, searchQuery, sortBy, supabase])

  // Initial fetch and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses(true)
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [searchQuery, category, sortBy])

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for restaurants, plumbers, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-background w-full h-14 text-base rounded-2xl border-muted/60 shadow-sm focus-visible:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Sort Menu */}
          <div className="shrink-0">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full sm:w-[180px] h-14 rounded-2xl bg-background border-muted/60">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
                <SelectItem value="name">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filters (Categories) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none w-full mask-edges">
          <Button
            variant={category === 'all' ? 'default' : 'secondary'}
            className="rounded-full shrink-0 h-10 px-5 font-medium shadow-sm"
            onClick={() => setCategory('all')}
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'secondary'}
              className="rounded-full shrink-0 h-10 px-5 font-medium shadow-sm transition-colors"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-[50vh]">
        {loading && businesses.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-32 bg-muted/20 rounded-3xl border border-dashed border-muted">
            <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No businesses found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">We couldn't find any results matching your search criteria. Try adjusting your filters or search term.</p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-full px-8"
              onClick={() => {
                setSearchQuery('')
                setCategory('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* List View */}
            <div className="flex flex-col gap-5">
              {businesses.map((business, i) => (
                <BusinessCard key={`${business.id}-${i}`} business={business} />
              ))}
            </div>

          {hasMore && (
            <div className="flex justify-center pt-8 pb-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => fetchBusinesses()}
                disabled={loading}
                className="w-full md:w-auto px-8"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}
