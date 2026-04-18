import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // PKCE flow — @supabase/ssr sends a code to exchange for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  // token_hash flow — fallback for older Supabase email templates
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "invite" | "recovery" | "email" | "signup" | "magiclink" | "email_change",
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
