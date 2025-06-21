"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Smartphone, 
  UserPlus, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: 'message' | 'device' | 'user' | 'error' | 'success'
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
}

interface RecentActivityProps {
  activities?: ActivityItem[]
  className?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message received',
    description: 'WhatsApp message from +1234567890',
    timestamp: '2 minutes ago',
    user: { name: 'John Doe' }
  },
  {
    id: '2',
    type: 'device',
    title: 'Device connected',
    description: 'WhatsApp device "iPhone 15" is now online',
    timestamp: '5 minutes ago'
  },
  {
    id: '3',
    type: 'success',
    title: 'Chatbot response sent',
    description: 'Automated response delivered successfully',
    timestamp: '8 minutes ago'
  },
  {
    id: '4',
    type: 'user',
    title: 'New contact added',
    description: 'Contact +9876543210 added to database',
    timestamp: '15 minutes ago'
  },
  {
    id: '5',
    type: 'error',
    title: 'Connection timeout',
    description: 'Device "Samsung Galaxy" lost connection',
    timestamp: '23 minutes ago'
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'message':
      return MessageSquare
    case 'device':
      return Smartphone
    case 'user':
      return UserPlus
    case 'error':
      return AlertCircle
    case 'success':
      return CheckCircle
    default:
      return Clock
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'message':
      return 'text-blue-600 bg-blue-100'
    case 'device':
      return 'text-green-600 bg-green-100'
    case 'user':
      return 'text-purple-600 bg-purple-100'
    case 'error':
      return 'text-red-600 bg-red-100'
    case 'success':
      return 'text-emerald-600 bg-emerald-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function RecentActivity({ activities = mockActivities, className }: RecentActivityProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          const colorClass = getActivityColor(activity.type)
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                colorClass
              )}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                {activity.user && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {activity.user.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        <div className="pt-2">
          <button className="text-sm text-primary hover:underline">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
