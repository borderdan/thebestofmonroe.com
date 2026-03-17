import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/header"
import { LiveHeader } from "@/components/community/live-header"
import { PageTransition } from "@/components/page-transition"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch user profile with business info
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, business_id, is_superadmin')
    .eq('id', user.id)
    .single()

  // Fetch business name if profile exists
  let businessName = 'Made in Monroe'
  if (profile?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', profile.business_id)
      .single()
    if (business) businessName = business.name
  }

  const userData = {
    name: profile?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: profile?.role || 'staff',
    isSuperAdmin: !!profile?.is_superadmin,
  }

  return (
    <SidebarProvider>
      <AppSidebar user={userData} locale={locale} />
      <main className="flex flex-1 flex-col min-h-screen">
        <AppHeader businessName={businessName} />
        <LiveHeader />
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
