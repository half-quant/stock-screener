import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the Supabase auth callback after email confirmation.
 *
 * Supabase redirects users here with an auth code in the URL query params.
 * We exchange the code for a session and then redirect to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If there is no code or the exchange failed, redirect to login with an error hint
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin),
  );
}
