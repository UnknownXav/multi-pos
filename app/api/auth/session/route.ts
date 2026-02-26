import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/session
 * Verify session token and return user data.
 * Wrapped in apiHandler for centralized error logging.
 */
export async function GET(request: NextRequest) {
  return apiHandler(async (req: NextRequest) => {
    const token = req.cookies.get('session')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new ApiError('Unauthorized', 401)
    }

    const sessionData = await verifySession(token)
    if (!sessionData) {
      throw new ApiError('Unauthorized', 401)
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      throw new ApiError('User not found', 404)
    }

    return NextResponse.json({
      user,
      success: true
    })
  })(request)
}
