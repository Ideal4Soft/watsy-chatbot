/**
 * Toast Hook for Watsy-Chatbot Platform
 * 
 * Simple wrapper around the notification system for consistent toast usage
 */

import { showSuccess, showError, showWarning, showInfo } from '@/lib/notifications'

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export function useToast() {
  return {
    toast: {
      success: (message: string, options?: ToastOptions) => showSuccess(message, options),
      error: (message: string, options?: ToastOptions) => showError(message, options),
      warning: (message: string, options?: ToastOptions) => showWarning(message, options),
      info: (message: string, options?: ToastOptions) => showInfo(message, options)
    }
  }
}
