/**
 * Password Hashing Utilities for Watsy-Chatbot Platform
 * 
 * This module provides secure password hashing and verification utilities using bcryptjs.
 * It implements industry-standard security practices for password management.
 */

import bcrypt from 'bcryptjs'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Number of salt rounds for bcrypt hashing
 * 12 rounds provides a good balance between security and performance
 * Each additional round doubles the computation time
 */
const SALT_ROUNDS = 12

/**
 * Minimum password length requirement
 */
export const MIN_PASSWORD_LENGTH = 8

/**
 * Maximum password length to prevent DoS attacks
 */
export const MAX_PASSWORD_LENGTH = 128

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export interface PasswordHashResult {
  success: boolean
  hash?: string
  error?: string
}

export interface PasswordVerificationResult {
  success: boolean
  isValid?: boolean
  error?: string
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password strength and requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Check length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`)
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Three or more consecutive identical characters
    /123456|654321|abcdef|qwerty|password/i, // Common sequences
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns')
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if password meets basic requirements (less strict for existing users)
 */
export function isPasswordValid(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH
}

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<PasswordHashResult> {
  try {
    // Validate password first
    if (!isPasswordValid(password)) {
      return {
        success: false,
        error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
      }
    }

    // Generate salt and hash
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)

    return {
      success: true,
      hash
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hash password'
    }
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<PasswordVerificationResult> {
  try {
    // Basic validation
    if (!password || !hash) {
      return {
        success: false,
        error: 'Password and hash are required'
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, hash)

    return {
      success: true,
      isValid
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify password'
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a secure random password
 * Useful for temporary passwords or password resets
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check if a hash is using bcrypt format
 */
export function isBcryptHash(hash: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
  return /^\$2[abxy]\$\d{2}\$.{53}$/.test(hash)
}

/**
 * Get password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
  let score = 0
  
  // Length bonus
  score += Math.min(password.length * 2, 20)
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/\d/.test(password)) score += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15
  
  // Length bonus for longer passwords
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10
  if (/123456|654321|abcdef|qwerty|password/i.test(password)) score -= 20
  
  return Math.max(0, Math.min(100, score))
}
