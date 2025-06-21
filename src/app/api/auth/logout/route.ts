/**
 * Logout API Route
 * 
 * This endpoint handles user logout and clears authentication cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    // Call the logout server action
    const result = await logoutUser()
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
    
  } catch (error) {
    console.error('Logout API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during logout'
    }, { status: 500 })
  }
}
