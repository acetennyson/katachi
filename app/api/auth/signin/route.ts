import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase auth error:", error)
      return NextResponse.json({ 
        error: "Invalid credentials",
        details: error.message,
        code: error.code 
      }, { status: 401 })
    }

    // Fetch user profile with role using service role (bypasses RLS)
    const supabaseAdmin = await getSupabaseServiceRole()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ 
        error: "Failed to fetch profile",
        details: profileError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      user: { 
        id: data.user?.id, 
        email: data.user?.email,
        name: profile.name,
        role: profile.role
      },
    })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ 
      error: "Signin failed",
      details: error instanceof Error ? error.message : "Unknown error",
      cause: error instanceof Error && 'cause' in error ? String(error.cause) : undefined
    }, { status: 500 })
  }
}
