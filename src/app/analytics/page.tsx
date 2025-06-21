/**
 * Analytics Page
 * 
 * This page provides comprehensive analytics and reporting
 * for WhatsApp messaging, device performance, and user engagement.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRole, useAuthActions } from '@/stores/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, BarChart, DonutChart } from '@/components/ui/chart'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  MessageSquare,
  Smartphone,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react'

export default function AnalyticsPage() {
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Mock data for charts
  const messageData = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 150 },
    { label: 'Wed', value: 180 },
    { label: 'Thu', value: 220 },
    { label: 'Fri', value: 200 },
    { label: 'Sat', value: 170 },
    { label: 'Sun', value: 190 }
  ]

  const deviceData = [
    { label: 'iPhone', value: 45, color: '#3b82f6' },
    { label: 'Android', value: 35, color: '#10b981' },
    { label: 'Web', value: 20, color: '#f59e0b' }
  ]

  const hourlyData = [
    { label: '00', value: 20 },
    { label: '06', value: 45 },
    { label: '12', value: 180 },
    { label: '18', value: 220 },
    { label: '24', value: 120 }
  ]

  return (
    <DashboardLayout 
      user={user} 
      role={role || 'USER'} 
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your WhatsApp messaging performance.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Last 30 Days
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231</div>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12.5%</span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+8.2%</span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600">-2.1%</span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Uptime</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.8%</div>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+0.3%</span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Message Volume Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Message Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={messageData} height={300} />
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <DonutChart data={deviceData} size={250} />
            </CardContent>
          </Card>
        </div>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Message Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={hourlyData} height={300} />
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2:00 PM - 3:00 PM', messages: 1247, percentage: 85 },
                  { time: '10:00 AM - 11:00 AM', messages: 1156, percentage: 78 },
                  { time: '7:00 PM - 8:00 PM', messages: 1089, percentage: 74 },
                  { time: '9:00 AM - 10:00 AM', messages: 987, percentage: 67 }
                ].map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{hour.time}</p>
                      <p className="text-sm text-muted-foreground">{hour.messages} messages</p>
                    </div>
                    <Badge variant="secondary">{hour.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Text Messages', count: 28456, percentage: 63 },
                  { type: 'Media Messages', count: 12847, percentage: 28 },
                  { type: 'Voice Messages', count: 3928, percentage: 9 }
                ].map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type.type}</p>
                      <p className="text-sm text-muted-foreground">{type.count.toLocaleString()} messages</p>
                    </div>
                    <Badge variant="outline">{type.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">
                  📊 Advanced Analytics Coming Soon
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  Real-time data integration, custom report builder, predictive analytics, 
                  and advanced filtering options are under development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
