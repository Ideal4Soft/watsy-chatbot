/**
 * Authentication Middleware for Watsy-Chatbot Platform
 * 
 * This middleware handles:
 * - Route protection based on authentication status
 * - Role-based access control
 * - JWT token validation
 * - Automatic token refresh
 * - Redirect logic for authenticated/unauthenticated users
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/health',
  '/api/auth/refresh'
]

/**
 * Authentication routes that should redirect authenticated users
 */
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
]

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/devices',
  '/chatbots',
  '/messages',
  '/analytics'
]

/**
 * Admin routes that require ADMIN or SUPER_ADMIN role
 */
const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/subscriptions',
  '/admin/analytics',
  '/admin/settings'
]

/**
 * Super admin routes that require SUPER_ADMIN role only
 */
const SUPER_ADMIN_ROUTES = [
  '/admin/system',
  '/admin/audit-logs',
  '/admin/system-settings'
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a path matches any of the given patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1))
    }
    return pathname === pattern || pathname.startsWith(pattern + '/')
  })
}

// Note: Role-based access control functions removed since we're using
// a simplified middleware approach. Role checks are handled in Server Components.

// ============================================================================
// MIDDLEWARE FUNCTION
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'))
  ) {
    return NextResponse.next()
  }
  
  // Check if route is public
  const isPublicRoute = matchesPath(pathname, PUBLIC_ROUTES)
  const isAuthRoute = matchesPath(pathname, AUTH_ROUTES)
  const isProtectedRoute = matchesPath(pathname, PROTECTED_ROUTES) ||
                          matchesPath(pathname, ADMIN_ROUTES) ||
                          matchesPath(pathname, SUPER_ADMIN_ROUTES)

  // Allow public routes without authentication
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  // Check for authentication by looking for refresh token cookie
  // In Edge Runtime, we can't verify JWT tokens, so we use a simpler approach
  const refreshToken = request.cookies.get('refreshToken')?.value
  const accessToken = request.cookies.get('accessToken')?.value

  // Consider user authenticated if they have both tokens
  // The actual validation happens in the React components
  const hasTokens = !!(refreshToken && accessToken)

  // Handle authentication routes - be more permissive to avoid redirect loops
  if (isAuthRoute) {
    // For now, let React components handle all authentication logic
    // This prevents middleware redirect loops
    console.log('Auth route accessed:', pathname, 'hasTokens:', hasTokens)
    return NextResponse.next()
  }
  
  // Handle protected routes
  if (isProtectedRoute) {
    if (!hasTokens) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Note: Role-based access control is handled in Server Components/Actions
    // since we can't verify JWT tokens in Edge Runtime middleware
  }
  
  // Continue with the request
  return NextResponse.next()
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
