import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/products/[id]
 * Update a product — now includes kitchenStation and security hardening
 */
export const PUT = apiHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: idStr } = await context.params
  const productId = parseInt(idStr)
  const body = await request.json()
  const { name, barcode, price, stock, lowStockThreshold, kitchenStation } = body

  // ✅ SECURITY: Enforce store ownership
  const sessionStoreId = request.headers.get('X-Store-ID')
  const userRole = request.headers.get('X-User-Role')
  if (!sessionStoreId) {
    throw new ApiError('Unauthorized', 401)
  }
  const storeId = parseInt(sessionStoreId)

  // ✅ RBAC: Only owner/admin can update products
  if (userRole === 'cashier') {
    throw new ApiError('Forbidden', 403)
  }

  // Verify product exists and belongs to this store
  const productExists = await prisma.product.findFirst({
    where: { id: productId, storeId }
  })
  if (!productExists) {
    throw new ApiError('Product not found', 404)
  }

  // Validate required fields
  if (!name) {
    throw new ApiError('Name is required', 400)
  }

  // Check if barcode is unique in this store (excluding current product)
  if (barcode) {
    const existing = await prisma.product.findFirst({
      where: {
        storeId,
        barcode,
        id: { not: productId }
      }
    })
    if (existing) {
      throw new ApiError('Barcode already exists', 409)
    }
  }

  const product = await (prisma.product as any).update({
    where: { id: productId },
    data: {
      name,
      barcode: barcode || null,
      price: price !== undefined ? parseFloat(price) : undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
      genericName: body.genericName,
      category: body.category,
      kitchenStation: kitchenStation || null,
      isPrescriptionRequired: body.isPrescriptionRequired,
      isArchived: body.isArchived,
    },
  })

  return NextResponse.json({ success: true, data: product }, { status: 200 })
})

/**
 * DELETE /api/products/[id]
 * Delete a product with security check
 */
export const DELETE = apiHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: idStr } = await context.params
  const productId = parseInt(idStr)

  // ✅ SECURITY: Enforce store ownership
  const sessionStoreId = request.headers.get('X-Store-ID')
  const userRole = request.headers.get('X-User-Role')
  if (!sessionStoreId) {
    throw new ApiError('Unauthorized', 401)
  }
  const storeId = parseInt(sessionStoreId)

  // ✅ RBAC: Only owner/admin can delete
  if (userRole === 'cashier') {
    throw new ApiError('Forbidden', 403)
  }

  // Verify ownership
  const productExists = await prisma.product.findFirst({
    where: { id: productId, storeId }
  })
  if (!productExists) {
    throw new ApiError('Product not found', 404)
  }

  // Check if product has any sales items or batches (Data Integrity)
  const saleItems = await prisma.saleItem.findFirst({
    where: { productId }
  })
  const batches = await prisma.batch.findFirst({
    where: { productId }
  })

  if (saleItems || batches) {
    throw new ApiError('Cannot delete product with existing sales records or batches. Try archiving instead.', 400)
  }

  await (prisma.product as any).delete({
    where: { id: productId }
  })

  return NextResponse.json({ success: true, message: 'Product deleted' }, { status: 200 })
})
