import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Store } from 'lucide-react'
import { AddToCartButton } from '@/components/directory/add-to-cart-button'
import { DirectoryCartDrawer } from '@/components/directory/directory-cart-drawer'
import { LinkIcon } from '@/components/directory/link-icon'
import { resolveLinkUrl } from '@/lib/utils/link-resolvers'
import { ProfileLinkData } from '@/lib/schemas/links'

// Define the shape of menu items expected from JSONB
interface MenuItemData {
  name: string;
  price: string | number;
  description?: string;
  category?: string;
  [key: string]: unknown;
}

export default async function TenantDirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch the business by slug
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, city, category')
    .eq('slug', slug)
    .single()

  if (!business) {
    notFound()
  }

  // 2. Fetch all public menu items for this business from the 'products' table
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, description, category, image_url')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // 3. Fetch public Smart Links from entities
  const { data: profileLinks } = await supabase
    .from('entities')
    .select('id, data')
    .eq('business_id', business.id)
    .eq('type', 'profile_link')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    
  // Transform products to the shape expected by the UI
  const items = products?.map(p => ({
    id: p.id,
    data: {
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      image_url: p.image_url
    }
  })) || []
  const links = (profileLinks || []) as unknown as { id: string; data: ProfileLinkData }[]
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Hero Section for Business */}
      <div className="bg-primary/5 border-b py-12 mb-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary text-primary-foreground mb-6 shadow-xl">
            <Store className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {business.name}
          </h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground font-medium">
            <span className="capitalize">{business.category?.replace('_', ' ')}</span>
            {business.city && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                <span>{business.city}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Smart Links Section */}
      {links.length > 0 && (
        <div className="container mx-auto px-4 max-w-4xl mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={resolveLinkUrl(link.data, business.id)}
                target={link.data.link_type === 'vcard' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ 
                  backgroundColor: link.data.meta.bg_color || '#4f46e5', 
                  color: link.data.meta.text_color || '#ffffff' 
                }}
              >
                <LinkIcon type={link.data.link_type} metaIcon={link.data.meta.icon} className="w-5 h-5" />
                <span>{link.data.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu/Catalog Grid */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Our Menu</h2>
          <p className="text-muted-foreground">Discover what we have to offer.</p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const data = item.data as unknown as MenuItemData
              const price = Number(data.price) || 0
              
              return (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-0 flex flex-row">
                    {/* Add Image placeholder if needed, currently skipping as jsonb data wasn't explicitly providing images in Phase 6 context without assumption */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="font-semibold text-lg leading-tight">{data.name}</h3>
                          <span className="font-bold text-lg text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                            ${price.toFixed(2)}
                          </span>
                        </div>
                        {data.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {data.description}
                          </p>
                        )}
                        <AddToCartButton item={{ id: item.id, name: data.name, price }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-2xl border-dashed border-2">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Menu is empty</h3>
            <p className="text-muted-foreground">This business hasn&apos;t added any public items yet.</p>
          </div>
        )}
      </div>

      <DirectoryCartDrawer businessId={business.id} />
    </div>
  )
}
