/**
 * Middleware-Safe Authentication Utilities
 * 
 * This module provides authentication utilities specifically designed
 * for use in Next.js middleware with proper environment variable handling.
 */

import * as jwt from 'jsonwebtoken'
import { UserRole } from '@/generated/prisma'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  iat?: number
  exp?: number
}

export interface AuthResult {
  success: boolean
  user?: JWTPayload
  error?: string
}

// ============================================================================
// MIDDLEWARE-SAFE JWT VERIFICATION
// ============================================================================

/**
 * Verify an access token (middleware-safe)
 * Only attempts verification if environment variables are available
 */
export function verifyAccessToken(token: string): AuthResult {
  try {
    // Check if JWT secret is available
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return {
        success: false,
        error: 'JWT_SECRET not available in middleware context'
      }
    }

    const decoded = (jwt.verify as any)(token, jwtSecret, {
      issuer: 'watsy-chatbot',
      audience: 'watsy-users'
    }) as JWTPayload

    return {
      success: true,
      user: decoded
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token'
    }
  }
}

/**
 * Extract access token from Authorization header
 */
export function extractAccessTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number }
    const exp = decoded?.exp
    if (!exp) return true

    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

/**
 * Verify a refresh token (middleware-safe)
 */
export function verifyRefreshToken(token: string): AuthResult {
  try {
    // Check if JWT refresh secret is available
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET
    if (!jwtRefreshSecret) {
      return {
        success: false,
        error: 'JWT_REFRESH_SECRET not available in middleware context'
      }
    }

    const decoded = (jwt.verify as any)(token, jwtRefreshSecret, {
      issuer: 'watsy-chatbot',
      audience: 'watsy-users'
    }) as JWTPayload

    return {
      success: true,
      user: decoded
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid refresh token'
    }
  }
}
