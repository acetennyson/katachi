/**
 * Route Service - Fetches realistic routes for live tracking
 * Uses OpenStreetMap's OSRM (Open Source Routing Machine) for free routing
 */

export type RouteType = 'STRAIGHT' | 'DRIVING' | 'WALKING' | 'CYCLING' | 'TRANSIT'

interface Waypoint {
  lat: number
  lng: number
}

/**
 * Fetch route from OSRM (free, no API key required)
 * Uses public OSRM demo server
 */
export async function fetchRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeType: RouteType
): Promise<Waypoint[]> {
  // If STRAIGHT, return just start and end
  if (routeType === 'STRAIGHT') {
    return [
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng },
    ]
  }

  try {
    // Map route types to OSRM profiles
    const profileMap: Record<string, string> = {
      DRIVING: 'car',
      WALKING: 'foot',
      CYCLING: 'bike',
      TRANSIT: 'car', // Fallback to car for transit
    }

    const profile = profileMap[routeType] || 'car'

    // OSRM API endpoint (free public demo server)
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Katachi-Tracking/1.0',
      },
    })

    if (!response.ok) {
      console.error('OSRM API error:', response.status)
      return fallbackToStraightLine(startLat, startLng, endLat, endLng)
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found from OSRM')
      return fallbackToStraightLine(startLat, startLng, endLat, endLng)
    }

    // Extract coordinates from the route geometry
    const coordinates = data.routes[0].geometry.coordinates

    // Convert from [lng, lat] to {lat, lng} and simplify points
    const waypoints: Waypoint[] = coordinates.map(([lng, lat]: [number, number]) => ({
      lat,
      lng,
    }))

    // Simplify route to reduce number of waypoints (take every Nth point)
    const simplified = simplifyRoute(waypoints, 10) // Take every 10th point

    console.log(`Fetched ${coordinates.length} waypoints, simplified to ${simplified.length}`)

    return simplified
  } catch (error) {
    console.error('Error fetching route from OSRM:', error)
    return fallbackToStraightLine(startLat, startLng, endLat, endLng)
  }
}

/**
 * Fallback to straight line if routing fails
 */
function fallbackToStraightLine(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Waypoint[] {
  console.log('Falling back to straight line route')
  // Create a few intermediate points for smoother animation
  const points: Waypoint[] = []
  const steps = 5 // Number of intermediate points

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    points.push({
      lat: startLat + (endLat - startLat) * progress,
      lng: startLng + (endLng - startLng) * progress,
    })
  }

  return points
}

/**
 * Simplify route by taking every Nth waypoint
 */
function simplifyRoute(waypoints: Waypoint[], factor: number): Waypoint[] {
  if (waypoints.length <= 20) return waypoints // Keep if already small

  const simplified: Waypoint[] = [waypoints[0]] // Always include first point

  for (let i = factor; i < waypoints.length - 1; i += factor) {
    simplified.push(waypoints[i])
  }

  simplified.push(waypoints[waypoints.length - 1]) // Always include last point

  return simplified
}

/**
 * Calculate current position along a route based on progress
 */
export function calculatePositionOnRoute(waypoints: Waypoint[], progress: number): Waypoint {
  if (progress <= 0) return waypoints[0]
  if (progress >= 1) return waypoints[waypoints.length - 1]

  // Find which segment we're on
  const totalSegments = waypoints.length - 1
  const targetDistance = progress * totalSegments
  const segmentIndex = Math.floor(targetDistance)
  const segmentProgress = targetDistance - segmentIndex

  // Handle edge case
  if (segmentIndex >= waypoints.length - 1) {
    return waypoints[waypoints.length - 1]
  }

  // Interpolate between two waypoints
  const start = waypoints[segmentIndex]
  const end = waypoints[segmentIndex + 1]

  return {
    lat: start.lat + (end.lat - start.lat) * segmentProgress,
    lng: start.lng + (end.lng - start.lng) * segmentProgress,
  }
}
