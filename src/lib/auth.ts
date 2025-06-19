/**
 * Authentication Utilities for Watsy-Chatbot Platform
 * 
 * This module provides comprehensive JWT authentication utilities including:
 * - JWT token generation and verification
 * - Refresh token management
 * - Secure cookie handling
 * - Token payload types and interfaces
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

export interface RefreshTokenPayload {
  userId: string
  tokenVersion?: number
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  success: boolean
  user?: JWTPayload
  error?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured.')
  }
  return secret
}

const getJWTRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not configured.')
  }
  return secret
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d'

// ============================================================================
// JWT UTILITIES
// ============================================================================

/**
 * Generate an access token for a user
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return (jwt.sign as any)(payload, getJWTSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'watsy-chatbot',
    audience: 'watsy-users'
  })
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return (jwt.sign as any)(payload, getJWTRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'watsy-chatbot',
    audience: 'watsy-refresh'
  })
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(user: {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}): TokenPair {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  })

  const refreshToken = generateRefreshToken({
    userId: user.id
  })

  return { accessToken, refreshToken }
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): AuthResult {
  try {
    const decoded = (jwt.verify as any)(token, getJWTSecret(), {
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
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): { success: boolean; payload?: RefreshTokenPayload; error?: string } {
  try {
    const decoded = (jwt.verify as any)(token, getJWTRefreshSecret(), {
      issuer: 'watsy-chatbot',
      audience: 'watsy-refresh'
    }) as RefreshTokenPayload

    return {
      success: true,
      payload: decoded
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid refresh token'
    }
  }
}




