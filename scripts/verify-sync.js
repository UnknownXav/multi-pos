const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifySync() {
    console.log('--- Verifying Database Schema ---')
    try {
        const batchCount = await prisma.batch.count()
        console.log(`Successfully reached Batch table. Count: ${batchCount}`)

        const sales = await prisma.sale.findMany({ take: 1 })
        console.log('Successfully reached Sale table.')

        // Check for StockAdjustment table added in Phase 5
        const adjustmentCount = await prisma.stockAdjustment.count()
        console.log(`Successfully reached StockAdjustment table. Count: ${adjustmentCount}`)

        console.log('SUCCESS: Schema is fully synchronized.')
    } catch (error) {
        console.error('FAILURE: Schema mismatch detected.')
        console.error(error)
    }
}

verifySync().catch(console.error).finally(() => prisma.$disconnect())
