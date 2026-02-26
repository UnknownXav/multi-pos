import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError, requireRole } from '@/lib/api-utils'

/**
 * GET /api/reports/gym/subscriptions
 * Fetch recent subscriptions for the summary table
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }

    // Require Owner or Admin role for reports
    requireRole(request, ['owner', 'admin'])

    const storeId = parseInt(sessionStoreId)

    const subscriptions = await prisma.subscription.findMany({
        where: {
            member: {
                storeId: storeId
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
})
