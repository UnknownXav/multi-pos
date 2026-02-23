import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/membership-plans
 * Fetch all plans for a store
 */
export async function GET(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        const plans = await prisma.membershipPlan.findMany({
            where: { storeId },
            orderBy: { price: 'asc' }
        })

        return NextResponse.json({ success: true, data: plans })
    } catch (error) {
        console.error('GET /api/membership-plans error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 })
    }
}

/**
 * POST /api/membership-plans
 * Create a new plan
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
        const { name, durationDays, price, description } = body

        if (!name || !durationDays || price === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
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
    } catch (error) {
        console.error('POST /api/membership-plans error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 })
    }
}
