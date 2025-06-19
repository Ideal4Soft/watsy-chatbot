/**
 * Dashboard Page for Watsy-Chatbot Platform
 * 
 * This is a protected route that demonstrates:
 * - Authentication requirement
 * - User information display
 * - Role-based content
 * - Logout functionality
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useAuth, useRole, useAuthActions } from '@/stores/auth'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()
  const { role, isAdmin, isSuperAdmin } = useRole()
  const { logout } = useAuthActions()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {role}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* User Information Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Account Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.firstName} {user.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/devices"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center inline-block"
                >
                  Manage WhatsApp Devices
                </Link>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Create Chatbot
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  View Messages
                </button>
              </div>
            </div>
          </div>

          {/* Role-based Content */}
          {(isAdmin || isSuperAdmin) && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Admin Panel
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You have administrative privileges. Access admin features below.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Manage Users
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          )}

          {isSuperAdmin && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Super Admin Panel
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You have super administrator privileges. Access system-level features below.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    System Settings
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Audit Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Test Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-green-800 mb-2">
              🎉 Authentication System Working!
            </h4>
            <p className="text-sm text-green-700">
              You are successfully authenticated and viewing a protected route. The JWT authentication system 
              with refresh tokens, role-based access control, and secure password hashing is fully functional.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
