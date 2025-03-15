import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const q = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build the query filters
    const filters: any = {
      isActive: true,
    };

    if (category) {
      filters.category = {
        slug: category,
      };
    }

    if (featured) {
      filters.featured = true;
    }

    if (q) {
      filters.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get products with pagination
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        category: true,
        variants: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: filters,
    });

    return NextResponse.json({
      products,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        sku: body.sku,
        stock: parseInt(body.stock),
        images: body.images || [],
        featured: body.featured || false,
        isActive: body.isActive || true,
        categoryId: body.categoryId,
      },
    });

    // Create variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: body.variants.map((variant: any) => ({
          name: variant.name,
          sku: variant.sku,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock),
          productId: product.id,
          attributes: variant.attributes,
        })),
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 