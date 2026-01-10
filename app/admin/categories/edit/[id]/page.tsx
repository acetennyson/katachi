"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/image-upload"

export default function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [categoryId, setCategoryId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    tags: "",
  })

  useEffect(() => {
    params.then(p => setCategoryId(p.id))
  }, [params])

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/categories")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        router.push("/profile")
      } else if (categoryId) {
        fetchCategory()
      }
    }
  }, [user, isLoading, router, categoryId])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`)
      const data = await response.json()
      
      if (data.success && data.category) {
        const category = data.category
        setFormData({
          name: category.name || "",
          slug: category.slug || "",
          description: category.description || "",
          image: category.image || "",
          tags: Array.isArray(category.tags) ? category.tags.join(", ") : "",
        })
      } else {
        toast.error("Category not found")
        router.push("/admin/categories")
      }
    } catch (error) {
      console.error("Failed to fetch category:", error)
      toast.error("Failed to load category")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Category updated successfully!")
        router.push("/admin/categories")
      } else {
        toast.error(data.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Failed to update category:", error)
      toast.error("Failed to update category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category? Products using this category will have their category unset.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Category deleted successfully!")
        router.push("/admin/categories")
      } else {
        toast.error(data.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast.error("Failed to delete category")
    }
  }

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </main>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return null
  }

  return (
    <AdminLayout>
      <div className="container-custom max-w-4xl">
        <BreadcrumbNav items={[
          { label: "Categories", href: "/admin/categories" },
          { label: "Edit Category" }
        ]} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Edit Category</h1>
            <p className="text-neutral-600 mt-1">Update category information</p>
          </div>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated) *</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Used for smart product recommendations. Separate tags with commas.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Category Image</h2>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
              label="Category Image"
              placeholder="Upload category image"
            />
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
