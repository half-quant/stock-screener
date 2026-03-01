import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, API routes,
 * and server actions. Uses the Next.js cookies() API for session management.
 *
 * IMPORTANT: Never import this file from Client Components.
 * Use @/lib/supabase/client instead for browser-side usage.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from a Server Component where cookies
            // cannot be modified. This is safe to ignore because the
            // middleware handles session refresh on every request.
          }
        },
      },
    },
  );
}
