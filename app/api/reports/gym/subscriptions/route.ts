import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/reports/gym/subscriptions
 * Fetch recent subscriptions for the summary table
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get('storeId')

        if (!storeId) {
            return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 })
        }

        const subscriptions = await prisma.subscription.findMany({
            where: {
                member: {
                    storeId: parseInt(storeId)
                }
            },
            include: {
                member: true,
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        })

        return NextResponse.json({ success: true, data: subscriptions })
    } catch (error) {
        console.error('Gym Subscription Report Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 })
    }
}
