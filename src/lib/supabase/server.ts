import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sanitizeSupabaseUrl, logSupabaseDiagnostic } from './utils'

console.log('>>> LOADING src/lib/supabase/server.ts');

export async function createClient() {
  const cookieStore = await cookies()
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
  const supabaseAnonKey = rawKey // Usually no sanitization for keys unless needed

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `SUPABASE_CONFIG_ERROR: Missing variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}, CI: ${process.env.CI}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Verbose diagnostics in CI
  if (process.env.CI) {
    logSupabaseDiagnostic('SERVER-URL', supabaseUrl);
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
