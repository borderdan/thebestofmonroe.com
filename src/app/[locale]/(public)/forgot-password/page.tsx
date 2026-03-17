'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, ForgotPasswordValues } from '@/lib/schemas/auth'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      })

      // Security: Always show success to prevent user enumeration
      toast.success(t('forgotPasswordSuccess'))
    } catch {
      // Still show success or generic error
      toast.success(t('forgotPasswordSuccess'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden p-4">
      {/* ... (background blobs omited for brevity) */}
      <div className="relative w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('forgotPasswordTitle')}</h1>
          <p className="text-muted-foreground">{t('forgotPasswordSubtitle')}</p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">{t('forgotPassword')}</CardTitle>
            <CardDescription>
              {t('forgotPasswordSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                className={cn(buttonVariants(), "w-full h-11 text-base")}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('forgotPasswordButton')}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          The Best of Monroe &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
