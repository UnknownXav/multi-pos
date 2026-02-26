import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { calculateTieredAmount } from '@/lib/water-billing'

import { apiHandler, ApiError } from '@/lib/api-utils'

export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const searchParams = request.nextUrl.searchParams
    const consumerId = searchParams.get('consumerId')
    const billingPeriod = searchParams.get('billingPeriod')

    const readings = await (prisma as any).meterReading.findMany({
        where: {
            consumer: { storeId }, // Ensure we only get readings for this store's consumers
            ...(consumerId && { consumerId: parseInt(consumerId) }),
            ...(billingPeriod && { billingPeriod }),
        },
        include: {
            consumer: {
                select: { name: true, accountNumber: true }
            },
            bill: true
        },
        orderBy: { readingDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: readings })
})

export const POST = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const body = await request.json()
    const {
        consumerId,
        billingPeriod,
        currentReading,
        readingDate,
        environmentalFee = 0,
        serviceCharge = 0
    } = body

    if (!consumerId || !billingPeriod || currentReading === undefined) {
        throw new ApiError('Missing required fields', 400)
    }

    // Use a transaction to ensure reading and bill are created together
    const result = await (prisma as any).$transaction(async (tx: any) => {
        // 1. Verify consumer and get previous reading
        const consumer = await tx.consumer.findFirst({
            where: { id: parseInt(consumerId), storeId },
            include: {
                readings: {
                    orderBy: { readingDate: 'desc' },
                    take: 1,
                }
            }
        })

        if (!consumer) {
            throw new ApiError('Consumer not found', 404)
        }

        // Check for existing reading in this period
        const existingReading = await tx.meterReading.findUnique({
            where: { consumerId_billingPeriod: { consumerId: parseInt(consumerId), billingPeriod } }
        })
        if (existingReading) {
            throw new ApiError('Reading for this period already exists', 409)
        }

        const previousReading = consumer.readings[0]?.currentReading || consumer.initialReading
        const consumption = parseFloat(currentReading) - previousReading

        if (consumption < 0) {
            throw new ApiError('Current reading cannot be less than previous reading', 400)
        }

        // 2. Get active rate version
        const rateVersion = await tx.rateVersion.findFirst({
            where: { storeId, isActive: true },
            include: { tiers: true }
        })

        if (!rateVersion) {
            throw new ApiError('No active rate configuration found for this store', 400)
        }

        // 3. Calculate amount
        const amountDue = calculateTieredAmount(consumption, rateVersion.tiers as any)
        const totalAmount = amountDue + parseFloat(environmentalFee) + parseFloat(serviceCharge)

        // 4. Create reading
        const reading = await tx.meterReading.create({
            data: {
                consumerId: parseInt(consumerId),
                billingPeriod,
                previousReading,
                currentReading: parseFloat(currentReading),
                consumption,
                readingDate: readingDate ? new Date(readingDate) : new Date(),
            },
        })

        // 5. Create bill
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15) // Default 15 days due date

        const bill = await tx.waterBill.create({
            data: {
                storeId,
                consumerId: consumer.id,
                readingId: reading.id,
                rateVersionId: rateVersion.id,
                consumption,
                amountDue,
                environmentalFee: parseFloat(environmentalFee),
                serviceCharge: parseFloat(serviceCharge),
                totalAmount,
                balance: totalAmount, // Initial balance is total amount
                dueDate,
                status: 'Unpaid',
            }
        })

        return { reading, bill }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
})
