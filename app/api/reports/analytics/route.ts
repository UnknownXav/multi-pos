import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/reports/analytics
 * Returns profit analytics, hourly heatmap, and category breakdown
 */
export async function GET(request: NextRequest) {
    try {
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const storeId = parseInt(sessionStoreId)

        const { searchParams } = new URL(request.url)
        const rangeStr = searchParams.get('range') || '30'
        const rangeDays = parseInt(rangeStr)
        const since = new Date()
        since.setDate(since.getDate() - rangeDays)

        // Fetch all sales in range with items + products
        const sales = await prisma.sale.findMany({
            where: { storeId, createdAt: { gte: since }, status: 'PAID' },
            include: {
                items: {
                    include: { product: { select: { name: true, category: true, price: true, costPrice: true } } }
                }
            }
        })

        // 1. Revenue & Profit Summary
        let totalRevenue = 0
        let totalCost = 0
        sales.forEach(sale => {
            totalRevenue += sale.total
            sale.items.forEach(item => {
                totalCost += (item.product.costPrice || 0) * item.quantity
            })
        })
        const grossProfit = totalRevenue - totalCost
        const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

        // 2. Category Breakdown
        const categoryMap: Record<string, { revenue: number; units: number; profit: number }> = {}
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const cat = item.product.category || 'Uncategorized'
                if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, units: 0, profit: 0 }
                const revenue = item.price * item.quantity
                const cost = (item.product.costPrice || 0) * item.quantity
                categoryMap[cat].revenue += revenue
                categoryMap[cat].units += item.quantity
                categoryMap[cat].profit += (revenue - cost)
            })
        })
        const categoryData = Object.entries(categoryMap)
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.revenue - a.revenue)

        // 3. Top Products by Revenue
        const productMap: Record<string, { revenue: number; units: number; profit: number; totalCost: number }> = {}
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const name = item.product.name
                if (!productMap[name]) productMap[name] = { revenue: 0, units: 0, profit: 0, totalCost: 0 }
                const revenue = item.price * item.quantity
                const cost = (item.product.costPrice || 0) * item.quantity
                productMap[name].revenue += revenue
                productMap[name].units += item.quantity
                productMap[name].profit += (revenue - cost)
                productMap[name].totalCost += cost
            })
        })
        const topProducts = Object.entries(productMap)
            .map(([name, d]) => ({ name, ...d, marginPct: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0 }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        // 4. Hourly Heatmap (0-23 hours x 7 days)
        const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
        sales.forEach(sale => {
            const d = new Date(sale.createdAt)
            const dow = d.getDay() // 0=Sun
            const hour = d.getHours()
            heatmap[dow][hour] += 1
        })

        // 5. Daily Revenue Trend (last rangeDays days)
        const dailyMap: Record<string, number> = {}
        sales.forEach(sale => {
            const dateKey = new Date(sale.createdAt).toISOString().split('T')[0]
            if (!dailyMap[dateKey]) dailyMap[dateKey] = 0
            dailyMap[dateKey] += sale.total
        })
        const dailyTrend = Object.entries(dailyMap)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalRevenue,
                    totalCost,
                    grossProfit,
                    marginPct: Math.round(marginPct * 10) / 10,
                    totalTransactions: sales.length,
                    topCategory: categoryData[0]?.name || 'N/A',
                },
                categoryData,
                topProducts,
                heatmap,
                dailyTrend,
            }
        })
    } catch (error) {
        console.error('GET /api/reports/analytics error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
