import { Metadata } from 'next'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string, locale: string }> 
}): Promise<Metadata> {
  const { slug, locale } = await params
  return {
    manifest: `/${locale}/directory/${slug}/manifest.webmanifest`,
  }
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
