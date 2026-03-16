import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { QRGenerator } from '@/components/qr-generator'
import { MapPin, Phone, Mail, Globe } from 'lucide-react'

interface PageProps {
  params: Promise<{
    locale: string
    city: string
    slug: string
  }>
  searchParams: Promise<{ table?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, slug } = await params
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, category, logo_url, cover_url')
    .eq('slug', slug)
    .eq('city', city)
    .single()

  if (!business) return { title: 'Not Found' }

  return {
    title: `${business.name} — The Best of ${city.replace(/-/g, ' ')}`,
    description: `${business.name} is a premier ${business.category?.toLowerCase() || 'business'} in ${city.replace(/-/g, ' ')}, Mexico. Discover the best of Mexico with The Best of Monroe.`,
    openGraph: {
      title: business.name,
      description: `Explore ${business.name} in ${city}.`,
      images: [business.cover_url || business.logo_url || ''].filter(Boolean),
      type: 'website',
    },
    alternates: {
      canonical: `/${city}/${slug}`,
    }
  }
}

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const { locale, city, slug } = await params
  const { table } = await searchParams
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('city', city)
    .single()

  if (!business) notFound()

  // Fetch associated entities (menu items, staff, etc.)
  const { data: entities } = await supabase
    .from('entities')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const menuItems = (entities || []).filter((e) => e.type === 'menu_item')
  const staffCards = (entities || []).filter((e) => e.type === 'directory')

  // SEO JSON-LD injection
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    image: business.cover_url || business.logo_url,
    url: `https://thebestofmonroe.com/${city}/${slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.replace(/-/g, ' '),
      addressCountry: 'MX'
    }
  }

  const themeClass = business.landing_page_theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-[#f8fafc] text-slate-900'

  return (
    <main className={`min-h-screen ${themeClass}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Dynamic Header */}
      <div 
        className="w-full h-[400px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${business.cover_url || '/placeholder-cover.jpg'})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6">
            {business.logo_url && (
              <img 
                src={business.logo_url} 
                alt={`${business.name} Logo`} 
                className="w-32 h-32 rounded-2xl border-4 text-white shadow-xl object-cover shrink-0"
                style={{ borderColor: business.brand_color || 'white', backgroundColor: business.brand_color || 'white' }}
              />
            )}
            <div className="pb-2 flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{business.name}</h1>
              <p className="text-white/80 text-lg uppercase tracking-wider mb-4">{business.category}</p>
              
              {/* Contact & Location Badges */}
              <div className="flex flex-wrap gap-3">
                {business.location?.address && (
                  <div className="flex items-center text-sm text-white/90 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {business.location.address}
                  </div>
                )}
                {business.contact?.phone && (
                  <a href={`tel:${business.contact.phone}`} className="flex items-center text-sm text-white/90 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors">
                    <Phone className="w-4 h-4 mr-1.5" />
                    {business.contact.phone}
                  </a>
                )}
                {business.contact?.email && (
                  <a href={`mailto:${business.contact.email}`} className="flex items-center text-sm text-white/90 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors">
                    <Mail className="w-4 h-4 mr-1.5" />
                    Email
                  </a>
                )}
                {business.contact?.website && (
                  <a href={business.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-white/90 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 py-12">
        {/* Table indicator */}
        {table && (
          <div className="text-white rounded-lg p-4 mb-8 text-center font-medium" style={{ backgroundColor: business.brand_color || '#3b82f6' }}>
            Mesa #{table}
          </div>
        )}

        {/* Menu Items */}
        {menuItems.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Menú</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => {
                const data = item.data as Record<string, any>
                return (
                  <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    {data?.image_url && (
                      <img
                        src={data.image_url}
                        alt={data?.name || ''}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold">{data?.name || 'Unnamed'}</h3>
                    {data?.description && (
                      <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                    )}
                    <p className="font-bold mt-2" style={{ color: business.brand_color || '#3b82f6' }}>
                      ${Number(data?.price || 0).toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Staff Directory */}
        {staffCards.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Equipo</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffCards.map((item) => {
                const data = item.data as Record<string, any>
                return (
                  <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm text-center">
                    {data?.image_url ? (
                      <img
                        src={data.image_url}
                        alt={data?.name || ''}
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {(data?.name || '?')[0]}
                      </div>
                    )}
                    <h3 className="font-semibold">{data?.name || 'Unnamed'}</h3>
                    {data?.description && (
                      <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* QR Code Section */}
        <section className="flex items-center justify-center py-8">
          <QRGenerator 
            city={city}
            slug={slug}
            locale={locale}
          />
        </section>
      </div>
    </main>
  )
}
