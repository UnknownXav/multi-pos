export const dynamic = 'force-dynamic'
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'

import { apiHandler, ApiError } from '@/lib/api-utils'

/**
 * GET /api/auth/login
 * Prevent static optimization
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

/**
 * POST /api/auth/login
 * Authenticate cashier with email and password
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    throw new ApiError('Email and password required', 400)
  }

  // Find user by email with store information
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      storeId: true,
      store: {
        select: {
          id: true,
          name: true,
          businessType: true,
        },
      },
    },
  })

  if (!user) {
    throw new ApiError('Invalid email or password', 401)
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError('Invalid email or password', 401)
  }

  // Create session token — storeId is embedded for server-side tenant isolation
  const sessionToken = await createSession(user.id, user.role, user.storeId)

  // Return user info with store data and session token
  const response = NextResponse.json(
    {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        store: user.store,
        session: sessionToken,
      },
    },
    { status: 200 }
  )

  // Set session cookie
  response.cookies.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 24 hours
    path: '/',
  })

  return response
})
