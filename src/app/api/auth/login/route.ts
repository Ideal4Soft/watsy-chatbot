/**
 * Login API Route
 * 
 * This endpoint handles user authentication and returns JWT tokens.
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/app/actions/auth'
import { loginSchema } from '@/schemas'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validatedInput = loginSchema.parse(body)
    
    // Call the login server action
    const result = await loginUser(validatedInput)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        message: 'Login successful'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Login failed'
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Login API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
