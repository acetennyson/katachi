import { type NextRequest, NextResponse } from "next/server"

// RBAC Middleware
// Note: Admin authentication is now handled via Supabase service role
// Client admin routes (/admin/*) are protected in the component itself
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Admin API routes use service role authentication in the endpoint itself
  // So we don't need to block them here
  // The endpoints validate using getSupabaseServiceRole() which has full access

  return NextResponse.next()
}

export const config = {
  // Removed /api/admin from matcher since it's handled by service role
  matcher: [],
}
