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
    // Let tests continue if we fail to provide the anon key, by injecting a fake key.
    // Otherwise the server crashes completely.
    if (process.env.NODE_ENV !== 'production' || process.env.CI) {
      console.warn("Using fallback dummy credentials for test/dev environment.");
    } else {
      throw new Error(errorMsg);
    }
  }

  const safeUrl = supabaseUrl || 'http://localhost:54321';
  const safeKey = supabaseAnonKey || 'dummy_anon_key';

  // Verbose diagnostics in CI
  if (process.env.CI) {
    logSupabaseDiagnostic('MIDDLEWARE-URL', safeUrl);
  }

  const supabase = createServerClient(
    safeUrl,
    safeKey,
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
