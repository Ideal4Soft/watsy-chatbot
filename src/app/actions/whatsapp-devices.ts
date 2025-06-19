/**
 * WhatsApp Device Server Actions for Watsy-Chatbot Platform
 * 
 * This module provides secure Server Actions for WhatsApp device operations
 * including device creation, connection management, pairing, and status monitoring.
 * All actions include proper authentication, validation, and error handling.
 */

'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from '@/lib/whatsapp/service'
import { DevicePairingManager } from '@/lib/whatsapp/pairing'
import { WhatsAppSessionManager } from '@/lib/whatsapp/session-manager'
import { WhatsAppSecurityManager } from '@/lib/whatsapp/security'
import { verifyAccessToken } from '@/lib/auth'
import { WhatsAppDeviceStatus } from '@/generated/prisma'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(50, 'Device name too long'),
  description: z.string().optional()
})

const connectDeviceSchema = z.object({
  deviceId: z.string().cuid('Invalid device ID')
})

const generateQRCodeSchema = z.object({
  deviceId: z.string().cuid('Invalid device ID')
})

const generatePairingCodeSchema = z.object({
  deviceId: z.string().cuid('Invalid device ID'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
})

const validatePairingCodeSchema = z.object({
  deviceId: z.string().cuid('Invalid device ID'),
  pairingCode: z.string().min(6, 'Pairing code must be at least 6 characters')
})

const deviceActionSchema = z.object({
  deviceId: z.string().cuid('Invalid device ID'),
  action: z.enum(['connect', 'disconnect', 'remove', 'refresh'])
})

// ============================================================================
// SERVICE INSTANCES
// ============================================================================

const whatsappService = new WhatsAppService()
const pairingManager = new DevicePairingManager(whatsappService)
const sessionManager = new WhatsAppSessionManager()
const securityManager = new WhatsAppSecurityManager()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get authenticated user from request headers
 */
async function getAuthenticatedUser() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  return { userId, userRole }
}

/**
 * Verify device ownership with security checks
 */
async function verifyDeviceOwnership(deviceId: string, userId: string) {
  // First check basic ownership
  const device = await prisma.whatsAppDevice.findFirst({
    where: {
      id: deviceId,
      userId: userId
    }
  })

  if (!device) {
    throw new Error('Device not found or access denied')
  }

  // Perform security authorization check
  const authResult = await securityManager.authorizeDeviceAccess(userId, deviceId)

  if (!authResult.authorized) {
    throw new Error(authResult.reason || 'Device access denied')
  }

  return device
}

// ============================================================================
// DEVICE MANAGEMENT ACTIONS
// ============================================================================

/**
 * Create a new WhatsApp device
 */
export async function createWhatsAppDevice(input: z.infer<typeof createDeviceSchema>) {
  try {
    // Validate input
    const validatedInput = createDeviceSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Check device limit
    const deviceCount = await prisma.whatsAppDevice.count({
      where: { userId }
    })
    
    const maxDevices = 5 // Could be based on subscription plan
    if (deviceCount >= maxDevices) {
      return {
        success: false,
        error: `Maximum device limit reached (${maxDevices})`
      }
    }
    
    // Create device using service
    const device = await whatsappService.createDevice(userId, validatedInput.name)
    
    return {
      success: true,
      message: 'Device created successfully',
      data: {
        deviceId: device.id,
        name: device.name,
        status: device.status,
        createdAt: device.createdAt
      }
    }
    
  } catch (error) {
    console.error('Create device error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create device'
    }
  }
}

/**
 * Get user's WhatsApp devices
 */
export async function getUserWhatsAppDevices() {
  try {
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Get devices from service
    const devices = await whatsappService.listUserDevices(userId)
    
    return {
      success: true,
      data: devices.map(device => ({
        id: device.id,
        name: device.name,
        phoneNumber: device.phoneNumber,
        status: device.status,
        lastConnectedAt: device.lastConnectedAt,
        lastDisconnectedAt: device.lastDisconnectedAt,
        connectionAttempts: device.connectionAttempts,
        messagesSentToday: device.messagesSentToday,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      }))
    }
    
  } catch (error) {
    console.error('Get devices error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get devices'
    }
  }
}

/**
 * Get device details
 */
export async function getWhatsAppDeviceDetails(deviceId: string) {
  try {
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    const device = await verifyDeviceOwnership(deviceId, userId)
    
    // Get additional device info
    const status = await whatsappService.getDeviceStatus(deviceId)
    
    return {
      success: true,
      data: {
        ...device,
        status
      }
    }
    
  } catch (error) {
    console.error('Get device details error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get device details'
    }
  }
}

// ============================================================================
// DEVICE CONNECTION ACTIONS
// ============================================================================

/**
 * Connect WhatsApp device
 */
export async function connectWhatsAppDevice(input: z.infer<typeof connectDeviceSchema>) {
  try {
    // Validate input
    const validatedInput = connectDeviceSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Connect device using service
    const result = await whatsappService.connectDevice(validatedInput.deviceId)
    
    if (result.success) {
      return {
        success: true,
        message: 'Device connection initiated',
        data: {
          deviceId: validatedInput.deviceId,
          qrCode: result.qrCode,
          pairingCode: result.pairingCode
        }
      }
    } else {
      return {
        success: false,
        error: result.error || 'Failed to connect device'
      }
    }
    
  } catch (error) {
    console.error('Connect device error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect device'
    }
  }
}

/**
 * Disconnect WhatsApp device
 */
export async function disconnectWhatsAppDevice(input: z.infer<typeof connectDeviceSchema>) {
  try {
    // Validate input
    const validatedInput = connectDeviceSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Disconnect device using service
    const success = await whatsappService.disconnectDevice(validatedInput.deviceId)
    
    if (success) {
      return {
        success: true,
        message: 'Device disconnected successfully'
      }
    } else {
      return {
        success: false,
        error: 'Failed to disconnect device'
      }
    }
    
  } catch (error) {
    console.error('Disconnect device error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect device'
    }
  }
}

/**
 * Remove WhatsApp device
 */
export async function removeWhatsAppDevice(input: z.infer<typeof connectDeviceSchema>) {
  try {
    // Validate input
    const validatedInput = connectDeviceSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Remove device using service
    const success = await whatsappService.removeDevice(validatedInput.deviceId)
    
    if (success) {
      return {
        success: true,
        message: 'Device removed successfully'
      }
    } else {
      return {
        success: false,
        error: 'Failed to remove device'
      }
    }
    
  } catch (error) {
    console.error('Remove device error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove device'
    }
  }
}

// ============================================================================
// DEVICE PAIRING ACTIONS
// ============================================================================

/**
 * Generate QR code for device pairing
 */
export async function generateDeviceQRCode(input: z.infer<typeof generateQRCodeSchema>) {
  try {
    // Validate input
    const validatedInput = generateQRCodeSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Generate QR code using pairing manager
    const pairingData = await pairingManager.generateQRCode(validatedInput.deviceId)
    
    return {
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode: pairingData.qrCode,
        expiresAt: pairingData.expiresAt,
        isExpired: pairingData.isExpired
      }
    }
    
  } catch (error) {
    console.error('Generate QR code error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate QR code'
    }
  }
}

/**
 * Generate pairing code for device
 */
export async function generateDevicePairingCode(input: z.infer<typeof generatePairingCodeSchema>) {
  try {
    // Validate input
    const validatedInput = generatePairingCodeSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Generate pairing code using pairing manager
    const pairingData = await pairingManager.generatePairingCode(
      validatedInput.deviceId,
      validatedInput.phoneNumber
    )
    
    return {
      success: true,
      message: 'Pairing code generated successfully',
      data: {
        pairingCode: pairingData.pairingCode,
        expiresAt: pairingData.expiresAt,
        isExpired: pairingData.isExpired
      }
    }
    
  } catch (error) {
    console.error('Generate pairing code error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate pairing code'
    }
  }
}

/**
 * Validate pairing code
 */
export async function validateDevicePairingCode(input: z.infer<typeof validatePairingCodeSchema>) {
  try {
    // Validate input
    const validatedInput = validatePairingCodeSchema.parse(input)
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(validatedInput.deviceId, userId)
    
    // Validate pairing code using pairing manager
    const isValid = await pairingManager.validatePairingCode(
      validatedInput.deviceId,
      validatedInput.pairingCode
    )
    
    if (isValid) {
      return {
        success: true,
        message: 'Pairing code validated successfully'
      }
    } else {
      return {
        success: false,
        error: 'Invalid or expired pairing code'
      }
    }
    
  } catch (error) {
    console.error('Validate pairing code error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate pairing code'
    }
  }
}

/**
 * Get device pairing status
 */
export async function getDevicePairingStatus(deviceId: string) {
  try {
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(deviceId, userId)
    
    // Get pairing status using pairing manager
    const status = await pairingManager.getPairingStatus(deviceId)
    
    return {
      success: true,
      data: status
    }
    
  } catch (error) {
    console.error('Get pairing status error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pairing status'
    }
  }
}

/**
 * Cancel device pairing
 */
export async function cancelDevicePairing(deviceId: string) {
  try {
    // Get authenticated user
    const { userId } = await getAuthenticatedUser()
    
    // Verify device ownership
    await verifyDeviceOwnership(deviceId, userId)
    
    // Cancel pairing using pairing manager
    const success = await pairingManager.cancelPairing(deviceId)
    
    if (success) {
      return {
        success: true,
        message: 'Pairing cancelled successfully'
      }
    } else {
      return {
        success: false,
        error: 'Failed to cancel pairing'
      }
    }
    
  } catch (error) {
    console.error('Cancel pairing error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel pairing'
    }
  }
}
