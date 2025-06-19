/**
 * Authentication Server Actions for Watsy-Chatbot Platform
 * 
 * This module provides secure server-side authentication actions including:
 * - User registration with email verification
 * - User login with JWT token generation
 * - Token refresh functionality
 * - Password reset operations
 */

'use server'


import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import {
  generateTokenPair,
  verifyRefreshToken
} from '@/lib/auth'
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie
} from '@/lib/auth-cookies'
import { 
  registerSchema, 
  loginSchema, 
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  type RegisterInput,
  type LoginInput,
  type PasswordResetRequestInput,
  type PasswordResetConfirmInput
} from '@/schemas'
import { UserRole } from '@/generated/prisma'
import { randomBytes } from 'crypto'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthActionResult {
  success: boolean
  message?: string
  error?: string
  data?: Record<string, unknown>
}

export interface LoginResult extends AuthActionResult {
  accessToken?: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    avatar?: string | null
  }
}

// ============================================================================
// USER REGISTRATION
// ============================================================================

/**
 * Register a new user
 */
export async function registerUser(input: RegisterInput): Promise<AuthActionResult> {
  try {
    // Validate input
    const validatedInput = registerSchema.parse(input)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedInput.email }
    })
    
    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email address already exists'
      }
    }
    
    // Hash password
    const passwordResult = await hashPassword(validatedInput.password)
    if (!passwordResult.success || !passwordResult.hash) {
      return {
        success: false,
        error: passwordResult.error || 'Failed to process password'
      }
    }
    
    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex')
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedInput.email,
        password: passwordResult.hash,
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        emailVerificationToken,
        role: UserRole.USER,
        // Create default subscription
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })
    
    // TODO: Send verification email (implement email service)
    // await sendVerificationEmail(user.email, emailVerificationToken)
    
    return {
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        userId: user.id,
        email: user.email,
        requiresVerification: true
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: 'Invalid input data provided'
        }
      }
      
      // Handle Prisma errors
      if (error.message.includes('Unique constraint')) {
        return {
          success: false,
          error: 'A user with this email address already exists'
        }
      }
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred during registration'
    }
  }
}

// ============================================================================
// USER LOGIN
// ============================================================================

/**
 * Authenticate user and generate tokens
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  try {
    // Validate input
    const validatedInput = loginSchema.parse(input)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedInput.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    })
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }
    
    // Check if account is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      }
    }
    
    // Verify password
    const passwordResult = await verifyPassword(validatedInput.password, user.password)
    if (!passwordResult.success || !passwordResult.isValid) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }
    
    // Check email verification (optional - can be enforced based on requirements)
    // Note: emailVerified is DateTime? - null means not verified, any date means verified
    if (!user.emailVerified) {
      return {
        success: false,
        error: 'Please verify your email address before logging in',
        data: {
          requiresVerification: true,
          email: user.email
        }
      }
    }
    
    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    })
    
    // Set refresh token in HttpOnly cookie
    await setRefreshTokenCookie(tokens.refreshToken)
    
    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    return {
      success: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred during login'
    }
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<LoginResult> {
  try {
    // Get refresh token from cookie
    const refreshToken = await getRefreshTokenFromCookie()
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token found'
      }
    }
    
    // Verify refresh token
    const tokenResult = verifyRefreshToken(refreshToken)
    if (!tokenResult.success || !tokenResult.payload) {
      await clearRefreshTokenCookie()
      return {
        success: false,
        error: 'Invalid refresh token'
      }
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: tokenResult.payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true
      }
    })
    
    if (!user || !user.isActive) {
      await clearRefreshTokenCookie()
      return {
        success: false,
        error: 'User not found or inactive'
      }
    }
    
    // Generate new tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    })
    
    // Set new refresh token in cookie
    await setRefreshTokenCookie(tokens.refreshToken)
    
    return {
      success: true,
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      }
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    await clearRefreshTokenCookie()
    
    return {
      success: false,
      error: 'Failed to refresh token'
    }
  }
}

// ============================================================================
// USER LOGOUT
// ============================================================================

/**
 * Logout user and clear refresh token
 */
export async function logoutUser(): Promise<AuthActionResult> {
  try {
    // Clear refresh token cookie
    await clearRefreshTokenCookie()

    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error) {
    console.error('Logout error:', error)

    return {
      success: false,
      error: 'Failed to logout'
    }
  }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request password reset
 */
export async function requestPasswordReset(input: PasswordResetRequestInput): Promise<AuthActionResult> {
  try {
    // Validate input
    const validatedInput = passwordResetRequestSchema.parse(input)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedInput.email },
      select: { id: true, email: true, firstName: true }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      }
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    })

    // TODO: Send password reset email
    // await sendPasswordResetEmail(user.email, resetToken)

    return {
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.'
    }
  } catch (error) {
    console.error('Password reset request error:', error)

    return {
      success: false,
      error: 'Failed to process password reset request'
    }
  }
}

/**
 * Confirm password reset with new password
 */
export async function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<AuthActionResult> {
  try {
    // Validate input
    const validatedInput = passwordResetConfirmSchema.parse(input)

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: validatedInput.token,
        passwordResetExpires: {
          gt: new Date()
        }
      },
      select: { id: true, email: true }
    })

    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired reset token'
      }
    }

    // Hash new password
    const passwordResult = await hashPassword(validatedInput.password)
    if (!passwordResult.success || !passwordResult.hash) {
      return {
        success: false,
        error: passwordResult.error || 'Failed to process new password'
      }
    }

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordResult.hash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    }
  } catch (error) {
    console.error('Password reset confirmation error:', error)

    return {
      success: false,
      error: 'Failed to reset password'
    }
  }
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Verify user email address
 */
export async function verifyEmail(token: string): Promise<AuthActionResult> {
  try {
    if (!token) {
      return {
        success: false,
        error: 'Verification token is required'
      }
    }

    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: null
      },
      select: { id: true, email: true }
    })

    if (!user) {
      return {
        success: false,
        error: 'Invalid verification token or email already verified'
      }
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null
      }
    })

    return {
      success: true,
      message: 'Email verified successfully. You can now login to your account.'
    }
  } catch (error) {
    console.error('Email verification error:', error)

    return {
      success: false,
      error: 'Failed to verify email'
    }
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(email: string): Promise<AuthActionResult> {
  try {
    // Find unverified user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        emailVerified: null
      },
      select: { id: true, email: true, firstName: true }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found or email already verified'
      }
    }

    // Generate new verification token
    const emailVerificationToken = randomBytes(32).toString('hex')

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken }
    })

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, emailVerificationToken)

    return {
      success: true,
      message: 'Verification email sent successfully'
    }
  } catch (error) {
    console.error('Resend verification error:', error)

    return {
      success: false,
      error: 'Failed to resend verification email'
    }
  }
}
