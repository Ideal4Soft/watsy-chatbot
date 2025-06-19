/**
 * Email Verification Page for Watsy-Chatbot Platform
 * 
 * This page provides email verification functionality with:
 * - Token validation from URL parameters
 * - Automatic verification on page load
 * - Resend verification email functionality
 * - Professional UI using shadcn/ui components
 */

"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail, resendEmailVerification } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Mail, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type VerificationState = 'loading' | 'success' | 'error' | 'expired'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  
  const [verificationState, setVerificationState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string>('')

  // Verify email on component mount
  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setVerificationState('error')
        setMessage('Invalid or missing verification token.')
        return
      }

      try {
        const result = await verifyEmail(token)
        
        if (result.success) {
          setVerificationState('success')
          setMessage(result.message || 'Email verified successfully!')
          
          // Redirect to login page after a short delay
          setTimeout(() => {
            router.push('/login?message=email-verified')
          }, 3000)
        } else {
          setVerificationState('error')
          setMessage(result.error || 'Email verification failed.')
        }
      } catch (error) {
        setVerificationState('error')
        setMessage('An unexpected error occurred during verification.')
        console.error('Email verification error:', error)
      }
    }

    verifyEmailToken()
  }, [token, router])

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Email address is required to resend verification.')
      return
    }

    setIsResending(true)
    setResendMessage('')

    try {
      const result = await resendEmailVerification(email)
      
      if (result.success) {
        setResendMessage('Verification email sent successfully! Please check your inbox.')
      } else {
        setResendMessage(result.error || 'Failed to resend verification email.')
      }
    } catch (error) {
      setResendMessage('An unexpected error occurred. Please try again.')
      console.error('Resend verification error:', error)
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (verificationState) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Verifying your email...</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-2" />
              <h3 className="text-lg font-medium text-green-900">Email Verified!</h3>
              <p className="text-sm text-green-800 mt-1">
                Your email has been successfully verified. You will be redirected to the login page shortly.
              </p>
            </div>

            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Continue to Login
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-2" />
              <h3 className="text-lg font-medium text-red-900">Verification Failed</h3>
              <p className="text-sm text-red-800 mt-1">
                The verification link may be invalid or expired.
              </p>
            </div>

            {email && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Need a new verification link?
                </p>
                <LoadingButton
                  onClick={handleResendVerification}
                  loading={isResending}
                  loadingText="Sending..."
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </LoadingButton>
                
                {resendMessage && (
                  <Alert className={resendMessage.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription className={resendMessage.includes('successfully') ? 'text-green-800' : 'text-red-800'}>
                      {resendMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Confirming your email address
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Verify Email</CardTitle>
            <CardDescription className="text-center">
              We're verifying your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}

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
            Having trouble with verification?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
