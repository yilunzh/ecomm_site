import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/reviews - Get all reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating") || "0") : null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build the query filters
    const filters: any = {};

    if (productId) {
      filters.productId = productId;
    }

    if (userId) {
      filters.userId = userId;
    }

    if (rating) {
      filters.rating = rating;
    }

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.review.count({
      where: filters,
    });

    return NextResponse.json({
      reviews,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    if (!body.productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        productId: body.productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: body.productId,
        rating: body.rating,
        comment: body.comment || "",
        title: body.title || "",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: {
        productId: body.productId,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = productReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
    const averageRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

    await prisma.product.update({
      where: { id: body.productId },
      data: {
        rating: averageRating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
} 