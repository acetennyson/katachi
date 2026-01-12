"use client"

import { useEffect, useState, useRef, memo } from "react"
import dynamic from "next/dynamic"

// Use memo to prevent re-renders
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

// Track if any map has been initialized globally
let globalMapInitialized = false

interface TrackingMapWrapperProps {
  startLat: number
  startLng: number
  startAddress?: string
  endLat: number
  endLng: number
  endAddress?: string
  currentLat: number
  currentLng: number
  isComplete: boolean
  status: string
}

function TrackingMapWrapperComponent({
  startLat,
  startLng,
  startAddress,
  endLat,
  endLng,
  endAddress,
  currentLat,
  currentLng,
  isComplete,
  status,
}: TrackingMapWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only set client once globally
    if (!globalMapInitialized) {
      globalMapInitialized = true
      // Small delay to ensure React has finished mounting
      const timer = setTimeout(() => {
        setIsClient(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Calculate center
  const centerLat = (startLat + endLat) / 2
  const centerLng = (startLng + endLng) / 2

  // Create custom icons
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

  if (!isClient) {
    return (
      <div style={{ height: "500px", width: "100%" }} className="bg-neutral-100 animate-pulse flex items-center justify-center">
        <p className="text-neutral-600">Loading map...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        whenReady={() => console.log("Map ready")}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route line */}
      <Polyline
        positions={[
          [startLat, startLng],
          [endLat, endLng],
        ]}
        pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.5, dashArray: "10, 10" }}
      />

      {/* Start marker (green) */}
      <Marker position={[startLat, startLng]} icon={createCustomIcon("#10b981")}>
        <Popup>
          <strong>📍 Origin</strong>
          <br />
          {startAddress || `${startLat}, ${startLng}`}
        </Popup>
      </Marker>

      {/* Current position marker (blue, animated) */}
      {!isComplete && (
        <Marker position={[currentLat, currentLng]} icon={createCustomIcon("#3b82f6")}>
          <Popup>
            <strong>🚚 Your Package</strong>
            <br />
            {status === "ACTIVE" ? "On the way!" : "Temporarily stopped"}
          </Popup>
        </Marker>
      )}

      {/* End marker (red) */}
      <Marker position={[endLat, endLng]} icon={createCustomIcon("#ef4444")}>
        <Popup>
          <strong>🏁 Destination</strong>
          <br />
          {endAddress || `${endLat}, ${endLng}`}
        </Popup>
      </Marker>
    </MapContainer>
    </div>
  )
}

// Export memoized version
export const TrackingMapWrapper = memo(TrackingMapWrapperComponent)
