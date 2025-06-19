/**
 * Authentication Layout Component
 * 
 * A responsive layout component for authentication pages that provides:
 * - Consistent branding and styling
 * - Responsive design for mobile and desktop
 * - Background patterns and gradients
 * - Proper spacing and typography
 */

"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showLogo?: boolean
  className?: string
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showLogo = true, 
  className 
}: AuthLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8",
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {showLogo && (
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Watsy</span>
              </div>
            </Link>
          )}
          
          <h2 className="text-3xl font-bold text-gray-900">
            {title}
          </h2>
          
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-gray-700 transition-colors">
              Support
            </Link>
          </div>
          
          <p className="text-xs text-gray-400">
            © 2024 Watsy-Chatbot. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Authentication Card Component
 * 
 * A specialized card component for authentication forms
 */
interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
  className?: string
}

export function AuthCard({ children, title, description, className }: AuthCardProps) {
  return (
    <Card className={cn("shadow-lg", className)}>
      <div className="p-6 space-y-1">
        <h3 className="text-2xl font-semibold text-center">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>
        )}
      </div>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Authentication Form Wrapper
 * 
 * A wrapper component that provides consistent spacing and styling for auth forms
 */
interface AuthFormProps {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  className?: string
}

export function AuthForm({ children, onSubmit, className }: AuthFormProps) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={cn("space-y-4", className)}
      noValidate
    >
      {children}
    </form>
  )
}

/**
 * Authentication Link Component
 * 
 * A styled link component for authentication pages
 */
interface AuthLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function AuthLink({ href, children, className }: AuthLinkProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "font-medium text-primary hover:text-primary/80 transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

/**
 * Authentication Divider Component
 * 
 * A divider component with text for authentication pages
 */
interface AuthDividerProps {
  text?: string
}

export function AuthDivider({ text = "or" }: AuthDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  )
}

/**
 * Social Authentication Button Component
 * 
 * A button component for social authentication providers
 */
interface SocialAuthButtonProps {
  provider: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export function SocialAuthButton({ 
  provider, 
  icon, 
  onClick, 
  disabled = false 
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {icon}
      <span className="ml-2">Continue with {provider}</span>
    </button>
  )
}
