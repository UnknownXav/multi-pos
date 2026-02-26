import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler, ApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const { id } = await context.params
  const numericId = Number(id)

  const sessionStoreId = request.headers.get('X-Store-ID')

  if (!sessionStoreId || Number.isNaN(numericId)) {
    throw new ApiError('Unauthorized or invalid ID', 401)
  }

  const storeId = Number(sessionStoreId)

  const plan = await prisma.membershipPlan.findFirst({
    where: { id: numericId, storeId },
    include: { _count: { select: { subscriptions: true } } },
  })

  if (!plan) {
    throw new ApiError('Plan not found', 404)
  }

  if (plan._count.subscriptions > 0) {
    throw new ApiError('Cannot delete plan: This plan has active or past subscriptions.', 400)
  }

  await prisma.membershipPlan.delete({
    where: { id: numericId },
  })

  return NextResponse.json({
    success: true,
    message: 'Plan deleted',
  })
})