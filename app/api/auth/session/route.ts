import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const sessionData = await verifySession(token)
    if (!sessionData) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
      user,
      success: true
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({
      user: null,
      success: false,
      message: 'Failed to verify session'
    }, { status: 401 })
  }
}
