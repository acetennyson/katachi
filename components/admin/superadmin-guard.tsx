"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "sonner"

interface SuperAdminGuardProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

/**
 * Wrapper component that ensures only SUPERADMIN users can access a page
 * Regular ADMINs will be redirected to /admin with an error message
 */
export function SuperAdminGuard({ children, loadingComponent }: SuperAdminGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin")
      } else if (user.role !== "SUPERADMIN") {
        router.push("/admin")
        toast.error("Access Denied - SUPERADMIN access required")
      }
    }
  }, [user, isLoading, router])

  // Show loading state
  if (isLoading) {
    return (
      loadingComponent || (
        <AdminLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading...</p>
            </div>
          </div>
        </AdminLayout>
      )
    )
  }

  // Block non-SUPERADMIN users
  if (!user || user.role !== "SUPERADMIN") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h2>
            <p className="text-neutral-600 mb-4">
              This page is only accessible to SUPERADMIN users.
            </p>
            <p className="text-sm text-neutral-500">
              You will be redirected to the admin dashboard.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // User is authenticated and is SUPERADMIN
  return <>{children}</>
}
