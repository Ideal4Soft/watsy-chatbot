/**
 * Registration Page for Watsy-Chatbot Platform
 * 
 * This page provides a comprehensive registration interface with:
 * - Real-time form validation using React Hook Form and Zod
 * - Password strength indicator
 * - Terms and conditions acceptance
 * - Professional UI using shadcn/ui components
 * - Integration with authentication store
 */

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/schemas'
import { registerUser } from '@/app/actions/auth'
import { getPasswordStrength } from '@/lib/password'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      acceptTerms: false
    }
  })

  const watchedPassword = watch('password')
  const watchedAcceptTerms = watch('acceptTerms')
  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : 0

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await registerUser(data)

      if (result.success) {
        setSubmitSuccess(result.message || 'Account created successfully!')
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login?message=registration-success')
        }, 2000)
      } else {
        setSubmitError(result.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.')
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Watsy-Chatbot and start building amazing WhatsApp experiences
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign up</CardTitle>
            <CardDescription className="text-center">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  placeholder="John"
                  required
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <FormField
                  label="Last Name"
                  placeholder="Doe"
                  required
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              {/* Email */}
              <FormField
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                required
                error={errors.email?.message}
                helpText="We'll send you a verification email"
                {...register('email')}
              />

              {/* Password */}
              <FormField
                label="Password"
                type="password"
                placeholder="Create a strong password"
                required
                error={errors.password?.message}
                showPasswordStrength={true}
                passwordStrength={passwordStrength}
                helpText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                {...register('password')}
              />

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={watchedAcceptTerms}
                  onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {submitSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {submitSuccess}
                  </AlertDescription>
                </Alert>
              )}

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
                loadingText="Creating account..."
                disabled={!isValid || isLoading}
              >
                Create Account
              </LoadingButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            <br />
            We'll send you a verification email to confirm your account.
          </p>
        </div>
      </div>
    </div>
  )
}
