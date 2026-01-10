import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import settings from "@/lib/constants/settings"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    // Fetch all settings from database
    const { data: dbSettings, error: settingsError } = await supabase
      .from("site_settings")
      .select("*")
      .order("key")

    if (settingsError) throw settingsError

    // Convert array of settings to object
    const settingsObj: Record<string, any> = {}
    dbSettings?.forEach((setting) => {
      settingsObj[setting.key] = setting.value
    })

    // Merge with default settings from file
    const mergedSettings = {
      defaults: {
        taxPercentage: settingsObj.default_tax_percentage || settings.defaults.taxPercentage,
        shippingPrice: settingsObj.default_shipping_price || settings.defaults.shippingPrice,
        currency: settingsObj.currency || settings.defaults.currency,
      },
      display: {
        currencyLocale: settingsObj.currency_locale || settings.display.currencyLocale,
        currencySymbol: settingsObj.currency_symbol || settings.display.currencySymbol,
      },
      taxRates: settings.taxRates,
    }

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
    })
  } catch (error: any) {
    console.error("[Admin Settings API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings", details: error?.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()
    const body = await request.json()

    const updates = [
      { key: "default_tax_percentage", value: body.defaults.taxPercentage },
      { key: "default_shipping_price", value: body.defaults.shippingPrice },
      { key: "currency", value: body.defaults.currency },
      { key: "currency_locale", value: body.display.currencyLocale },
      { key: "currency_symbol", value: body.display.currencySymbol },
    ]

    // Update each setting
    for (const update of updates) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          {
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error: any) {
    console.error("[Admin Settings API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update settings", details: error?.message },
      { status: 500 }
    )
  }
}
