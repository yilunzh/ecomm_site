import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/orders - Get all orders (admin) or user's orders (customer)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }

    // User filter - admin can filter by any user, regular users can only see their own orders
    if (session.user.role === "ADMIN") {
      if (userId) {
        filter.userId = userId;
      }
    } else {
      // Regular users can only access their own orders
      filter.userId = session.user.id;
    }

    // Get orders with pagination
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
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
                  images: true,
                  price: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where: filter }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json({
      orders,
      meta: {
        page,
        limit,
        totalOrders,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
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
    const { items, shippingAddress, paymentIntentId } = body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Calculate order total by fetching current product prices from DB
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    // Create a map of product IDs to products for easy lookup
    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Calculate order items and total
    let orderTotal = 0;
    const orderItems = items.map(item => {
      const product = productMap[item.productId];
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const itemTotal = product.price * item.quantity;
      orderTotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        variantId: item.variantId || null,
      };
    });

    // Create shipping address record
    const shippingAddressRecord = await prisma.address.create({
      data: {
        userId: session.user.id,
        name: shippingAddress.name,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || "",
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: orderTotal,
        paymentIntentId: paymentIntentId || null,
        shippingAddressId: shippingAddressRecord.id,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
} 