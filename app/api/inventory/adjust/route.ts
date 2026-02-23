import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/inventory/adjust
 * Perform a manual stock adjustment
 */
export async function POST(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId and userId
        const sessionStoreId = request.headers.get('X-Store-ID')
        const sessionUserId = request.headers.get('X-User-ID')

        if (!sessionStoreId || !sessionUserId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const storeId = parseInt(sessionStoreId)
        const userId = parseInt(sessionUserId)
        const body = await request.json()
        const { productId, batchId, quantity, type, reason } = body

        if (!productId || !quantity || !type) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // ✅ SECURITY: Verify product belongs to THIS store
        const targetProduct = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!targetProduct || targetProduct.storeId !== storeId) {
            return NextResponse.json({ success: false, error: 'Product not found or unauthorized' }, { status: 404 })
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create Audit Log
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    productId,
                    batchId,
                    userId,
                    type, // "IN", "OUT", "DAMAGE", "RETURN", "EXPIRY", "CORRECTION"
                    quantity,
                    reason
                }
            })

            // 2. Adjust Product Stock
            // If type is IN or RETURN, we increment. If OUT, DAMAGE, EXPIRY, we decrement.
            const isIncrement = ["IN", "RETURN", "CORRECTION_POSITIVE"].includes(type)
            const change = isIncrement ? Math.abs(quantity) : -Math.abs(quantity)

            await tx.product.update({
                where: { id: productId },
                data: { stock: { increment: change } }
            })

            // 3. Adjust Batch Stock if provided
            if (batchId) {
                // ✅ SECURITY: Verify batch belongs to this product (implicit via Prisma schema usually, but let's be safe)
                await tx.batch.update({
                    where: { id: batchId, productId },
                    data: { quantity: { increment: change } }
                })
            }

            return adjustment
        })

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('Inventory Adjustment Error:', error)
        return NextResponse.json({ success: false, error: 'Adjustment failed' }, { status: 500 })
    }
}
