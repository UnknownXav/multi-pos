import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/stats
 * Fetch aggregate statistics for the dashboard
 * Returns gym-specific metrics when businessType is GYM
 */
export async function GET(request: NextRequest) {
    try {
        const sessionStoreId = request.headers.get('X-Store-ID')
        if (!sessionStoreId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const sId = parseInt(sessionStoreId)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())

        const thirtyDaysFromNow = new Date(today)
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Standard sales stats (all business types)
        const [todaySales, weeklySales, monthlySales] = await Promise.all([
            prisma.sale.aggregate({ where: { storeId: sId, createdAt: { gte: today } }, _sum: { total: true } }),
            prisma.sale.aggregate({ where: { storeId: sId, createdAt: { gte: startOfWeek } }, _sum: { total: true } }),
            prisma.sale.aggregate({ where: { storeId: sId, createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
        ])

        // Business-type specific stats
        const [products, expiryAlerts, cleaningTables] = await Promise.all([
            prisma.product.findMany({ where: { storeId: sId }, select: { stock: true, lowStockThreshold: true } }),
            prisma.batch.count({
                where: { product: { storeId: sId }, quantity: { gt: 0 }, expiryDate: { lte: thirtyDaysFromNow } }
            }),
            prisma.restaurantTable.count({ where: { storeId: sId, status: 'CLEANING' } }),
        ])

        const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length

        // Gym-specific stats
        const [activeMembers, expiringMemberships, newSignups, expiredMembers] = await Promise.all([
            // Active: subscriptions where endDate is in the future
            prisma.subscription.count({
                where: { member: { storeId: sId }, endDate: { gte: new Date() }, status: { not: 'cancelled' } }
            }),
            // Expiring: active subs ending within 30 days
            prisma.subscription.count({
                where: {
                    member: { storeId: sId },
                    endDate: { gte: new Date(), lte: thirtyDaysFromNow },
                    status: { not: 'cancelled' }
                }
            }),
            // New signups this month
            prisma.member.count({ where: { storeId: sId, createdAt: { gte: startOfMonth } } }),
            // Expired: still marked active but past end date
            prisma.subscription.count({
                where: { member: { storeId: sId }, endDate: { lt: new Date() }, status: 'active' }
            }),
        ])

        // Pharmacy-specific stats
        const prescriptionsToday = await prisma.prescription.count({
            where: {
                sale: {
                    storeId: sId,
                    createdAt: { gte: today }
                }
            }
        })

        // Restaurant-specific stats (advanced)
        const [activeTablesCount, kitchenOrdersCount, completedOrdersCount] = await Promise.all([
            prisma.restaurantTable.count({ where: { storeId: sId, status: { not: 'AVAILABLE' } } }),
            prisma.sale.count({ where: { storeId: sId, status: 'IN_PROGRESS' } }),
            prisma.sale.count({ where: { storeId: sId, status: { in: ['READY', 'PAID'] }, updatedAt: { gte: today } } }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                todaySales: todaySales._sum.total || 0,
                weeklySales: weeklySales._sum.total || 0,
                monthlySales: monthlySales._sum.total || 0,
                lowStockCount,
                expiryAlerts,
                cleaningTables,
                // Gym stats
                activeMembers,
                expiringMemberships,
                newSignups,
                expiredMembers,
                // Pharmacy stats
                prescriptionsToday,
                // Restaurant stats
                activeTablesCount,
                kitchenOrdersCount,
                completedOrdersCount,
            }
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
    }
}
