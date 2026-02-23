import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/reports/expiring
 * Fetch batches nearing expiration for a specific store
 */
export async function GET(request: NextRequest) {
    try {
        // ✅ SECURITY: Use server-injected store ID from JWT session
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
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
    } catch (error) {
        console.error('GET /api/reports/expiring error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch expiring products' },
            { status: 500 }
        )
    }
}
