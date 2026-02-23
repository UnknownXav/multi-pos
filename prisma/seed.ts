/**
 * Prisma seed script
 * Run: npx prisma db seed
 * Populates database with demo data for multi-tenant architecture
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.subscription.deleteMany({})
  await prisma.member.deleteMany({})
  await prisma.membershipPlan.deleteMany({})
  await prisma.checkIn.deleteMany({})
  await prisma.saleItem.deleteMany({})
  await prisma.sale.deleteMany({})
  await prisma.batch.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.store.deleteMany({})

  // 1. Create Demo Owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      password: await hashPassword('password123'),
      name: 'Retail Owner',
      role: 'owner',
    },
  })

  // 2. Create Demo Store
  const store = await prisma.store.create({
    data: {
      name: 'Demo Sari-Sari Store',
      businessType: 'RETAIL',
      ownerId: owner.id,
    },
  })

  // 3. Create Demo Cashiers
  const cashier1 = await prisma.user.create({
    data: {
      email: 'maria@demo.com',
      password: await hashPassword('password123'),
      name: 'Maria Santos',
      role: 'cashier',
      storeId: store.id,
    },
  })

  const cashier2 = await prisma.user.create({
    data: {
      email: 'juan@demo.com',
      password: await hashPassword('password123'),
      name: 'Juan Dela Cruz',
      role: 'cashier',
      storeId: store.id,
    },
  })

  console.log('✓ Created owner, store, and cashiers')

  // 4. Create Demo Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Rice 5kg',
        barcode: '001234567890',
        price: 250.0,
        stock: 15,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Canned Tuna 155g',
        barcode: '001234567891',
        price: 45.0,
        stock: 3,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Instant Noodles',
        barcode: '001234567892',
        price: 12.0,
        stock: 25,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Cooking Oil 1L',
        barcode: '001234567893',
        price: 180.0,
        stock: 8,
        lowStockThreshold: 3,
      },
    }),
  ])

  console.log('✓ Created products')

  // 5. Create Demo Sales
  await prisma.sale.create({
    data: {
      storeId: store.id,
      cashierId: cashier1.id,
      total: 274.0,
      paymentMethod: 'cash',
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            price: 250.0,
          },
          {
            productId: products[2].id,
            quantity: 2,
            price: 12.0,
          },
        ],
      },
    },
  })

  console.log('✓ Created demo sales')
  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
