import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/gym/payments
 * Handle membership renewal payments
 * 1. Create a Sale record
 * 2. Update/Create Subscription
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { storeId, memberId, planId, paymentMethod, amount } = body

        if (!storeId || !memberId || !planId || !amount) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Get the plan to know the duration
        const plan = await prisma.membershipPlan.findUnique({
            where: { id: parseInt(planId) }
        })

        if (!plan) {
            return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
        }

        // 2. Ensure a "Membership Renewal" service product exists for this store
        let serviceProduct = await prisma.product.findFirst({
            where: { storeId: parseInt(storeId), name: 'Membership Renewal' }
        })

        if (!serviceProduct) {
            serviceProduct = await prisma.product.create({
                data: {
                    storeId: parseInt(storeId),
                    name: 'Membership Renewal',
                    price: 0, // Will be overridden in SaleItem
                    stock: 999999, // Services don't run out
                    barcode: `SERVICE-RENEWAL-${storeId}`
                }
            })
        }

        // Get the current user from session headers for the cashierId
        const sessionUserId = request.headers.get('X-User-ID')
        const cashierId = sessionUserId ? parseInt(sessionUserId) : 1

        // Start Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 2. Create the Sale
            const sale = await tx.sale.create({
                data: {
                    storeId: parseInt(storeId),
                    cashierId: cashierId,
                    total: parseFloat(amount),
                    paymentMethod,
                    items: {
                        create: {
                            productId: serviceProduct!.id,
                            quantity: 1,
                            price: parseFloat(amount),
                        }
                    }
                }
            })

            // 3. Handle Subscription stacking
            const existingSub = await tx.subscription.findFirst({
                where: {
                    memberId: parseInt(memberId),
                    status: 'active',
                    endDate: { gte: new Date() }
                },
                orderBy: { endDate: 'desc' }
            })

            let startDate = new Date()
            if (existingSub) {
                // If already active, start from the end of current sub
                startDate = new Date(existingSub.endDate)
            }

            const endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + plan.durationDays)

            // Only expire subscriptions that have actually ended
            await tx.subscription.updateMany({
                where: {
                    memberId: parseInt(memberId),
                    status: 'active',
                    endDate: { lt: new Date() }
                },
                data: { status: 'expired' }
            })

            const subscription = await tx.subscription.create({
                data: {
                    memberId: parseInt(memberId),
                    planId: plan.id,
                    startDate,
                    endDate,
                    status: 'active'
                }
            })

            // Update member status
            await tx.member.update({
                where: { id: parseInt(memberId) },
                data: { status: 'active' }
            })

            // Fetch the full sale object with relations for the receipt
            const fullSale = await tx.sale.findUnique({
                where: { id: sale.id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    cashier: true
                }
            })

            return { sale: fullSale }
        })

        return NextResponse.json({ success: true, data: result.sale })
    } catch (error) {
        console.error('Gym Payment Error:', error)
        return NextResponse.json({ success: false, error: 'Payment processing failed' }, { status: 500 })
    }
}
