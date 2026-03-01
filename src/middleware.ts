import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Routes that require authentication. Unauthenticated users are
 * redirected to /login.
 */
const PROTECTED_ROUTES = ['/dashboard', '/screener', '/watchlist', '/settings'];

/**
 * Returns true if the given pathname starts with any protected route prefix.
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request so downstream server code can read them
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          // Recreate the response with updated request cookies
          supabaseResponse = NextResponse.next({ request });

          // Set cookies on the response so they are sent to the browser
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh the auth session. IMPORTANT: Do not remove this call.
  // Supabase uses this to refresh expired tokens and keep the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (favicon)
     * - Public assets (svg, png, jpg, jpeg, gif, webp)
     *
     * This runs the middleware on all page and API routes while
     * skipping static asset requests for performance.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
