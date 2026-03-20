import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, ShieldCheck, Settings, Globe, Database } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) redirect(`/${locale}/app`)

  const navItems = [
    { title: 'Overview', href: `/${locale}/admin`, icon: LayoutDashboard },
    { title: 'Tenants', href: `/${locale}/admin/tenants`, icon: Users },
    { title: 'Infrastructure', href: `/${locale}/admin/infrastructure`, icon: ShieldCheck },
    { title: 'Data Pipeline', href: `/${locale}/admin/data-sources`, icon: Database },
    { title: 'Global Settings', href: `/${locale}/admin/settings`, icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-zinc-800">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          <span className="font-black tracking-tighter text-xl">NEWBOM <span className="text-zinc-500 text-xs">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm font-medium text-zinc-400 hover:text-zinc-100"
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link 
            href={`/${locale}/app`}
            className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-emerald-500 uppercase tracking-widest"
          >
            <Globe className="w-3 h-3" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
