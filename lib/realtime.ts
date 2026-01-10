import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

export const subscribeToMessages = (threadId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`messages:${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `thread_id=eq.${threadId}`,
      },
      callback,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export const subscribeToOrderUpdates = (orderId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`orders:${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      callback,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
