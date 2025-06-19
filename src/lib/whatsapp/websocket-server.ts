/**
 * WebSocket Server for WhatsApp Device Management
 * 
 * This module provides real-time WebSocket communication for device status updates,
 * connection monitoring, and event broadcasting. It handles client connections,
 * authentication, and message routing with comprehensive error handling.
 */

import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { verify } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { EventEmitter } from 'events'
import { 
  DeviceEvent, 
  ConnectionEvent, 
  MessageEvent, 
  StatusEvent, 
  ErrorEvent,
  WhatsAppServiceError 
} from './types'
import { WhatsAppDeviceStatus } from '@/generated/prisma'

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  clientId?: string
  isAuthenticated?: boolean
  lastPing?: Date
  subscribedDevices?: Set<string>
}

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

interface ClientConnection {
  id: string
  userId: string
  socket: AuthenticatedWebSocket
  connectedAt: Date
  lastActivity: Date
  subscribedDevices: Set<string>
}

// ============================================================================
// WEBSOCKET SERVER CLASS
// ============================================================================

export class WhatsAppWebSocketServer extends EventEmitter {
  private wss: WebSocketServer
  private clients: Map<string, ClientConnection> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()
  private pingInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout

  constructor(port: number = 8080) {
    super()
    
    this.wss = new WebSocketServer({
      port,
      verifyClient: this.verifyClient.bind(this)
    })

    this.setupEventHandlers()
    this.startPingInterval()
    this.startCleanupInterval()

    console.log(`WhatsApp WebSocket server started on port ${port}`)
  }

  // ============================================================================
  // CLIENT CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Verify client connection and authenticate
   */
  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const url = parse(info.req.url || '', true)
      const token = url.query.token as string

      if (!token) {
        console.log('WebSocket connection rejected: No token provided')
        return false
      }

      // Verify JWT token
      const decoded = verify(token, process.env.JWT_SECRET!) as any
      
      if (!decoded.userId) {
        console.log('WebSocket connection rejected: Invalid token')
        return false
      }

      // Store user info in request for later use
      ;(info.req as any).userId = decoded.userId
      return true

    } catch (error) {
      console.log('WebSocket connection rejected: Token verification failed', error)
      return false
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      this.handleNewConnection(ws, req)
    })

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error)
    })
  }

  /**
   * Handle new client connection
   */
  private handleNewConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    const userId = (req as any).userId
    const clientId = uuidv4()

    // Setup client connection
    ws.userId = userId
    ws.clientId = clientId
    ws.isAuthenticated = true
    ws.lastPing = new Date()
    ws.subscribedDevices = new Set()

    const connection: ClientConnection = {
      id: clientId,
      userId,
      socket: ws,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscribedDevices: new Set()
    }

    this.clients.set(clientId, connection)

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId)!.add(clientId)

    console.log(`Client connected: ${clientId} (User: ${userId})`)

    // Setup client event handlers
    this.setupClientEventHandlers(ws, connection)

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'success',
      payload: {
        message: 'Connected successfully',
        clientId,
        serverTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Setup event handlers for individual client
   */
  private setupClientEventHandlers(ws: AuthenticatedWebSocket, connection: ClientConnection) {
    ws.on('message', (data) => {
      this.handleClientMessage(connection, Buffer.from(data as ArrayBuffer))
    })

    ws.on('close', (code, reason) => {
      this.handleClientDisconnection(connection, code, reason)
    })

    ws.on('error', (error) => {
      console.error(`Client error (${connection.id}):`, error)
    })

    ws.on('pong', () => {
      connection.lastActivity = new Date()
      ws.lastPing = new Date()
    })
  }

  /**
   * Handle client message
   */
  private handleClientMessage(connection: ClientConnection, data: Buffer) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString())
      connection.lastActivity = new Date()

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(connection, message)
          break
        case 'unsubscribe':
          this.handleUnsubscribe(connection, message)
          break
        case 'ping':
          this.handlePing(connection, message)
          break
        case 'device_action':
          this.handleDeviceAction(connection, message)
          break
        default:
          this.sendErrorToClient(connection.id, 'Unknown message type', message.messageId)
      }

    } catch (error) {
      console.error(`Failed to handle client message (${connection.id}):`, error)
      this.sendErrorToClient(connection.id, 'Invalid message format')
    }
  }

  /**
   * Handle client disconnection
   */
  private handleClientDisconnection(connection: ClientConnection, code: number, reason: Buffer) {
    console.log(`Client disconnected: ${connection.id} (Code: ${code}, Reason: ${reason.toString()})`)

    // Remove from clients map
    this.clients.delete(connection.id)

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.userId)
    if (userConnections) {
      userConnections.delete(connection.id)
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId)
      }
    }
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  /**
   * Handle device subscription
   */
  private handleSubscribe(connection: ClientConnection, message: WebSocketMessage) {
    try {
      const { deviceId } = message.payload

      if (!deviceId) {
        this.sendErrorToClient(connection.id, 'Device ID is required', message.messageId)
        return
      }

      // TODO: Verify user owns this device
      connection.subscribedDevices.add(deviceId)
      connection.socket.subscribedDevices!.add(deviceId)

      this.sendToClient(connection.id, {
        type: 'success',
        payload: {
          message: `Subscribed to device ${deviceId}`,
          deviceId
        },
        messageId: message.messageId,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      this.sendErrorToClient(connection.id, 'Failed to subscribe to device', message.messageId)
    }
  }

  /**
   * Handle device unsubscription
   */
  private handleUnsubscribe(connection: ClientConnection, message: WebSocketMessage) {
    try {
      const { deviceId } = message.payload

      connection.subscribedDevices.delete(deviceId)
      connection.socket.subscribedDevices!.delete(deviceId)

      this.sendToClient(connection.id, {
        type: 'success',
        payload: {
          message: `Unsubscribed from device ${deviceId}`,
          deviceId
        },
        messageId: message.messageId,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      this.sendErrorToClient(connection.id, 'Failed to unsubscribe from device', message.messageId)
    }
  }

  /**
   * Handle ping message
   */
  private handlePing(connection: ClientConnection, message: WebSocketMessage) {
    this.sendToClient(connection.id, {
      type: 'pong',
      payload: {
        serverTime: new Date().toISOString()
      },
      messageId: message.messageId,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle device action
   */
  private handleDeviceAction(connection: ClientConnection, message: WebSocketMessage) {
    try {
      const { deviceId, action } = message.payload

      // Emit device action event for handling by other services
      this.emit('device_action', {
        userId: connection.userId,
        deviceId,
        action,
        clientId: connection.id
      })

      this.sendToClient(connection.id, {
        type: 'success',
        payload: {
          message: `Device action ${action} initiated`,
          deviceId,
          action
        },
        messageId: message.messageId,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      this.sendErrorToClient(connection.id, 'Failed to execute device action', message.messageId)
    }
  }

  // ============================================================================
  // BROADCASTING METHODS
  // ============================================================================

  /**
   * Broadcast device event to subscribed clients
   */
  broadcastDeviceEvent(deviceId: string, event: DeviceEvent) {
    const message: WebSocketResponse = {
      type: 'event',
      payload: {
        eventType: event.type,
        deviceId,
        data: event.data,
        timestamp: event.timestamp
      },
      timestamp: new Date().toISOString()
    }

    // Send to all clients subscribed to this device
    for (const [clientId, connection] of this.clients) {
      if (connection.subscribedDevices.has(deviceId)) {
        this.sendToClient(clientId, message)
      }
    }
  }

  /**
   * Broadcast to all user connections
   */
  broadcastToUser(userId: string, message: WebSocketResponse) {
    const userConnections = this.userConnections.get(userId)
    if (userConnections) {
      for (const clientId of userConnections) {
        this.sendToClient(clientId, message)
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketResponse) {
    const connection = this.clients.get(clientId)
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      try {
        connection.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error)
      }
    }
  }

  /**
   * Send error message to client
   */
  private sendErrorToClient(clientId: string, error: string, messageId?: string) {
    this.sendToClient(clientId, {
      type: 'error',
      payload: { error },
      messageId,
      timestamp: new Date().toISOString()
    })
  }

  // ============================================================================
  // MAINTENANCE METHODS
  // ============================================================================

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      for (const [clientId, connection] of this.clients) {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.ping()
        }
      }
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Start cleanup interval for stale connections
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = new Date()
      const staleThreshold = 5 * 60 * 1000 // 5 minutes

      for (const [clientId, connection] of this.clients) {
        const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime()
        
        if (timeSinceLastActivity > staleThreshold) {
          console.log(`Closing stale connection: ${clientId}`)
          connection.socket.terminate()
          this.clients.delete(clientId)
        }
      }
    }, 60000) // Check every minute
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      totalUsers: this.userConnections.size,
      connectionsPerUser: Array.from(this.userConnections.entries()).map(([userId, connections]) => ({
        userId,
        connections: connections.size
      }))
    }
  }

  /**
   * Shutdown server gracefully
   */
  shutdown() {
    console.log('Shutting down WebSocket server...')

    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Close all client connections
    for (const [clientId, connection] of this.clients) {
      connection.socket.close(1001, 'Server shutting down')
    }

    this.wss.close(() => {
      console.log('WebSocket server closed')
    })
  }
}
