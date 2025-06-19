/**
 * WhatsApp Service Types for Watsy-Chatbot Platform
 * 
 * This module provides TypeScript types and interfaces for WhatsApp integration
 * using the Baileys library. It includes types for device management, session
 * handling, and real-time communication.
 */

import { WhatsAppDeviceStatus } from '@/generated/prisma'
import { ConnectionState, DisconnectReason, WASocket } from '@whiskeysockets/baileys'

// ============================================================================
// DEVICE TYPES
// ============================================================================

export interface WhatsAppDevice {
  id: string
  userId: string
  name: string
  phoneNumber: string | null
  status: WhatsAppDeviceStatus
  lastConnectedAt: Date | null
  lastDisconnectedAt: Date | null
  connectionAttempts: number
  sessionData: any
  qrCode: string | null
  qrCodeExpires: Date | null
  deviceInfo: any
  batteryLevel: number | null
  isCharging: boolean | null
  messagesSentToday: number
  lastMessageSentAt: Date | null
  rateLimitResetAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface DeviceConnectionInfo {
  deviceId: string
  socket?: WASocket
  connectionState: ConnectionState
  isConnected: boolean
  lastSeen?: Date
  retryCount: number
  maxRetries: number
}

export interface DevicePairingData {
  qrCode?: string
  pairingCode?: string
  expiresAt: Date
  isExpired: boolean
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface WhatsAppSession {
  deviceId: string
  sessionData: any
  isValid: boolean
  lastUpdated: Date
  expiresAt?: Date
}

export interface SessionCredentials {
  creds: any
  keys: any
}

export interface SessionRestoreResult {
  success: boolean
  session?: WhatsAppSession
  error?: string
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export interface ConnectionOptions {
  deviceId: string
  userId: string
  deviceName: string
  printQRInTerminal?: boolean
  markOnlineOnConnect?: boolean
  syncFullHistory?: boolean
  generateHighQualityLinkPreview?: boolean
}

export interface ConnectionResult {
  success: boolean
  deviceId: string
  socket?: WASocket
  qrCode?: string
  pairingCode?: string
  error?: string
  disconnectReason?: DisconnectReason
}

export interface DisconnectionInfo {
  deviceId: string
  reason: DisconnectReason
  isLoggedOut: boolean
  shouldReconnect: boolean
  error?: Error
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface WhatsAppMessage {
  id: string
  deviceId: string
  whatsappMessageId: string
  fromNumber: string
  toNumber: string
  fromName?: string
  toName?: string
  content?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  quotedMessageId?: string
  timestamp: Date
  isFromMe: boolean
  isGroup: boolean
  groupId?: string
}

export interface SendMessageOptions {
  deviceId: string
  to: string
  message: string
  quotedMessageId?: string
  linkPreview?: boolean
}

export interface SendMediaOptions {
  deviceId: string
  to: string
  mediaPath: string
  caption?: string
  mimeType?: string
  quotedMessageId?: string
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface DeviceEvent {
  type: 'connection' | 'message' | 'status' | 'error'
  deviceId: string
  userId: string
  timestamp: Date
  data: any
}

export interface ConnectionEvent extends DeviceEvent {
  type: 'connection'
  data: {
    status: WhatsAppDeviceStatus
    connectionState: ConnectionState
    qrCode?: string
    pairingCode?: string
    phoneNumber?: string
    deviceInfo?: any
  }
}

export interface MessageEvent extends DeviceEvent {
  type: 'message'
  data: {
    message: WhatsAppMessage
    isIncoming: boolean
  }
}

export interface StatusEvent extends DeviceEvent {
  type: 'status'
  data: {
    status: WhatsAppDeviceStatus
    batteryLevel?: number
    isCharging?: boolean
    lastSeen?: Date
  }
}

export interface ErrorEvent extends DeviceEvent {
  type: 'error'
  data: {
    error: Error
    code?: string
    fatal: boolean
  }
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface WhatsAppServiceConfig {
  maxDevicesPerUser: number
  maxConnectionRetries: number
  qrCodeExpirationMinutes: number
  sessionExpirationDays: number
  messageRateLimit: number
  enableLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface DeviceManager {
  createDevice(userId: string, deviceName: string): Promise<WhatsAppDevice>
  connectDevice(deviceId: string): Promise<ConnectionResult>
  disconnectDevice(deviceId: string): Promise<boolean>
  removeDevice(deviceId: string): Promise<boolean>
  getDeviceStatus(deviceId: string): Promise<WhatsAppDeviceStatus>
  listUserDevices(userId: string): Promise<WhatsAppDevice[]>
  generatePairingData(deviceId: string): Promise<DevicePairingData>
}

export interface SessionManager {
  saveSession(deviceId: string, sessionData: any): Promise<boolean>
  loadSession(deviceId: string): Promise<SessionRestoreResult>
  clearSession(deviceId: string): Promise<boolean>
  isSessionValid(deviceId: string): Promise<boolean>
  refreshSession(deviceId: string): Promise<boolean>
}

export interface MessageManager {
  sendTextMessage(options: SendMessageOptions): Promise<string>
  sendMediaMessage(options: SendMediaOptions): Promise<string>
  getMessageHistory(deviceId: string, contactNumber: string, limit?: number): Promise<WhatsAppMessage[]>
  markMessageAsRead(deviceId: string, messageId: string): Promise<boolean>
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookPayload {
  event: string
  deviceId: string
  userId: string
  timestamp: string
  data: any
}

export interface MessageWebhookPayload extends WebhookPayload {
  event: 'message.received' | 'message.sent' | 'message.delivered' | 'message.read'
  data: {
    message: WhatsAppMessage
    contact: {
      number: string
      name?: string
      isGroup: boolean
    }
  }
}

export interface StatusWebhookPayload extends WebhookPayload {
  event: 'device.connected' | 'device.disconnected' | 'device.pairing' | 'device.error'
  data: {
    status: WhatsAppDeviceStatus
    phoneNumber?: string
    qrCode?: string
    pairingCode?: string
    error?: string
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeviceEventHandler = (event: DeviceEvent) => void | Promise<void>
export type ConnectionEventHandler = (event: ConnectionEvent) => void | Promise<void>
export type MessageEventHandler = (event: MessageEvent) => void | Promise<void>
export type StatusEventHandler = (event: StatusEvent) => void | Promise<void>
export type ErrorEventHandler = (event: ErrorEvent) => void | Promise<void>

export interface EventHandlers {
  onConnection?: ConnectionEventHandler
  onMessage?: MessageEventHandler
  onStatus?: StatusEventHandler
  onError?: ErrorEventHandler
}

export interface DeviceMetrics {
  deviceId: string
  totalMessages: number
  messagesReceived: number
  messagesSent: number
  uptime: number
  lastActivity: Date
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class WhatsAppServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public deviceId?: string,
    public fatal: boolean = false
  ) {
    super(message)
    this.name = 'WhatsAppServiceError'
  }
}

export class DeviceNotFoundError extends WhatsAppServiceError {
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND', deviceId)
  }
}

export class SessionExpiredError extends WhatsAppServiceError {
  constructor(deviceId: string) {
    super(`Session expired for device: ${deviceId}`, 'SESSION_EXPIRED', deviceId)
  }
}

export class ConnectionFailedError extends WhatsAppServiceError {
  constructor(deviceId: string, reason: string) {
    super(`Connection failed for device ${deviceId}: ${reason}`, 'CONNECTION_FAILED', deviceId)
  }
}

export class RateLimitExceededError extends WhatsAppServiceError {
  constructor(deviceId: string) {
    super(`Rate limit exceeded for device: ${deviceId}`, 'RATE_LIMIT_EXCEEDED', deviceId)
  }
}
