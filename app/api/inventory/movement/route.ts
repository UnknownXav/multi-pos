import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/movement
 * Fetch stock adjustment history for a specific store
 */
export async function GET(request: NextRequest) {
    try {
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '50')

        const adjustments = await prisma.stockAdjustment.findMany({
            where: { product: { storeId } },
            include: {
                product: { select: { name: true } },
                user: { select: { name: true } },
                batch: { select: { batchNumber: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json({ success: true, data: adjustments })
    } catch (error) {
        console.error('GET /api/inventory/movement error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch movement' }, { status: 500 })
    }
}
