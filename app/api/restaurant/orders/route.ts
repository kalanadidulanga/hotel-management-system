import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PaymentMethod } from '@/lib/generated/prisma';

// GET /api/restaurant/orders - Get all orders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const orderType = searchParams.get('orderType');

    const where: {
      status?: string;
      tableId?: number;
      orderType?: string;
    } = {};

    if (status) {
      where.status = status;
    }

    if (tableId) {
      where.tableId = parseInt(tableId);
    }

    if (orderType) {
      where.orderType = orderType;
    }

    const orders = await prisma.restaurantOrder.findMany({
      where,
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        takenByStaff: true,
        servedByStaff: true,
      },
      orderBy: {
        orderTime: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tableId,
      customerId,
      customerName,
      customerPhone,
      orderType,
      items,
      notes,
      specialRequests,
      waiterName,
      takenBy,
      paymentMethod,
    } = body;

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item: {
      productId: number;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
        notes: item.notes,
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create order with items
    const order = await prisma.restaurantOrder.create({
      data: {
        tableId: tableId ? parseInt(tableId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        customerName,
        customerPhone,
        orderType: orderType || 'DINE_IN',
        subtotal,
        tax,
        total,
        notes,
        specialRequests,
        waiterName: waiterName || null,
        takenBy: takenBy ? parseInt(takenBy) : null,
        paymentMethod: paymentMethod as PaymentMethod,
        items: {
          create: orderItems,
        },
      },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        takenByStaff: true,
      },
    });

    // Update table status if it's a dine-in order
    if (tableId && orderType === 'DINE_IN') {
      await prisma.restaurantTable.update({
        where: { id: parseInt(tableId) },
        data: { status: 'OCCUPIED' },
      });
    }

    // Update product stock quantities
    for (const item of items) {
      await prisma.restaurantProduct.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
