"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Truck, Clock, Navigation, AlertCircle } from "lucide-react"
import { formatETA } from "@/lib/live-tracking"
import { TrackingMapWrapper } from "./tracking-map-wrapper"

interface TrackingData {
  start_lat: number
  start_lng: number
  start_address?: string
  end_lat: number
  end_lng: number
  end_address?: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  current_lat: number
  current_lng: number
  progress: number
  eta: string | null
  isComplete: boolean
}

interface LiveTrackingMapProps {
  orderId: string
  email: string
  orderNumber: string
}

export function LiveTrackingMap({ orderId, email, orderNumber }: LiveTrackingMapProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    link.crossOrigin = ""
    document.head.appendChild(link)

    setMapLoaded(true)
    setMapKey(prev => prev + 1) // Force new map instance
    fetchTracking()

    // Poll for updates every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchTracking()
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [orderId, email])

  const fetchTracking = async () => {
    try {
      const url = `/api/orders/${orderId}/tracking?email=${encodeURIComponent(email)}`
      console.log("Fetching tracking from:", url)
      
      const res = await fetch(url)
      const data = await res.json()
      
      console.log("Tracking API response:", data)

      if (data.success && data.hasTracking) {
        console.log("Tracking data found:", data.tracking)
        setTracking(data.tracking)
        setError(null)
      } else if (!data.hasTracking) {
        console.log("No tracking session found for this order")
        setError("Live tracking is not available for this order yet.")
      } else {
        console.log("Error from API:", data.error)
        setError(data.error || "Failed to load tracking")
      }
    } catch (err) {
      console.error("Failed to fetch tracking:", err)
      setError("Failed to load tracking information")
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const info = {
      ACTIVE: { label: "In Transit", color: "bg-green-100 text-green-800", icon: Truck },
      PAUSED: { label: "Temporarily Stopped", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      COMPLETED: { label: "Delivered", color: "bg-blue-100 text-blue-800", icon: MapPin },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
    }
    return info[status as keyof typeof info] || info.ACTIVE
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner className="w-12 h-12 mb-4" />
        <p className="text-neutral-600">Loading live tracking...</p>
      </div>
    )
  }

  if (error || !tracking) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Live Tracking Not Started</h2>
        <p className="text-neutral-600 mb-4">
          {error || "Live tracking with real-time map has not been activated for this order yet."}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm text-blue-900 mb-2">
            <strong>📦 Order Status:</strong>
          </p>
          <p className="text-sm text-blue-800 mb-3">
            Your order is being processed. Live GPS tracking will be available once your package is out for delivery.
          </p>
          <p className="text-sm text-blue-900">
            <strong>💡 In the meantime:</strong>
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Check basic tracking status</li>
            <li>View order details in your profile</li>
            <li>Contact support if you have questions</li>
          </ul>
        </div>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href={`/track/${orderNumber}`}>
            <Button variant="outline">View Basic Tracking</Button>
          </Link>
          <Link href="/profile/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-12 h-12" />
      </div>
    )
  }

  const statusInfo = getStatusInfo(tracking.status)
  const StatusIcon = statusInfo.icon

  // Calculate center point for map
  const centerLat = (tracking.start_lat + tracking.end_lat) / 2
  const centerLng = (tracking.start_lng + tracking.end_lng) / 2

  // Custom icon setup for Leaflet
  const createCustomIcon = (color: string) => {
    if (typeof window !== "undefined") {
      const L = require("leaflet")
      return L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
    }
    return undefined
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusIcon className="w-6 h-6 text-neutral-600" />
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Order #{orderNumber}</h2>
              <p className="text-sm text-neutral-600">Real-time tracking</p>
            </div>
          </div>
          <Badge className={statusInfo.color + " text-sm px-4 py-2"}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>Delivery Progress</span>
            <span>{Math.round(tracking.progress * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${tracking.progress * 100}%` }}
            />
          </div>
        </div>

        {/* ETA */}
        {tracking.eta && tracking.status === 'ACTIVE' && (
          <div className="mt-4 flex items-center gap-2 text-neutral-700">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">ETA:</span>
            <span>{formatETA(new Date(tracking.eta))}</span>
          </div>
        )}

        {tracking.status === 'PAUSED' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              ⏸️ Your delivery is temporarily paused. It will resume shortly.
            </p>
          </div>
        )}

        {tracking.status === 'COMPLETED' && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900">
              ✅ Your package has been delivered!
            </p>
          </div>
        )}
      </Card>

      {/* Map */}
      <Card className="p-0 overflow-hidden">
        <TrackingMapWrapper
          startLat={tracking.start_lat}
          startLng={tracking.start_lng}
          startAddress={tracking.start_address}
          endLat={tracking.end_lat}
          endLng={tracking.end_lng}
          endAddress={tracking.end_address}
          currentLat={tracking.current_lat}
          currentLng={tracking.current_lng}
          isComplete={tracking.isComplete}
          status={tracking.status}
        />
      </Card>

      {/* Route Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Origin</p>
              <p className="text-sm text-neutral-600">
                {tracking.start_address || `${tracking.start_lat}, ${tracking.start_lng}`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Destination</p>
              <p className="text-sm text-neutral-600">
                {tracking.end_address || `${tracking.end_lat}, ${tracking.end_lng}`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Auto-refresh indicator */}
      <p className="text-xs text-center text-neutral-500">
        🔄 Auto-refreshing every 5 seconds
      </p>
    </div>
  )
}
