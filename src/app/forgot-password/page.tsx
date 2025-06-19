/**
 * Forgot Password Page for Watsy-Chatbot Platform
 * 
 * This page provides a password reset request interface with:
 * - Email input for password reset
 * - Form validation using React Hook Form and Zod
 * - Professional UI using shadcn/ui components
 * - Integration with authentication actions
 */

"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordResetRequestSchema, type PasswordResetRequestInput } from '@/schemas'
import { requestPasswordReset } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: PasswordResetRequestInput) => {
    setIsLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await requestPasswordReset(data)

      if (result.success) {
        setSubmitSuccess(result.message || 'Password reset email sent successfully!')
      } else {
        setSubmitError(result.error || 'Failed to send password reset email. Please try again.')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.')
      console.error('Password reset request error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No worries! Enter your email and we'll send you a reset link
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitSuccess ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <FormField
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  required
                  error={errors.email?.message}
                  helpText="Enter the email address associated with your account"
                  {...register('email')}
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
                  loadingText="Sending reset link..."
                  disabled={!isValid || isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
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

                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Mail className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                    <p className="text-sm text-blue-800">
                      Check your email for a password reset link. If you don't see it, check your spam folder.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Didn't receive the email?</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => {
                        setSubmitSuccess(null)
                        setSubmitError(null)
                      }}
                    >
                      Try again
                    </Button>
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

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Still having trouble?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
