import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/categories/[categoryId] - Get a single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[categoryId] - Update a category (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if slug is unique if it's being changed
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id: params.categoryId },
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
        image: body.image,
        parentId: body.parentId === undefined ? existingCategory.parentId : body.parentId,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[categoryId] - Delete a category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if the category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories" },
        { status: 400 }
      );
    }

    // Check if the category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with products" },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: params.categoryId },
    });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 