import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")

    // Fetch only enabled shipping methods
    const { data: methods, error } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("enabled", true)
      .order("sort_order")

    if (error) throw error

    // If country is provided, fetch zone-based rates
    if (country && methods) {
      // Find the zone for this country
      const { data: zones, error: zoneError } = await supabase
        .from("shipping_zones")
        .select("id, name, countries")
        .eq("enabled", true)

      if (!zoneError && zones) {
        // Find matching zone
        const matchingZone = zones.find(zone => 
          zone.countries.includes(country.toUpperCase()) || zone.countries.includes("*")
        )

        if (matchingZone) {
          // Fetch zone-based rates
          const { data: zoneRates, error: ratesError } = await supabase
            .from("shipping_zone_rates")
            .select("shipping_method_id, price")
            .eq("zone_id", matchingZone.id)

          if (!ratesError && zoneRates) {
            // Update method prices with zone-based rates
            const methodsWithZoneRates = methods.map(method => {
              const zoneRate = zoneRates.find(r => r.shipping_method_id === method.id)
              return {
                ...method,
                price: zoneRate ? zoneRate.price : method.price,
                zone: matchingZone.name,
              }
            })

            return NextResponse.json({
              success: true,
              methods: methodsWithZoneRates,
              zone: matchingZone.name,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      methods: methods || [],
    })
  } catch (error: any) {
    console.error("[Shipping Methods API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipping methods", details: error?.message },
      { status: 500 }
    )
  }
}
