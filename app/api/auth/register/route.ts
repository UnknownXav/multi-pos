import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession } from '@/lib/auth'

/**
 * POST /api/auth/register
 * Register a new store owner account with business type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeName, ownerName, email, password, confirmPassword, businessType } = body

    // Validate input
    if (!storeName || !ownerName || !email || !password || !confirmPassword || !businessType) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Validate business type
    const validBusinessTypes = ['RETAIL', 'RESTAURANT', 'PHARMACY', 'GYM']
    if (!validBusinessTypes.includes(businessType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid business type' },
        { status: 400 }
      )
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
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
