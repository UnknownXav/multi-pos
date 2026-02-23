import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/products/[id]
 * Update a product — now includes kitchenStation and security hardening
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = parseInt(params.id)
    const body = await request.json()
    const { name, barcode, price, stock, lowStockThreshold, kitchenStation } = body

    // ✅ SECURITY: Enforce store ownership
    const sessionStoreId = request.headers.get('X-Store-ID')
    const userRole = request.headers.get('X-User-Role')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    // ✅ RBAC: Only owner/admin can update products
    if (userRole === 'cashier') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Verify product exists and belongs to this store
    const productExists = await prisma.product.findFirst({
      where: { id: productId, storeId }
    })
    if (!productExists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
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
        return NextResponse.json(
          { success: false, error: 'Barcode already exists' },
          { status: 409 }
        )
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
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product with security check
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = parseInt(params.id)

    // ✅ SECURITY: Enforce store ownership
    const sessionStoreId = request.headers.get('X-Store-ID')
    const userRole = request.headers.get('X-User-Role')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    // ✅ RBAC: Only owner/admin can delete
    if (userRole === 'cashier') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Verify ownership
    const productExists = await prisma.product.findFirst({
      where: { id: productId, storeId }
    })
    if (!productExists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Check if product has any sales items or batches (Data Integrity)
    const saleItems = await prisma.saleItem.findFirst({
      where: { productId }
    })
    const batches = await prisma.batch.findFirst({
      where: { productId }
    })

    if (saleItems || batches) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product with existing sales records or batches. Try archiving instead.' },
        { status: 400 }
      )
    }

    await (prisma.product as any).delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true, message: 'Product deleted' }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
