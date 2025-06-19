/**
 * Device Status Indicator Component
 * 
 * This component displays the current status of a WhatsApp device
 * with appropriate colors, icons, and animations.
 */

'use client'

import { Wifi, WifiOff, AlertCircle, RefreshCw, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { WhatsAppDeviceStatus } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

interface DeviceStatusIndicatorProps {
  status: WhatsAppDeviceStatus
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// ============================================================================
// DEVICE STATUS INDICATOR COMPONENT
// ============================================================================

export function DeviceStatusIndicator({ 
  status, 
  showText = false, 
  size = 'md' 
}: DeviceStatusIndicatorProps) {
  
  // ============================================================================
  // STATUS CONFIGURATION
  // ============================================================================

  const getStatusConfig = (status: WhatsAppDeviceStatus) => {
    switch (status) {
      case WhatsAppDeviceStatus.CONNECTED:
        return {
          icon: Wifi,
          color: 'bg-green-500',
          badgeVariant: 'default' as const,
          text: 'Connected',
          description: 'Device is connected and ready to send/receive messages'
        }
      case WhatsAppDeviceStatus.CONNECTING:
        return {
          icon: RefreshCw,
          color: 'bg-yellow-500',
          badgeVariant: 'secondary' as const,
          text: 'Connecting',
          description: 'Device is attempting to connect to WhatsApp',
          animate: true
        }
      case WhatsAppDeviceStatus.DISCONNECTED:
        return {
          icon: WifiOff,
          color: 'bg-gray-500',
          badgeVariant: 'outline' as const,
          text: 'Disconnected',
          description: 'Device is not connected to WhatsApp'
        }
      case WhatsAppDeviceStatus.FAILED:
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          badgeVariant: 'destructive' as const,
          text: 'Failed',
          description: 'Connection failed - check your internet connection and try again'
        }
      case WhatsAppDeviceStatus.BANNED:
        return {
          icon: Ban,
          color: 'bg-red-700',
          badgeVariant: 'destructive' as const,
          text: 'Banned',
          description: 'Device has been banned by WhatsApp - contact support'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'bg-gray-500',
          badgeVariant: 'outline' as const,
          text: 'Unknown',
          description: 'Unknown device status'
        }
    }
  }

  const getSizeConfig = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 'h-3 w-3',
          dotSize: 'w-2 h-2'
        }
      case 'md':
        return {
          iconSize: 'h-4 w-4',
          dotSize: 'w-3 h-3'
        }
      case 'lg':
        return {
          iconSize: 'h-5 w-5',
          dotSize: 'w-4 h-4'
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const sizeConfig = getSizeConfig(size)
  const Icon = statusConfig.icon

  // ============================================================================
  // RENDER
  // ============================================================================

  if (showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={statusConfig.badgeVariant} className="gap-1">
              <Icon 
                className={`${sizeConfig.iconSize} ${statusConfig.animate ? 'animate-spin' : ''}`} 
              />
              {statusConfig.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeConfig.dotSize} rounded-full ${statusConfig.color}`}
            />
            <Icon 
              className={`${sizeConfig.iconSize} text-muted-foreground ${statusConfig.animate ? 'animate-spin' : ''}`} 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{statusConfig.text}</p>
            <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
