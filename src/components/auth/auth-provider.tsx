/**
 * Authentication Provider for Watsy-Chatbot Platform
 * 
 * This component provides authentication context and handles:
 * - Session persistence and restoration
 * - Automatic token refresh
 * - Authentication state initialization
 * - Global authentication event handling
 */

"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, initializeAuth, setupTokenRefresh } from '@/stores/auth'
import { showError, authNotifications, authErrors } from '@/lib/notifications'
import { Loader2 } from 'lucide-react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isInitializing, setIsInitializing] = useState(true)
  const { isAuthenticated, user, refreshToken, clearAuth } = useAuthStore()

  // Initialize authentication on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth()
      } catch (error) {
        console.error('Auth initialization error:', error)
        authErrors.sessionExpired()
        clearAuth()
      } finally {
        setIsInitializing(false)
      }
    }

    initAuth()
  }, [clearAuth])

  // Setup automatic token refresh
  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshInterval = setInterval(() => {
        setupTokenRefresh()
      }, 5 * 60 * 1000) // Check every 5 minutes

      return () => clearInterval(refreshInterval)
    }
  }, [isAuthenticated, user])

  // Handle authentication state changes - simplified to avoid conflicts
  useEffect(() => {
    if (!isInitializing) {
      console.log('AuthProvider: Auth state changed', {
        isAuthenticated,
        pathname,
        isProtected: isProtectedRoute(pathname),
        isAuth: isAuthRoute(pathname)
      })

      // Only handle automatic redirects for protected routes when clearly unauthenticated
      // Let individual pages handle their own authentication logic
      if (!isAuthenticated && isProtectedRoute(pathname) && pathname !== '/dashboard') {
        console.log('AuthProvider: Redirecting to login from protected route:', pathname)
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }
  }, [isAuthenticated, pathname, router, isInitializing])

  // Show loading screen during initialization
  if (isInitializing) {
    return <AuthLoadingScreen />
  }

  return <>{children}</>
}

/**
 * Authentication Loading Screen
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">Watsy</span>
        </div>
        
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-600">Initializing application...</p>
      </div>
    </div>
  )
}

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/devices',
    '/chatbots',
    '/messages',
    '/analytics',
    '/admin'
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is an authentication route
 */
function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ]
  
  return authRoutes.includes(pathname)
}

/**
 * Session Management Hook
 * 
 * Provides session management utilities for components
 */
export function useSession() {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    if (!isLoading) {
      setSessionStatus(isAuthenticated ? 'authenticated' : 'unauthenticated')
    }
  }, [isAuthenticated, isLoading])

  return {
    status: sessionStatus,
    user,
    isLoading
  }
}

/**
 * Authentication Event Handler Hook
 * 
 * Handles global authentication events and notifications
 */
export function useAuthEvents() {
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    // Handle successful login
    if (isAuthenticated && user) {
      // Only show welcome message if this is a fresh login
      const isNewLogin = sessionStorage.getItem('newLogin')
      if (isNewLogin) {
        authNotifications.loginSuccess(user.firstName)
        sessionStorage.removeItem('newLogin')
      }
    }
  }, [isAuthenticated, user])

  // Mark as new login when login action is triggered
  const markNewLogin = () => {
    sessionStorage.setItem('newLogin', 'true')
  }

  return { markNewLogin }
}

/**
 * Auto-logout Hook
 * 
 * Automatically logs out user after period of inactivity
 */
export function useAutoLogout(timeoutMinutes: number = 30) {
  const { isAuthenticated, logout } = useAuthStore()
  const [lastActivity, setLastActivity] = useState(Date.now())

  useEffect(() => {
    if (!isAuthenticated) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    // Check for inactivity
    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      const timeoutMs = timeoutMinutes * 60 * 1000

      if (timeSinceLastActivity > timeoutMs) {
        authErrors.sessionExpired()
        logout()
      }
    }, 60000) // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
      clearInterval(interval)
    }
  }, [isAuthenticated, lastActivity, timeoutMinutes, logout])
}

/**
 * Token Refresh Hook
 * 
 * Handles automatic token refresh before expiration
 */
export function useTokenRefresh() {
  const { isAuthenticated, refreshToken, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      try {
        const success = await refreshToken()
        if (!success) {
          authErrors.sessionExpired()
          clearAuth()
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        authErrors.sessionExpired()
        clearAuth()
      }
    }, 10 * 60 * 1000) // Refresh every 10 minutes

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, refreshToken, clearAuth])
}

/**
 * Network Status Hook
 * 
 * Handles authentication when network connectivity changes
 */
export function useNetworkAuth() {
  const { isAuthenticated, refreshToken } = useAuthStore()

  useEffect(() => {
    const handleOnline = async () => {
      if (isAuthenticated) {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Network reconnection auth error:', error)
        }
      }
    }

    const handleOffline = () => {
      // Could show offline notification
      console.log('Application is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isAuthenticated, refreshToken])
}
