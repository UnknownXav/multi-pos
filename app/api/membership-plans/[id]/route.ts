import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/membership-plans/[id]
 * Delete a membership plan
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)

        // ✅ SECURITY: Enforce session ownership
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId || isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Unauthorized or invalid ID' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        // Verify ownership and check subscriptions
        const plan = await prisma.membershipPlan.findFirst({
            where: { id, storeId },
            include: { _count: { select: { subscriptions: true } } }
        })

        if (!plan) {
            return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
        }

        if (plan._count.subscriptions > 0) {
            return NextResponse.json({
                success: false,
                error: 'Cannot delete plan: This plan has active or past subscriptions. Consider archiving instead.'
            }, { status: 400 })
        }

        await prisma.membershipPlan.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Plan deleted' })
    } catch (error) {
        console.error('DELETE /api/membership-plans/[id] error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete plan' }, { status: 500 })
    }
}
