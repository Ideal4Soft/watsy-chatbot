/**
 * WhatsApp Device Dashboard Component
 * 
 * This component provides a comprehensive dashboard for managing WhatsApp devices.
 * It includes device listing, status monitoring, connection management, and
 * real-time updates using WebSocket connections.
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Smartphone, Wifi, WifiOff, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator'
// import { useToast } from '@/hooks/use-toast'
import { 
  getUserWhatsAppDevices, 
  connectWhatsAppDevice, 
  disconnectWhatsAppDevice, 
  removeWhatsAppDevice 
} from '@/app/actions/whatsapp-devices'
import { WhatsAppDeviceStatus } from '@/generated/prisma'
// Temporary placeholder components
const DeviceStatusIndicator = ({ status }: { status: WhatsAppDeviceStatus }) => (
  <Badge variant="outline">{status}</Badge>
)

const CreateDeviceDialog = (_props: any) => null

const DevicePairingDialog = (_props: any) => null

// ============================================================================
// TYPES
// ============================================================================

interface WhatsAppDevice {
  id: string
  name: string
  phoneNumber?: string
  status: WhatsAppDeviceStatus
  lastConnectedAt?: Date
  lastDisconnectedAt?: Date
  connectionAttempts: number
  messagesSentToday: number
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// DEVICE DASHBOARD COMPONENT
// ============================================================================

export function DeviceDashboard() {
  const [devices, setDevices] = useState<WhatsAppDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  
  // const { toast } = useToast()
  const toast = ({ title, description, variant }: any) => {
    console.log(`Toast: ${title} - ${description} (${variant})`)
  }
  // const { isConnected, subscribe, unsubscribe } = useWebSocket()
  const isConnected = false
  const subscribe = (_deviceId: string, _handler: any) => {}
  const unsubscribe = (_deviceId: string) => {}

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadDevices()
  }, [])

  useEffect(() => {
    // Subscribe to device events for real-time updates
    devices.forEach(device => {
      subscribe(device.id, handleDeviceEvent)
    })

    return () => {
      devices.forEach(device => {
        unsubscribe(device.id)
      })
    }
  }, [devices, subscribe, unsubscribe])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleDeviceEvent = (event: any) => {
    if (event.type === 'connection') {
      setDevices(prev => prev.map(device => 
        device.id === event.deviceId 
          ? { ...device, status: event.data.status }
          : device
      ))
    }
  }

  const loadDevices = async () => {
    try {
      setLoading(true)
      const result = await getUserWhatsAppDevices()
      
      if (result.success && result.data) {
        setDevices(result.data as WhatsAppDevice[])
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load devices',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load devices',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceAction = async (deviceId: string, action: 'connect' | 'disconnect' | 'remove') => {
    try {
      setActionLoading(deviceId)
      
      let result
      switch (action) {
        case 'connect':
          result = await connectWhatsAppDevice({ deviceId })
          if (result.success) {
            setSelectedDeviceId(deviceId)
            setPairingDialogOpen(true)
          }
          break
        case 'disconnect':
          result = await disconnectWhatsAppDevice({ deviceId })
          break
        case 'remove':
          result = await removeWhatsAppDevice({ deviceId })
          if (result.success) {
            setDevices(prev => prev.filter(device => device.id !== deviceId))
          }
          break
      }
      
      if (result?.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        
        if (action !== 'remove') {
          await loadDevices()
        }
      } else {
        toast({
          title: 'Error',
          description: result?.error || `Failed to ${action} device`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} device`,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeviceCreated = () => {
    setCreateDialogOpen(false)
    loadDevices()
    toast({
      title: 'Success',
      description: 'Device created successfully'
    })
  }

  const handlePairingComplete = () => {
    setPairingDialogOpen(false)
    setSelectedDeviceId(null)
    loadDevices()
    toast({
      title: 'Success',
      description: 'Device connected successfully'
    })
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatusColor = (status: WhatsAppDeviceStatus) => {
    switch (status) {
      case WhatsAppDeviceStatus.CONNECTED:
        return 'bg-green-500'
      case WhatsAppDeviceStatus.CONNECTING:
        return 'bg-yellow-500'
      case WhatsAppDeviceStatus.DISCONNECTED:
        return 'bg-gray-500'
      case WhatsAppDeviceStatus.FAILED:
        return 'bg-red-500'
      case WhatsAppDeviceStatus.BANNED:
        return 'bg-red-700'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: WhatsAppDeviceStatus) => {
    switch (status) {
      case WhatsAppDeviceStatus.CONNECTED:
        return 'Connected'
      case WhatsAppDeviceStatus.CONNECTING:
        return 'Connecting'
      case WhatsAppDeviceStatus.DISCONNECTED:
        return 'Disconnected'
      case WhatsAppDeviceStatus.FAILED:
        return 'Failed'
      case WhatsAppDeviceStatus.BANNED:
        return 'Banned'
      default:
        return 'Unknown'
    }
  }

  const canConnect = (status: WhatsAppDeviceStatus) => {
    return status === WhatsAppDeviceStatus.DISCONNECTED || status === WhatsAppDeviceStatus.FAILED
  }

  const canDisconnect = (status: WhatsAppDeviceStatus) => {
    return status === WhatsAppDeviceStatus.CONNECTED || status === WhatsAppDeviceStatus.CONNECTING
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Devices</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp device connections and monitor their status
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
          </Badge>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No devices found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first WhatsApp device
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <DeviceStatusIndicator status={device.status} />
                </div>
                <CardDescription>
                  {device.phoneNumber || 'Not connected'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                  <span className="text-sm font-medium">{getStatusText(device.status)}</span>
                </div>

                {/* Device Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Messages Today</p>
                    <p className="font-medium">{device.messagesSentToday}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Connection Attempts</p>
                    <p className="font-medium">{device.connectionAttempts}</p>
                  </div>
                </div>

                {/* Last Activity */}
                {device.lastConnectedAt && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Last Connected</p>
                    <p className="font-medium">
                      {new Date(device.lastConnectedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {canConnect(device.status) && (
                    <Button
                      size="sm"
                      onClick={() => handleDeviceAction(device.id, 'connect')}
                      disabled={actionLoading === device.id}
                      className="flex-1"
                    >
                      {actionLoading === device.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wifi className="h-4 w-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                  
                  {canDisconnect(device.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeviceAction(device.id, 'disconnect')}
                      disabled={actionLoading === device.id}
                      className="flex-1"
                    >
                      {actionLoading === device.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeviceAction(device.id, 'remove')}
                    disabled={actionLoading === device.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateDeviceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onDeviceCreated={handleDeviceCreated}
      />
      
      {selectedDeviceId && (
        <DevicePairingDialog
          open={pairingDialogOpen}
          onOpenChange={setPairingDialogOpen}
          deviceId={selectedDeviceId}
          onPairingComplete={handlePairingComplete}
        />
      )}
    </div>
  )
}
