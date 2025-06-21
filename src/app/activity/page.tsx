/**
 * Activity Page
 * 
 * This page provides a comprehensive activity feed showing
 * all system events, user actions, and WhatsApp interactions.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRole, useAuthActions } from '@/stores/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  MessageSquare, 
  Smartphone, 
  UserPlus, 
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'

export default function ActivityPage() {
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
          <p className="mt-4 text-gray-600">Loading activity...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const mockActivities = [
    {
      id: '1',
      type: 'message',
      title: 'New message received',
      description: 'WhatsApp message from +1234567890: "Hello, I need help with my order"',
      timestamp: '2 minutes ago',
      user: { name: 'John Doe', avatar: null },
      status: 'new'
    },
    {
      id: '2',
      type: 'device',
      title: 'Device connected',
      description: 'WhatsApp device "iPhone 15 Pro" is now online and ready to receive messages',
      timestamp: '5 minutes ago',
      user: { name: 'System', avatar: null },
      status: 'success'
    },
    {
      id: '3',
      type: 'chatbot',
      title: 'Chatbot response sent',
      description: 'Welcome Bot responded to customer inquiry about business hours',
      timestamp: '8 minutes ago',
      user: { name: 'Welcome Bot', avatar: null },
      status: 'success'
    },
    {
      id: '4',
      type: 'user',
      title: 'New contact added',
      description: 'Contact +9876543210 (Sarah Wilson) added to customer database',
      timestamp: '15 minutes ago',
      user: { name: user.firstName + ' ' + user.lastName, avatar: null },
      status: 'info'
    },
    {
      id: '5',
      type: 'error',
      title: 'Connection timeout',
      description: 'Device "Samsung Galaxy S24" lost connection due to network timeout',
      timestamp: '23 minutes ago',
      user: { name: 'System', avatar: null },
      status: 'error'
    },
    {
      id: '6',
      type: 'message',
      title: 'Bulk message sent',
      description: 'Marketing campaign "Summer Sale 2024" sent to 1,247 contacts',
      timestamp: '1 hour ago',
      user: { name: user.firstName + ' ' + user.lastName, avatar: null },
      status: 'success'
    },
    {
      id: '7',
      type: 'device',
      title: 'Device pairing completed',
      description: 'Successfully paired new WhatsApp Business account with QR code',
      timestamp: '2 hours ago',
      user: { name: user.firstName + ' ' + user.lastName, avatar: null },
      status: 'success'
    },
    {
      id: '8',
      type: 'user',
      title: 'User login',
      description: `${user.firstName} ${user.lastName} logged in from IP 192.168.1.100`,
      timestamp: '3 hours ago',
      user: { name: user.firstName + ' ' + user.lastName, avatar: null },
      status: 'info'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return MessageSquare
      case 'device':
        return Smartphone
      case 'user':
        return UserPlus
      case 'error':
        return AlertCircle
      case 'chatbot':
        return CheckCircle
      default:
        return Clock
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-blue-600 bg-blue-100'
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'info':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'info':
        return <Badge variant="secondary">Info</Badge>
      default:
        return null
    }
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
              <p className="text-muted-foreground">
                Monitor all system events, user actions, and WhatsApp interactions in real-time.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">189</div>
              <p className="text-xs text-muted-foreground">76% of all events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Events</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">9% of all events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">1% of all events</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                const colorClass = getActivityColor(activity.status)
                
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.title}</p>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(activity.status)}
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={activity.user.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {activity.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="pt-4 text-center">
              <Button variant="outline">
                Load More Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
