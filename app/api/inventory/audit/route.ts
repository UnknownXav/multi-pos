import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/audit
 * Fetch stock adjustment logs for a store
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const storeId = searchParams.get('storeId')

        if (!storeId) {
            return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 })
        }

        const logs = await (prisma as any).stockAdjustment.findMany({
            where: {
                product: { storeId: parseInt(storeId) }
            },
            include: {
                product: { select: { name: true } },
                batch: { select: { batchNumber: true } },
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        return NextResponse.json({ success: true, data: logs })
    } catch (error) {
        console.error('Audit Log Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 })
    }
}

/**
 * DELETE /api/inventory/audit
 * Delete a specific audit log entry
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'Log ID required' }, { status: 400 })
        }

        await (prisma as any).stockAdjustment.delete({
            where: { id: parseInt(id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete Audit Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete audit log' }, { status: 500 })
    }
}
