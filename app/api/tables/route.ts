import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tables
 * Get all tables for a store
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    const tables = await prisma.restaurantTable.findMany({
      where: { storeId },
      orderBy: { tableNumber: 'asc' },
    })

    return NextResponse.json({ success: true, data: tables }, { status: 200 })
  } catch (error) {
    console.error('GET /api/tables error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tables' }, { status: 500 })
  }
}

/**
 * POST /api/tables
 * Create a new table for a store
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    console.log('[DEBUG] POST /api/tables - X-Store-ID header:', sessionStoreId)

    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No X-Store-ID' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)
    console.log('[DEBUG] POST /api/tables - parsed storeId:', storeId)

    const body = await request.json()
    const { tableNumber, capacity } = body

    if (!tableNumber || !capacity) {
      return NextResponse.json(
        { success: false, error: 'tableNumber and capacity are required' },
        { status: 400 }
      )
    }

    // Check if table number already exists for this store
    const existingTable = await prisma.restaurantTable.findUnique({
      where: { storeId_tableNumber: { storeId, tableNumber: tableNumber.toString() } },
    })

    if (existingTable) {
      return NextResponse.json(
        { success: false, error: 'Table number already exists for this store' },
        { status: 409 }
      )
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
  } catch (error) {
    console.error('POST /api/tables error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create table' },
      { status: 500 }
    )
  }
}
