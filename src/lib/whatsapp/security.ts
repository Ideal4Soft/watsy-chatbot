/**
 * WhatsApp Device Security Manager
 * 
 * This module implements comprehensive security measures for WhatsApp device
 * management including device authorization, session validation, rate limiting,
 * and security monitoring with audit logging.
 */

import { prisma } from '@/lib/prisma'
import { WhatsAppDeviceStatus } from '@/generated/prisma'
import { createHash, randomBytes } from 'crypto'

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

interface SecurityConfig {
  maxDevicesPerUser: number
  maxConnectionAttemptsPerHour: number
  sessionValidityDays: number
  deviceAuthTokenLength: number
  rateLimitWindowMs: number
  maxRequestsPerWindow: number
  suspiciousActivityThreshold: number
  enableAuditLogging: boolean
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxDevicesPerUser: 5,
  maxConnectionAttemptsPerHour: 10,
  sessionValidityDays: 30,
  deviceAuthTokenLength: 32,
  rateLimitWindowMs: 60 * 60 * 1000, // 1 hour
  maxRequestsPerWindow: 100,
  suspiciousActivityThreshold: 5,
  enableAuditLogging: true
}

// ============================================================================
// SECURITY MANAGER CLASS
// ============================================================================

export class WhatsAppSecurityManager {
  private config: SecurityConfig
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
  }

  // ============================================================================
  // DEVICE AUTHORIZATION
  // ============================================================================

  /**
   * Authorize device access for a user
   */
  async authorizeDeviceAccess(userId: string, deviceId: string): Promise<{
    authorized: boolean
    reason?: string
    deviceInfo?: any
  }> {
    try {
      // Check if device exists and belongs to user
      const device = await prisma.whatsAppDevice.findFirst({
        where: {
          id: deviceId,
          userId: userId
        },
        include: {
          user: {
            select: { isActive: true, role: true }
          }
        }
      })

      if (!device) {
        await this.logSecurityEvent(userId, 'UNAUTHORIZED_DEVICE_ACCESS', {
          deviceId,
          reason: 'Device not found or access denied'
        })
        
        return {
          authorized: false,
          reason: 'Device not found or access denied'
        }
      }

      // Check if user account is active
      if (!device.user.isActive) {
        await this.logSecurityEvent(userId, 'INACTIVE_USER_ACCESS', {
          deviceId,
          reason: 'User account is inactive'
        })
        
        return {
          authorized: false,
          reason: 'User account is inactive'
        }
      }

      // Check device status
      if (device.status === WhatsAppDeviceStatus.BANNED) {
        await this.logSecurityEvent(userId, 'BANNED_DEVICE_ACCESS', {
          deviceId,
          reason: 'Device is banned'
        })
        
        return {
          authorized: false,
          reason: 'Device is banned'
        }
      }

      // Check connection attempts rate limit
      const connectionCheck = await this.checkConnectionRateLimit(deviceId)
      if (!connectionCheck.allowed) {
        await this.logSecurityEvent(userId, 'RATE_LIMIT_EXCEEDED', {
          deviceId,
          reason: 'Too many connection attempts'
        })
        
        return {
          authorized: false,
          reason: 'Too many connection attempts. Please try again later.'
        }
      }

      return {
        authorized: true,
        deviceInfo: {
          id: device.id,
          name: device.name,
          status: device.status,
          lastConnectedAt: device.lastConnectedAt
        }
      }

    } catch (error) {
      console.error('Device authorization error:', error)
      
      await this.logSecurityEvent(userId, 'AUTHORIZATION_ERROR', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        authorized: false,
        reason: 'Authorization check failed'
      }
    }
  }

  /**
   * Generate secure device authentication token
   */
  async generateDeviceAuthToken(deviceId: string): Promise<string> {
    const token = randomBytes(this.config.deviceAuthTokenLength).toString('hex')
    const hashedToken = this.hashToken(token)
    
    // Store hashed token in database
    await prisma.whatsAppDevice.update({
      where: { id: deviceId },
      data: {
        sessionData: {
          authToken: hashedToken,
          tokenCreatedAt: new Date().toISOString(),
          tokenExpiresAt: new Date(Date.now() + this.config.sessionValidityDays * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    })

    return token
  }

  /**
   * Validate device authentication token
   */
  async validateDeviceAuthToken(deviceId: string, token: string): Promise<boolean> {
    try {
      const device = await prisma.whatsAppDevice.findUnique({
        where: { id: deviceId },
        select: { sessionData: true }
      })

      if (!device?.sessionData || typeof device.sessionData !== 'object') {
        return false
      }

      const sessionData = device.sessionData as any
      const storedHashedToken = sessionData.authToken
      const tokenExpiresAt = sessionData.tokenExpiresAt

      if (!storedHashedToken || !tokenExpiresAt) {
        return false
      }

      // Check if token is expired
      if (new Date() > new Date(tokenExpiresAt)) {
        return false
      }

      // Validate token hash
      const hashedToken = this.hashToken(token)
      return hashedToken === storedHashedToken

    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  // ============================================================================
  // SESSION VALIDATION
  // ============================================================================

  /**
   * Validate device session integrity
   */
  async validateDeviceSession(deviceId: string): Promise<{
    valid: boolean
    reason?: string
    sessionInfo?: any
  }> {
    try {
      const device = await prisma.whatsAppDevice.findUnique({
        where: { id: deviceId },
        select: {
          id: true,
          status: true,
          sessionData: true,
          lastConnectedAt: true,
          updatedAt: true
        }
      })

      if (!device) {
        return {
          valid: false,
          reason: 'Device not found'
        }
      }

      // Check if device has session data
      if (!device.sessionData) {
        return {
          valid: false,
          reason: 'No session data found'
        }
      }

      const sessionData = device.sessionData as any
      const now = new Date()

      // Check session expiration
      if (sessionData.tokenExpiresAt && new Date(sessionData.tokenExpiresAt) < now) {
        return {
          valid: false,
          reason: 'Session expired'
        }
      }

      // Check if session is too old (based on last update)
      const maxSessionAge = this.config.sessionValidityDays * 24 * 60 * 60 * 1000
      if (now.getTime() - device.updatedAt.getTime() > maxSessionAge) {
        return {
          valid: false,
          reason: 'Session too old'
        }
      }

      return {
        valid: true,
        sessionInfo: {
          deviceId: device.id,
          status: device.status,
          lastConnectedAt: device.lastConnectedAt,
          sessionCreatedAt: sessionData.tokenCreatedAt,
          sessionExpiresAt: sessionData.tokenExpiresAt
        }
      }

    } catch (error) {
      console.error('Session validation error:', error)
      return {
        valid: false,
        reason: 'Session validation failed'
      }
    }
  }

  /**
   * Refresh device session
   */
  async refreshDeviceSession(deviceId: string): Promise<boolean> {
    try {
      const newToken = await this.generateDeviceAuthToken(deviceId)
      
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          updatedAt: new Date()
        }
      })

      return true

    } catch (error) {
      console.error('Session refresh error:', error)
      return false
    }
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  /**
   * Check connection rate limit for device
   */
  async checkConnectionRateLimit(deviceId: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const windowStart = now - this.config.rateLimitWindowMs
    
    // Get recent connection attempts from database
    const recentAttempts = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
      select: { connectionAttempts: true, updatedAt: true }
    })

    if (!recentAttempts) {
      return { allowed: true, remaining: this.config.maxConnectionAttemptsPerHour, resetTime: now + this.config.rateLimitWindowMs }
    }

    // Check if we're within the rate limit window
    const lastUpdate = recentAttempts.updatedAt.getTime()
    if (lastUpdate < windowStart) {
      // Reset counter if outside window
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: { connectionAttempts: 0 }
      })
      
      return { allowed: true, remaining: this.config.maxConnectionAttemptsPerHour, resetTime: now + this.config.rateLimitWindowMs }
    }

    const currentAttempts = recentAttempts.connectionAttempts
    const allowed = currentAttempts < this.config.maxConnectionAttemptsPerHour
    const remaining = Math.max(0, this.config.maxConnectionAttemptsPerHour - currentAttempts)

    return {
      allowed,
      remaining,
      resetTime: lastUpdate + this.config.rateLimitWindowMs
    }
  }

  /**
   * Record connection attempt
   */
  async recordConnectionAttempt(deviceId: string, success: boolean): Promise<void> {
    try {
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          connectionAttempts: { increment: 1 },
          ...(success && { lastConnectedAt: new Date() })
        }
      })

    } catch (error) {
      console.error('Failed to record connection attempt:', error)
    }
  }

  // ============================================================================
  // SECURITY MONITORING
  // ============================================================================

  /**
   * Log security event for audit trail
   */
  async logSecurityEvent(userId: string, action: string, metadata: any): Promise<void> {
    if (!this.config.enableAuditLogging) {
      return
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'WHATSAPP_DEVICE',
          metadata,
          ipAddress: metadata.ipAddress || null,
          userAgent: metadata.userAgent || null
        }
      })

    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean
    reasons: string[]
    riskScore: number
  }> {
    try {
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Get recent security events
      const recentEvents = await prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: { gte: last24Hours },
          resource: 'WHATSAPP_DEVICE'
        },
        orderBy: { createdAt: 'desc' }
      })

      const reasons: string[] = []
      let riskScore = 0

      // Check for multiple failed authorization attempts
      const failedAttempts = recentEvents.filter(e => 
        e.action.includes('UNAUTHORIZED') || e.action.includes('RATE_LIMIT')
      ).length

      if (failedAttempts >= this.config.suspiciousActivityThreshold) {
        reasons.push(`Multiple failed authorization attempts (${failedAttempts})`)
        riskScore += failedAttempts * 2
      }

      // Check for rapid device creation/deletion
      const deviceActions = recentEvents.filter(e => 
        e.action.includes('CREATE') || e.action.includes('DELETE')
      ).length

      if (deviceActions >= 5) {
        reasons.push(`Rapid device management actions (${deviceActions})`)
        riskScore += deviceActions
      }

      // Check for unusual IP addresses
      const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress).filter(Boolean))
      if (uniqueIPs.size >= 3) {
        reasons.push(`Multiple IP addresses (${uniqueIPs.size})`)
        riskScore += uniqueIPs.size
      }

      return {
        suspicious: riskScore >= 10,
        reasons,
        riskScore
      }

    } catch (error) {
      console.error('Suspicious activity detection error:', error)
      return {
        suspicious: false,
        reasons: [],
        riskScore: 0
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(userId?: string): Promise<{
    totalDevices: number
    activeDevices: number
    bannedDevices: number
    recentSecurityEvents: number
    suspiciousUsers: number
  }> {
    try {
      const whereClause = userId ? { userId } : {}
      
      const [totalDevices, activeDevices, bannedDevices, recentEvents] = await Promise.all([
        prisma.whatsAppDevice.count({ where: whereClause }),
        prisma.whatsAppDevice.count({ 
          where: { ...whereClause, status: WhatsAppDeviceStatus.CONNECTED } 
        }),
        prisma.whatsAppDevice.count({ 
          where: { ...whereClause, status: WhatsAppDeviceStatus.BANNED } 
        }),
        prisma.auditLog.count({
          where: {
            ...(userId && { userId }),
            resource: 'WHATSAPP_DEVICE',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })
      ])

      return {
        totalDevices,
        activeDevices,
        bannedDevices,
        recentSecurityEvents: recentEvents,
        suspiciousUsers: 0 // Would need more complex query for this
      }

    } catch (error) {
      console.error('Failed to get security stats:', error)
      return {
        totalDevices: 0,
        activeDevices: 0,
        bannedDevices: 0,
        recentSecurityEvents: 0,
        suspiciousUsers: 0
      }
    }
  }
}
