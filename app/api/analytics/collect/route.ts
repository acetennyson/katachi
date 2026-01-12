import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import settings from "@/lib/constants/settings"

// In-memory lock to prevent concurrent API calls for the same IP
const ipFetchLocks = new Map<string, Promise<string | null>>()

// Fetch from enabled location APIs based on settings
// APIs auto-detect public IP when no IP is provided
async function fetchLocationFromAPI(): Promise<any> {
  // Try ipinfo if enabled (auto-detects public IP)
  if (settings.locationAPI.ipinfo) {
    try {
      console.log(`[Analytics] Fetching geolocation from ipinfo.io (auto-detect)...`)
      const response = await fetch(`https://ipinfo.io/json`)
      
      if (response.ok) {
        const data = await response.json()
        if (!data.error && !data.bogon) {
          const [latitude, longitude] = (data.loc || ',').split(',')
          console.log(`[Analytics] ipinfo.io detected IP: ${data.ip}`)
          return {
            ip: data.ip,
            country: data.country || null, // This is the country code (e.g., "US")
            country_code: data.country || null,
            country_name: data.country || null, // ipinfo doesn't provide full name
            city: data.city || null,
            region: data.region || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            timezone: data.timezone || null,
          }
        }
        console.warn(`[Analytics] ipinfo.io returned bogon or error`)
      }
    } catch (error) {
      console.error("[Analytics] ipinfo.io fetch error:", error)
    }
  }

  // Try ipapi if enabled (auto-detects public IP)
  if (settings.locationAPI.ipapi) {
    try {
      console.log(`[Analytics] Fetching geolocation from ipapi.co (auto-detect)...`)
      const response = await fetch(`https://ipapi.co/json/`, {
        headers: { 'User-Agent': 'node-fetch' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (!data.error) {
          console.log(`[Analytics] ipapi.co detected IP: ${data.ip}`)
          return {
            ip: data.ip,
            country: data.country_name || null,
            country_code: data.country_code || null,
            country_name: data.country_name || null,
            city: data.city || null,
            region: data.region || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            timezone: data.timezone || null,
            postal: data.postal || null,
            org: data.org || null,
          }
        }
        console.warn(`[Analytics] ipapi.co error: ${data.reason}`)
      }
    } catch (error) {
      console.error("[Analytics] ipapi.co fetch error:", error)
    }
  }

  return null
}

// IP to country lookup with cookie-based caching
// Cookie flow: Check cookie -> if absent, fetch from enabled API -> save to DB -> create cookie
async function getCountryFromIP(
  supabase: any,
  cookieStore: any
): Promise<{ 
  country: string | null; 
  city: string | null;
  region: string | null;
  detectedIP: string | null 
}> {
  
  // Step 1: Check for active location cookie
  const locationCookie = cookieStore.get(settings.locationCookieProps.name)
  if (locationCookie && !settings.clearLocationCookie) {
    try {
      const locationData = JSON.parse(locationCookie.value)
      console.log(`[Analytics] Using location from cookie: ${locationData.city}, ${locationData.region}, ${locationData.country} (IP: ${locationData.ip})`)
      return { 
        country: locationData.country, 
        city: locationData.city,
        region: locationData.region,
        detectedIP: locationData.ip 
      }
    } catch (error) {
      console.error("[Analytics] Failed to parse location cookie:", error)
      // Continue to fetch if cookie is invalid
    }
  }

  // Clear cookie if clearLocationCookie is enabled
  if (settings.clearLocationCookie && locationCookie) {
    console.log(`[Analytics] Clearing location cookie as per settings...`)
    cookieStore.delete(settings.locationCookieProps.name)
  }

  console.log(`[Analytics] No valid location cookie found, fetching from API...`)
  
  // Use a lock key since we're auto-detecting IP
  const lockKey = 'auto-detect'
  
  // Check if there's already a fetch in progress
  const existingFetch = ipFetchLocks.get(lockKey)
  if (existingFetch) {
    console.log(`[Analytics] Waiting for existing fetch...`)
    return await existingFetch
  }
  
  // Create a promise for this fetch and store it
  const fetchPromise = (async (): Promise<{ 
    country: string | null; 
    city: string | null;
    region: string | null;
    detectedIP: string | null 
  }> => {
    try {
      // Step 2: Cookie absent - fetch from enabled API (auto-detects public IP)
      const locationData = await fetchLocationFromAPI()
      
      if (!locationData || !locationData.ip) {
        console.warn(`[Analytics] Could not fetch location from API`)
        return { country: null, city: null, region: null, detectedIP: null }
      }
      
      const detectedIP = locationData.ip
      const country = locationData.country_name || locationData.country
      const countryCode = locationData.country_code
      const city = locationData.city
      const region = locationData.region
      const latitude = locationData.latitude
      const longitude = locationData.longitude
      const timezone = locationData.timezone
      const postal = locationData.postal || null
      const org = locationData.org || null
      
      // Step 3: Save to database
      const now = new Date().toISOString()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // DB cache expires after 24 hours
      
      // Check if IP already exists in cache
      const { data: existing } = await supabase
        .from("ip_geolocation_cache")
        .select("visit_count")
        .eq("ip", detectedIP)
        .single()
      
      if (existing) {
        // Update existing record
        await supabase
          .from("ip_geolocation_cache")
          .update({
            country,
            country_code: countryCode,
            city,
            region,
            latitude,
            longitude,
            timezone,
            visit_count: existing.visit_count + 1,
            last_visit_at: now,
            expires_at: expiresAt.toISOString(),
            updated_at: now
          })
          .eq("ip", detectedIP)
      } else {
        // Insert new record
        await supabase.from("ip_geolocation_cache").insert({
          ip: detectedIP,
          country,
          country_code: countryCode,
          city,
          region,
          latitude,
          longitude,
          timezone,
          visit_count: 1,
          first_visit_at: now,
          last_visit_at: now,
          cached_at: now,
          expires_at: expiresAt.toISOString(),
          updated_at: now
        })
      }
      
      // Step 4: Create cookie that lives for settings.locationCookieDuration
      const cookieData = {
        country,
        country_code: countryCode,
        city,
        region,
        timezone,
        postal,
        org,
        latitude,
        longitude,
        ip: detectedIP
      }
      
      cookieStore.set(
        settings.locationCookieProps.name, 
        JSON.stringify(cookieData), 
        {
          maxAge: settings.locationCookieDuration / 1000, // Convert ms to seconds
          httpOnly: settings.locationCookieProps.httpOnly,
          secure: settings.locationCookieProps.secure,
          sameSite: settings.locationCookieProps.sameSite as 'strict' | 'lax' | 'none',
          path: settings.locationCookieProps.path
        }
      )
      
      console.log(`[Analytics] Fetched and cached location for IP ${detectedIP}: ${city}, ${region}, ${country} (cookie expires in ${settings.locationCookieDuration / (1000 * 60 * 60 * 24)} days)`)
      
      return { country, city, region, detectedIP }
    } catch (error) {
      console.error("[Analytics] IP geolocation error:", error)
      return { country: null, city: null, region: null, detectedIP: null }
    } finally {
      // Remove lock after fetch completes
      ipFetchLocks.delete(lockKey)
    }
  })()
  
  // Store the promise
  ipFetchLocks.set(lockKey, fetchPromise)
  return await fetchPromise
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, payload, sessionId, deviceId } = body

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Extract additional metadata from request
    const userAgent = req.headers.get("user-agent") || null
    const referrer = req.headers.get("referer") || null

    // Parse user agent for device/browser info (basic parsing)
    let deviceType = "unknown"
    let browser = "unknown"
    let os = "unknown"
    
    if (userAgent) {
      // Basic device type detection
      if (/mobile|android|iphone|ipad/i.test(userAgent)) {
        deviceType = "mobile"
      } else if (/tablet|ipad/i.test(userAgent)) {
        deviceType = "tablet"
      } else {
        deviceType = "desktop"
      }
      
      // Basic browser detection
      if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = "chrome"
      else if (/firefox/i.test(userAgent)) browser = "firefox"
      else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "safari"
      else if (/edg/i.test(userAgent)) browser = "edge"
      else if (/opera|opr/i.test(userAgent)) browser = "opera"
      
      // Basic OS detection
      if (/windows/i.test(userAgent)) os = "windows"
      else if (/macintosh|mac os/i.test(userAgent)) os = "macos"
      else if (/linux/i.test(userAgent)) os = "linux"
      else if (/android/i.test(userAgent)) os = "android"
      else if (/ios|iphone|ipad/i.test(userAgent)) os = "ios"
    }

    // Get location data and IP from API (auto-detects public IP with cookie caching)
    let country: string | null = null
    let city: string | null = null
    let region: string | null = null
    let ip: string | null = null
    try {
      const result = await getCountryFromIP(supabase, cookieStore)
      country = result.country
      city = result.city
      region = result.region
      ip = result.detectedIP
    } catch (error) {
      console.error("[Analytics] Location lookup failed:", error)
    }

    // Try to include product_id if provided in payload for better per-product analytics (safe even if column missing)
    const productId = (payload && (payload.productId || payload.product_id)) || null

    const insertRow: any = {
      user_id: user?.id,
      session_id: sessionId,
      device_id: deviceId,
      type,
      payload,
      ip,
      user_agent: userAgent,
      referrer,
      device_type: deviceType,
      browser,
      os,
      country,
      city,
      occurred_at: new Date().toISOString(),
    }
    if (productId) insertRow.product_id = productId

    const { error } = await supabase.from("analytics_events").insert(insertRow)

    if (error) {
      console.error("[v0] Analytics error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics route error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
