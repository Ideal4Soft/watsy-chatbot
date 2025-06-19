/**
 * Client-Safe Authentication Utilities
 * 
 * This module provides authentication utilities that can be safely used
 * on both client and server sides without requiring environment variables.
 */

import * as jwt from 'jsonwebtoken'

// ============================================================================
// TOKEN EXTRACTION UTILITIES
// ============================================================================

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
 * Get token expiration time in seconds
 */
export function getTokenExpirationTime(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number }
    return decoded?.exp || null
  } catch {
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpirationTime(token)
  if (!exp) return true
  
  return Date.now() >= exp * 1000
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * Decode token payload without verification (client-safe)
 * Note: This should only be used for reading non-sensitive data
 * and should never be trusted for security decisions
 */
export function decodeTokenPayload(token: string): any | null {
  try {
    return jwt.decode(token)
  } catch {
    return null
  }
}
