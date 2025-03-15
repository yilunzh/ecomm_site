import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";

const prisma = new PrismaClient();

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    
    const where: any = {};
    
    // Filter by parent category if provided
    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === "null") {
      // If parentId is explicitly set to null, get only root categories
      where.parentId = null;
    }
    
    const categories = await prisma.category.findMany({
      where,
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingCategory = await prisma.category.findUnique({
      where: { slug: body.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
        image: body.image,
        parentId: body.parentId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
} 