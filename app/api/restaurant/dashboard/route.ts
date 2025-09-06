import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Orders by status
    const [pendingCount, preparingCount, readyCount] = await Promise.all([
      prisma.restaurantOrder.count({ where: { status: 'PENDING' } }),
      prisma.restaurantOrder.count({ where: { status: 'PREPARING' } }),
      prisma.restaurantOrder.count({ where: { status: 'READY' } }),
    ]);

    // Active KOTs = orders in pending/preparing with kotGenerated true, fallback to status
    const activeKOTs = await prisma.restaurantOrder.count({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'PREPARING' },
        ],
      },
    });

    // Overdue KOTs: preparing orders with estimatedTime exceeded
    const now = new Date();
    const overdueKOTs = await prisma.restaurantOrder.count({
      where: {
        status: 'PREPARING',
        estimatedTime: { not: null },
        orderTime: { lt: new Date(now.getTime() - 1000 * 60) }, // ensure orderTime exists
      },
    });

    // Avg prep time from READY orders that have readyTime and orderTime
    const readyOrders = await prisma.restaurantOrder.findMany({
      where: { status: 'READY', readyTime: { not: null } },
      select: { orderTime: true, readyTime: true },
      take: 100,
      orderBy: { readyTime: 'desc' },
    });
    let avgPrepTime = 0;
    if (readyOrders.length > 0) {
      const totalMs = readyOrders.reduce((acc, o) => {
        const startDate = o.orderTime instanceof Date ? o.orderTime : new Date(o.orderTime as unknown as string);
        const endDate = o.readyTime instanceof Date ? o.readyTime : new Date(o.readyTime as unknown as string);
        const start = startDate.getTime();
        const end = endDate.getTime();
        return acc + Math.max(0, end - start);
      }, 0);
      avgPrepTime = Math.round(totalMs / readyOrders.length / 60000);
    }

    // Tables status counts
    const [availableTables, occupiedTables, reservedTables] = await Promise.all([
      prisma.restaurantTable.count({ where: { status: 'AVAILABLE' } }),
      prisma.restaurantTable.count({ where: { status: 'OCCUPIED' } }),
      prisma.restaurantTable.count({ where: { status: 'RESERVED' } }),
    ]);

    // Table list for layout
    const tableList = await prisma.restaurantTable.findMany({
      select: { id: true, tableNumber: true, capacity: true, status: true },
      orderBy: { tableNumber: 'asc' },
    });

    // Order queue: latest pending + preparing
    const orderQueue = await prisma.restaurantOrder.findMany({
      where: { status: { in: ['PENDING', 'PREPARING'] } },
      include: { table: true },
      orderBy: { orderTime: 'desc' },
      take: 12,
    });

    return NextResponse.json({
      orders: {
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
      },
      kitchen: {
        activeKOTs,
        overdueKOTs,
        avgPrepTime,
      },
      tables: {
        available: availableTables,
        occupied: occupiedTables,
        reserved: reservedTables,
        list: tableList,
      },
      queue: orderQueue.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        estimatedTime: o.estimatedTime,
        customerName: o.customerName,
        table: o.table ? { tableNumber: o.table.tableNumber } : null,
      })),
    });
  } catch (error) {
    console.error('Dashboard fetch error', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
