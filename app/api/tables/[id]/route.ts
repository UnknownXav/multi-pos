import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/tables/[id]
 * Update table status or details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = parseInt(params.id)
    const body = await request.json()
    const { status, capacity } = body

    // ✅ SECURITY: Enforce session ownership
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId || isNaN(tableId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized or invalid ID' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    // Verify ownership
    const tableExists = await prisma.restaurantTable.findFirst({
      where: { id: tableId, storeId }
    })
    if (!tableExists) {
      return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (capacity) updateData.capacity = parseInt(capacity)

    const table = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: updateData,
    })

    return NextResponse.json(
      { success: true, data: table },
      { status: 200 }
    )
  } catch (error) {
    console.error('PUT /api/tables/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update table' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tables/[id]
 * Delete a table
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = parseInt(params.id)

    // ✅ SECURITY: Enforce session ownership
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId || !tableId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    // Verify ownership
    const tableExists = await prisma.restaurantTable.findFirst({
      where: { id: tableId, storeId }
    })
    if (!tableExists) {
      return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 })
    }

    await prisma.restaurantTable.delete({
      where: { id: tableId },
    })

    return NextResponse.json(
      { success: true, message: 'Table deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/tables/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}
