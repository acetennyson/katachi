"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  Menu,
  Home,
  BarChart3
} from "lucide-react"

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    router.push("/")
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/messaging", label: "Messages", icon: MessageSquare },
  ]
  
  // Add Users link for SUPERADMIN only
  if (user?.role === "SUPERADMIN") {
    navItems.push({ href: "/admin/users", label: "Users", icon: User })
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Back to Store */}
          <Button variant="outline" size="sm" asChild className="hidden md:flex gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Store
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                  <User className="h-4 w-4 text-neutral-600" />
                </div>
                <span className="hidden md:block text-sm font-medium text-neutral-900">
                  {user?.email?.split('@')[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Role: {user?.role || 'ADMIN'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  View Store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 rounded-md hover:bg-neutral-50 transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Admin Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                {/* User Info */}
                <div className="pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                      <User className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.email}</span>
                      <span className="text-xs text-muted-foreground">Admin</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-2 py-3 text-sm font-medium rounded-md transition-colors",
                        isActive(item.href)
                          ? "bg-neutral-100 text-neutral-900"
                          : "hover:bg-neutral-50 text-neutral-600"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}

                <div className="h-px bg-neutral-200 my-2" />

                {/* Additional Links */}
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                >
                  <Home className="h-5 w-5" />
                  View Store
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                >
                  <User className="h-5 w-5" />
                  My Profile
                </Link>

                <div className="h-px bg-neutral-200 my-2" />

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
