import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Build deduction-like history from recent order items
    const items = await prisma.restaurantOrderItem.findMany({
      include: {
        order: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const history = items.map((it) => ({
      id: it.id,
      orderNumber: it.order?.orderNumber ?? '-',
      itemName: it.product?.name ?? 'Unknown',
      quantityDeducted: it.quantity,
      unit: 'qty',
      deductedAt: (it.order?.orderTime ?? it.createdAt).toISOString(),
      deductedBy: 'System Auto',
      reason: 'Order preparation',
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching deduction history:', error);
    return NextResponse.json({ error: 'Failed to fetch deduction history' }, { status: 500 });
  }
}
