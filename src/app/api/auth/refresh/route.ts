/**
 * Refresh Token API Route
 * 
 * This endpoint handles access token refresh using the refresh token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    // Call the refresh token server action
    const result = await refreshAccessToken()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        message: 'Token refresh successful'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Token refresh failed'
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Refresh token API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during token refresh'
    }, { status: 500 })
  }
}
