"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  showBackButton?: boolean
}

export function BreadcrumbNav({ items, showBackButton = true }: BreadcrumbNavProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4 mb-6">
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            {item.href && index !== items.length - 1 ? (
              <Link href={item.href} className="text-neutral-600 hover:text-neutral-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-900 font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
