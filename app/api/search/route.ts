import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "auth";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/search - Search across multiple entities
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // Optional: can be 'products', 'categories', 'orders'
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Initialize results object
    const results: any = {};

    // Search products if type is not specified or type is 'products'
    if (!type || type === "products") {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
          ],
          isActive: true,
        },
        include: {
          category: true,
        },
        take: limit,
      });

      results.products = products;
    }

    // Search categories if type is not specified or type is 'categories'
    if (!type || type === "categories") {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        take: limit,
      });

      results.categories = categories;
    }

    // Search orders if type is not specified or type is 'orders'
    // Only admin can search all orders, regular users can only search their own
    if ((!type || type === "orders") && session) {
      const orderFilter: any = {
        OR: [
          { id: { contains: query } },
          { trackingNumber: { contains: query, mode: "insensitive" } },
          { trackingCompany: { contains: query, mode: "insensitive" } },
          {
            user: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        ],
      };

      // Regular users can only search their own orders
      if (session.user.role !== "ADMIN") {
        orderFilter.userId = session.user.id;
      }

      const orders = await prisma.order.findMany({
        where: orderFilter,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
      });

      results.orders = orders;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 