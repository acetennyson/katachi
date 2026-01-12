import { getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Send magic link (passwordless login) to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Send magic link with implicit flow (tokens in URL hash, not PKCE)
    // This avoids the PKCE code verifier issue
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackUrl = `${siteUrl}/`
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || callbackUrl,
        // Don't use PKCE for email links
        shouldCreateUser: false,
      },
    })
    
    console.log('[Magic Link] Sent to:', email, 'Redirect URL:', redirectTo || callbackUrl)

    if (error) {
      console.error("Magic link error:", error)
      return NextResponse.json(
        {
          error: "Failed to send magic link",
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Magic link sent! Check your email.",
    })
  } catch (error) {
    console.error("Magic link error:", error)
    return NextResponse.json(
      {
        error: "Failed to send magic link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
