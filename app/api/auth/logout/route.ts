import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clear session cookie and logout user
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // This immediately expires the cookie
      path: '/',
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}
