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
import { Textarea } from "@/components/ui/textarea"
import { Truck, Plus, Save, X, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"

interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimated_days: string
  enabled: boolean
  sort_order: number
}

export default function ShippingMethodsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "0.00",
    estimated_days: "",
    enabled: true,
    sort_order: 0,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      const response = await fetch("/api/admin/shipping-methods")
      const data = await response.json()

      if (data.success) {
        setMethods(data.methods)
      }
    } catch (error) {
      console.error("Failed to fetch shipping methods:", error)
      toast.error("Failed to load shipping methods")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (method: ShippingMethod) => {
    setEditingId(method.id)
    setFormData({
      id: method.id,
      name: method.name,
      description: method.description || "",
      price: method.price.toString(),
      estimated_days: method.estimated_days || "",
      enabled: method.enabled,
      sort_order: method.sort_order,
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      id: "",
      name: "",
      description: "",
      price: "0.00",
      estimated_days: "",
      enabled: true,
      sort_order: methods.length,
    })
  }

  const handleSave = async () => {
    try {
      const url = editingId
        ? `/api/admin/shipping-methods/${editingId}`
        : "/api/admin/shipping-methods"
      
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          estimated_days: formData.estimated_days,
          enabled: formData.enabled,
          sort_order: formData.sort_order,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingId ? "Method updated" : "Method created")
        fetchMethods()
        handleCancel()
      } else {
        toast.error(data.error || "Failed to save method")
      }
    } catch (error) {
      console.error("Failed to save method:", error)
      toast.error("Failed to save method")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping method?")) return

    try {
      const response = await fetch(`/api/admin/shipping-methods/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Method deleted")
        fetchMethods()
      } else {
        toast.error(data.error || "Failed to delete method")
      }
    } catch (error) {
      console.error("Failed to delete method:", error)
      toast.error("Failed to delete method")
    }
  }

  const toggleEnabled = async (method: ShippingMethod) => {
    try {
      const response = await fetch(`/api/admin/shipping-methods/${method.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...method,
          enabled: !method.enabled,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(method.enabled ? "Method disabled" : "Method enabled")
        fetchMethods()
      } else {
        toast.error(data.error || "Failed to update method")
      }
    } catch (error) {
      console.error("Failed to update method:", error)
      toast.error("Failed to update method")
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
            { label: "Shipping Methods", href: "/admin/shipping-methods" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Truck className="w-8 h-8" />
              Shipping Methods
            </h1>
            <p className="text-neutral-600 mt-1">Manage shipping options for customers</p>
          </div>
          
          {!editingId && (
            <Button onClick={() => setEditingId("new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(editingId || editingId === "new") && (
          <Card className="p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              {editingId === "new" ? "Add New" : "Edit"} Shipping Method
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="id">ID *</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="standard"
                  disabled={editingId !== "new"}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Unique identifier (lowercase, no spaces)
                </p>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Standard Shipping"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Delivery in 5-7 business days"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_days">Estimated Delivery</Label>
                <Input
                  id="estimated_days"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                  placeholder="5-7"
                />
                <p className="text-xs text-neutral-500 mt-1">e.g., "5-7" or "1"</p>
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enabled" className="cursor-pointer">Enabled</Label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Methods List */}
        <div className="grid grid-cols-1 gap-4">
          {methods.map((method) => (
            <Card key={method.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-neutral-900">{method.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        method.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {method.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-neutral-600 mt-1">{method.description}</p>
                  <div className="flex gap-4 mt-3 text-sm text-neutral-500">
                    <span>Price: ${method.price.toFixed(2)}</span>
                    {method.estimated_days && (
                      <span>Delivery: {method.estimated_days} days</span>
                    )}
                    <span>Sort: {method.sort_order}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleEnabled(method)}
                  >
                    {method.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(method)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
