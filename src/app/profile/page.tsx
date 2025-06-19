/**
 * User Profile Page for Watsy-Chatbot Platform
 * 
 * This page provides user profile management with:
 * - Profile information editing
 * - Password change functionality
 * - Account settings
 * - Professional UI using shadcn/ui components
 * - Protected route with authentication requirement
 */

"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth, useAuthActions } from '@/stores/auth'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@/schemas'
import { getPasswordStrength } from '@/lib/password'
import { showSuccess, showError } from '@/lib/notifications'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User, Lock, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function ProfilePageContent() {
  const { user } = useAuth()
  const { logout } = useAuthActions()
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Profile form
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatar: user?.avatar || ''
    }
  })

  // Password form
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const watchedNewPassword = passwordForm.watch('newPassword')
  const passwordStrength = watchedNewPassword ? getPasswordStrength(watchedNewPassword) : 0

  const onUpdateProfile = async (data: UpdateProfileInput) => {
    setIsUpdatingProfile(true)
    
    try {
      // TODO: Implement profile update API call
      // const result = await updateUserProfile(data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSuccess('Profile updated successfully')
      
    } catch (error) {
      showError('Failed to update profile. Please try again.')
      console.error('Profile update error:', error)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true)
    
    try {
      // TODO: Implement password change API call
      // const result = await changeUserPassword(data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSuccess('Password changed successfully')
      passwordForm.reset()
      
    } catch (error) {
      showError('Failed to change password. Please try again.')
      console.error('Password change error:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // TODO: Implement account deletion
        showError('Account deletion is not yet implemented')
      } catch (error) {
        showError('Failed to delete account. Please contact support.')
      }
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="First Name"
                      placeholder="John"
                      required
                      error={profileForm.formState.errors.firstName?.message}
                      {...profileForm.register('firstName')}
                    />
                    <FormField
                      label="Last Name"
                      placeholder="Doe"
                      required
                      error={profileForm.formState.errors.lastName?.message}
                      {...profileForm.register('lastName')}
                    />
                  </div>

                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={user.email}
                    disabled
                    helpText="Email address cannot be changed. Contact support if needed."
                  />

                  <FormField
                    label="Avatar URL"
                    placeholder="https://example.com/avatar.jpg"
                    error={profileForm.formState.errors.avatar?.message}
                    helpText="Optional: URL to your profile picture"
                    {...profileForm.register('avatar')}
                  />

                  <div className="flex items-center space-x-2">
                    <LoadingButton
                      type="submit"
                      loading={isUpdatingProfile}
                      loadingText="Updating..."
                      disabled={!profileForm.formState.isValid}
                    >
                      Update Profile
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => profileForm.reset()}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  <FormField
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                    required
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register('currentPassword')}
                  />

                  <FormField
                    label="New Password"
                    type="password"
                    placeholder="Enter your new password"
                    required
                    error={passwordForm.formState.errors.newPassword?.message}
                    showPasswordStrength={true}
                    passwordStrength={passwordStrength}
                    helpText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                    {...passwordForm.register('newPassword')}
                  />

                  <FormField
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm your new password"
                    required
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    {...passwordForm.register('confirmPassword')}
                  />

                  <div className="flex items-center space-x-2">
                    <LoadingButton
                      type="submit"
                      loading={isChangingPassword}
                      loadingText="Changing..."
                      disabled={!passwordForm.formState.isValid}
                    >
                      Change Password
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => passwordForm.reset()}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    View your account details and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">User ID:</span>
                      <p className="font-mono text-gray-900">{user.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Role:</span>
                      <p className="text-gray-900">{user.role}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Account Status:</span>
                      <p className="text-green-600">Active</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Member Since:</span>
                      <p className="text-gray-900">January 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      Once you delete your account, there is no going back. Please be certain.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}
