/**
 * WhatsApp Session Manager for Watsy-Chatbot Platform
 * 
 * This module handles persistent session storage, restoration capabilities,
 * cleanup, and renewal processes for WhatsApp connections. It ensures
 * reliable session management across application restarts and failures.
 */

import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { 
  WhatsAppSession, 
  SessionCredentials, 
  SessionRestoreResult,
  WhatsAppServiceError,
  DeviceNotFoundError,
  SessionExpiredError
} from './types'
import { WhatsAppDeviceStatus } from '@/generated/prisma'

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

interface SessionConfig {
  sessionsPath: string
  sessionExpirationDays: number
  maxSessionSize: number
  enableCompression: boolean
  backupSessions: boolean
  cleanupIntervalHours: number
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionsPath: process.env.WHATSAPP_SESSIONS_PATH || './sessions',
  sessionExpirationDays: 30,
  maxSessionSize: 10 * 1024 * 1024, // 10MB
  enableCompression: true,
  backupSessions: true,
  cleanupIntervalHours: 24
}

// ============================================================================
// SESSION MANAGER CLASS
// ============================================================================

export class WhatsAppSessionManager {
  private config: SessionConfig
  private cleanupInterval?: NodeJS.Timeout

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config }
    this.initializeSessionDirectory()
    this.startCleanupScheduler()
  }

  // ============================================================================
  // SESSION STORAGE
  // ============================================================================

  /**
   * Save session data to persistent storage
   */
  async saveSession(deviceId: string, sessionData: any): Promise<boolean> {
    try {
      // Validate session data
      if (!sessionData || typeof sessionData !== 'object') {
        throw new WhatsAppServiceError(
          'Invalid session data provided',
          'INVALID_SESSION_DATA',
          deviceId
        )
      }

      // Check session size
      const sessionSize = Buffer.byteLength(JSON.stringify(sessionData))
      if (sessionSize > this.config.maxSessionSize) {
        throw new WhatsAppServiceError(
          `Session data too large: ${sessionSize} bytes`,
          'SESSION_TOO_LARGE',
          deviceId
        )
      }

      // Create session directory if it doesn't exist
      const deviceSessionPath = this.getDeviceSessionPath(deviceId)
      await this.ensureDirectoryExists(path.dirname(deviceSessionPath))

      // Backup existing session if enabled
      if (this.config.backupSessions) {
        await this.backupExistingSession(deviceId)
      }

      // Prepare session data with metadata
      const sessionWithMetadata = {
        deviceId,
        sessionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
        checksum: this.calculateChecksum(sessionData)
      }

      // Write session to file
      const sessionJson = JSON.stringify(sessionWithMetadata, null, 2)
      await fs.writeFile(deviceSessionPath, sessionJson, 'utf8')

      // Update database record
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          sessionData: sessionWithMetadata,
          updatedAt: new Date()
        }
      })

      console.log(`Session saved for device ${deviceId}`)
      return true

    } catch (error) {
      console.error(`Failed to save session for device ${deviceId}:`, error)
      return false
    }
  }

  /**
   * Load session data from persistent storage
   */
  async loadSession(deviceId: string): Promise<SessionRestoreResult> {
    try {
      // Check if device exists
      const device = await prisma.whatsAppDevice.findUnique({
        where: { id: deviceId },
        select: { id: true, status: true, sessionData: true }
      })

      if (!device) {
        return {
          success: false,
          error: 'Device not found'
        }
      }

      // Try to load from file first
      const fileSession = await this.loadSessionFromFile(deviceId)
      if (fileSession.success) {
        return fileSession
      }

      // Fallback to database session
      if (device.sessionData) {
        const session: WhatsAppSession = {
          deviceId,
          sessionData: device.sessionData,
          isValid: true,
          lastUpdated: new Date()
        }

        return {
          success: true,
          session
        }
      }

      return {
        success: false,
        error: 'No session data found'
      }

    } catch (error) {
      console.error(`Failed to load session for device ${deviceId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Load session from file system
   */
  private async loadSessionFromFile(deviceId: string): Promise<SessionRestoreResult> {
    try {
      const sessionPath = this.getDeviceSessionPath(deviceId)
      
      // Check if session file exists
      try {
        await fs.access(sessionPath)
      } catch {
        return {
          success: false,
          error: 'Session file not found'
        }
      }

      // Read and parse session file
      const sessionContent = await fs.readFile(sessionPath, 'utf8')
      const sessionWithMetadata = JSON.parse(sessionContent)

      // Validate session structure
      if (!this.validateSessionStructure(sessionWithMetadata)) {
        return {
          success: false,
          error: 'Invalid session file structure'
        }
      }

      // Check session expiration
      const createdAt = new Date(sessionWithMetadata.createdAt)
      const expirationDate = new Date(createdAt.getTime() + this.config.sessionExpirationDays * 24 * 60 * 60 * 1000)
      
      if (new Date() > expirationDate) {
        await this.clearSession(deviceId)
        return {
          success: false,
          error: 'Session expired'
        }
      }

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum(sessionWithMetadata.sessionData)
      if (calculatedChecksum !== sessionWithMetadata.checksum) {
        console.warn(`Session checksum mismatch for device ${deviceId}`)
      }

      const session: WhatsAppSession = {
        deviceId,
        sessionData: sessionWithMetadata.sessionData,
        isValid: true,
        lastUpdated: new Date(sessionWithMetadata.updatedAt),
        expiresAt: expirationDate
      }

      return {
        success: true,
        session
      }

    } catch (error) {
      console.error(`Failed to load session file for device ${deviceId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse session file'
      }
    }
  }

  // ============================================================================
  // SESSION CLEANUP
  // ============================================================================

  /**
   * Clear session data for a device
   */
  async clearSession(deviceId: string): Promise<boolean> {
    try {
      // Remove session file
      const sessionPath = this.getDeviceSessionPath(deviceId)
      try {
        await fs.unlink(sessionPath)
      } catch (error) {
        // File might not exist, which is fine
      }

      // Remove backup files
      await this.removeBackupSessions(deviceId)

      // Clear session data in database
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: {
          sessionData: {},
          status: WhatsAppDeviceStatus.DISCONNECTED
        }
      })

      console.log(`Session cleared for device ${deviceId}`)
      return true

    } catch (error) {
      console.error(`Failed to clear session for device ${deviceId}:`, error)
      return false
    }
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(deviceId: string): Promise<boolean> {
    const result = await this.loadSession(deviceId)
    return result.success && result.session?.isValid === true
  }

  /**
   * Refresh session (update timestamp)
   */
  async refreshSession(deviceId: string): Promise<boolean> {
    try {
      const result = await this.loadSession(deviceId)
      
      if (!result.success || !result.session) {
        return false
      }

      // Update session with new timestamp
      return await this.saveSession(deviceId, result.session.sessionData)

    } catch (error) {
      console.error(`Failed to refresh session for device ${deviceId}:`, error)
      return false
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleanedCount = 0

    try {
      // Get all devices with sessions
      const devices = await prisma.whatsAppDevice.findMany({
        where: {
          sessionData: { not: {} }
        },
        select: { id: true }
      })

      for (const device of devices) {
        const result = await this.loadSession(device.id)
        
        if (!result.success || (result.session?.expiresAt && new Date() > result.session.expiresAt)) {
          await this.clearSession(device.id)
          cleanedCount++
        }
      }

      // Also cleanup orphaned session files
      const orphanedCount = await this.cleanupOrphanedSessionFiles()
      cleanedCount += orphanedCount

      console.log(`Cleaned up ${cleanedCount} expired/orphaned sessions`)
      return cleanedCount

    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return cleanedCount
    }
  }

  /**
   * Cleanup orphaned session files
   */
  private async cleanupOrphanedSessionFiles(): Promise<number> {
    let cleanedCount = 0

    try {
      const sessionFiles = await fs.readdir(this.config.sessionsPath)
      
      for (const file of sessionFiles) {
        if (file.endsWith('.json')) {
          const deviceId = file.replace('.json', '')
          
          // Check if device exists in database
          const device = await prisma.whatsAppDevice.findUnique({
            where: { id: deviceId },
            select: { id: true }
          })

          if (!device) {
            const filePath = path.join(this.config.sessionsPath, file)
            await fs.unlink(filePath)
            cleanedCount++
          }
        }
      }

    } catch (error) {
      console.error('Failed to cleanup orphaned session files:', error)
    }

    return cleanedCount
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get device session file path
   */
  private getDeviceSessionPath(deviceId: string): string {
    return path.join(this.config.sessionsPath, `${deviceId}.json`)
  }

  /**
   * Get backup session file path
   */
  private getBackupSessionPath(deviceId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return path.join(this.config.sessionsPath, 'backups', `${deviceId}_${timestamp}.json`)
  }

  /**
   * Initialize session directory
   */
  private async initializeSessionDirectory() {
    try {
      await this.ensureDirectoryExists(this.config.sessionsPath)
      await this.ensureDirectoryExists(path.join(this.config.sessionsPath, 'backups'))
    } catch (error) {
      console.error('Failed to initialize session directory:', error)
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string) {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * Backup existing session
   */
  private async backupExistingSession(deviceId: string) {
    try {
      const sessionPath = this.getDeviceSessionPath(deviceId)
      const backupPath = this.getBackupSessionPath(deviceId)

      try {
        await fs.access(sessionPath)
        await fs.copyFile(sessionPath, backupPath)
      } catch {
        // No existing session to backup
      }
    } catch (error) {
      console.error(`Failed to backup session for device ${deviceId}:`, error)
    }
  }

  /**
   * Remove backup sessions for a device
   */
  private async removeBackupSessions(deviceId: string) {
    try {
      const backupDir = path.join(this.config.sessionsPath, 'backups')
      const files = await fs.readdir(backupDir)
      
      for (const file of files) {
        if (file.startsWith(`${deviceId}_`)) {
          await fs.unlink(path.join(backupDir, file))
        }
      }
    } catch (error) {
      // Backup directory might not exist
    }
  }

  /**
   * Validate session structure
   */
  private validateSessionStructure(session: any): boolean {
    return (
      session &&
      typeof session === 'object' &&
      session.deviceId &&
      session.sessionData &&
      session.createdAt &&
      session.updatedAt &&
      session.checksum
    )
  }

  /**
   * Calculate session checksum
   */
  private calculateChecksum(data: any): string {
    const crypto = require('crypto')
    const dataString = JSON.stringify(data)
    return crypto.createHash('sha256').update(dataString).digest('hex')
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler() {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions()
    }, this.config.cleanupIntervalHours * 60 * 60 * 1000)
  }

  /**
   * Stop cleanup scheduler
   */
  stopCleanupScheduler() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number
    validSessions: number
    expiredSessions: number
    totalSize: number
  }> {
    try {
      const devices = await prisma.whatsAppDevice.findMany({
        where: { sessionData: { not: {} } },
        select: { id: true }
      })

      let validSessions = 0
      let expiredSessions = 0
      let totalSize = 0

      for (const device of devices) {
        const result = await this.loadSession(device.id)
        
        if (result.success) {
          validSessions++
        } else {
          expiredSessions++
        }

        // Calculate file size
        try {
          const sessionPath = this.getDeviceSessionPath(device.id)
          const stats = await fs.stat(sessionPath)
          totalSize += stats.size
        } catch {
          // File might not exist
        }
      }

      return {
        totalSessions: devices.length,
        validSessions,
        expiredSessions,
        totalSize
      }

    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        validSessions: 0,
        expiredSessions: 0,
        totalSize: 0
      }
    }
  }
}
