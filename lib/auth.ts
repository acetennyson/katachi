import { getSupabaseServer, getSupabaseServiceRole } from "./supabase"

export async function getUserProfile(userId: string) {
  const supabase = await getSupabaseServiceRole()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export async function getUserByEmail(email: string) {
  const supabase = await getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("profiles")
    .select("*, addresses(*), subscriptions(*), payment_methods(*)")
    .eq("email", email)
    .single()

  if (error) throw error
  return data
}

export async function createUserProfile(userId: string, email: string, name?: string) {
  const supabase = await getSupabaseServiceRole()

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert([{ id: userId, email, name, role: "CUSTOMER" }])
    .select()
    .single()

  if (profileError) throw profileError

  // Create cart
  await supabase.from("carts").insert([{ user_id: userId }])

  return profile
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Require admin authentication (ADMIN or SUPERADMIN)
 * Returns error response if user is not admin
 */
export async function requireAdmin() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401 as const, message: "Unauthorized" }

  const sr = await getSupabaseServiceRole()
  const { data: profile } = await sr.from("profiles").select("role, id, email").eq("id", user.id).single()

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN")) {
    return { ok: false, status: 403 as const, message: "Forbidden" }
  }

  return { ok: true as const, user: profile }
}

/**
 * Require SUPERADMIN authentication only
 * Returns error response if user is not superadmin
 */
export async function requireSuperAdmin() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401 as const, message: "Unauthorized" }

  const sr = await getSupabaseServiceRole()
  const { data: profile } = await sr.from("profiles").select("role, id, email").eq("id", user.id).single()

  if (!profile || profile.role !== "SUPERADMIN") {
    return { ok: false, status: 403 as const, message: "Forbidden - Superadmin access required" }
  }

  return { ok: true as const, user: profile }
}
