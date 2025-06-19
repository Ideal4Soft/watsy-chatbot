/**
 * Protected Route Components for Watsy-Chatbot Platform
 * 
 * This module provides components and HOCs for protecting routes based on:
 * - Authentication status
 * - User roles and permissions
 * - Email verification status
 * - Subscription status
 */

"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, useRole, useAuthActions } from '@/stores/auth'
import { UserRole } from '@/generated/prisma'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRoles?: UserRole[]
  requireEmailVerification?: boolean
  fallbackPath?: string
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}

function UnauthorizedAccess({ requiredRoles }: { requiredRoles?: UserRole[] }) {
  const router = useRouter()
  const { logout } = useAuthActions()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {requiredRoles && requiredRoles.length > 0
                ? `This page requires ${requiredRoles.join(' or ')} role.`
                : 'You are not authorized to view this content.'
              }
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoBack} variant="outline">
              Go Back
            </Button>
            <Button onClick={handleGoHome}>
              Go to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-red-600">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmailVerificationRequired() {
  const router = useRouter()
  const { user } = useAuth()

  const handleResendVerification = () => {
    // This would trigger resend verification email
    router.push(`/verify-email?email=${user?.email}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We've sent a verification email to <strong>{user?.email}</strong>. 
              Please check your inbox and click the verification link.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleResendVerification}>
              Resend Verification Email
            </Button>
            <Button onClick={() => router.push('/login')} variant="outline">
              Sign In with Different Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN PROTECTED ROUTE COMPONENT
// ============================================================================

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRoles = [],
  requireEmailVerification = false,
  fallbackPath = '/login',
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading } = useAuth()
  const { hasAnyRole } = useRole()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth state to be determined
      if (isLoading) return

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        const redirectUrl = `${fallbackPath}?redirect=${encodeURIComponent(pathname)}`
        router.push(redirectUrl)
        return
      }

      // Check email verification requirement
      if (requireEmailVerification && user && !user.emailVerified) {
        // Don't redirect, show verification required component
        setIsChecking(false)
        return
      }

      // Check role requirements
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        // Don't redirect, show unauthorized component
        setIsChecking(false)
        return
      }

      setIsChecking(false)
    }

    checkAccess()
  }, [
    isAuthenticated,
    user,
    isLoading,
    requireAuth,
    requiredRoles,
    requireEmailVerification,
    hasAnyRole,
    router,
    pathname,
    fallbackPath
  ])

  // Show loading state
  if (isLoading || isChecking) {
    return loadingComponent || <AuthLoadingSpinner />
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null // Will redirect
  }

  // Check email verification
  if (requireEmailVerification && user && !user.emailVerified) {
    return <EmailVerificationRequired />
  }

  // Check role authorization
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return unauthorizedComponent || <UnauthorizedAccess requiredRoles={requiredRoles} />
  }

  return <>{children}</>
}

// ============================================================================
// SPECIALIZED GUARD COMPONENTS
// ============================================================================

/**
 * Authentication Guard - Requires user to be authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  return (
    <ProtectedRoute
      requireAuth={true}
      loadingComponent={fallback}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * Role Guard - Requires specific roles
 */
export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requiredRoles={allowedRoles}
      unauthorizedComponent={fallback}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * Admin Guard - Requires admin or super admin role
 */
export function AdminGuard({ children, fallback }: AuthGuardProps) {
  return (
    <RoleGuard
      allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Super Admin Guard - Requires super admin role only
 */
export function SuperAdminGuard({ children, fallback }: AuthGuardProps) {
  return (
    <RoleGuard
      allowedRoles={[UserRole.SUPER_ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Guest Guard - Redirects authenticated users away
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <AuthLoadingSpinner />
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
