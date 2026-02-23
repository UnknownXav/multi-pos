import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/products
 * Fetch all products — storeId is enforced from the verified session header (not client input)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Use server-injected store ID from JWT session, never trust client input
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const lowStockOnly = searchParams.get('lowStock') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: any = { storeId }
    where.isArchived = includeArchived

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { barcode: { contains: query } }
      ]
    }

    let products = await (prisma.product as any).findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
          select: { batchNumber: true, expiryDate: true, quantity: true }
        }
      }
    })

    if (lowStockOnly) {
      products = products.filter((p: any) => p.stock <= p.lowStockThreshold)
    }

    return NextResponse.json({ success: true, data: products }, { status: 200 })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Create a new product — storeId is enforced from the verified session header
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Enforce storeId from session
    const sessionStoreId = request.headers.get('X-Store-ID')
    const userRole = request.headers.get('X-User-Role')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    // ✅ RBAC: Only owner/admin can create products
    if (userRole === 'cashier') {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const storeId = parseInt(sessionStoreId)
    const body = await request.json()
    const { name, barcode, lowStockThreshold } = body

    // Parse numerics safely
    const price = parseFloat(body.price)
    const stock = parseInt(body.stock)

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      )
    }
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price value' },
        { status: 400 }
      )
    }
    if (isNaN(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid stock value' },
        { status: 400 }
      )
    }

    if (barcode) {
      const existing = await (prisma.product as any).findFirst({
        where: { storeId, barcode }
      })
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Product with this barcode already exists in this store' },
          { status: 409 }
        )
      }
    }

    const sellingPrice = parseFloat(body.price)
    const costPrice = body.costPrice ? parseFloat(body.costPrice) : undefined
    const hasBatch = body.batchNumber && body.expiryDate && !isNaN(stock)

    const product = await (prisma.product as any).create({
      data: {
        storeId,
        name,
        barcode: barcode || null,
        price,
        stock,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 5,
        genericName: body.genericName || null,
        category: body.category || null,
        kitchenStation: body.kitchenStation || null,
        isPrescriptionRequired: body.isPrescriptionRequired || false,
        ...(hasBatch && {
          batches: {
            create: {
              batchNumber: body.batchNumber,
              expiryDate: new Date(body.expiryDate),
              quantity: stock,
              costPrice: costPrice,
              sellingPrice: isNaN(sellingPrice) ? price : sellingPrice
            }
          }
        })
      },
      include: { batches: true }
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
