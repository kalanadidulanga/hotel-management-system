import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/restaurant/kot - list orders needing KOT (PENDING or PREPARING and not kotGenerated)
export async function GET() {
  try {
    const orders = await prisma.restaurantOrder.findMany({
      where: {
        status: { in: ['PENDING', 'PREPARING'] },
        kotGenerated: false,
      },
      include: {
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderTime: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching KOT orders:', error);
    return NextResponse.json({ error: 'Failed to fetch KOT orders' }, { status: 500 });
  }
}

// POST /api/restaurant/kot - mark KOT generated for an order and optionally set estimatedTime
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, estimatedTime } = body as { orderId: number; estimatedTime?: number };

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const updated = await prisma.restaurantOrder.update({
      where: { id: Number(orderId) },
      data: {
        kotGenerated: true,
        kotGeneratedAt: new Date(),
        // Move order to PREPARING if still PENDING
        status: undefined,
        estimatedTime: typeof estimatedTime === 'number' ? estimatedTime : undefined,
      },
    });

    // If status is PENDING, set to PREPARING
    if (updated.status === 'PENDING') {
      await prisma.restaurantOrder.update({
        where: { id: updated.id },
        data: { status: 'PREPARING' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating KOT:', error);
    return NextResponse.json({ error: 'Failed to generate KOT' }, { status: 500 });
  }
}
