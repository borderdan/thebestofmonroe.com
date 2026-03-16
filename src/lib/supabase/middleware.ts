import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { sanitizeSupabaseUrl, logSupabaseDiagnostic } from './utils'

console.log('>>> LOADING src/lib/supabase/middleware.ts');

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response || NextResponse.next({
    request,
  })

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
  const supabaseAnonKey = rawKey

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `SUPABASE_MIDDLEWARE_CONFIG_ERROR: Missing variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}, CI: ${process.env.CI}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Verbose diagnostics in CI
  if (process.env.CI) {
    logSupabaseDiagnostic('MIDDLEWARE-URL', supabaseUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          if (!response) {
            supabaseResponse = NextResponse.next({
              request,
            })
          }
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user, supabase }
}
