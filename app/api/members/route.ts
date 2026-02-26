import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/members
 * Fetch members for a store
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    const where: any = { storeId }
    if (query) {
        where.OR = [
            { name: { contains: query } },
            { phone: { contains: query } },
            { barcode: { contains: query } }
        ]
    }

    const members = await prisma.member.findMany({
        where,
        include: {
            subscriptions: {
                orderBy: { endDate: 'desc' },
                take: 1,
                include: { plan: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: members })
})

/**
 * POST /api/members
 * Register a member and activate a subscription
 */
export const POST = apiHandler(async (request: NextRequest) => {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const body = await request.json()
    const { name, email, phone, barcode, planId } = body

    if (!name || !planId) {
        throw new ApiError('Missing required fields', 400)
    }

    // ✅ SECURITY: Verify plan belongs to THIS store
    const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId }
    })
    if (!plan || plan.storeId !== storeId) {
        throw new ApiError('Plan not found or unauthorized', 404)
    }

    const result = await prisma.$transaction(async (tx: any) => {
        // 1. Create Member
        const member = await tx.member.create({
            data: {
                storeId,
                name,
                email,
                phone,
                barcode
            }
        })

        // 2. Calculate Dates
        const startDate = body.startDate ? new Date(body.startDate) : new Date()
        const duration = body.durationDays ? parseInt(body.durationDays) : plan.durationDays

        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + duration)

        // 3. Create Subscription
        const subscription = await tx.subscription.create({
            data: {
                memberId: member.id,
                planId: plan.id,
                startDate,
                endDate,
                status: 'active'
            }
        })

        return { member, subscription }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
})
