import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware({ locales, defaultLocale })

// TODO: Implement persistent rate limiting with Redis/Upstash
// Removed in-memory map as it doesn't persist across edge isolates.

export default async function proxy(request: NextRequest) {
  // 1. Handle i18n routing logic first (determines locale matching)
  const response = intlMiddleware(request)

  const pathname = request.nextUrl.pathname

  // Rate Limiting for public APIs (TODO: reimplement)
  if (pathname.startsWith('/api/codi/generate') || 
      pathname.startsWith('/api/health') || 
      pathname.startsWith('/api/vcard/')) {
    // const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  }

  // 2. Wrap that response with Supabase Auth logic to maintain session cookies
  const { supabaseResponse, user } = await updateSession(request, response)

  // Protect /app/* back-office routes from unauthenticated access
  // Robust check for /app routes with or without locale prefix
  const isAppRoute = pathname.startsWith('/app') || 
    locales.some(lang => pathname.startsWith(`/${lang}/app`))

  if (isAppRoute && !user) {
    // Detect locale from path or fallback to default
    const localeInPath = locales.find(lang => pathname.startsWith(`/${lang}/`))
    const locale = localeInPath || defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Phase 2: Enforce Email Verification
  if (isAppRoute && user && !user.email_confirmed_at) {
    const localeInPath = locales.find(lang => pathname.startsWith(`/${lang}/`))
    const locale = localeInPath || defaultLocale
    const verifyUrl = new URL(`/${locale}/verify-email`, request.url)
    return NextResponse.redirect(verifyUrl)
  }

  // Phase 19: POS PIN Session Check
  // Check if accessing the POS route but not the unlock screen
  if (pathname.includes('/app/pos') && !pathname.includes('/app/pos/unlock')) {
    const posSession = request.cookies.get('pos_session_role')
    
    // If no session exists, redirect to the PIN unlock screen
    if (!posSession) {
      const localeInPath = locales.find(lang => pathname.startsWith(`/${lang}/`))
      const locale = localeInPath || defaultLocale
      const unlockUrl = new URL(`/${locale}/app/pos/unlock`, request.url)
      return NextResponse.redirect(unlockUrl)
    }
  }

  // Checkout Route Guard: Prevent direct access without session params
  const isCheckoutRoute = pathname.includes('/checkout')
  if (isCheckoutRoute) {
    const sessionId = request.nextUrl.searchParams.get('session_id') || 
                      request.nextUrl.searchParams.get('stripe_session_id')
    if (!sessionId) {
      const localeInPath = locales.find(lang => pathname.startsWith(`/${lang}/`))
      const locale = localeInPath || defaultLocale
      const pricingUrl = new URL(`/${locale}/pricing`, request.url)
      return NextResponse.redirect(pricingUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
