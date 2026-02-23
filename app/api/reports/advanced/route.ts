import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/reports/advanced
 * Advanced Analytics: Revenue, COGS, Profit, Top Products, etc.
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const storeId = searchParams.get('storeId')
        const period = searchParams.get('period') || '30days' // 7days, 30days, year

        if (!storeId) {
            return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 })
        }

        const sId = parseInt(storeId)

        // 1. Financial Overview (Raw SQL for precision across batches and base prices)
        // Profit = (SaleItem.price - (Batch.costPrice OR Product.costPrice)) * SaleItem.quantity
        const financialOverview: any = await prisma.$queryRaw`
            SELECT 
                SUM(si.price * si.quantity) as revenue,
                SUM(COALESCE(b.costPrice, p.costPrice, 0) * si.quantity) as cogs
            FROM SaleItem si
            JOIN Sale s ON si.saleId = s.id
            JOIN Product p ON si.productId = p.id
            LEFT JOIN Batch b ON si.batchId = b.id
            WHERE s.storeId = ${sId}
        `

        const revenue = Number(financialOverview[0]?.revenue || 0)
        const cogs = Number(financialOverview[0]?.cogs || 0)
        const grossProfit = revenue - cogs

        // 2. Top Products by Revenue
        const topProducts: any = await prisma.$queryRaw`
            SELECT 
                p.name,
                SUM(si.price * si.quantity) as totalRevenue,
                SUM(si.quantity) as totalQuantity
            FROM SaleItem si
            JOIN Sale s ON si.saleId = s.id
            JOIN Product p ON si.productId = p.id
            WHERE s.storeId = ${sId}
            GROUP BY p.id, p.name
            ORDER BY totalRevenue DESC
            LIMIT 5
        `

        // 3. Category Distribution
        const categorySales: any = await prisma.$queryRaw`
            SELECT 
                COALESCE(p.category, 'General') as category,
                SUM(si.price * si.quantity) as value
            FROM SaleItem si
            JOIN Sale s ON si.saleId = s.id
            JOIN Product p ON si.productId = p.id
            WHERE s.storeId = ${sId}
            GROUP BY category
        `

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    revenue,
                    cogs,
                    grossProfit,
                    margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0
                },
                topProducts: topProducts.map((p: any) => ({
                    name: p.name,
                    revenue: Number(p.totalRevenue),
                    quantity: Number(p.totalQuantity)
                })),
                categorySales: categorySales.map((c: any) => ({
                    category: c.category,
                    value: Number(c.value)
                }))
            }
        })
    } catch (error) {
        console.error('Advanced Reports Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate advanced reports' }, { status: 500 })
    }
}
