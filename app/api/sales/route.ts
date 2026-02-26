import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales
 * Fetch sales records with optional date filtering
 */
export const GET = apiHandler(async (request: NextRequest) => {
  // ✅ SECURITY: Use server-injected store ID from JWT session
  const sessionStoreId = request.headers.get('X-Store-ID')
  if (!sessionStoreId) {
    throw new ApiError('Unauthorized', 401)
  }
  const storeId = parseInt(sessionStoreId)

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = { storeId }
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ success: true, data: sales }, { status: 200 })
})

/**
 * POST /api/sales
 * Create a new sale with items (transaction)
 * Body: { cashierId: number, items: [{productId, quantity, price}] }
 */
export const POST = apiHandler(async (request: NextRequest) => {
  // ✅ SECURITY: Use server-injected IDs, never trust client-provided cashierId/storeId for authorization
  const sessionStoreId = request.headers.get('X-Store-ID')
  const sessionUserId = request.headers.get('X-User-ID')

  if (!sessionStoreId || !sessionUserId) {
    throw new ApiError('Unauthorized', 401)
  }

  const storeId = parseInt(sessionStoreId)
  const cashierId = parseInt(sessionUserId)
  const body = await request.json()
  const { items } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError('Missing items', 400)
  }

  // Calculate total and validate products exist AND belong to THIS store
  let total = 0
  const saleitems: any[] = []
  const insufficientStock: any[] = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    })

    // ✅ SECURITY: Verify product exists AND belongs to the user's store
    if (!product || product.storeId !== storeId) {
      throw new ApiError(`Product ${item.productId} not found or unauthorized`, 404)
    }

    // Check if there's enough stock
    if (product.stock < item.quantity) {
      insufficientStock.push({
        productId: item.productId,
        productName: product.name,
        available: product.stock,
        requested: item.quantity,
      })
    }

    const itemTotal = product.price * item.quantity
    total += itemTotal

    saleitems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    } as any)
  }

  // Return error if any product has insufficient stock
  if (insufficientStock.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Insufficient stock for one or more products',
        insufficientStock
      },
      { status: 400 }
    )
  }

  // Create sale transaction with items and stock updates
  const sale = await prisma.$transaction(async (tx: any) => {
    // 1. Fetch store info for business-specific logic
    const store = await tx.store.findUnique({
      where: { id: storeId }
    })

    const finalSaleItems: any[] = []

    // 2. Process each item
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { batches: { orderBy: { expiryDate: 'asc' }, where: { quantity: { gt: 0 } } } }
      })

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      // 3. Deduction Logic
      if (store?.businessType === 'PHARMACY') {
        let remainingToDeduct = item.quantity

        for (const batch of product.batches) {
          if (remainingToDeduct <= 0) break

          const deduction = Math.min(batch.quantity, remainingToDeduct)
          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduction } }
          })

          // Track this specific batch deduction as a SaleItem
          finalSaleItems.push({
            productId: item.productId,
            batchId: batch.id,
            quantity: deduction,
            price: product.price,
            notes: item.notes
          })

          remainingToDeduct -= deduction
        }

        if (remainingToDeduct > 0) {
          throw new Error(`Batch inconsistency for ${product.name}: unable to satisfy FIFO requirement.`)
        }
      } else {
        // Retail/Restaurant/Gym standard deduction
        finalSaleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          notes: item.notes
        })
      }

      // 4. Decrement aggregate stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    // 5. Create Sale and SaleItems
    const rxItem = items.find((i: any) => i.prescription)
    const rxData = rxItem?.prescription

    return await tx.sale.create({
      data: {
        storeId: storeId,
        cashierId: cashierId,
        total,
        items: {
          create: finalSaleItems.map(i => ({
            productId: i.productId,
            batchId: i.batchId,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes
          }))
        },
        ...(rxData && {
          prescription: {
            create: {
              referenceNumber: rxData.referenceNumber,
              status: 'APPROVED'
            }
          }
        })
      },
      include: {
        items: { include: { product: true, batch: true } },
        cashier: true,
        prescription: true
      },
    })
  })

  return NextResponse.json({ success: true, data: sale }, { status: 201 })
})
