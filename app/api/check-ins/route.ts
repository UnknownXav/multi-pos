import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/check-ins
 * Process a member check-in with status verification
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
        const { identifier } = body // identifier can be barcode or id

        if (!identifier) {
            return NextResponse.json({ success: false, error: 'Identifier required' }, { status: 400 })
        }

        // 1. Find Member (enforcing storeId)
        const member = await prisma.member.findFirst({
            where: {
                storeId,
                OR: [
                    { barcode: identifier },
                    { id: isNaN(parseInt(identifier)) ? -1 : parseInt(identifier) }
                ]
            },
            include: {
                subscriptions: {
                    orderBy: { endDate: 'desc' },
                    take: 1,
                    include: { plan: true }
                }
            }
        })

        if (!member) {
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
        }

        // 2. Verify Subscription Status
        const sub = member.subscriptions[0]
        const now = new Date()

        if (!sub) {
            return NextResponse.json({ success: false, error: 'No subscription found for this member' }, { status: 403 })
        }

        const isExpired = sub.endDate < now
        if (sub.status !== 'ACTIVE' || isExpired) {
            // Update status if it was active but expired
            if (sub.status === 'ACTIVE' && isExpired) {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: 'EXPIRED' }
                })
            }
            return NextResponse.json({
                success: false,
                error: 'Subscription expired or inactive',
                member: { name: member.name, plan: sub.plan.name, expiry: sub.endDate }
            }, { status: 403 })
        }

        // 3. Create Check-in
        const checkIn = await prisma.checkIn.create({
            data: {
                memberId: member.id
            }
        })

        return NextResponse.json({
            success: true,
            message: `Welcome back, ${member.name}!`,
            data: { member, checkIn }
        })
    } catch (error) {
        console.error('POST /api/check-ins error:', error)
        return NextResponse.json({ success: false, error: 'Check-in failed' }, { status: 500 })
    }
}
