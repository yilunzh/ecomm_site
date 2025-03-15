import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/users/[userId] - Get a user by ID (admin or self)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authorized (admin or self)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only allow admin or the user themselves to access
    if (session.user.role !== "ADMIN" && session.user.id !== params.userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        orders: {
          take: 5,
          orderBy: {
            createdAt: "desc"
          },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Update a user (admin or self)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authorized (admin or self)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only allow admin or the user themselves to update
    if (session.user.role !== "ADMIN" && session.user.id !== params.userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only allow basic user data to be updated
    if (body.name !== undefined) updateData.name = body.name;
    if (body.image !== undefined) updateData.image = body.image;
    
    // Only allow admin to update role
    if (session.user.role === "ADMIN" && body.role !== undefined) {
      updateData.role = body.role;
    }
    
    // Handle password update if provided
    if (body.password) {
      updateData.hashedPassword = await hashPassword(body.password);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.userId },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('bcrypt');
  return await hash(password, 10);
} 