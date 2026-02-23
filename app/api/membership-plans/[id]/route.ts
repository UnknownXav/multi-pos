import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params
    const numericId = Number(id)

    const sessionStoreId = request.headers.get('X-Store-ID')

    if (!sessionStoreId || Number.isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or invalid ID' },
        { status: 401 }
      )
    }

    const storeId = Number(sessionStoreId)

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: numericId, storeId },
      include: { _count: { select: { subscriptions: true } } },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    if (plan._count.subscriptions > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete plan: This plan has active or past subscriptions.',
        },
        { status: 400 }
      )
    }

    await prisma.membershipPlan.delete({
      where: { id: numericId },
    })

    return NextResponse.json({
      success: true,
      message: 'Plan deleted',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}