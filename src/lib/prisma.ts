/**
 * Prisma Client Configuration for Watsy-Chatbot Platform
 * 
 * This module provides a singleton Prisma client instance with proper
 * connection management for both development and production environments.
 */

import { PrismaClient } from '../generated/prisma'

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma client instance
 * 
 * In development, we use a global variable to prevent multiple instances
 * due to hot reloading. In production, we create a new instance.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

// Store the instance globally in development to prevent multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Graceful shutdown handler for Prisma client
 * 
 * This function should be called when the application is shutting down
 * to properly close database connections.
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

/**
 * Database health check
 * 
 * Performs a simple query to verify database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Database connection info
 * 
 * Returns basic information about the database connection
 */
export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    return {
      connected: true,
      version: result[0]?.version || 'Unknown',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Export types for use throughout the application
export type {
  User,
  Subscription,
  WhatsAppDevice,
  Message,
  Contact,
  Chatbot,
  ChatbotTrigger,
  MessageTemplate,
  ApiKey,
  Webhook,
  WebhookDelivery,
  Analytics,
  SystemSettings,
  AuditLog,
  MediaFile,
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
  WhatsAppDeviceStatus,
  MessageType,
  MessageDirection,
  MessageStatus,
  ChatbotTriggerType,
  ApiKeyStatus,
  WebhookEventType,
} from '../generated/prisma'
