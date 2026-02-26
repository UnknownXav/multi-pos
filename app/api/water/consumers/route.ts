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
    const query = searchParams.get('q')

    const consumers = await (prisma as any).consumer.findMany({
        where: {
            storeId,
            ...(query && {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { accountNumber: { contains: query, mode: 'insensitive' } },
                    { meterNumber: { contains: query, mode: 'insensitive' } },
                ],
            }),
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: consumers })
})

export const POST = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const body = await request.json()
    const { accountNumber, name, address, contactNumber, meterNumber, connectionType, initialReading } = body

    if (!accountNumber || !name || !address) {
        throw new ApiError('Missing required fields', 400)
    }

    try {
        const consumer = await (prisma as any).consumer.create({
            data: {
                storeId,
                accountNumber,
                name,
                address,
                contactNumber,
                meterNumber,
                connectionType: connectionType || 'Residential',
                initialReading: parseFloat(initialReading) || 0,
            },
        })

        return NextResponse.json({ success: true, data: consumer }, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ApiError('Account number already exists', 409)
        }
        throw error // Let apiHandler handle unknown db errors securely
    }
})
