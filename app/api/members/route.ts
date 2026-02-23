import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/members
 * Fetch members for a store
 */
export async function GET(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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
    } catch (error) {
        console.error('GET /api/members error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 })
    }
}

/**
 * POST /api/members
 * Register a member and activate a subscription
 */
export async function POST(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        const body = await request.json()
        const { name, email, phone, barcode, planId } = body

        if (!name || !planId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // ✅ SECURITY: Verify plan belongs to THIS store
        const plan = await prisma.membershipPlan.findUnique({
            where: { id: planId }
        })
        if (!plan || plan.storeId !== storeId) {
            return NextResponse.json({ success: false, error: 'Plan not found or unauthorized' }, { status: 404 })
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
    } catch (error) {
        console.error('POST /api/members error:', error)
        return NextResponse.json({ success: false, error: 'Failed to register member' }, { status: 500 })
    }
}
