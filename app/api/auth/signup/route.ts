import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Use service role to create and fetch profile (bypasses RLS)
    const supabaseAdmin = await getSupabaseServiceRole()
    
    // Create user profile with CUSTOMER role (default)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([{ 
        id: data.user?.id, 
        email: data.user?.email,
        name: name,
        role: "CUSTOMER"
      }])

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Continue even if profile creation fails - the trigger might handle it
    }

    // Fetch the profile to return with role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", data.user?.id)
      .single()

    return NextResponse.json(
      {
        user: { 
          id: data.user?.id, 
          email: data.user?.email,
          name: profile?.name || name,
          role: profile?.role || "CUSTOMER"
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ 
      error: "Signup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
