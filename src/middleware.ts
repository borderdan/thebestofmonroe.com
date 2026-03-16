import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware({ locales, defaultLocale })

// Basic in-memory rate limiting for Edge (clears on isolate reset)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  record.count++
  return true
}

export default async function proxy(request: NextRequest) {
  // 1. Handle i18n routing logic first (determines locale matching)
  const response = intlMiddleware(request)

  const pathname = request.nextUrl.pathname

  // Rate Limiting for public APIs
  if (pathname.startsWith('/api/codi/generate') || 
      pathname.startsWith('/api/health') || 
      pathname.startsWith('/api/vcard/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const isAllowed = checkRateLimit(ip)
    
    if (!isAllowed) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
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
