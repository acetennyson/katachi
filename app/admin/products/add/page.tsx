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
import { Plus, Save, X } from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/image-upload"
import { MultiImageUpload } from "@/components/admin/multi-image-upload"
import settings from "@/lib/constants/settings"

export default function AddProduct() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "furniture",
    category_id: "",
    status: "DRAFT",
    price: "",
    currency: settings.defaults.currency,
    stock: "",
    in_stock: true,
    tax_percentage: settings.defaults.taxPercentage.toString(),
    shipping_price: settings.defaults.shippingPrice.toString(),
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
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/products/add")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        router.push("/profile")
      } else {
        fetchCategories()
      }
    }
  }, [user, isLoading, router])

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

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/products/upload", {
        method: "POST",
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
        toast.success("Product created successfully!")
        router.push("/admin/products")
      } else {
        toast.error(data.error || "Failed to create product")
      }
    } catch (error) {
      console.error("Failed to create product:", error)
      toast.error("Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
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
            { label: "Add Product" }
          ]} />

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900">Add New Product</h1>
            <p className="text-neutral-600 mt-1">Create a new product in your catalog</p>
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Modern Oak Lounge Chair"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="modern-oak-lounge-chair"
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">Auto-generated from name</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed product description..."
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
                      placeholder="furniture, chair, table, etc."
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
                    {categories.length === 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        No categories found. Create categories first in Categories section.
                      </p>
                    )}
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
                    placeholder='["Oak Wood", "Premium Leather"]'
                    rows={2}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Array of material names</p>
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
                    placeholder='[{"name": "Natural Oak", "value": "#D2B48C"}, {"name": "Dark Oak", "value": "#6B4423"}]'
                    rows={3}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Array of color objects with name and hex value</p>
                </div>

                <div>
                  <Label htmlFor="specifications">Specifications (JSON Array)</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                    placeholder='["Made from sustainably sourced solid oak", "Premium full-grain leather seating"]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Array of specification strings</p>
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
                    placeholder="999.99"
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
                    placeholder="10"
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
                placeholder='{"color": "oak", "material": "wood", "dimensions": {"width": 80, "height": 75, "depth": 85}}'
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-neutral-500 mt-1">Enter valid JSON for product attributes</p>
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
                    Save Product
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
