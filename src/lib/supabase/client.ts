import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components (browser-side).
 *
 * NOTE: These env vars must be prefixed with NEXT_PUBLIC_ so they are
 * available in the browser bundle. Make sure your .env.local includes:
 *   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
