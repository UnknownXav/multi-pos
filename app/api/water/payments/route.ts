import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

import { apiHandler, ApiError } from '@/lib/api-utils'

export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const searchParams = request.nextUrl.searchParams
    const consumerId = searchParams.get('consumerId')
    const billId = searchParams.get('billId')

    const payments = await (prisma as any).waterPayment.findMany({
        where: {
            bill: {
                storeId,
                ...(consumerId && { consumerId: parseInt(consumerId) }),
                ...(billId && { id: parseInt(billId) }),
            }
        },
        include: {
            bill: {
                include: {
                    consumer: { select: { name: true, accountNumber: true } }
                }
            }
        },
        orderBy: { paymentDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: payments })
})

export const POST = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const body = await request.json()
    const { billId, amount, paymentMethod, referenceNumber } = body

    if (!billId || amount === undefined) {
        throw new ApiError('Missing required fields', 400)
    }

    const payAmount = parseFloat(amount)

    // Use transaction to update bill and create payment record
    const result = await (prisma as any).$transaction(async (tx: any) => {
        // 1. Find bill and verify store ownership
        const bill = await tx.waterBill.findFirst({
            where: { id: parseInt(billId), storeId },
        })

        if (!bill) {
            throw new ApiError('Bill not found', 404)
        }

        if (bill.status === 'Paid') {
            throw new ApiError('Bill is already fully paid', 400)
        }

        const newPaidAmount = bill.paidAmount + payAmount
        const newBalance = Math.max(0, bill.totalAmount - newPaidAmount)
        const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid'

        // 2. Update bill
        const updatedBill = await tx.waterBill.update({
            where: { id: bill.id },
            data: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            }
        })

        // 3. Create payment record
        const payment = await tx.waterPayment.create({
            data: {
                billId: bill.id,
                amount: payAmount,
                paymentMethod: paymentMethod || 'Cash',
                referenceNumber,
            }
        })

        return { bill: updatedBill, payment }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
})
