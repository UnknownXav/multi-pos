import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // summary, collection, outstanding, consumption
    const billingPeriod = searchParams.get('billingPeriod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (type === 'summary') {
        const summary = await (prisma as any).waterBill.aggregate({
            where: {
                storeId,
                ...(billingPeriod && { reading: { billingPeriod } }),
            },
            _sum: {
                totalAmount: true,
                paidAmount: true,
                balance: true,
                consumption: true,
            },
            _count: { id: true },
        })
        return NextResponse.json({ success: true, data: summary })
    }

    if (type === 'collection') {
        const collections = await (prisma as any).waterPayment.findMany({
            where: {
                bill: { storeId },
                ...(startDate && endDate && {
                    paymentDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    }
                })
            },
            include: {
                bill: {
                    include: { consumer: { select: { name: true, accountNumber: true } } }
                }
            },
            orderBy: { paymentDate: 'desc' },
        })
        return NextResponse.json({ success: true, data: collections })
    }

    if (type === 'outstanding') {
        const outstanding = await (prisma as any).waterBill.findMany({
            where: {
                storeId,
                status: { in: ['Unpaid', 'Partially Paid', 'Overdue'] },
                balance: { gt: 0 },
            },
            include: {
                consumer: { select: { name: true, accountNumber: true, contactNumber: true } },
                reading: true,
            },
            orderBy: { dueDate: 'asc' },
        })
        return NextResponse.json({ success: true, data: outstanding })
    }

    if (type === 'consumption') {
        const consumption = await (prisma as any).meterReading.findMany({
            where: {
                consumer: { storeId },
                ...(billingPeriod && { billingPeriod }),
            },
            include: {
                consumer: { select: { name: true, accountNumber: true, connectionType: true } }
            },
            orderBy: { consumption: 'desc' },
        })
        return NextResponse.json({ success: true, data: consumption })
    }

    throw new ApiError('Invalid report type', 400)
})
