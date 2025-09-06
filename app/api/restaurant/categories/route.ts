import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/restaurant/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.restaurantCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    const category = await prisma.restaurantCategory.create({
      data: {
        name,
        description,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant/categories - Update existing category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await prisma.restaurantCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        sortOrder: parseInt(sortOrder),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurant/categories - Delete existing category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has products
    const productCount = await prisma.restaurantProduct.count({
      where: { categoryId: parseInt(id) },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      );
    }

    await prisma.restaurantCategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
