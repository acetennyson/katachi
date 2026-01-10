import { getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { threadId, body, senderId } = await request.json()

    if (!threadId || !body || !senderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert([{ thread_id: threadId, sender_id: senderId, body }])
      .select(
        `
        *,
        sender:sender_id(id, name, email)
      `,
      )
      .single()

    if (messageError) throw messageError

    // Update thread timestamp
    await supabase.from("message_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
