const { PrismaClient } = require('@prisma/client')

async function testConnection() {
    const prisma = new PrismaClient()
    try {
        console.log('Attempting to connect to the database...')
        await prisma.$connect()
        console.log('Successfully connected to the database!')

        const userCount = await prisma.user.count()
        console.log(`User count: ${userCount}`)
    } catch (error) {
        console.error('Failed to connect to the database:')
        console.error(error.message)
        if (error.code) console.log(`Error code: ${error.code}`)
    } finally {
        await prisma.$disconnect()
    }
}

testConnection()
