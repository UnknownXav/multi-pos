import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/tables/[id]
 * Update table status or details
 */
export const PUT = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await context.params
  const tableId = parseInt(idStr)
  const body = await request.json()
  const { status, capacity } = body

  // ✅ SECURITY: Enforce session ownership
  const sessionStoreId = request.headers.get('X-Store-ID')
  if (!sessionStoreId || isNaN(tableId)) {
    throw new ApiError('Unauthorized or invalid ID', 401)
  }
  const storeId = parseInt(sessionStoreId)

  // Verify ownership
  const tableExists = await prisma.restaurantTable.findFirst({
    where: { id: tableId, storeId }
  })
  if (!tableExists) {
    throw new ApiError('Table not found', 404)
  }

  const updateData: any = {}
  if (status) updateData.status = status
  if (capacity) updateData.capacity = parseInt(capacity)

  const table = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: updateData,
  })

  return NextResponse.json({ success: true, data: table }, { status: 200 })
})

/**
 * DELETE /api/tables/[id]
 * Delete a table
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await context.params
  const tableId = parseInt(idStr)

  // ✅ SECURITY: Enforce session ownership
  const sessionStoreId = request.headers.get('X-Store-ID')
  if (!sessionStoreId || !tableId) {
    throw new ApiError('Unauthorized', 401)
  }
  const storeId = parseInt(sessionStoreId)

  // Verify ownership
  const tableExists = await prisma.restaurantTable.findFirst({
    where: { id: tableId, storeId }
  })
  if (!tableExists) {
    throw new ApiError('Table not found', 404)
  }

  await prisma.restaurantTable.delete({
    where: { id: tableId },
  })

  return NextResponse.json({ success: true, message: 'Table deleted' }, { status: 200 })
})
