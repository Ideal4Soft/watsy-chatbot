/**
 * Reset Password Page for Watsy-Chatbot Platform
 * 
 * This page provides a password reset interface with:
 * - Token validation from URL parameters
 * - New password input with confirmation
 * - Password strength indicator
 * - Form validation using React Hook Form and Zod
 * - Professional UI using shadcn/ui components
 */

"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordResetConfirmSchema, type PasswordResetConfirmInput } from '@/schemas'
import { confirmPasswordReset } from '@/app/actions/auth'
import { getPasswordStrength } from '@/lib/password'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    mode: 'onChange',
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: ''
    }
  })

  const watchedPassword = watch('password')
  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : 0

  // Redirect if no token is provided
  useEffect(() => {
    if (!token) {
      router.push('/forgot-password')
    }
  }, [token, router])

  const onSubmit = async (data: PasswordResetConfirmInput) => {
    setIsLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await confirmPasswordReset(data)

      if (result.success) {
        setSubmitSuccess(result.message || 'Password reset successfully!')
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login?message=password-reset-success')
        }, 2000)
      } else {
        setSubmitError(result.error || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.')
      console.error('Password reset confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Invalid or missing reset token. Please request a new password reset link.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Request new reset link
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">New Password</CardTitle>
            <CardDescription className="text-center">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitSuccess ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden token field */}
                <input type="hidden" {...register('token')} />

                {/* New Password */}
                <FormField
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  required
                  error={errors.password?.message}
                  showPasswordStrength={true}
                  passwordStrength={passwordStrength}
                  helpText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                  {...register('password')}
                />

                {/* Confirm Password */}
                <FormField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your new password"
                  required
                  error={errors.confirmPassword?.message}
                  helpText="Re-enter your password to confirm"
                  {...register('confirmPassword')}
                />

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
                  loadingText="Resetting password..."
                  disabled={!isValid || isLoading}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Reset Password
                </LoadingButton>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Success Message */}
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {submitSuccess}
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Shield className="mx-auto h-12 w-12 text-green-600 mb-2" />
                    <p className="text-sm text-green-800">
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            For security reasons, this reset link will expire after one hour.
          </p>
        </div>
      </div>
    </div>
  )
}
