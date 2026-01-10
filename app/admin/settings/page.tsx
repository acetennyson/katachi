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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Settings2 } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    defaults: {
      taxPercentage: "19.00",
      shippingPrice: "0.00",
      currency: "USD",
    },
    display: {
      currencyLocale: "en-US",
      currencySymbol: "$",
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (data.success) {
        setFormData({
          defaults: {
            taxPercentage: data.settings.defaults.taxPercentage.toString(),
            shippingPrice: data.settings.defaults.shippingPrice.toString(),
            currency: data.settings.defaults.currency,
          },
          display: {
            currencyLocale: data.settings.display.currencyLocale,
            currencySymbol: data.settings.display.currencySymbol,
          },
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaults: {
            taxPercentage: parseFloat(formData.defaults.taxPercentage),
            shippingPrice: parseFloat(formData.defaults.shippingPrice),
            currency: formData.defaults.currency,
          },
          display: {
            currencyLocale: formData.display.currencyLocale,
            currencySymbol: formData.display.currencySymbol,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Settings updated successfully")
      } else {
        toast.error(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setSaving(false)
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
            { label: "Settings", href: "/admin/settings" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Settings2 className="w-8 h-8" />
              Site Settings
            </h1>
            <p className="text-neutral-600 mt-1">Manage global site configuration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Default Values */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Default Values</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taxPercentage">Default Tax Percentage (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.defaults.taxPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, taxPercentage: e.target.value },
                      }))
                    }
                    placeholder="19.00"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Used when country-specific rate is not available
                  </p>
                </div>

                <div>
                  <Label htmlFor="shippingPrice">Default Shipping Price</Label>
                  <Input
                    id="shippingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaults.shippingPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, shippingPrice: e.target.value },
                      }))
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-neutral-500 mt-1">0.00 for free shipping</p>
                </div>

                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={formData.defaults.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, currency: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Display Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Display Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    type="text"
                    maxLength={3}
                    value={formData.display.currencySymbol}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display: { ...prev.display, currencySymbol: e.target.value },
                      }))
                    }
                    placeholder="$"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Symbol displayed before prices (e.g., $, €, £)
                  </p>
                </div>

                <div>
                  <Label htmlFor="currencyLocale">Currency Locale</Label>
                  <Select
                    value={formData.display.currencyLocale}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        display: { ...prev.display, currencyLocale: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">en-US (1,234.56)</SelectItem>
                      <SelectItem value="de-DE">de-DE (1.234,56)</SelectItem>
                      <SelectItem value="en-GB">en-GB (1,234.56)</SelectItem>
                      <SelectItem value="fr-FR">fr-FR (1 234,56)</SelectItem>
                      <SelectItem value="ja-JP">ja-JP (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Format for displaying numbers and currency
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
