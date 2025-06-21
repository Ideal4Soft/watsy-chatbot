/**
 * Token Validation API Route
 * 
 * This endpoint validates the refresh token and returns the authentication status.
 * Used by middleware to check if a user is actually authenticated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'No refresh token found' 
      }, { status: 401 })
    }

    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken)
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'Invalid refresh token' 
      }, { status: 401 })
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: payload.userId 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'User not found or inactive' 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      isAuthenticated: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({ 
      isAuthenticated: false, 
      error: 'Token validation failed' 
    }, { status: 401 })
  }
}
