import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'

import { apiHandler, ApiError } from '@/lib/api-utils'

/**
 * GET /api/auth/register
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

/**
 * POST /api/auth/register
 * Register a new store owner account with business type
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { storeName, ownerName, email, password, confirmPassword, businessType } = body

  // Validate input
  if (!storeName || !ownerName || !email || !password || !confirmPassword || !businessType) {
    throw new ApiError('All fields are required', 400)
  }

  if (password !== confirmPassword) {
    throw new ApiError('Passwords do not match', 400)
  }

  if (password.length < 6) {
    throw new ApiError('Password must be at least 6 characters', 400)
  }

  if (!email.includes('@')) {
    throw new ApiError('Please enter a valid email address', 400)
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ApiError('Email already registered', 409)
  }

  // Validate business type
  const validBusinessTypes = ['RETAIL', 'RESTAURANT', 'PHARMACY', 'GYM', 'WATER_BILLING']
  if (!validBusinessTypes.includes(businessType)) {
    throw new ApiError('Invalid business type', 400)
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create transaction: User + Store
  const result = await prisma.$transaction(async (tx: any) => {
    // Create store owner user
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name: ownerName,
        role: 'owner',
      },
    })

    // Create store
    const store = await tx.store.create({
      data: {
        name: storeName,
        businessType: businessType as any,
        ownerId: user.id,
      },
    })

    // Update user with store reference
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        storeId: store.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        store: {
          select: {
            id: true,
            name: true,
            businessType: true,
          },
        },
      },
    })

    return updatedUser
  })

  // Auto-login: Create session token with storeId embedded for tenant isolation
  const sessionToken = await createSession(result.id, result.role, result.store?.id ?? null)

  const response = NextResponse.json(
    {
      success: true,
      message: 'Store created successfully.',
      data: result,
    },
    { status: 201 }
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
