import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/reports
 * Fetch sales summary by time period (today, week, month)
 * Query params: period = 'today' | 'week' | 'month'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'today'

    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        const firstDayOfWeek = new Date(now)
        firstDayOfWeek.setDate(now.getDate() - now.getDay())
        firstDayOfWeek.setHours(0, 0, 0, 0)
        startDate = firstDayOfWeek
        break
      case 'month':
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid period. Use: today, week, month' },
          { status: 400 }
        )
    }

    // ✅ SECURITY: Use session-verified storeId
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storeId = parseInt(sessionStoreId)

    // Get sales summary for THIS store only
    const sales = await prisma.sale.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        cashier: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate metrics
    const totalSales = sales.reduce((sum: number, sale: any) => sum + sale.total, 0)
    const totalTransactions = sales.length
    const totalItems = sales.reduce((sum: number, sale: any) => sum + sale.items.length, 0)
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Get top products
    const allItems = sales.flatMap((s: any) => s.items)
    const productSales = allItems.reduce((acc: any[], item: any) => {
      const existing = acc.find((p: any) => p.productId === item.productId)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
      } else {
        acc.push({
          productId: item.productId,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        })
      }
      return acc
    }, [])

    const topProducts = productSales
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5)

    // Get cashier performance
    const salesByCashier = sales.reduce((acc: any[], sale: any) => {
      const existing = acc.find((c: any) => c.cashierId === sale.cashierId)
      if (existing) {
        existing.transactionCount += 1
        existing.totalSales += sale.total
      } else {
        acc.push({
          cashierId: sale.cashierId,
          cashierName: sale.cashier.name,
          transactionCount: 1,
          totalSales: sale.total,
        })
      }
      return acc
    }, [])

    const report = {
      period,
      dateRange: { start: startDate, end: now },
      summary: {
        totalSales,
        totalTransactions,
        totalItems,
        avgTransaction: Math.round(avgTransaction * 100) / 100,
      },
      topProducts,
      salesByCashier,
      transactions: sales,
    }

    return NextResponse.json({ success: true, data: report }, { status: 200 })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
