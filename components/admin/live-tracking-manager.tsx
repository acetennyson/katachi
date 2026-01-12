"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Play, Pause, CheckCircle, XCircle, Trash2, Navigation, Car, PersonStanding, Bike, Train, Plane } from "lucide-react"
import { toast } from "sonner"

interface LiveTrackingManagerProps {
  orderId: string
  orderNumber: string
}

interface TrackingData {
  id: string
  start_lat: number
  start_lng: number
  start_address?: string
  end_lat: number
  end_lng: number
  end_address?: string
  start_time: string
  duration_minutes: number
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  current_lat?: number
  current_lng?: number
  calculated_position?: {
    lat: number
    lng: number
    progress: number
    isComplete: boolean
    eta: string | null
  }
}

export function LiveTrackingManager({ orderId, orderNumber }: LiveTrackingManagerProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Setup form state
  const [startLat, setStartLat] = useState("")
  const [startLng, setStartLng] = useState("")
  const [startAddress, setStartAddress] = useState("")
  const [endLat, setEndLat] = useState("")
  const [endLng, setEndLng] = useState("")
  const [endAddress, setEndAddress] = useState("")
  const [duration, setDuration] = useState("60")
  const [routeType, setRouteType] = useState("DRIVING")

  useEffect(() => {
    fetchTracking()
  }, [orderId])

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`)
      const data = await res.json()
      
      if (data.success && data.tracking) {
        setTracking(data.tracking)
        setShowSetup(false)
      } else {
        setTracking(null)
      }
    } catch (error) {
      console.error("Failed to fetch tracking:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: parseFloat(startLat),
          start_lng: parseFloat(startLng),
          start_address: startAddress,
          end_lat: parseFloat(endLat),
          end_lng: parseFloat(endLng),
          end_address: endAddress,
          duration_minutes: parseInt(duration),
          route_type: routeType,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Live tracking started!", {
          description: "Customers can now see the package moving on the map.",
        })
        await fetchTracking()
      } else {
        toast.error(data.error || "Failed to start tracking")
      }
    } catch (error) {
      toast.error("Failed to start tracking")
    } finally {
      setUpdating(false)
    }
  }

  const handleAction = async (action: string) => {
    setUpdating(true)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (data.success) {
        const messages = {
          pause: "Tracking paused",
          resume: "Tracking resumed",
          complete: "Order marked as delivered!",
          cancel: "Tracking cancelled",
        }
        toast.success(messages[action as keyof typeof messages])
        await fetchTracking()
      } else {
        toast.error(data.error || "Failed to update tracking")
      }
    } catch (error) {
      toast.error("Failed to update tracking")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this tracking session?")) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Tracking deleted")
        setTracking(null)
        setShowSetup(false)
      } else {
        toast.error("Failed to delete tracking")
      }
    } catch (error) {
      toast.error("Failed to delete tracking")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      PAUSED: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const useCurrentLocation = (type: 'start' | 'end') => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (type === 'start') {
            setStartLat(position.coords.latitude.toFixed(6))
            setStartLng(position.coords.longitude.toFixed(6))
            toast.success("Start location set to your current position")
          } else {
            setEndLat(position.coords.latitude.toFixed(6))
            setEndLng(position.coords.longitude.toFixed(6))
            toast.success("End location set to your current position")
          }
        },
        (error) => {
          toast.error("Could not get your location")
        }
      )
    } else {
      toast.error("Geolocation not supported")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
        </div>
      </Card>
    )
  }

  if (!tracking && !showSetup) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Navigation className="h-5 w-5 text-neutral-600" />
          <h2 className="text-lg font-bold text-neutral-900">Live Tracking</h2>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          Enable real-time map tracking so customers can watch their package move from origin to destination.
        </p>
        <Button onClick={() => setShowSetup(true)}>
          <Play className="w-4 h-4 mr-2" />
          Start Live Tracking
        </Button>
      </Card>
    )
  }

  if (showSetup) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-neutral-600" />
            <h2 className="text-lg font-bold text-neutral-900">Setup Live Tracking</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSetup(false)}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleCreateTracking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Start Location
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={startLat}
                  onChange={(e) => setStartLat(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={startLng}
                  onChange={(e) => setStartLng(e.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="Address (optional)"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => useCurrentLocation('start')}
              >
                Use Current Location
              </Button>
            </div>

            {/* End Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Destination
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={endLat}
                  onChange={(e) => setEndLat(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={endLng}
                  onChange={(e) => setEndLng(e.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="Address (optional)"
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => useCurrentLocation('end')}
              >
                Use Current Location
              </Button>
            </div>
          </div>

          <div>
            <Label>Route Type</Label>
            <Select value={routeType} onValueChange={setRouteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRAIGHT">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Straight Line (Air)</div>
                      <div className="text-xs text-neutral-500">Direct path - for air freight</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="DRIVING">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Driving Route</div>
                      <div className="text-xs text-neutral-500">Follows roads - realistic for cars/trucks</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="WALKING">
                  <div className="flex items-center gap-2">
                    <PersonStanding className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Walking Route</div>
                      <div className="text-xs text-neutral-500">Pedestrian paths - for local delivery</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="CYCLING">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Cycling Route</div>
                      <div className="text-xs text-neutral-500">Bike paths - for bicycle delivery</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="TRANSIT">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Public Transit</div>
                      <div className="text-xs text-neutral-500">Bus/train routes</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">
              {routeType === 'STRAIGHT' 
                ? '⚡ Fast simulation - package moves in a straight line' 
                : '🗺️ Realistic routing - uses actual paths (requires route calculation)'}
            </p>
          </div>

          <div>
            <Label>Estimated Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              How long should the package take to travel from start to destination?
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> You can find coordinates by searching on Google Maps, right-clicking a location,
              and selecting the coordinates to copy them.
            </p>
          </div>

          <Button type="submit" disabled={updating} className="w-full">
            {updating ? "Starting..." : "Start Tracking"}
          </Button>
        </form>
      </Card>
    )
  }

  // Tracking active view
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Navigation className="h-5 w-5 text-neutral-600" />
          <h2 className="text-lg font-bold text-neutral-900">Live Tracking</h2>
          <Badge className={getStatusColor(tracking!.status)}>
            {tracking!.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={updating}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Progress */}
        {tracking!.calculated_position && (
          <div>
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(tracking!.calculated_position.progress * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${tracking!.calculated_position.progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Route Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">From</p>
            <p className="font-medium">{tracking!.start_address || `${tracking!.start_lat}, ${tracking!.start_lng}`}</p>
          </div>
          <div>
            <p className="text-neutral-500">To</p>
            <p className="font-medium">{tracking!.end_address || `${tracking!.end_lat}, ${tracking!.end_lng}`}</p>
          </div>
        </div>

        {/* ETA */}
        {tracking!.calculated_position?.eta && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>ETA:</strong> {new Date(tracking!.calculated_position.eta).toLocaleString()}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {tracking!.status === 'ACTIVE' && (
            <Button
              onClick={() => handleAction('pause')}
              disabled={updating}
              variant="outline"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {tracking!.status === 'PAUSED' && (
            <Button
              onClick={() => handleAction('resume')}
              disabled={updating}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          {(tracking!.status === 'ACTIVE' || tracking!.status === 'PAUSED') && (
            <>
              <Button
                onClick={() => handleAction('complete')}
                disabled={updating}
                variant="default"
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Delivered
              </Button>

              <Button
                onClick={() => handleAction('cancel')}
                disabled={updating}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Public Link */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-900 mb-2">
            <strong>📍 Customer Tracking Link:</strong>
          </p>
          <a
            href={`/track/${orderNumber}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:underline break-all"
          >
            {typeof window !== 'undefined' && window.location.origin}/track/{orderNumber}/live
          </a>
        </div>
      </div>
    </Card>
  )
}
