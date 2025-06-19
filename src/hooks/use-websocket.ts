/**
 * WebSocket Hook for Real-time Communication
 * 
 * This hook provides a React interface for WebSocket communication
 * with the WhatsApp device management system. It handles connection
 * management, authentication, and real-time event subscriptions.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'device_action'
  payload: any
  messageId?: string
  timestamp?: string
}

interface WebSocketResponse {
  type: 'success' | 'error' | 'event' | 'pong'
  payload: any
  messageId?: string
  timestamp: string
}

type EventHandler = (event: any) => void

// ============================================================================
// WEBSOCKET HOOK
// ============================================================================

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastError, setLastError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlersRef = useRef<Map<string, Set<EventHandler>>>(new Map())
  const messageQueueRef = useRef<WebSocketMessage[]>([])
  const reconnectAttemptsRef = useRef(0)
  
  const { accessToken } = useAuthStore()
  
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  const pingInterval = 30000

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  const connect = useCallback(() => {
    if (!accessToken) {
      console.log('No access token available for WebSocket connection')
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')
      setLastError(null)
      
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}?token=${accessToken}`
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        
        // Process queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift()
          if (message) {
            sendMessage(message)
          }
        }
        
        // Start ping interval
        startPingInterval()
      }
      
      ws.onmessage = (event) => {
        try {
          const response: WebSocketResponse = JSON.parse(event.data)
          handleMessage(response)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        stopPingInterval()
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setLastError('Connection error')
        setConnectionStatus('error')
      }
      
      wsRef.current = ws
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setLastError('Failed to connect')
      setConnectionStatus('error')
    }
  }, [accessToken])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    stopPingInterval()
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttemptsRef.current = 0
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectAttemptsRef.current++
    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1) // Exponential backoff
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect])

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          ...message,
          messageId: message.messageId || generateMessageId(),
          timestamp: new Date().toISOString()
        }))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    } else {
      // Queue message for later
      messageQueueRef.current.push(message)
    }
  }, [])

  const handleMessage = useCallback((response: WebSocketResponse) => {
    switch (response.type) {
      case 'success':
        console.log('WebSocket success:', response.payload)
        break
        
      case 'error':
        console.error('WebSocket error:', response.payload)
        setLastError(response.payload.error)
        break
        
      case 'event':
        // Broadcast event to subscribed handlers
        const { deviceId, eventType } = response.payload
        const handlers = eventHandlersRef.current.get(deviceId)
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(response.payload)
            } catch (error) {
              console.error('Error in event handler:', error)
            }
          })
        }
        break
        
      case 'pong':
        // Handle pong response
        break
        
      default:
        console.log('Unknown WebSocket message type:', response.type)
    }
  }, [])

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  const subscribe = useCallback((deviceId: string, handler: EventHandler) => {
    // Add handler to local registry
    if (!eventHandlersRef.current.has(deviceId)) {
      eventHandlersRef.current.set(deviceId, new Set())
    }
    eventHandlersRef.current.get(deviceId)!.add(handler)
    
    // Send subscription message
    sendMessage({
      type: 'subscribe',
      payload: { deviceId }
    })
  }, [sendMessage])

  const unsubscribe = useCallback((deviceId: string, handler?: EventHandler) => {
    const handlers = eventHandlersRef.current.get(deviceId)
    if (handlers) {
      if (handler) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(deviceId)
        }
      } else {
        // Remove all handlers for this device
        eventHandlersRef.current.delete(deviceId)
      }
      
      // Send unsubscription message if no more handlers
      if (!eventHandlersRef.current.has(deviceId)) {
        sendMessage({
          type: 'unsubscribe',
          payload: { deviceId }
        })
      }
    }
  }, [sendMessage])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const startPingInterval = useCallback(() => {
    stopPingInterval()
    pingIntervalRef.current = setInterval(() => {
      sendMessage({
        type: 'ping',
        payload: {}
      })
    }, pingInterval)
  }, [sendMessage])

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const generateMessageId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (accessToken) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [accessToken, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    isConnected,
    connectionStatus,
    lastError,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage
  }
}
