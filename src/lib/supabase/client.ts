import { createBrowserClient } from '@supabase/ssr'
import { sanitizeSupabaseUrl, logSupabaseDiagnostic } from './utils'

console.log('>>> LOADING src/lib/supabase/client.ts');

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
  const supabaseAnonKey = rawKey

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `SUPABASE_CLIENT_CONFIG_ERROR: Missing variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}, CI: ${process.env.CI}`;
    console.warn(errorMsg);
    
    if (process.env.NODE_ENV !== 'production' || process.env.CI) {
      console.warn('Proceeding without full Supabase config during test/dev/CI environment.');
      return createBrowserClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')
    }

    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    if (!supabaseAnonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  }

  // Verbose diagnostics in CI
  if (process.env.CI) {
    logSupabaseDiagnostic('CLIENT-URL', supabaseUrl);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
