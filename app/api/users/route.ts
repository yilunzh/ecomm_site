import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const q = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build the query filters
    const filters: any = {};

    if (role && (role === "ADMIN" || role === "CUSTOMER")) {
      filters.role = role;
    }

    if (q) {
      filters.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: filters,
    });

    return NextResponse.json({
      users,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role || "CUSTOMER",
        image: body.image,
        hashedPassword: body.password ? await hashPassword(body.password) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('bcrypt');
  return await hash(password, 10);
} 