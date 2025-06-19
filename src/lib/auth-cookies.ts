/**
 * Server-only Cookie Utilities for Authentication
 * 
 * This module provides cookie management functions that can only be used
 * in server contexts (Server Actions, Route Handlers, Server Components).
 */

import { cookies } from 'next/headers'

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Set refresh token in HttpOnly cookie
 */
export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  })
}

/**
 * Get refresh token from HttpOnly cookie
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshTokenCookie = cookieStore.get('refreshToken')
  
  return refreshTokenCookie?.value || null
}

/**
 * Clear refresh token cookie
 */
export async function clearRefreshTokenCookie(): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
}
