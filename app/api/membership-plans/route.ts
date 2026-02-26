import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/membership-plans
 * Fetch all plans for a store
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const plans = await prisma.membershipPlan.findMany({
        where: { storeId },
        orderBy: { price: 'asc' }
    })

    return NextResponse.json({ success: true, data: plans })
})

/**
 * POST /api/membership-plans
 * Create a new plan
 */
export const POST = apiHandler(async (request: NextRequest) => {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const body = await request.json()
    const { name, durationDays, price, description } = body

    if (!name || !durationDays || price === undefined) {
        throw new ApiError('Missing required fields', 400)
    }

    const plan = await prisma.membershipPlan.create({
        data: {
            storeId,
            name,
            durationDays: parseInt(durationDays),
            price: parseFloat(price),
            description
        }
    })

    return NextResponse.json({ success: true, data: plan }, { status: 201 })
})
