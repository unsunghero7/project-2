import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import stripe from "@/lib/stripe";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const branchManagerId = searchParams.get("branchManagerId");

    let orders;
    if (restaurantId && session.user.role === "RESTAURANT_ADMIN") {
      orders = await prisma.order.findMany({
        where: {
          restaurantId: parseInt(restaurantId),
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
              addons: true,
            },
          },
          branch: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (branchManagerId && session.user.role === "BRANCH_MANAGER") {
      const branches = await prisma.branch.findMany({
        where: {
          managers: {
            some: { id: parseInt(branchManagerId) },
          },
        },
      });

      orders = await prisma.order.findMany({
        where: {
          branchId: {
            in: branches.map((b) => b.id),
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
              addons: true,
            },
          },
          branch: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // For customers or other roles
      orders = await prisma.order.findMany({
        where: {
          userId: parseInt(session.user.id),
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
              addons: true,
            },
          },
          branch: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const {
      restaurantId,
      branchId,
      items,
      deliveryType = "PICKUP",
      subtotal,
      discount = 0,
      platformFee = 0,
      paymentFee = 0,
      total,
    } = body;

    // Validate required fields
    if (!branchId || !items?.length || !total) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { branchId, itemsLength: items?.length, total },
        },
        { status: 400 }
      );
    }

    // Find branch and validate
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Log the data we're about to insert
    console.log("Creating order with data:", {
      restaurantId: branch.restaurantId,
      branchId,
      customerName: session.user.name,
      userId: session.user.id,
      items: items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        addonCount: item.addons?.length || 0,
      })),
    });

    try {
      // First, validate that all menuItems exist
      const menuItemIds = items.map((item) => item.menuItem.id);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
        },
      });

      if (menuItems.length !== menuItemIds.length) {
        return NextResponse.json(
          {
            error: "One or more menu items not found",
            details: {
              requested: menuItemIds,
              found: menuItems.map((item) => item.id),
            },
          },
          { status: 400 }
        );
      }

      // Create the order
      const order = await prisma.order.create({
        data: {
          restaurantId: branch.restaurantId,
          branchId,
          customerName: session.user.name || "Guest",
          userId: parseInt(session.user.id),
          status: "PENDING",
          deliveryType,
          deliveryCharge: 0,
          deliveryDiscount: 0,
          orderDiscount: discount,
          platformFee,
          paymentProcessingFee: paymentFee,
          total,
          orderItems: {
            create: items.map((item) => {
              // Log each item being created
              console.log("Creating order item:", {
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
                addons: item.addons,
              });

              return {
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
                addons: item.addons?.length
                  ? {
                      connect: item.addons.flatMap((addon) =>
                        addon.items.map((addonItem) => ({
                          id: addonItem.id,
                        }))
                      ),
                    }
                  : undefined,
              };
            }),
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
              addons: true,
            },
          },
        },
      });

      console.log("Order created successfully:", order.id);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: {
          orderId: order.id.toString(),
          userId: session.user.id,
        },
      });

      console.log("Payment intent created:", paymentIntent.id);

      return NextResponse.json({
        order,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (dbError: any) {
      console.error("Database error details:", {
        code: dbError.code,
        message: dbError.message,
        meta: dbError.meta,
      });

      // Check for specific Prisma errors
      if (dbError.code === "P2002") {
        return NextResponse.json(
          {
            error: "Duplicate entry found",
            details: dbError.meta,
          },
          { status: 400 }
        );
      }

      if (dbError.code === "P2003") {
        return NextResponse.json(
          {
            error: "Related record not found",
            details: dbError.meta,
          },
          { status: 400 }
        );
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error("Final error catch:", error);
    return NextResponse.json(
      {
        error: "Failed to process order",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Get the order to verify authorization
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: {
          include: {
            restaurant: true,
            managers: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    const userId = parseInt(session.user.id);
    const canUpdate =
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "RESTAURANT_ADMIN" &&
        order.branch.restaurant.adminId === userId) ||
      (session.user.role === "BRANCH_MANAGER" &&
        order.branch.managers.some((manager) => manager.id === userId));

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderItems: {
          include: {
            menuItem: true,
            addons: true,
          },
        },
        branch: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
