import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PwaRegistry } from '@/components/pwa-registry'
import { ThemeProvider } from '@/components/theme-provider'

// Fonts are now handled in the root layout to avoid duplication

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate that the incoming `locale` parameter is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locales.includes(locale as any)) {
    notFound()
  }
 
  // Receiving messages from the next-intl server integration
  let messages;
  try {
    messages = await getMessages()
  } catch {
    // Fallback if messages aren't defined yet to prevent build crashes
    messages = {}
  }
 
  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          {children}
          <PwaRegistry />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
