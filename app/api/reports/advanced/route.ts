import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError, requireRole } from '@/lib/api-utils'

/**
 * GET /api/reports/advanced
 * Advanced Analytics: Revenue, COGS, Profit, Top Products, etc.
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const sessionStoreId = request.headers.get('X-Store-ID')
    if (!sessionStoreId) {
        throw new ApiError('Unauthorized', 401)
    }

    // Require Owner or Admin role
    requireRole(request, ['owner', 'admin'])

    const sId = parseInt(sessionStoreId)

    // 1. Financial Overview (Raw SQL for precision across batches and base prices)
    const financialOverview: any = await prisma.$queryRaw`
        SELECT 
            SUM(si.price * si.quantity) as revenue,
            SUM(COALESCE(b.costPrice, p.costPrice, 0) * si.quantity) as cogs
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        JOIN "Product" p ON si."productId" = p.id
        LEFT JOIN "Batch" b ON si."batchId" = b.id
        WHERE s."storeId" = ${sId}
    `

    const revenue = Number(financialOverview[0]?.revenue || 0)
    const cogs = Number(financialOverview[0]?.cogs || 0)
    const grossProfit = revenue - cogs

    // 2. Top Products by Revenue
    const topProducts: any = await prisma.$queryRaw`
        SELECT 
            p.name,
            SUM(si.price * si.quantity) as "totalRevenue",
            SUM(si.quantity) as "totalQuantity"
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        JOIN "Product" p ON si."productId" = p.id
        WHERE s."storeId" = ${sId}
        GROUP BY p.id, p.name
        ORDER BY "totalRevenue" DESC
        LIMIT 5
    `

    // 3. Category Distribution
    const categorySales: any = await prisma.$queryRaw`
        SELECT 
            COALESCE(p.category, 'General') as category,
            SUM(si.price * si.quantity) as value
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        JOIN "Product" p ON si."productId" = p.id
        WHERE s."storeId" = ${sId}
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
})
