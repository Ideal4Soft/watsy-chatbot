"use client"

import { ReactNode } from 'react'
import { SidebarNav } from './sidebar-nav'
import { DashboardHeader } from './dashboard-header'

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string | null
  }
  role: string
  onLogout: () => void
  showHeader?: boolean
}

export function DashboardLayout({
  children,
  user,
  role,
  onLogout,
  showHeader = true
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <SidebarNav userRole={role} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {showHeader && (
            <DashboardHeader
              user={user}
              role={role}
              onLogout={onLogout}
            />
          )}

          {/* Page content with scroll */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
