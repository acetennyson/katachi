/**
 * Admin Activity Logging
 * Tracks all actions performed by admin users for audit and analytics
 */

import { getSupabaseServiceRole } from "@/lib/supabase"

export type AdminAction = 
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "category_created"
  | "category_updated"
  | "category_deleted"
  | "order_viewed"
  | "order_updated"
  | "order_status_changed"
  | "settings_updated"
  | "shipping_method_created"
  | "shipping_method_updated"
  | "shipping_method_deleted"
  | "knowledge_base_created"
  | "knowledge_base_updated"
  | "knowledge_base_deleted"
  | "admin_login"
  | "admin_logout"

export type ResourceType = 
  | "product"
  | "category"
  | "order"
  | "settings"
  | "shipping_method"
  | "knowledge_base"
  | "auth"

interface LogActivityParams {
  adminId: string
  action: AdminAction
  resourceType: ResourceType
  resourceId?: string | number
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an admin activity
 */
export async function logAdminActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await getSupabaseServiceRole()
    
    const { error } = await supabase.from("admin_activity_logs").insert({
      admin_id: params.adminId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId?.toString(),
      details: params.details || {},
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Admin Activity] Error logging activity:", error)
    }
  } catch (error) {
    console.error("[Admin Activity] Exception logging activity:", error)
  }
}

/**
 * Get recent activity for an admin
 */
export async function getAdminActivity(adminId: string, limit: number = 50) {
  try {
    const supabase = await getSupabaseServiceRole()
    
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error("[Admin Activity] Error fetching activity:", error)
    return []
  }
}

/**
 * Get all admin activities (SUPERADMIN only)
 */
export async function getAllAdminActivity(limit: number = 100) {
  try {
    const supabase = await getSupabaseServiceRole()
    
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select(`
        *,
        profiles!admin_activity_logs_admin_id_fkey (
          email,
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error("[Admin Activity] Error fetching all activity:", error)
    return []
  }
}

/**
 * Get admin analytics summary
 */
export async function getAdminAnalytics(adminId: string) {
  try {
    const supabase = await getSupabaseServiceRole()
    
    const { data, error } = await supabase
      .from("admin_analytics")
      .select("*")
      .eq("admin_id", adminId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      throw error
    }
    
    return data || null
  } catch (error) {
    console.error("[Admin Activity] Error fetching admin analytics:", error)
    return null
  }
}

/**
 * Get all admin analytics (SUPERADMIN only)
 */
export async function getAllAdminAnalytics() {
  try {
    const supabase = await getSupabaseServiceRole()
    
    const { data, error } = await supabase
      .from("admin_performance_summary")
      .select("*")
      .order("total_revenue", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("[Admin Activity] Error fetching all admin analytics:", error)
    return []
  }
}

/**
 * Extract IP address and User Agent from Next.js request headers
 */
export function extractRequestMetadata(headers: Headers): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: 
      headers.get("x-forwarded-for")?.split(",")[0] || 
      headers.get("x-real-ip") || 
      undefined,
    userAgent: headers.get("user-agent") || undefined,
  }
}
