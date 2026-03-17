import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamClient } from '@/components/team/team-client'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('team')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users')
    .select('business_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) redirect(`/${locale}/login`)

  // RBAC guard: only owners can view team management
  if (profile.role !== 'owner') {
    redirect(`/${locale}/app`)
  }

  // Fetch all team members
  const { data: members, error } = await supabase
    .from('users')
    .select('id, full_name, role, created_at, permissions')
    .eq('business_id', profile.business_id)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load team members: ${error.message}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link 
          href={`/${locale}/app/users/audit-logs`}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium transition-all hover:bg-muted hover:text-foreground"
        >
          <Shield className="w-4 h-4 mr-2 text-emerald-500" />
          {t('audit_logs.title', { defaultValue: 'Audit Logs' })}
        </Link>
      </div>
      <TeamClient
        members={(members as any) || []}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  )
}

