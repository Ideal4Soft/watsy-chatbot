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
import { verifyAccessToken, extractAccessTokenFromHeader, isTokenExpired } from '@/lib/auth-middleware'
import { UserRole } from '@/generated/prisma'

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

/**
 * Check if user has required role for a route
 */
function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Get required roles for a given path
 */
function getRequiredRoles(pathname: string): UserRole[] {
  if (matchesPath(pathname, SUPER_ADMIN_ROUTES)) {
    return [UserRole.SUPER_ADMIN]
  }
  
  if (matchesPath(pathname, ADMIN_ROUTES)) {
    return [UserRole.ADMIN, UserRole.SUPER_ADMIN]
  }
  
  if (matchesPath(pathname, PROTECTED_ROUTES)) {
    return [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
  }
  
  return []
}

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

  // Get access token from Authorization header
  const authHeader = request.headers.get('authorization')
  const accessToken = extractAccessTokenFromHeader(authHeader)

  // Try to get user from access token
  let user = null
  let isAuthenticated = false

  if (accessToken && !isTokenExpired(accessToken)) {
    const tokenResult = verifyAccessToken(accessToken)
    if (tokenResult.success && tokenResult.user) {
      user = tokenResult.user
      isAuthenticated = true
    }
  }

  // Handle authentication routes
  if (isAuthRoute && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Handle protected routes
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check role-based access
    const requiredRoles = getRequiredRoles(pathname)
    if (requiredRoles.length > 0 && user && !hasRequiredRole(user.role, requiredRoles)) {
      // Redirect users without required role to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Add user information to request headers for Server Components
  const response = NextResponse.next()
  
  if (isAuthenticated && user) {
    response.headers.set('x-user-id', user.userId)
    response.headers.set('x-user-email', user.email)
    response.headers.set('x-user-role', user.role)
    response.headers.set('x-user-name', `${user.firstName} ${user.lastName}`)
  }
  
  return response
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
