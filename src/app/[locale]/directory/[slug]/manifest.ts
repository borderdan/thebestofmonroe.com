import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function manifest({ 
  params 
}: { 
  params: Promise<{ slug: string, locale: string }> 
}): Promise<MetadataRoute.Manifest> {
  const { slug, locale } = await params
  const supabase = await createClient()
  
  // Fetch tenant data to dynamically populate the PWA manifest
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('slug', slug)
    .single()

  const tenantName = business?.name || 'The Best of Monroe Business'

  return {
    name: tenantName,
    short_name: tenantName,
    description: `Official application for ${tenantName}`,
    start_url: `/${locale}/directory/${slug}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#09090b',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
