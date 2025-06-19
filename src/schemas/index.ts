/**
 * Data Validation Schemas for Watsy-Chatbot Platform
 *
 * This module provides comprehensive Zod validation schemas for all API endpoints,
 * Server Actions, and form validations throughout the application.
 */

import { z } from 'zod'
import { UserRole } from '@/generated/prisma'

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

/**
 * Email validation schema with comprehensive checks
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .toLowerCase()
  .trim()

/**
 * Password validation schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim()

/**
 * User ID validation schema
 */
export const userIdSchema = z
  .string()
  .min(1, 'User ID is required')
  .cuid('Invalid user ID format')

/**
 * User role validation schema
 */
export const userRoleSchema = z.nativeEnum(UserRole)

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions')
})

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().default(false)
})

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema
})

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
})

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .optional() // Optional because it might come from cookies
})

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

/**
 * Update user profile schema
 */
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .nullable()
})

/**
 * Update user email schema
 */
export const updateEmailSchema = z.object({
  newEmail: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required for email change')
})

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

/**
 * Create user schema (admin only)
 */
export const createUserSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: userRoleSchema.optional().default(UserRole.USER),
  sendWelcomeEmail: z.boolean().optional().default(true)
})

/**
 * Update user role schema (admin only)
 */
export const updateUserRoleSchema = z.object({
  userId: userIdSchema,
  role: userRoleSchema
})

/**
 * Bulk user operations schema
 */
export const bulkUserOperationSchema = z.object({
  userIds: z
    .array(userIdSchema)
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot process more than 100 users at once'),
  operation: z.enum(['activate', 'deactivate', 'delete']),
  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
})

// ============================================================================
// MFA SCHEMAS
// ============================================================================

/**
 * Enable MFA schema
 */
export const enableMfaSchema = z.object({
  secret: z
    .string()
    .min(1, 'MFA secret is required'),
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only numbers')
})

/**
 * Verify MFA schema
 */
export const verifyMfaSchema = z.object({
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only numbers')
})

/**
 * Disable MFA schema
 */
export const disableMfaSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to disable MFA'),
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only numbers')
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>
export type EnableMfaInput = z.infer<typeof enableMfaSchema>
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>
export type DisableMfaInput = z.infer<typeof disableMfaSchema>
