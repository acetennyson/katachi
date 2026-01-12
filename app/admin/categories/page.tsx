"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Tag } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function AdminCategories() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/categories")
      } else if (user.role !== "SUPERADMIN") {
        // Only SUPERADMIN can manage categories
        router.push("/admin")
      } else {
        fetchCategories()
      }
    }
  }, [user, isLoading, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
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

  if (!user || user.role !== "SUPERADMIN") {
    return null
  }

  return (
    <AdminLayout>
      <div className="container-custom max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Categories Management</h1>
            <p className="text-neutral-600 mt-1">{categories.length} total categories</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/categories/add">
              <Plus className="h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              whileHover={{ y: -4 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-neutral-500 mb-2">/{category.slug}</p>
                    <p className="text-sm text-neutral-600 line-clamp-2">{category.description || 'No description'}</p>
                  </div>
                </div>
                
                {category.tags && category.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {category.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {category.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{category.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild className="gap-2 flex-1">
                    <Link href={`/admin/categories/edit/${category.id}`}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No categories yet</p>
            <Button asChild>
              <Link href="/admin/categories/add">Add Your First Category</Link>
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
