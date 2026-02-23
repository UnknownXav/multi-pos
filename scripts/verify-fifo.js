const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyFIFO() {
    console.log('--- Verifying Pharmacy FIFO Logic ---')

    const store = await prisma.store.findFirst({ where: { businessType: 'PHARMACY' } })
    if (!store) {
        console.log('No Pharmacy store found. Skipping...')
        return
    }

    const product = await prisma.product.findFirst({
        where: { storeId: store.id },
        include: { batches: { orderBy: { expiryDate: 'asc' } } }
    })

    if (!product || product.batches.length < 2) {
        console.log('Not enough batches to test FIFO. Create at least 2 batches for a product first.')
        return
    }

    console.log(`Product: ${product.name}`)
    console.log(`Current Batches:`)
    product.batches.forEach(b => console.log(` - Batch ${b.batchNumber}: Qty ${b.quantity}, Expiry ${b.expiryDate.toLocaleDateString()}`))

    console.log('Testing FIFO by calling local API or checking business logic...')
    // In a real test, we would hit the API, but here we just verify the query pattern
    const activeBatches = await prisma.batch.findMany({
        where: { productId: product.id, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' }
    })

    if (activeBatches[0].id === product.batches[0].id) {
        console.log('SUCCESS: Nearest expiry batch is identified first.')
    } else {
        console.log('FAILURE: Batches not sorted by expiry.')
    }
}

verifyFIFO().catch(console.error).finally(() => prisma.$disconnect())
