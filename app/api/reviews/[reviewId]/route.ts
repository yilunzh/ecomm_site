import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";

const prisma = new PrismaClient();

// GET /api/reviews/[reviewId] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
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
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[reviewId] - Update a review (owner or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Only allow owner or admin to update
    if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        rating: body.rating !== undefined ? body.rating : review.rating,
        comment: body.comment !== undefined ? body.comment : review.comment,
      },
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
    });

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: {
        productId: review.productId,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = productReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
    const averageRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: averageRating,
        reviewCount: productReviews.length,
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId] - Delete a review (owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Only allow owner or admin to delete
    if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: params.reviewId },
    });

    return NextResponse.json(
      { message: "Review deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
} 