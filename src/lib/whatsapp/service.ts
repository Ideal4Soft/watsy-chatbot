/**
 * WhatsApp Service for Watsy-Chatbot Platform
 * 
 * This module provides the core WhatsApp service using Baileys library.
 * It handles device connections, session management, and message processing
 * with comprehensive error handling and real-time event broadcasting.
 */

import { EventEmitter } from 'events'
import { 
  makeWASocket, 
  DisconnectReason, 
  ConnectionState, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
  WAMessageKey,
  WAMessageContent
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { 
  WhatsAppDevice,
  DeviceConnectionInfo,
  ConnectionResult,
  DevicePairingData,
  WhatsAppServiceConfig,
  DeviceEvent,
  ConnectionEvent,
  MessageEvent,
  StatusEvent,
  ErrorEvent,
  WhatsAppServiceError,
  DeviceNotFoundError,
  ConnectionFailedError
} from './types'
import { WhatsAppDeviceStatus } from '@/generated/prisma'

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: WhatsAppServiceConfig = {
  maxDevicesPerUser: 5,
  maxConnectionRetries: 3,
  qrCodeExpirationMinutes: 5,
  sessionExpirationDays: 30,
  messageRateLimit: 100,
  enableLogging: true,
  logLevel: 'info'
}

// ============================================================================
// WHATSAPP SERVICE CLASS
// ============================================================================

export class WhatsAppService extends EventEmitter {
  private config: WhatsAppServiceConfig
  private connections: Map<string, DeviceConnectionInfo> = new Map()
  private sessionPath: string

  constructor(config: Partial<WhatsAppServiceConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionPath = process.env.WHATSAPP_SESSIONS_PATH || './sessions'
    
    // Set max listeners to handle multiple devices
    this.setMaxListeners(100)
  }

  // ============================================================================
  // DEVICE MANAGEMENT
  // ============================================================================

  /**
   * Create a new WhatsApp device for a user
   */
  async createDevice(userId: string, deviceName: string): Promise<WhatsAppDevice> {
    try {
      // Check user's device limit
      const userDevices = await prisma.whatsAppDevice.count({
        where: { userId }
      })

      if (userDevices >= this.config.maxDevicesPerUser) {
        throw new WhatsAppServiceError(
          `Maximum devices limit reached (${this.config.maxDevicesPerUser})`,
          'DEVICE_LIMIT_EXCEEDED'
        )
      }

      // Create device in database
      const device = await prisma.whatsAppDevice.create({
        data: {
          userId,
          name: deviceName,
          status: WhatsAppDeviceStatus.DISCONNECTED
        }
      })

      this.log('info', `Device created: ${device.id} for user ${userId}`)
      return device

    } catch (error) {
      this.log('error', `Failed to create device: ${error}`)
      throw error
    }
  }

  /**
   * Connect a WhatsApp device
   */
  async connectDevice(deviceId: string): Promise<ConnectionResult> {
    try {
      // Get device from database
      const device = await prisma.whatsAppDevice.findUnique({
        where: { id: deviceId }
      })

      if (!device) {
        throw new DeviceNotFoundError(deviceId)
      }

      // Check if already connected
      if (this.connections.has(deviceId)) {
        const connection = this.connections.get(deviceId)!
        if (connection.isConnected) {
          return {
            success: true,
            deviceId,
            socket: connection.socket
          }
        }
      }

      // Update device status
      await this.updateDeviceStatus(deviceId, WhatsAppDeviceStatus.CONNECTING)

      // Initialize connection
      const connectionResult = await this.initializeConnection(device)
      
      return connectionResult

    } catch (error) {
      this.log('error', `Failed to connect device ${deviceId}: ${error}`)
      await this.updateDeviceStatus(deviceId, WhatsAppDeviceStatus.FAILED)
      
      throw new ConnectionFailedError(deviceId, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Disconnect a WhatsApp device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(deviceId)
      
      if (connection?.socket) {
        await connection.socket.logout()
        connection.socket.end(undefined)
      }

      this.connections.delete(deviceId)
      await this.updateDeviceStatus(deviceId, WhatsAppDeviceStatus.DISCONNECTED)

      this.log('info', `Device disconnected: ${deviceId}`)
      return true

    } catch (error) {
      this.log('error', `Failed to disconnect device ${deviceId}: ${error}`)
      return false
    }
  }

  /**
   * Remove a WhatsApp device
   */
  async removeDevice(deviceId: string): Promise<boolean> {
    try {
      // Disconnect first
      await this.disconnectDevice(deviceId)

      // Remove from database
      await prisma.whatsAppDevice.delete({
        where: { id: deviceId }
      })

      this.log('info', `Device removed: ${deviceId}`)
      return true

    } catch (error) {
      this.log('error', `Failed to remove device ${deviceId}: ${error}`)
      return false
    }
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<WhatsAppDeviceStatus> {
    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
      select: { status: true }
    })

    return device?.status || WhatsAppDeviceStatus.DISCONNECTED
  }

  /**
   * List user's devices
   */
  async listUserDevices(userId: string): Promise<WhatsAppDevice[]> {
    return await prisma.whatsAppDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Initialize WhatsApp connection
   */
  private async initializeConnection(device: WhatsAppDevice): Promise<ConnectionResult> {
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion()
      
      if (!isLatest) {
        this.log('warn', `Using outdated Baileys version: ${version.join('.')}`)
      }

      // Setup auth state
      const { state, saveCreds } = await useMultiFileAuthState(`${this.sessionPath}/${device.id}`)

      // Create socket
      const socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, {
            debug: (msg: string) => this.log('debug', msg),
            info: (msg: string) => this.log('info', msg),
            warn: (msg: string) => this.log('warn', msg),
            error: (msg: string) => this.log('error', msg),
            fatal: (msg: string) => this.log('error', msg),
            trace: (msg: string) => this.log('debug', msg),
            child: () => ({
              debug: (msg: string) => this.log('debug', msg),
              info: (msg: string) => this.log('info', msg),
              warn: (msg: string) => this.log('warn', msg),
              error: (msg: string) => this.log('error', msg),
              fatal: (msg: string) => this.log('error', msg),
              trace: (msg: string) => this.log('debug', msg),
            })
          } as any)
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        logger: {
          level: this.config.logLevel,
          child: () => this.log.bind(this)
        } as any
      })

      // Store connection info
      const connectionInfo: DeviceConnectionInfo = {
        deviceId: device.id,
        socket,
        connectionState: 'connecting' as unknown as ConnectionState,
        isConnected: false,
        retryCount: 0,
        maxRetries: this.config.maxConnectionRetries
      }

      this.connections.set(device.id, connectionInfo)

      // Setup event handlers
      this.setupSocketEventHandlers(socket, device, saveCreds)

      return {
        success: true,
        deviceId: device.id,
        socket
      }

    } catch (error) {
      this.log('error', `Failed to initialize connection for device ${device.id}: ${error}`)
      throw error
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(
    socket: WASocket, 
    device: WhatsAppDevice, 
    saveCreds: () => Promise<void>
  ) {
    // Connection updates
    socket.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(device.id, update, saveCreds)
    })

    // Credentials update
    socket.ev.on('creds.update', saveCreds)

    // Messages
    socket.ev.on('messages.upsert', async (messageUpdate) => {
      await this.handleMessagesUpsert(device.id, messageUpdate)
    })

    // Message receipts
    socket.ev.on('message-receipt.update', async (receiptUpdate) => {
      await this.handleMessageReceipts(device.id, receiptUpdate)
    })

    // Presence updates
    socket.ev.on('presence.update', async (presenceUpdate) => {
      await this.handlePresenceUpdate(device.id, presenceUpdate)
    })

    // Contacts update
    socket.ev.on('contacts.update', async (contactsUpdate) => {
      await this.handleContactsUpdate(device.id, contactsUpdate)
    })
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle connection updates
   */
  private async handleConnectionUpdate(
    deviceId: string,
    update: any,
    _saveCreds: () => Promise<void>
  ) {
    const { connection, lastDisconnect, qr, isNewLogin } = update
    const connection_info = this.connections.get(deviceId)
    const socket = connection_info?.socket

    if (!connection_info) return

    if (qr) {
      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(qr)
      const expiresAt = new Date(Date.now() + this.config.qrCodeExpirationMinutes * 60 * 1000)

      // Update device with QR code
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          qrCode: qrCodeData,
          qrCodeExpires: expiresAt,
          status: WhatsAppDeviceStatus.CONNECTING
        }
      })

      // Emit QR code event
      this.emitConnectionEvent(deviceId, {
        status: WhatsAppDeviceStatus.CONNECTING,
        connectionState: connection,
        qrCode: qrCodeData
      })
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      
      if (shouldReconnect && connection_info.retryCount < connection_info.maxRetries) {
        connection_info.retryCount++
        this.log('info', `Reconnecting device ${deviceId} (attempt ${connection_info.retryCount})`)
        
        setTimeout(() => {
          this.connectDevice(deviceId)
        }, 5000)
      } else {
        await this.updateDeviceStatus(deviceId, WhatsAppDeviceStatus.DISCONNECTED)
        this.connections.delete(deviceId)
      }
    }

    if (connection === 'open') {
      connection_info.isConnected = true
      connection_info.retryCount = 0
      
      await this.updateDeviceStatus(deviceId, WhatsAppDeviceStatus.CONNECTED)
      
      // Get device info
      const deviceInfo = {
        platform: socket?.user?.id,
        phoneNumber: socket?.user?.id?.split(':')[0] || null,
        name: socket?.user?.name
      }

      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          phoneNumber: deviceInfo.phoneNumber,
          deviceInfo: deviceInfo,
          lastConnectedAt: new Date(),
          qrCode: null,
          qrCodeExpires: null
        }
      })

      this.emitConnectionEvent(deviceId, {
        status: WhatsAppDeviceStatus.CONNECTED,
        connectionState: connection,
        phoneNumber: deviceInfo.phoneNumber,
        deviceInfo
      })
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Update device status in database
   */
  private async updateDeviceStatus(deviceId: string, status: WhatsAppDeviceStatus) {
    await prisma.whatsAppDevice.update({
      where: { id: deviceId },
      data: { 
        status,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Emit connection event
   */
  private emitConnectionEvent(deviceId: string, data: any) {
    const event: ConnectionEvent = {
      type: 'connection',
      deviceId,
      userId: '', // Will be filled by caller
      timestamp: new Date(),
      data
    }
    
    this.emit('connection', event)
  }

  /**
   * Logging utility
   */
  private log(level: string, message: string, ...args: any[]) {
    if (this.config.enableLogging) {
      const logMethod = (console as any)[level] || console.log
      logMethod(`[WhatsAppService] ${message}`, ...args)
    }
  }

  // Placeholder methods for message handling
  private async handleMessagesUpsert(_deviceId: string, _messageUpdate: any) {
    // Implementation will be added in next iteration
  }

  private async handleMessageReceipts(_deviceId: string, _receiptUpdate: any) {
    // Implementation will be added in next iteration
  }

  private async handlePresenceUpdate(_deviceId: string, _presenceUpdate: any) {
    // Implementation will be added in next iteration
  }

  private async handleContactsUpdate(_deviceId: string, _contactsUpdate: any) {
    // Implementation will be added in next iteration
  }
}
