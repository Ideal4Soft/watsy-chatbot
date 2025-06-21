"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DeviceStatus {
  id: string
  name: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  lastSeen: string
  messageCount: number
  batteryLevel?: number
}

interface DeviceStatusOverviewProps {
  devices?: DeviceStatus[]
  className?: string
}

const mockDevices: DeviceStatus[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    status: 'CONNECTED',
    lastSeen: 'Just now',
    messageCount: 1247,
    batteryLevel: 85
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    status: 'CONNECTED',
    lastSeen: '2 minutes ago',
    messageCount: 892,
    batteryLevel: 62
  },
  {
    id: '3',
    name: 'WhatsApp Business',
    status: 'CONNECTING',
    lastSeen: '5 minutes ago',
    messageCount: 456,
    batteryLevel: 45
  },
  {
    id: '4',
    name: 'iPad Pro',
    status: 'DISCONNECTED',
    lastSeen: '1 hour ago',
    messageCount: 234,
    batteryLevel: 12
  }
]

const getStatusIcon = (status: DeviceStatus['status']) => {
  switch (status) {
    case 'CONNECTED':
      return CheckCircle
    case 'CONNECTING':
      return Clock
    case 'DISCONNECTED':
      return WifiOff
    case 'ERROR':
      return AlertTriangle
    default:
      return Wifi
  }
}

const getStatusColor = (status: DeviceStatus['status']) => {
  switch (status) {
    case 'CONNECTED':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'CONNECTING':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'DISCONNECTED':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    case 'ERROR':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  }
}

const getBatteryColor = (level: number) => {
  if (level > 50) return 'bg-green-500'
  if (level > 20) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function DeviceStatusOverview({ devices = mockDevices, className }: DeviceStatusOverviewProps) {
  const connectedCount = devices.filter(d => d.status === 'CONNECTED').length
  const totalCount = devices.length

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Device Status</span>
          <Badge variant="outline" className="ml-2">
            {connectedCount}/{totalCount} Online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.map((device) => {
          const StatusIcon = getStatusIcon(device.status)
          const statusColor = getStatusColor(device.status)
          
          return (
            <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{device.name}</p>
                    <Badge className={cn("text-xs", statusColor)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {device.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Last seen: {device.lastSeen}</span>
                    <span>Messages: {device.messageCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {device.batteryLevel !== undefined && (
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-muted-foreground">
                    {device.batteryLevel}%
                  </div>
                  <div className="w-16">
                    <Progress 
                      value={device.batteryLevel} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        <div className="pt-2 border-t">
          <button className="text-sm text-primary hover:underline">
            Manage all devices
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
