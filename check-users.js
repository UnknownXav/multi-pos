const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                store: true
            }
        })
        console.log(JSON.stringify(users, null, 2))
    } catch (error) {
        console.error('Error fetching users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
