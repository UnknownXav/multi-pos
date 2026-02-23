import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const stores = await prisma.store.findMany()
    console.log('Stores in DB:', stores.map(s => ({ id: s.id, name: s.name })))

    const users = await prisma.user.findMany()
    console.log('Users in DB:', users.map(u => ({ id: u.id, name: u.name, storeId: u.storeId })))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
