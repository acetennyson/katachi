import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getRecommendations(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    },
  )

  const { data: events } = await supabase
    .from("analytics_events")
    .select("payload")
    .eq("user_id", userId)
    .eq("type", "VIEW_PRODUCT")
    .order("occurred_at", { ascending: false })
    .limit(50)

  // Build category affinity from viewed products
  const categoryScores: Record<string, number> = {}

  if (events) {
    events.forEach((event: any) => {
      const categoryId = event.payload?.category_id
      if (categoryId) {
        categoryScores[categoryId] = (categoryScores[categoryId] || 0) + 1
      }
    })
  }

  // Get top products from favorite categories
  const topCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id)

  if (topCategories.length === 0) {
    // Fallback: get trending products
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(6)

    return products || []
  }

  const { data: recommended } = await supabase
    .from("products")
    .select("*")
    .in("category_id", topCategories)
    .eq("status", "ACTIVE")
    .limit(6)

  return recommended || []
}
