// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;
    const next = requestUrl.searchParams.get("next");
    const redirectTo = requestUrl.searchParams.get("redirect_to");
    const type = requestUrl.searchParams.get("type"); // Can be 'signup', 'recovery', or null

    if (!code) {
      console.error("No code provided in auth callback");
      return NextResponse.redirect(`${origin}/login?error=no_code_provided`);
    }

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    let session;

    // For email confirmation (signup flow), we don't need a code verifier
    if (next === '/confirm-email') {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: code,
        type: 'email'
      });
      
      if (error) throw error;
      session = data;
    } else {
      // For password reset and other flows that require PKCE
      const storedCodeVerifier = await (await cookieStore).get('code_verifier')?.value;
      
      if (!storedCodeVerifier) {
        console.error("No code verifier found");
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Missing authentication data")}`
        );
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) throw error;
      session = data;
    }

    // Handle successful authentication
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    
    let baseUrl = origin;
    if (!isLocalEnv && forwardedHost) {
      baseUrl = `https://${forwardedHost}`;
    }

    // Determine the final redirect URL
    let finalRedirect = '/dashboard'; // default redirect

    if (next === '/confirm-email') {
      finalRedirect = '/dashboard'; // or wherever you want to redirect after email confirmation
    } else if (redirectTo) {
      finalRedirect = redirectTo;
    }

    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}${finalRedirect}`);

    // Clear the code verifier cookie if it exists
    if ((await cookieStore).get('code_verifier')) {
      response.cookies.delete('code_verifier');
    }

    return response;

  } catch (error: any) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }
}