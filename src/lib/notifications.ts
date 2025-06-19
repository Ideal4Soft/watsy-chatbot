/**
 * Notification Service for Watsy-Chatbot Platform
 * 
 * This module provides a centralized notification system using Sonner toast library.
 * It includes pre-configured toast types for common authentication and application events.
 */

import { toast } from 'sonner'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationOptions {
  title?: string
  description?: string
  duration?: number
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Show a success notification
 */
export function showSuccess(message: string, options?: NotificationOptions) {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000
  })
}

/**
 * Show an error notification
 */
export function showError(message: string, options?: NotificationOptions) {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration || 6000
  })
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, options?: NotificationOptions) {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 5000
  })
}

/**
 * Show an info notification
 */
export function showInfo(message: string, options?: NotificationOptions) {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000
  })
}

/**
 * Show a loading notification
 */
export function showLoading(message: string, options?: { description?: string }) {
  return toast.loading(message, {
    description: options?.description
  })
}

/**
 * Dismiss a specific notification
 */
export function dismissNotification(toastId: string | number) {
  toast.dismiss(toastId)
}

/**
 * Dismiss all notifications
 */
export function dismissAllNotifications() {
  toast.dismiss()
}

// ============================================================================
// AUTHENTICATION-SPECIFIC NOTIFICATIONS
// ============================================================================

/**
 * Authentication success notifications
 */
export const authNotifications = {
  loginSuccess: (userName?: string) => 
    showSuccess(
      `Welcome back${userName ? `, ${userName}` : ''}!`,
      { description: 'You have been successfully signed in.' }
    ),

  registrationSuccess: () =>
    showSuccess(
      'Account created successfully!',
      { description: 'Please check your email to verify your account.' }
    ),

  logoutSuccess: () =>
    showSuccess(
      'Signed out successfully',
      { description: 'You have been safely logged out.' }
    ),

  passwordResetRequested: () =>
    showSuccess(
      'Password reset email sent',
      { description: 'Check your email for reset instructions.' }
    ),

  passwordResetSuccess: () =>
    showSuccess(
      'Password reset successfully',
      { description: 'You can now sign in with your new password.' }
    ),

  emailVerified: () =>
    showSuccess(
      'Email verified successfully',
      { description: 'Your account is now fully activated.' }
    ),

  profileUpdated: () =>
    showSuccess(
      'Profile updated',
      { description: 'Your profile information has been saved.' }
    )
}

/**
 * Authentication error notifications
 */
export const authErrors = {
  invalidCredentials: () =>
    showError(
      'Invalid credentials',
      { description: 'Please check your email and password.' }
    ),

  accountLocked: () =>
    showError(
      'Account temporarily locked',
      { description: 'Too many failed attempts. Please try again later.' }
    ),

  emailNotVerified: () =>
    showWarning(
      'Email not verified',
      {
        description: 'Please verify your email before signing in.'
      }
    ),

  sessionExpired: () =>
    showWarning(
      'Session expired',
      { description: 'Please sign in again to continue.' }
    ),

  networkError: () =>
    showError(
      'Connection error',
      {
        description: 'Please check your internet connection and try again.'
      }
    ),

  serverError: () =>
    showError(
      'Server error',
      { description: 'Something went wrong. Please try again later.' }
    ),

  validationError: (field: string) =>
    showError(
      'Validation error',
      { description: `Please check your ${field} and try again.` }
    )
}

// ============================================================================
// APPLICATION-SPECIFIC NOTIFICATIONS
// ============================================================================

/**
 * General application notifications
 */
export const appNotifications = {
  saveSuccess: (item: string) =>
    showSuccess(`${item} saved successfully`),

  deleteSuccess: (item: string) =>
    showSuccess(`${item} deleted successfully`),

  copySuccess: () =>
    showSuccess('Copied to clipboard'),

  uploadSuccess: (fileName: string) =>
    showSuccess(`${fileName} uploaded successfully`),

  downloadSuccess: (fileName: string) =>
    showSuccess(`${fileName} downloaded successfully`),

  connectionEstablished: (service: string) =>
    showSuccess(`Connected to ${service}`),

  connectionLost: (service: string) =>
    showWarning(`Connection to ${service} lost`, {
      description: 'Attempting to reconnect...'
    }),

  featureNotAvailable: () =>
    showInfo('Feature coming soon', {
      description: 'This feature is currently under development.'
    }),

  maintenanceMode: () =>
    showWarning('Maintenance mode', {
      description: 'Some features may be temporarily unavailable.'
    })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show a notification based on an API response
 */
export function showApiResponse(response: { success: boolean; message?: string; error?: string }) {
  if (response.success) {
    showSuccess(response.message || 'Operation completed successfully')
  } else {
    showError(response.error || 'Operation failed')
  }
}

/**
 * Show a notification with custom styling
 */
export function showCustomNotification(
  type: NotificationType,
  message: string,
  options?: NotificationOptions
) {
  switch (type) {
    case 'success':
      return showSuccess(message, options)
    case 'error':
      return showError(message, options)
    case 'warning':
      return showWarning(message, options)
    case 'info':
      return showInfo(message, options)
    default:
      return showInfo(message, options)
  }
}
