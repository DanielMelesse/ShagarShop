import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSellerProfileForUser } from "@/lib/seller-profile";
import { requireAuthSession } from "@/lib/require-auth";
import { isSellerRole } from "@/lib/user-role";

export async function GET(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.session.user.id;
  const [user, sellerProfile, orderCount, listingCount, pendingSellerOrders] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      getSellerProfileForUser(userId),
      prisma.order.count({ where: { userId } }),
      isSellerRole(auth.session.user.role)
        ? prisma.product.count({ where: { sellerId: userId } })
        : Promise.resolve(0),
      isSellerRole(auth.session.user.role)
        ? prisma.orderItem.count({
            where: {
              fulfillmentStatus: "pending",
              product: { sellerId: userId },
            },
          })
        : Promise.resolve(0),
    ]);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    sellerProfile: sellerProfile
      ? {
          shopName: sellerProfile.shopName,
          location: sellerProfile.location,
          category: sellerProfile.category,
          licenseUrl: sellerProfile.licenseUrl,
          completedAt: sellerProfile.completedAt.toISOString(),
        }
      : null,
    stats: {
      orderCount,
      listingCount,
      pendingSellerOrders,
    },
  });
}
