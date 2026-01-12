import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireSuperAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let query = supabase
      .from("scheduled_reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: schedules, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedules: schedules || [],
    })
  } catch (error: any) {
    console.error("[Schedule Reports API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch scheduled reports", details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  try {
    const supabase = await getSupabaseServiceRole()
    const body = await request.json()

    const { data, error } = await supabase
      .from("scheduled_reports")
      .insert({
        user_id: body.userId,
        report_type: body.reportType,
        frequency: body.frequency,
        recipients: body.recipients,
        enabled: true,
        next_run: calculateNextRun(body.frequency),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedule: data,
      message: "Report scheduled successfully",
    })
  } catch (error: any) {
    console.error("[Schedule Reports API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to schedule report", details: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  try {
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("scheduled_reports")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    })
  } catch (error: any) {
    console.error("[Schedule Reports API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete schedule", details: error?.message },
      { status: 500 }
    )
  }
}

function calculateNextRun(frequency: string): string {
  const now = new Date()
  
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1)
      break
    case "weekly":
      now.setDate(now.getDate() + 7)
      break
    case "monthly":
      now.setMonth(now.getMonth() + 1)
      break
  }
  
  // Set to 9 AM
  now.setHours(9, 0, 0, 0)
  
  return now.toISOString()
}
