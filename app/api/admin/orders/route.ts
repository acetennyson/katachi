import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    // ADMIN or SUPERADMIN
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const supabase = await getSupabaseServiceRole()
    const isSuper = auth.user.role === "SUPERADMIN"

    if (isSuper) {
      // SUPERADMIN: all orders
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          payment_status,
          subtotal,
          tax,
          total,
          created_at,
          user_id,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ success: true, orders: orders || [] })
    }

    // ADMIN: only orders containing items for products owned by this admin
    // 1) get product ids created by admin
    const { data: adminProducts, error: prodErr } = await supabase
      .from("products")
      .select("id")
      .eq("created_by", auth.user.id)

    if (prodErr) throw prodErr
    const productIds = (adminProducts || []).map((p: any) => p.id)

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, orders: [] })
    }

    // 2) find order_items that reference those products
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_id")
      .in("product_id", productIds)

    if (itemsErr) throw itemsErr

    const orderIds = Array.from(new Set((items || []).map((i: any) => i.order_id)))
    if (orderIds.length === 0) {
      return NextResponse.json({ success: true, orders: [] })
    }

    // 3) fetch those orders with their items (filtered to show all items of those orders)
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax,
        total,
        created_at,
        user_id,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .in("id", orderIds)
      .order("created_at", { ascending: false })

    if (ordersErr) throw ordersErr

    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (error: any) {
    console.error("[Admin Orders API] Failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders", details: error?.message },
      { status: 500 }
    )
  }
}
