import { prisma } from "@/lib/db";
import type {
  AdminCourierRow,
  AdminCustomerRow,
  AdminOrderRow,
  AdminOverviewStats,
  AdminProductRow,
  AdminSellerRow,
} from "@/lib/admin";
import { deriveOrderFulfillmentStatus } from "@/lib/order-status";
import { getBuyerFulfillmentLabel } from "@/lib/order-status";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const today = startOfToday();

  const [
    revenueAgg,
    revenueTodayAgg,
    ordersTotal,
    ordersToday,
    pendingFulfillment,
    unassignedDeliveries,
    productsLive,
    lowStock,
    buyers,
    sellers,
    couriers,
    activeCouriers,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.orderItem.count({ where: { fulfillmentStatus: "pending" } }),
    prisma.orderItem.count({
      where: { fulfillmentStatus: "shipped", deliveryId: null },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.sellerProfile.count(),
    prisma.deliveryProfile.count(),
    prisma.deliveryProfile.count({ where: { active: true } }),
  ]);

  return {
    revenueTotal: Math.round((revenueAgg._sum.total ?? 0) * 100) / 100,
    revenueToday: Math.round((revenueTodayAgg._sum.total ?? 0) * 100) / 100,
    ordersTotal,
    ordersToday,
    pendingFulfillment,
    unassignedDeliveries,
    productsLive,
    lowStock,
    buyers,
    sellers,
    couriers,
    activeCouriers,
  };
}

export async function listAdminOrders(limit = 50): Promise<AdminOrderRow[]> {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      items: { select: { quantity: true, fulfillmentStatus: true } },
    },
  });

  return orders.map((order) => {
    const status = deriveOrderFulfillmentStatus(order.items);
    return {
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      shippingName: order.shippingName,
      city: order.city,
      buyerName: order.user?.name ?? null,
      buyerPhone: order.user?.phone ?? null,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      fulfillmentSummary: getBuyerFulfillmentLabel(status),
    };
  });
}

export async function listAdminProducts(limit = 100): Promise<AdminProductRow[]> {
  const products = await prisma.product.findMany({
    take: limit,
    orderBy: { name: "asc" },
    include: {
      seller: {
        select: {
          name: true,
          sellerProfile: { select: { shopName: true } },
        },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    featured: p.featured,
    sellerName: p.seller?.name ?? null,
    shopName: p.seller?.sellerProfile?.shopName ?? null,
  }));
}

export async function listAdminCustomers(limit = 100): Promise<AdminCustomerRow[]> {
  const users = await prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    orderCount: u._count.orders,
  }));
}

export async function listAdminSellers(): Promise<AdminSellerRow[]> {
  const sellers = await prisma.sellerProfile.findMany({
    orderBy: { completedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          _count: { select: { products: true } },
        },
      },
    },
  });

  return sellers.map((s) => ({
    id: s.id,
    userId: s.userId,
    shopName: s.shopName,
    location: s.location,
    category: s.category,
    ownerName: s.user.name,
    ownerPhone: s.user.phone,
    listings: s.user._count.products,
    completedAt: s.completedAt.toISOString(),
  }));
}

export async function listAdminCouriers(): Promise<AdminCourierRow[]> {
  const couriers = await prisma.deliveryProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          deliveries: {
            where: { fulfillmentStatus: "shipped" },
            select: { id: true },
          },
        },
      },
    },
  });

  return couriers.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.user.name,
    phone: c.user.phone,
    vehicleType: c.vehicleType,
    serviceArea: c.serviceArea,
    active: c.active,
    activeJobs: c.user.deliveries.length,
  }));
}
