import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/restaurant/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    
    const {
      customerName,
      status,
      notes,
      specialRequests,
      takenByStaff,
      total
    } = body;

    const updatedOrder = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        customerName,
        status,
        notes,
        specialRequests,
        total,
        updatedAt: new Date(),
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
        servedByStaff: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurant/orders/[id] - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    // Delete order items first (cascade should handle this, but being explicit)
    await prisma.restaurantOrderItem.deleteMany({
      where: { orderId },
    });

    // Delete the order
    await prisma.restaurantOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// GET /api/restaurant/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    const order = await prisma.restaurantOrder.findUnique({
      where: { id: orderId },
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
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
