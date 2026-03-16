import { createClient } from '@/lib/supabase/server'
import { Store } from 'lucide-react'
import { CategoryFilters } from '@/components/directory/category-filters'
import { BusinessCardDetailed } from '@/components/directory/business-card-detailed'
import { DirectoryMap } from '@/components/directory/dynamic-map'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DirectoryIndexPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; view?: string; city?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const category = resolvedSearchParams?.category
  const view = resolvedSearchParams?.view || 'list'
  const city = resolvedSearchParams?.city
  
  const supabase = await createClient()

  let query = supabase.from('businesses').select('*').eq('is_visible', true).order('created_at', { ascending: false })
  
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (city) {
    query = query.eq('city', city)
  }

  const { data: businesses } = await query

  const { data: rankings } = await supabase.rpc('get_directory_rankings')
  
  const rankedBusinesses = (businesses || []).map(biz => {
    const rankData = (rankings || []).find((r: { business_id: string; total_score: number }) => r.business_id === biz.id)
    return {
      ...biz,
      total_score: rankData ? Number(rankData.total_score) : 0
    }
  }).sort((a, b) => b.total_score - a.total_score)

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl relative animate-fade-in-up">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-slow -z-10 dark:opacity-30 dark:bg-primary/20" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-slow -z-10 dark:opacity-30" style={{ animationDelay: '2s' }} />

      <div className="flex flex-col items-center text-center mb-10 relative z-10">
        <h1 className="text-5xl font-black tracking-tight lg:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-primary/80 drop-shadow-sm">
          Discover Local Businesses
        </h1>
        <p className="text-lg text-muted-foreground/90 max-w-2xl font-medium mb-8">
          Explore the best places, beautifully curated and highly rated by the community.
        </p>
        
        <div className="bg-card/60 backdrop-blur-xl p-2 rounded-2xl border border-border/40 shadow-sm w-full max-w-4xl mb-6">
          <CategoryFilters />
        </div>

        <div className="flex justify-center bg-muted/50 backdrop-blur-md p-1.5 rounded-full border border-border/30 shadow-inner inline-flex">
          <Link href={`/${locale}/directory?view=list${category ? `&category=${category}` : ''}`}>
             <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className={`rounded-full px-6 transition-all duration-300 ${view === 'list' ? 'bg-primary text-primary-foreground shadow-md scale-100' : 'hover:bg-muted/80 text-muted-foreground scale-95'}`}>Ranked List</Button>
          </Link>
          <Link href={`/${locale}/directory?view=map${category ? `&category=${category}` : ''}`}>
             <Button variant={view === 'map' ? 'default' : 'ghost'} size="sm" className={`rounded-full px-6 transition-all duration-300 ${view === 'map' ? 'bg-primary text-primary-foreground shadow-md scale-100' : 'hover:bg-muted/80 text-muted-foreground scale-95'}`}>Map View</Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        {rankedBusinesses && rankedBusinesses.length > 0 ? (
          view === 'map' ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/50 transition-all duration-500 hover:ring-primary/20 bg-card">
              <DirectoryMap businesses={rankedBusinesses} locale={locale} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              {rankedBusinesses.map((business, i) => (
                <BusinessCardDetailed key={business.id} business={business} rank={i + 1} locale={locale} clickCount={business.total_score} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-28 bg-card/40 backdrop-blur-2xl rounded-[3rem] border-dashed border-2 border-border/50 shadow-inner">
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-muted/60 rounded-full mb-6 ring-8 ring-background/50 shadow-sm">
              <Store className="w-10 h-10 text-muted-foreground/70" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">No businesses found</h3>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">Try adjusting your filters or check back later to discover more.</p>
          </div>
        )}
      </div>
    </div>
  )
}