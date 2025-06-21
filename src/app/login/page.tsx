/**
 * Login Page for Watsy-Chatbot Platform
 *
 * This page provides a secure login interface with:
 * - Email and password authentication
 * - Form validation using React Hook Form and Zod
 * - Integration with authentication store
 * - Professional UI using shadcn/ui components
 * - Redirect handling for authenticated users
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore, useAuth, useAuthActions } from '@/stores/auth'
import { loginSchema, type LoginInput } from '@/schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const message = searchParams.get('message')
  const fromDashboard = searchParams.get('from') === 'login'

  const { isAuthenticated } = useAuth()
  const { login, isLoading, error, clearError } = useAuthStore()
  const { clearStaleCookies } = useAuthActions()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const watchedRememberMe = watch('rememberMe')

  // Clear errors when component mounts or when user starts typing
  useEffect(() => {
    if (error) {
      setSubmitError(error)
      clearError()
    }
  }, [error, clearError])

  // Handle authentication state and clear stale cookies
  useEffect(() => {
    // If coming from dashboard redirect, clear any stale cookies
    if (fromDashboard) {
      console.log('Clearing stale cookies due to redirect loop')
      clearStaleCookies()
    }
  }, [fromDashboard, clearStaleCookies])

  // Separate effect for handling already authenticated users
  useEffect(() => {
    // If user is already authenticated and not coming from a redirect loop, go to dashboard
    if (isAuthenticated && !fromDashboard && !isLoading) {
      console.log('User already authenticated, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [isAuthenticated, fromDashboard, redirectTo, router, isLoading])

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(null)

    try {
      console.log('Attempting login...')
      const result = await login(data.email, data.password, data.rememberMe)

      if (result.success) {
        console.log('Login successful, redirecting to:', redirectTo)
        // Mark as new login for notifications
        sessionStorage.setItem('newLogin', 'true')

        // Use router.replace instead of push to avoid back button issues
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          router.replace(redirectTo)
        }, 200)
      } else {
        console.log('Login failed:', result.error)
        setSubmitError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Watsy-Chatbot account
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Success message for registration */}
            {message === 'registration-success' && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account created successfully! Please check your email for verification.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <FormField
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password */}
              <FormField
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={watchedRememberMe}
                    onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                className="w-full"
                loading={isLoading}
                loadingText="Signing in..."
                disabled={!isValid || isLoading}
              >
                Sign In
              </LoadingButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble signing in?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
