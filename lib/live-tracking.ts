/**
 * Live Tracking Utilities
 * Calculate current position based on start, end, time elapsed, and pauses
 */

import { calculatePositionOnRoute } from './route-service'

export interface TrackingSession {
  id: string
  order_id: string
  start_lat: number
  start_lng: number
  start_address?: string
  end_lat: number
  end_lng: number
  end_address?: string
  route_type?: string
  route_waypoints?: Array<{ lat: number; lng: number }>
  start_time: string
  duration_minutes: number
  paused_at?: string
  resumed_at?: string
  total_paused_duration: number
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  current_lat?: number
  current_lng?: number
  last_updated: string
}

/**
 * Calculate current position based on elapsed time
 * Uses linear interpolation between start and end points
 */
export function calculateCurrentPosition(tracking: TrackingSession): {
  lat: number
  lng: number
  progress: number // 0 to 1
  isComplete: boolean
  eta: Date | null
} {
  const now = new Date()
  const startTime = new Date(tracking.start_time)
  const totalDurationMs = tracking.duration_minutes * 60 * 1000
  
  // Calculate actual elapsed time (excluding paused time)
  let elapsedMs = now.getTime() - startTime.getTime()
  
  // If currently paused, use paused_at time instead of now
  if (tracking.status === 'PAUSED' && tracking.paused_at) {
    elapsedMs = new Date(tracking.paused_at).getTime() - startTime.getTime()
  }
  
  // Subtract total paused duration
  elapsedMs -= tracking.total_paused_duration * 60 * 1000
  
  // Calculate progress (0 to 1)
  let progress = Math.max(0, Math.min(1, elapsedMs / totalDurationMs))
  
  // If completed or cancelled, set to final position
  if (tracking.status === 'COMPLETED' || progress >= 1) {
    return {
      lat: tracking.end_lat,
      lng: tracking.end_lng,
      progress: 1,
      isComplete: true,
      eta: null,
    }
  }
  
  // Calculate position based on route type
  let lat: number
  let lng: number
  
  if (tracking.route_waypoints && tracking.route_waypoints.length > 0) {
    // Use waypoints for realistic path following
    const position = calculatePositionOnRoute(tracking.route_waypoints, progress)
    lat = position.lat
    lng = position.lng
  } else {
    // Fallback to linear interpolation (straight line)
    lat = tracking.start_lat + (tracking.end_lat - tracking.start_lat) * progress
    lng = tracking.start_lng + (tracking.end_lng - tracking.start_lng) * progress
  }
  
  // Calculate ETA
  const remainingMs = totalDurationMs - elapsedMs
  const eta = tracking.status === 'ACTIVE' ? new Date(now.getTime() + remainingMs) : null
  
  return {
    lat,
    lng,
    progress,
    isComplete: false,
    eta,
  }
}

/**
 * Calculate distance between two coordinates (in km)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date | null): string {
  if (!eta) return 'N/A'
  
  const now = new Date()
  const diffMs = eta.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  
  if (diffMinutes < 1) return 'Less than 1 minute'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${hours}h ${minutes}m`
}
