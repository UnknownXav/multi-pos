import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tables
 * Get all tables for a store
 */
export const GET = apiHandler(async (request: NextRequest) => {
  // ✅ SECURITY: Use session-verified storeId
  const sessionStoreId = request.headers.get('X-Store-ID')
  if (!sessionStoreId) {
    throw new ApiError('Unauthorized', 401)
  }
  const storeId = parseInt(sessionStoreId)

  const tables = await prisma.restaurantTable.findMany({
    where: { storeId },
    orderBy: { tableNumber: 'asc' },
  })

  return NextResponse.json({ success: true, data: tables }, { status: 200 })
})

/**
 * POST /api/tables
 * Create a new table for a store
 */
export const POST = apiHandler(async (request: NextRequest) => {
  // ✅ SECURITY: Use session-verified storeId
  const sessionStoreId = request.headers.get('X-Store-ID')

  if (!sessionStoreId) {
    throw new ApiError('Unauthorized: No X-Store-ID', 401)
  }
  const storeId = parseInt(sessionStoreId)

  const body = await request.json()
  const { tableNumber, capacity } = body

  if (!tableNumber || !capacity) {
    throw new ApiError('tableNumber and capacity are required', 400)
  }

  // Check if table number already exists for this store
  const existingTable = await prisma.restaurantTable.findUnique({
    where: { storeId_tableNumber: { storeId, tableNumber: tableNumber.toString() } },
  })

  if (existingTable) {
    throw new ApiError('Table number already exists for this store', 409)
  }

  const table = await prisma.restaurantTable.create({
    data: {
      storeId,
      tableNumber: tableNumber.toString(),
      capacity: parseInt(capacity),
      status: 'AVAILABLE',
    },
  })

  return NextResponse.json({ success: true, data: table }, { status: 201 })
})
