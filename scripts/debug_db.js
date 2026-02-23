const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')

async function debug() {
    try {
        console.log('Using DATABASE_URL:', process.env.DATABASE_URL)

        const countStores = await prisma.store.count()
        const countUsers = await prisma.user.count()
        const countProducts = await prisma.product.count()

        const output = {
            db_url: process.env.DATABASE_URL,
            storeCount: countStores,
            userCount: countUsers,
            productCount: countProducts
        }

        if (countStores > 0) {
            const stores = await prisma.store.findMany()
            output.stores = stores.map(s => ({ id: s.id, name: s.name }))
        }

        fs.writeFileSync('scripts/debug_output.json', JSON.stringify(output, null, 2))
        console.log('Full debug info written to scripts/debug_output.json')
    } catch (error) {
        console.error('Debug failed:', error)
        fs.writeFileSync('scripts/debug_error.txt', error.stack)
    } finally {
        await prisma.$disconnect()
    }
}

debug()
