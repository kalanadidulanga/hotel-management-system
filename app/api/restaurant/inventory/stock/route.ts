import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.restaurantProduct.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const items = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? 'Uncategorized',
      currentStock: p.stockQuantity,
      unit: 'qty',
      reorderLevel: p.lowStockAlert,
      costPerUnit: p.cost,
      supplier: '-',
      lastUpdated: p.updatedAt.toISOString(),
      status: p.stockQuantity === 0 ? 'out-of-stock' : (p.stockQuantity <= p.lowStockAlert ? 'low-stock' : 'in-stock') as 'in-stock' | 'low-stock' | 'out-of-stock',
    }));

    const stats = {
      totalItems: items.length,
      lowStock: items.filter(i => i.status === 'low-stock').length,
      outOfStock: items.filter(i => i.status === 'out-of-stock').length,
      totalValue: items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0),
    };

    return NextResponse.json({ items, stats });
  } catch (error) {
    console.error('Error fetching inventory stock:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory stock' }, { status: 500 });
  }
}
