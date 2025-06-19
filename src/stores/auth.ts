/**
 * Authentication Store for Watsy-Chatbot Platform
 * 
 * This Zustand store manages client-side authentication state including:
 * - User authentication status
 * - User profile information
 * - Access token management
 * - Login/logout actions
 * - Token refresh handling
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { UserRole } from '@/generated/prisma'
import { 
  loginUser, 
  logoutUser, 
  refreshAccessToken,
  type LoginResult,
  type AuthActionResult 
} from '@/app/actions/auth'
import { isTokenExpired, decodeTokenPayload } from '@/lib/auth-client'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string | null
  emailVerified?: Date | null
}

export interface AuthState {
  // State
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  accessToken: string | null
  error: string | null
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
  clearError: () => void
  
  // Utilities
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isTokenValid: () => boolean
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
      error: null,

      // Login action
      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await loginUser({ email, password, rememberMe })
          
          if (result.success && result.accessToken && result.user) {
            set({
              isAuthenticated: true,
              user: result.user,
              accessToken: result.accessToken,
              isLoading: false,
              error: null
            })
          } else {
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              isLoading: false,
              error: result.error || 'Login failed'
            })
          }
          
          return result
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: errorMessage
          })
          
          return {
            success: false,
            error: errorMessage
          }
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true })
        
        try {
          await logoutUser()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: null
          })
        }
      },

      // Refresh token action
      refreshToken: async () => {
        try {
          const result = await refreshAccessToken()
          
          if (result.success && result.accessToken && result.user) {
            set({
              isAuthenticated: true,
              user: result.user,
              accessToken: result.accessToken,
              error: null
            })
            return true
          } else {
            // Clear auth state if refresh fails
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              error: null
            })
            return false
          }
        } catch (error) {
          console.error('Token refresh error:', error)
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            error: null
          })
          return false
        }
      },

      // Set user
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      // Set access token
      setAccessToken: (token: string) => {
        const tokenPayload = decodeTokenPayload(token)
        if (tokenPayload && tokenPayload.userId) {
          set({
            accessToken: token,
            isAuthenticated: true,
            user: {
              id: tokenPayload.userId,
              email: tokenPayload.email,
              firstName: tokenPayload.firstName,
              lastName: tokenPayload.lastName,
              role: tokenPayload.role
            }
          })
        }
      },

      // Clear authentication state
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: null
        })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Check if user has specific role
      hasRole: (role: UserRole) => {
        const { user } = get()
        return user?.role === role
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles: UserRole[]) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },

      // Check if current token is valid
      isTokenValid: () => {
        const { accessToken } = get()
        if (!accessToken) return false
        
        try {
          return !isTokenExpired(accessToken)
        } catch {
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data, not sensitive tokens
        isAuthenticated: state.isAuthenticated,
        user: state.user
        // Note: accessToken is intentionally not persisted for security
      })
    }
  )
)

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get authentication status
 */
export const useAuth = () => {
  const { isAuthenticated, user, isLoading, error } = useAuthStore()
  return { isAuthenticated, user, isLoading, error }
}

/**
 * Hook to get user information
 */
export const useUser = () => {
  const user = useAuthStore(state => state.user)
  return user
}

/**
 * Hook to check user roles
 */
export const useRole = () => {
  const { hasRole, hasAnyRole, user } = useAuthStore()
  return { 
    hasRole, 
    hasAnyRole, 
    role: user?.role,
    isUser: hasRole(UserRole.USER),
    isAdmin: hasRole(UserRole.ADMIN),
    isSuperAdmin: hasRole(UserRole.SUPER_ADMIN)
  }
}

/**
 * Hook for authentication actions
 */
export const useAuthActions = () => {
  const { login, logout, refreshToken, clearAuth, clearError } = useAuthStore()
  return { login, logout, refreshToken, clearAuth, clearError }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Initialize authentication state from stored data
 * Call this on app startup
 */
export const initializeAuth = async () => {
  const { isAuthenticated, refreshToken, clearAuth } = useAuthStore.getState()
  
  if (isAuthenticated) {
    // Try to refresh token to validate session
    const success = await refreshToken()
    if (!success) {
      clearAuth()
    }
  }
}

/**
 * Get current access token for API requests
 */
export const getAccessToken = () => {
  const { accessToken, isTokenValid } = useAuthStore.getState()
  
  if (accessToken && isTokenValid()) {
    return accessToken
  }
  
  return null
}

/**
 * Auto-refresh token when it's about to expire
 */
export const setupTokenRefresh = () => {
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()
  
  if (!isAuthenticated || !accessToken) return
  
  try {
    // Check if token expires in the next 5 minutes
    const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
    const expiresAt = tokenPayload.exp * 1000
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
    
    if (expiresAt <= fiveMinutesFromNow) {
      refreshToken()
    }
  } catch (error) {
    console.error('Token refresh setup error:', error)
  }
}
