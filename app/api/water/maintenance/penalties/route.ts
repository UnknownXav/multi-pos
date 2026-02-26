import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * Maintenance endpoint to apply penalties to overdue bills.
 * Should be called daily via a cron job or manual trigger.
 */
export async function POST(request: NextRequest) {
    try {
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        // These could eventually come from store-specific configuration
        const penaltyType = 'Fixed'
        const penaltyValue = 50

        const today = new Date()

        // 1. Mark bills as 'Overdue' if due date passed (even if no penalty applied yet)
        await (prisma as any).waterBill.updateMany({
            where: {
                storeId,
                status: 'Unpaid',
                dueDate: { lt: today },
            },
            data: {
                status: 'Overdue'
            }
        })

        // 2. Find bills that need penalties (Overdue and no penalty record)
        const overdueBills = await (prisma as any).waterBill.findMany({
            where: {
                storeId,
                status: { in: ['Unpaid', 'Partially Paid', 'Overdue'] },
                dueDate: { lt: today },
                penaltyRecord: null,
            }
        })

        if (overdueBills.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending penalties to apply', count: 0 })
        }

        const results = await (prisma as any).$transaction(async (tx: any) => {
            const processed = []
            for (const bill of overdueBills) {
                let penaltyAmount = 0
                if (penaltyType === 'Fixed') {
                    penaltyAmount = penaltyValue
                } else {
                    penaltyAmount = bill.totalAmount * penaltyValue
                }

                // Create penalty record
                await tx.waterPenalty.create({
                    data: {
                        billId: bill.id,
                        amount: penaltyAmount,
                        type: penaltyType,
                    }
                })

                // Update bill totals
                const updatedBill = await tx.waterBill.update({
                    where: { id: bill.id },
                    data: {
                        penaltyAmount: { increment: penaltyAmount },
                        totalAmount: { increment: penaltyAmount },
                        balance: { increment: penaltyAmount },
                        status: 'Overdue',
                    }
                })
                processed.push(updatedBill.id)
            }
            return processed
        })

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${results.length} penalties.`,
            count: results.length
        })
    } catch (error) {
        console.error('POST /api/water/maintenance/penalties error:', error)
        return NextResponse.json({ success: false, error: 'Failed to apply penalties' }, { status: 500 })
    }
}
