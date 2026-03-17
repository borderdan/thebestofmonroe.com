'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, MailCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email_confirmed_at) {
          router.push('/app')
        } else {
          setEmail(user.email ?? null)
        }
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [router])

  const handleResend = async () => {
    if (!email) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/app`
        }
      })

      if (error) {
        toast.error(error.message || 'Failed to resend email')
        return
      }

      toast.success(t('verifyEmailSuccess'))
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden p-4">
      {/* Premium Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-brand-primary-light/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('verifyEmailTitle')}</h1>
          <p className="text-muted-foreground">{t('verifyEmailSubtitle')}</p>
        </div>

        {/* Card */}
        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">{email || 'Loading...'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleResend}
              className="w-full h-11 text-base"
              disabled={isLoading || !email}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('verifyEmailButton')}
            </Button>
            
            <div className="text-center">
              <Button variant="ghost" className="text-sm" onClick={() => window.location.reload()}>
                I already verified my email <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center">
                {t('backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
