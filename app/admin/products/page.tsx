"use client"

import { Suspense, useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Search, Package, ExternalLink } from "lucide-react"
import Link from "next/link"

function ProductsContent() {
  const [searchTerm, setSearchTerm] = useState("")

  const products = [
    {
      id: "1",
      name: "Modern Oak Lounge Chair",
      price: "€3,890",
      stock: 5,
      status: "Active",
    },
    {
      id: "2",
      name: "Minimalist Wooden Dining Table",
      price: "€2,450",
      stock: 3,
      status: "Active",
    },
    {
      id: "3",
      name: "Verde Modular Chair",
      price: "€4,890",
      stock: 0,
      status: "Out of Stock",
    },
  ]

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      <Reveal>
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-900">Products</h1>
            <p className="text-lg text-neutral-600 mt-2">Manage your product catalog</p>
          </div>
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </Reveal>

      {/* Search */}
      <Reveal delay={0.1}>
        <motion.div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
          />
        </motion.div>
      </Reveal>

      {/* Products Table */}
      <Reveal delay={0.2}>
        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 font-semibold text-neutral-900">Product</th>
                <th className="px-4 py-3 font-semibold text-neutral-900">Price</th>
                <th className="px-4 py-3 font-semibold text-neutral-900">Stock</th>
                <th className="px-4 py-3 font-semibold text-neutral-900">Status</th>
                <th className="px-4 py-3 font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{product.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{product.price}</td>
                  <td className="px-4 py-3 text-neutral-600">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Reveal>
    </>
  )
}

export default function AdminProducts() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/products")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
        router.push("/profile")
      } else {
        fetchProducts()
      }
    }
  }, [user, isLoading, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT")) {
    return null
  }

  return (
    <AdminLayout>
      <div className="container-custom max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Products Management</h1>
              <p className="text-neutral-600 mt-1">{products.length} total products</p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/admin/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-neutral-600 line-clamp-2">{product.description || 'No description'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">€{parseFloat(product.price).toFixed(2)}</p>
                      <p className="text-xs text-neutral-500">Stock: {product.stock}</p>
                    </div>
                    <div className="flex gap-2">
                      {product.status === 'ACTIVE' && (
                        <Button variant="ghost" size="sm" asChild className="gap-2">
                          <Link href={`/product/${product.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href={`/admin/products/edit/${product.id}`}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No products yet</p>
              <Button asChild>
                <Link href="/admin/products/add">Add Your First Product</Link>
              </Button>
            </div>
          )}
        </div>
    </AdminLayout>
  )
}
