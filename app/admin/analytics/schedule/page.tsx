"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Plus, Trash2, Clock, Check } from "lucide-react"
import { toast } from "sonner"

interface Schedule {
  id: string
  report_type: string
  frequency: string
  recipients: string[]
  enabled: boolean
  next_run: string
  created_at: string
}

export default function ScheduleReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    reportType: "overview",
    frequency: "weekly",
    recipients: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchSchedules()
    }
  }, [user])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/schedule?userId=${user?.id}`)
      const result = await response.json()
      if (result.success) {
        setSchedules(result.schedules)
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const recipients = formData.recipients.split(",").map(email => email.trim()).filter(Boolean)
      
      if (recipients.length === 0) {
        toast.error("Please enter at least one email address")
        return
      }

      const response = await fetch("/api/admin/analytics/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          reportType: formData.reportType,
          frequency: formData.frequency,
          recipients,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Report scheduled successfully!")
        setShowForm(false)
        setFormData({ reportType: "overview", frequency: "weekly", recipients: "" })
        fetchSchedules()
      } else {
        toast.error(result.error || "Failed to schedule report")
      }
    } catch (error) {
      console.error("Failed to schedule report:", error)
      toast.error("Failed to schedule report")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/admin/analytics/schedule?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Schedule deleted successfully")
        fetchSchedules()
      } else {
        toast.error(result.error || "Failed to delete schedule")
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error)
      toast.error("Failed to delete schedule")
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Analytics", href: "/admin/analytics" },
            { label: "Schedule Reports", href: "/admin/analytics/schedule" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Mail className="w-8 h-8" />
              Scheduled Email Reports
            </h1>
            <p className="text-neutral-600 mt-1">Automate your analytics reports via email</p>
          </div>
          
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>

        {/* Add Schedule Form */}
        {showForm && (
          <Card className="p-6 mb-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Create New Schedule</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <select
                    id="reportType"
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  >
                    <option value="overview">Overview</option>
                    <option value="pageviews">Page Views</option>
                    <option value="behavior">User Behavior</option>
                    <option value="conversions">Conversions</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="recipients">Email Recipients</Label>
                <Input
                  id="recipients"
                  type="text"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Check className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Schedules List */}
        <div className="grid grid-cols-1 gap-4">
          {schedules.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Scheduled Reports</h3>
              <p className="text-neutral-600 mb-4">
                Create your first scheduled report to receive analytics via email
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900 capitalize">
                        {schedule.report_type} Report
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          schedule.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {schedule.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{schedule.frequency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{schedule.recipients.join(", ")}</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Next run: {new Date(schedule.next_run).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
