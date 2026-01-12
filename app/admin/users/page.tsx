"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Users, Shield, UserCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  name: string
  role: "CUSTOMER" | "ADMIN" | "SUPPORT" | "SUPERADMIN"
  created_at: string
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/users")
      } else if (user.role !== "SUPERADMIN") {
        // Only SUPERADMIN can manage user roles
        router.push("/admin")
      } else {
        fetchUsers()
      }
    }
  }, [user, isLoading, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update role")
      }
    } catch (error) {
      console.error("Failed to update role:", error)
      alert("Failed to update role")
    } finally {
      setUpdating(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "SUPPORT":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
            <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
            <p className="text-neutral-600 mt-1">{users.length} total users</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Shield className="h-4 w-4" />
            SUPERADMIN Only
          </Badge>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-900">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-900">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-900">Current Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                          <UserCog className="h-5 w-5 text-neutral-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{u.name}</p>
                          <p className="text-xs text-neutral-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleBadgeColor(u.role)}>{u.role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.id === user.id ? (
                        <span className="text-sm text-neutral-500 italic">You cannot change your own role</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updating === u.id}
                          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 disabled:opacity-50"
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="SUPPORT">Support</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPERADMIN">Super Admin</option>
                        </select>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">No users found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
