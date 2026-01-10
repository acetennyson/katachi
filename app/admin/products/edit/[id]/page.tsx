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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/image-upload"
import { MultiImageUpload } from "@/components/admin/multi-image-upload"
import settings from "@/lib/constants/settings"

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [productId, setProductId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "",
    category_id: "",
    status: "DRAFT",
    price: "",
    currency: "EUR",
    stock: "",
    in_stock: true,
    tax_percentage: "19.00",
    shipping_price: "0.00",
    image: "",
    images: [],
    materials: "[]",
    dimensions: "",
    colors: "[]",
    badge: "",
    specifications: "[]",
    attributes: "{}",
  })

  useEffect(() => {
    params.then(p => setProductId(p.id))
  }, [params])

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/products")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        router.push("/profile")
      } else if (productId) {
        fetchCategories()
        fetchProduct()
      }
    }
  }, [user, isLoading, router, productId])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      const data = await response.json()
      
      if (data.success && data.product) {
        const product = data.product
        setFormData({
          name: product.name || "",
          slug: product.slug || "",
          description: product.description || "",
          type: product.type || "",
          category_id: product.category_id || "",
          status: product.status || "DRAFT",
          price: product.price?.toString() || "",
          currency: product.currency || "EUR",
          stock: product.stock?.toString() || "",
          in_stock: product.in_stock !== undefined ? product.in_stock : true,
          tax_percentage: product.tax_percentage?.toString() || settings.defaults.taxPercentage.toString(),
          shipping_price: product.shipping_price?.toString() || settings.defaults.shippingPrice.toString(),
          image: product.image || "",
          images: Array.isArray(product.images) ? product.images : [],
          materials: JSON.stringify(product.materials || [], null, 2),
          dimensions: product.dimensions || "",
          colors: JSON.stringify(product.colors || [], null, 2),
          badge: product.badge || "",
          specifications: JSON.stringify(product.specifications || [], null, 2),
          attributes: JSON.stringify(product.attributes || {}, null, 2),
        })
      } else {
        toast.error("Product not found")
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast.error("Failed to load product")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          in_stock: formData.in_stock,
          tax_percentage: parseFloat(formData.tax_percentage),
          shipping_price: parseFloat(formData.shipping_price),
          materials: JSON.parse(formData.materials || "[]"),
          images: formData.images,
          colors: JSON.parse(formData.colors || "[]"),
          specifications: JSON.parse(formData.specifications || "[]"),
          attributes: JSON.parse(formData.attributes || "{}"),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Product updated successfully!")
        router.push("/admin/products")
      } else {
        toast.error(data.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Failed to update product:", error)
      toast.error("Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Product deleted successfully!")
        router.push("/admin/products")
      } else {
        toast.error(data.error || "Failed to delete product")
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast.error("Failed to delete product")
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
            { label: "Products", href: "/admin/products" },
            { label: "Edit Product" }
          ]} />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Edit Product</h1>
              <p className="text-neutral-600 mt-1">Update product information</p>
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
                  <Label htmlFor="name">Product Name *</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Product Type *</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="badge">Badge (Optional)</Label>
                    <Select value={formData.badge || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, badge: value === "none" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Limited">Limited</SelectItem>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Popular">Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Images & Media</h2>
              
              <div className="space-y-6">
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                  label="Main Product Image *"
                  placeholder="Upload main product image"
                />

                <MultiImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                  label="Additional Images (Gallery)"
                  maxImages={10}
                />
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Product Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="materials">Materials (JSON Array)</Label>
                  <Textarea
                    id="materials"
                    value={formData.materials}
                    onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="W: 85cm × D: 90cm × H: 75cm"
                  />
                </div>

                <div>
                  <Label htmlFor="colors">Colors (JSON Array)</Label>
                  <Textarea
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => setFormData(prev => ({ ...prev, colors: e.target.value }))}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="specifications">Specifications (JSON Array)</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="tax_percentage">Tax Percentage (%) *</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_percentage: e.target.value }))}
                    placeholder="19.00"
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">Default: {settings.defaults.taxPercentage}%</p>
                </div>

                <div>
                  <Label htmlFor="shipping_price">Shipping Price *</Label>
                  <Input
                    id="shipping_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">0.00 for free shipping</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_stock: e.target.checked }))}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-700">In Stock (Available for purchase)</span>
                </label>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Additional Attributes (JSON)</h2>
              <Textarea
                value={formData.attributes}
                onChange={(e) => setFormData(prev => ({ ...prev, attributes: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
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
