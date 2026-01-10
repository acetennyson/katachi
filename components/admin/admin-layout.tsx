"use client"

import { ReactNode } from "react"
import { AdminHeader } from "./admin-header"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader />
      <main className="py-8">
        {children}
      </main>
    </div>
  )
}
