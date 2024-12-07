import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;
    const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

    if (!code) {
      console.error("No code provided in auth callback");
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      );
    }
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If successful and has redirect URL
    if (redirectTo) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // Default redirect if no redirect_to parameter
    return NextResponse.redirect(`${origin}/dashboard`);

  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add this to verify environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});