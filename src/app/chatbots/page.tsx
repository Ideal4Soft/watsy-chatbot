/**
 * Chatbots Page
 * 
 * This page provides the interface for creating and managing
 * automated WhatsApp chatbots and response flows.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRole, useAuthActions } from '@/stores/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Plus, 
  Play, 
  Pause,
  Settings,
  MessageSquare,
  Zap,
  AlertCircle
} from 'lucide-react'

export default function ChatbotsPage() {
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
          <p className="mt-4 text-gray-600">Loading chatbots...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const mockChatbots = [
    {
      id: 1,
      name: 'Welcome Bot',
      description: 'Greets new customers and provides basic information',
      status: 'active',
      responses: 1247,
      lastActive: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Support Bot',
      description: 'Handles common support questions and tickets',
      status: 'active',
      responses: 892,
      lastActive: '5 minutes ago'
    },
    {
      id: 3,
      name: 'Order Bot',
      description: 'Processes orders and payment information',
      status: 'paused',
      responses: 456,
      lastActive: '1 hour ago'
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Chatbots</h1>
          <p className="text-muted-foreground">
            Create and manage automated WhatsApp chatbots for customer engagement.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">1 paused</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,595</div>
              <p className="text-xs text-muted-foreground">+12.3% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">Automated responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.8s</div>
              <p className="text-xs text-muted-foreground">Instant responses</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Bot */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Chatbot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Build intelligent chatbots to automate customer interactions and support.
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Chatbots */}
        <Card>
          <CardHeader>
            <CardTitle>Your Chatbots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockChatbots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bot.name}</h3>
                      <p className="text-sm text-muted-foreground">{bot.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {bot.responses} responses
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last active: {bot.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={bot.status === 'active' ? 'default' : 'secondary'}
                      className={bot.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {bot.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {bot.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-purple-800">
                  🤖 Advanced Chatbot Builder Coming Soon
                </h4>
                <p className="text-sm text-purple-700 mt-1">
                  Visual flow builder, AI-powered responses, integration with external APIs, 
                  and advanced conversation management features are under development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
