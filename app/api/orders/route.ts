import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/orders
 * Fetch active orders for a store
 */
export async function GET(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)
        const tableId = request.nextUrl.searchParams.get('tableId')

        const where: any = {
            storeId,
            status: { not: 'PAID' } // Fetch active orders (OPEN, IN_PROGRESS, READY, BILLING)
        }
        if (tableId) where.tableId = parseInt(tableId)

        const orders = await prisma.sale.findMany({
            where,
            include: {
                table: true,
                items: { include: { product: true } },
                cashier: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: orders })
    } catch (error) {
        console.error('GET /api/orders error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
    }
}

/**
 * POST /api/orders
 * Create a new OPEN order for a table
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
        const cashierId = parseInt(sessionUserId)

        const body = await request.json()
        const { tableId } = body

        if (!tableId) {
            return NextResponse.json({ success: false, error: 'Table ID is required' }, { status: 400 })
        }

        // ✅ SECURITY: Check if table belongs to THIS store
        const table = await prisma.restaurantTable.findUnique({ where: { id: parseInt(tableId) } })
        if (!table || table.storeId !== storeId) {
            return NextResponse.json({ success: false, error: 'Table not found or unauthorized' }, { status: 404 })
        }

        if (table.status === 'OCCUPIED') {
            return NextResponse.json({ success: false, error: 'Table is already occupied' }, { status: 409 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Sale (Order) in OPEN status
            const order = await tx.sale.create({
                data: {
                    storeId,
                    tableId: parseInt(tableId),
                    cashierId,
                    total: 0,
                    status: 'OPEN'
                }
            })

            // 2. Set table to OCCUPIED
            await tx.restaurantTable.update({
                where: { id: parseInt(tableId) },
                data: { status: 'OCCUPIED' }
            })

            return order
        })

        return NextResponse.json({ success: true, data: result }, { status: 201 })
    } catch (error) {
        console.error('POST /api/orders error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
    }
}

/**
 * PATCH /api/orders
 * Update order items or status
 */
export async function PATCH(request: NextRequest) {
    try {
        // ✅ SECURITY: Use session-verified storeId
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        const body = await request.json()
        const { orderId, status, items } = body // items: [{productId, quantity, price, notes}]

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
        }

        // ✅ SECURITY: Verify order belongs to THIS store
        const targetOrder = await prisma.sale.findUnique({
            where: { id: parseInt(orderId) }
        })

        if (!targetOrder || targetOrder.storeId !== storeId) {
            return NextResponse.json({ success: false, error: 'Order not found or unauthorized' }, { status: 404 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update status if provided
            if (status) {
                await tx.sale.update({
                    where: { id: parseInt(orderId) },
                    data: { status }
                })

                // If status is PAID, release the table
                if (status === 'PAID') {
                    if (targetOrder.tableId) {
                        await tx.restaurantTable.update({
                            where: { id: targetOrder.tableId },
                            data: { status: 'AVAILABLE' }
                        })
                    }
                }
            }

            // 2. Add/Update items if provided
            if (items && Array.isArray(items)) {
                let newTotal = 0
                for (const item of items) {
                    // ✅ SECURITY: Verify product belongs to THIS store
                    const product = await tx.product.findUnique({
                        where: { id: item.productId }
                    })
                    if (!product || product.storeId !== storeId) {
                        throw new Error(`Unauthorized item: ${item.productId}`)
                    }

                    await tx.saleItem.create({
                        data: {
                            saleId: parseInt(orderId),
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            notes: item.notes
                        }
                    })
                    newTotal += item.price * item.quantity
                }

                // Update total
                await tx.sale.update({
                    where: { id: parseInt(orderId) },
                    data: { total: { increment: newTotal } }
                })
            }

            return await tx.sale.findUnique({
                where: { id: parseInt(orderId) },
                include: { items: { include: { product: true } } }
            })
        })

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('PATCH /api/orders error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
    }
}
