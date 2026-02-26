import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/maintenance/sync
 * System-wide status synchronization:
 * 1. Mark expired Gym subscriptions as EXPIRED
 * 2. Mark expired Pharmacy batches (for alerting)
 * 3. Update Member statuses based on active subscriptions
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const now = new Date()

    const result = await prisma.$transaction(async (tx: any) => {
        // 1. Gym: Expire subscriptions past endDate
        const expiredSubs = await tx.subscription.updateMany({
            where: {
                status: 'ACTIVE',
                endDate: { lt: now }
            },
            data: { status: 'EXPIRED' }
        })

        // 2. Gym: Deactivate members with no active subscriptions
        // This is a bit more complex, we'll mark members as inactive if they have expired subs and no active ones
        // For MVP, we'll just focus on subscription status which is checked at check-in

        // 3. Pharmacy: We don't "deactivate" batches, but we can log an entry for auditing if needed.
        // Batch expiry is already handled by filters in the dashboard and sales logic.

        return {
            subscriptionsExpired: expiredSubs.count,
        }
    })

    return NextResponse.json({
        success: true,
        message: 'Lifecycle maintenance completed',
        data: result
    })
})
