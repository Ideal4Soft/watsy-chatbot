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
}

export function DashboardLayout({ children, user, role, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <SidebarNav userRole={role} />
        
        {/* Main content */}
        <div className="flex-1 md:ml-0">
          {/* Header */}
          <DashboardHeader 
            user={user} 
            role={role} 
            onLogout={onLogout} 
          />
          
          {/* Page content */}
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
