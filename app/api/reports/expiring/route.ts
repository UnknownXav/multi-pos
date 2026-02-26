import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError, requireRole } from '@/lib/api-utils'

/**
 * GET /api/reports/expiring
 * Fetch batches nearing expiration for a specific store
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // ✅ SECURITY: Use server-injected store ID from JWT session
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }

    // Require Owner or Admin role for sensitive reports
    requireRole(request, ['owner', 'admin'])

    const sId = parseInt(sessionStoreId)
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const now = new Date()
    const limitDate = new Date()
    limitDate.setDate(now.getDate() + days)

    // Fetch batches with their associated product
    const expiringBatches = await prisma.batch.findMany({
        where: {
            product: {
                storeId: sId,
                isArchived: false,
            },
            quantity: {
                gt: 0,
            },
            expiryDate: {
                gte: now,
                lte: limitDate,
            },
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    barcode: true,
                    genericName: true,
                },
            },
        },
        orderBy: {
            expiryDate: 'asc',
        },
    })

    return NextResponse.json({
        success: true,
        data: expiringBatches,
    })
})
