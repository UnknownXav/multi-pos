import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id: idParam } = await params
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const id = parseInt(idParam)

    const consumer = await prisma.consumer.findFirst({
        where: { id, storeId },
        include: {
            readings: {
                orderBy: { readingDate: 'desc' },
                take: 12,
            },
            bills: {
                orderBy: { createdAt: 'desc' },
                take: 12,
            },
        },
    })

    if (!consumer) {
        throw new ApiError('Consumer not found', 404)
    }

    return NextResponse.json({ success: true, data: consumer })
})

export const PATCH = apiHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id: idParam } = await params
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const id = parseInt(idParam)
    const body = await request.json()

    // Enforce storeId check in where clause to prevent cross-tenant updates
    const consumer = await prisma.consumer.updateMany({
        where: { id, storeId },
        data: {
            ...body,
            id: undefined,
            storeId: undefined,
        },
    })

    if (consumer.count === 0) {
        throw new ApiError('Consumer not found or unauthorized', 404)
    }

    return NextResponse.json({ success: true, message: 'Consumer updated successfully' })
})

export const DELETE = apiHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id: idParam } = await params
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)
    const id = parseInt(idParam)

    // Delete the consumer - Cascade will handle readings and bills
    const result = await prisma.consumer.deleteMany({
        where: { id, storeId }
    })

    if (result.count === 0) {
        throw new ApiError('Consumer not found or unauthorized', 404)
    }

    return NextResponse.json({ success: true, message: 'Consumer deleted successfully' })
})
