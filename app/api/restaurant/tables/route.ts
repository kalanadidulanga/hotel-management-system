import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/restaurant/tables - Get all tables
export async function GET() {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      orderBy: { tableNumber: 'asc' },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/tables - Create new table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, capacity, location } = body;

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber,
        capacity: parseInt(capacity),
        location,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}
