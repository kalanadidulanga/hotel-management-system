import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/restaurant/products - Get all products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const available = searchParams.get('available');

    const whereClause: Record<string, any> = {};
    
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    if (available === 'true') {
      whereClause.isAvailable = true;
    }
    
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    const products = await prisma.restaurantProduct.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      categoryId,
      image,
      stockQuantity,
      isAvailable,
      preparationTime,
      isVegetarian,
      isVegan,
    } = body;

    const product = await prisma.restaurantProduct.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        image,
        stockQuantity: parseInt(stockQuantity) || 0,
        isAvailable: isAvailable ?? true,
        preparationTime: parseInt(preparationTime) || 15,
        isVegetarian: isVegetarian ?? false,
        isVegan: isVegan ?? false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      price,
      categoryId,
      image,
      stockQuantity,
      isAvailable,
      preparationTime,
      isVegetarian,
      isVegan,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await prisma.restaurantProduct.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        image,
        stockQuantity: parseInt(stockQuantity),
        isAvailable,
        preparationTime: parseInt(preparationTime),
        isVegetarian,
        isVegan,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await prisma.restaurantProduct.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
