/**
 * WhatsApp Devices Page
 *
 * This page provides the main interface for managing WhatsApp devices.
 * It includes the device dashboard with real-time status updates,
 * device creation, pairing, and management capabilities.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRole, useAuthActions } from '@/stores/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DeviceDashboard } from '@/components/whatsapp/device-dashboard'

export default function DevicesPage() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()
  const { role } = useRole()
  const { logout } = useAuthActions()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <DashboardLayout
      user={user}
      role={role || 'USER'}
      onLogout={handleLogout}
    >
      <DeviceDashboard />
    </DashboardLayout>
  )
}
