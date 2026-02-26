import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

import { apiHandler, ApiError, requireRole } from '@/lib/api-utils'

export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }
    const storeId = parseInt(sessionStoreId)

    const rateVersions = await (prisma as any).rateVersion.findMany({
        where: { storeId },
        include: {
            tiers: {
                orderBy: { fromCubicMeters: 'asc' }
            }
        },
        orderBy: { effectiveDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: rateVersions })
})

export const POST = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }

    // Require Owner or Admin role for rate modification
    requireRole(request, ['owner', 'admin'])

    const storeId = parseInt(sessionStoreId)
    const body = await request.json()
    const { name, effectiveDate, tiers } = body

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
        throw new ApiError('At least one tier is required', 400)
    }

    // Use transaction to ensure atomic update of active status and new version creation
    const result = await (prisma as any).$transaction(async (tx: any) => {
        // 1. Deactivate old versions
        await tx.rateVersion.updateMany({
            where: { storeId, isActive: true },
            data: { isActive: false }
        })

        // 2. Create new version with tiers
        return await tx.rateVersion.create({
            data: {
                storeId,
                name,
                effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
                isActive: true,
                tiers: {
                    create: tiers.map((t: any) => ({
                        fromCubicMeters: parseFloat(t.fromCubicMeters),
                        toCubicMeters: t.toCubicMeters ? parseFloat(t.toCubicMeters) : null,
                        rate: parseFloat(t.rate),
                        isMinimum: t.isMinimum || false,
                    }))
                }
            },
            include: { tiers: true }
        })
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
})
