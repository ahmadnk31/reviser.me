import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;
    const next = requestUrl.searchParams.get("next") ?? "/";
    const redirectTo = requestUrl.searchParams.get("redirect_to");

    // Early return if no code provided
    if (!code) {
      console.error("No code provided in auth callback");
      return NextResponse.redirect(`${origin}/auth/signin?error=no_code_provided`);
    }

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        `${origin}/auth/signin?error=${encodeURIComponent(error.message)}`
      );
    }

    // Handle successful authentication
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    
    // Determine the base URL for redirect
    let baseUrl = origin;
    if (!isLocalEnv && forwardedHost) {
      baseUrl = `https://${forwardedHost}`;
    }

    // Determine final redirect path
    const finalRedirect = redirectTo || next || "/onboarding";

    // Perform redirect
    return NextResponse.redirect(`${baseUrl}${finalRedirect}`);

  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect(
      `${origin}/auth/signin?error=internal_server_error`
    );
  }
}

// Verify environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});