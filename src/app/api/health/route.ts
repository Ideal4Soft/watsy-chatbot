/**
 * Health Check API Route
 * 
 * Provides system health information including database connectivity,
 * Redis status, and basic system metrics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, checkDatabaseHealth, getDatabaseInfo } from '@/lib/prisma'
import { createClient } from 'redis'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Test database connection
    const dbHealth = await checkDatabaseHealth()
    const dbInfo = await getDatabaseInfo()
    
    // Test Redis connection
    let redisHealth = false
    let redisInfo = null
    
    try {
      const redis = createClient({
        url: process.env.REDIS_URL
      })
      
      await redis.connect()
      const redisPing = await redis.ping()
      await redis.disconnect()
      
      redisHealth = redisPing === 'PONG'
      redisInfo = {
        connected: true,
        response: redisPing,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      redisInfo = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
    
    // Get basic system info
    const responseTime = Date.now() - startTime
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()
    
    // Get database statistics
    let dbStats = null
    if (dbHealth) {
      try {
        const userCount = await prisma.user.count()
        const deviceCount = await prisma.whatsAppDevice.count()
        const messageCount = await prisma.message.count()
        
        dbStats = {
          users: userCount,
          devices: deviceCount,
          messages: messageCount
        }
      } catch (error) {
        dbStats = { error: 'Failed to fetch statistics' }
      }
    }
    
    const healthData = {
      status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: `${Math.floor(uptime)}s`,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          ...dbInfo,
          statistics: dbStats
        },
        redis: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          ...redisInfo
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        }
      }
    }
    
    return NextResponse.json(healthData, {
      status: dbHealth && redisHealth ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: { status: 'unknown' },
          redis: { status: 'unknown' }
        }
      },
      { status: 500 }
    )
  }
}
