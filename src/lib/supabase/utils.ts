/**
 * Supabase Utility for URL sanitization and diagnostics in CI
 */

export function sanitizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // 1. Trim whitespace
  let sanitized = url.trim();
  
  // 2. Remove literal quotes if present (sometimes happens in CI secrets)
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    sanitized = sanitized.slice(1, -1);
  }
  if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
    sanitized = sanitized.slice(1, -1);
  }

  return sanitized;
}

export function logSupabaseDiagnostic(label: string, value: string | undefined) {
  if (!process.env.CI) return;

  if (!value) {
    console.log(`[DIAGNOSTIC-${label}] VALUE IS UNDEFINED/EMPTY`);
    return;
  }

  const firstChar = value[0];
  const lastChar = value[value.length - 1];
  const length = value.length;
  const hasHttp = value.startsWith('http');
  const hasHttps = value.startsWith('https://');

  console.log(`[DIAGNOSTIC-${label}] Length: ${length}`);
  console.log(`[DIAGNOSTIC-${label}] Starts with http: ${hasHttp}`);
  console.log(`[DIAGNOSTIC-${label}] Starts with https://: ${hasHttps}`);
  console.log(`[DIAGNOSTIC-${label}] First char code: ${value.charCodeAt(0)} ('${firstChar}')`);
  console.log(`[DIAGNOSTIC-${label}] Last char code: ${value.charCodeAt(length - 1)} ('${lastChar}')`);
}
