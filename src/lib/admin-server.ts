import { prisma } from "@/lib/db";
import type {
  AdminCourierDetail,
  AdminCourierRow,
  AdminCustomerDetail,
  AdminCustomerRow,
  AdminOrderDetail,
  AdminOrderLineDetail,
  AdminOrderRow,
  AdminOverviewStats,
  AdminProductDetail,
  AdminProductRow,
  AdminSellerDetail,
  AdminSellerRow,
} from "@/lib/admin";
import { deriveOrderFulfillmentStatus } from "@/lib/order-status";
import { getBuyerFulfillmentLabel } from "@/lib/order-status";
import { getProductConditionLabel } from "@/lib/product-condition";
import {
  DELIVERY_VEHICLE_LABELS,
  isDeliveryVehicleType,
} from "@/lib/delivery";
import {
  courierPayoutForStop,
  isSingleShopOrder,
  normalizeShippingTier,
  settleDeliveryFee,
  SHIPPING_TIER_FEES,
  SHIPPING_TIER_LABELS,
} from "@/lib/shipping";

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
      shipping: order.shipping,
      shippingName: order.shippingName,
      city: order.city,
      buyerName: order.user?.name ?? null,
      buyerPhone: order.user?.phone ?? null,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      fulfillmentSummary: getBuyerFulfillmentLabel(status),
    };
  });
}

export async function getAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              image: true,
              shippingTier: true,
              seller: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  sellerProfile: { select: { shopName: true } },
                },
              },
            },
          },
          delivery: {
            select: {
              id: true,
              name: true,
              phone: true,
              deliveryProfile: {
                select: { vehicleType: true, serviceArea: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  const fulfillmentStatus = deriveOrderFulfillmentStatus(order.items);
  const assignedAt = order.items
    .map((i) => i.deliveryAssignedAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const deliveredAt = order.items
    .map((i) => i.deliveredAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const readyDone =
    fulfillmentStatus === "shipped" ||
    fulfillmentStatus === "delivered" ||
    order.items.some((i) =>
      ["shipped", "delivered"].includes(i.fulfillmentStatus),
    );

  const items: AdminOrderLineDetail[] = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productImage: item.product.image,
    quantity: item.quantity,
    unitPrice: item.priceAtPurchase,
    lineTotal: Math.round(item.priceAtPurchase * item.quantity * 100) / 100,
    commissionRate: item.commissionRate,
    commissionAmount: item.commissionAmount,
    sellerEarnings: item.sellerEarnings,
    fulfillmentStatus: item.fulfillmentStatus,
    fulfillmentLabel: getBuyerFulfillmentLabel(item.fulfillmentStatus),
    seller: item.product.seller
      ? {
          id: item.product.seller.id,
          name: item.product.seller.name,
          phone: item.product.seller.phone,
          shopName: item.product.seller.sellerProfile?.shopName ?? null,
        }
      : null,
    courier: item.delivery
      ? {
          id: item.delivery.id,
          name: item.delivery.name,
          phone: item.delivery.phone,
          vehicleType: item.delivery.deliveryProfile?.vehicleType ?? null,
          serviceArea: item.delivery.deliveryProfile?.serviceArea ?? null,
        }
      : null,
    deliveryAssignedAt: item.deliveryAssignedAt?.toISOString() ?? null,
    deliveredAt: item.deliveredAt?.toISOString() ?? null,
  }));

  const platformCommission =
    Math.round(
      items.reduce((sum, item) => sum + item.commissionAmount, 0) * 100,
    ) / 100;

  const singleShop = isSingleShopOrder(
    order.items.map((item) => ({
      quantity: item.quantity,
      shippingTier: item.product.shippingTier,
      sellerId: item.product.seller?.id ?? null,
    })),
  );
  const orderUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const courierPayout = courierPayoutForStop(
    order.items.length,
    order.shipping,
    singleShop,
    orderUnits,
  );
  const { platform: platformDeliveryMargin } = settleDeliveryFee(
    order.shipping,
    courierPayout,
  );

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    subtotal: order.subtotal,
    shipping: order.shipping,
    courierPayout,
    platformDeliveryMargin,
    platformCommission,
    tax: order.tax,
    total: order.total,
    shippingName: order.shippingName,
    address: order.address,
    city: order.city,
    zip: order.zip,
    fulfillmentSummary: getBuyerFulfillmentLabel(fulfillmentStatus),
    fulfillmentStatus,
    buyer: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          phone: order.user.phone,
          email: order.user.email,
        }
      : null,
    items,
    timeline: [
      {
        key: "placed",
        label: "Order placed",
        at: order.createdAt.toISOString(),
        done: true,
      },
      {
        key: "ready",
        label: "Ready for delivery",
        at: readyDone ? (assignedAt?.toISOString() ?? null) : null,
        done: readyDone,
      },
      {
        key: "assigned",
        label: "Courier assigned",
        at: assignedAt?.toISOString() ?? null,
        done: Boolean(assignedAt),
      },
      {
        key: "delivered",
        label: "Delivered",
        at: deliveredAt?.toISOString() ?? null,
        done: fulfillmentStatus === "delivered",
      },
    ],
  };
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

export async function getAdminProductDetail(
  productId: string,
): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          sellerProfile: {
            select: {
              shopName: true,
              location: true,
              category: true,
            },
          },
          _count: { select: { products: true } },
        },
      },
      orderItems: {
        select: {
          quantity: true,
          priceAtPurchase: true,
          fulfillmentStatus: true,
        },
      },
    },
  });

  if (!product) return null;

  const tier = normalizeShippingTier(product.shippingTier);
  const images =
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  let unitsSold = 0;
  let unitsPending = 0;
  let unitsInTransit = 0;
  let unitsDelivered = 0;
  let unitsCancelled = 0;
  let revenue = 0;

  for (const item of product.orderItems) {
    if (item.fulfillmentStatus === "cancelled") {
      unitsCancelled += item.quantity;
      continue;
    }
    unitsSold += item.quantity;
    revenue += item.priceAtPurchase * item.quantity;
    if (item.fulfillmentStatus === "pending") unitsPending += item.quantity;
    else if (item.fulfillmentStatus === "shipped") unitsInTransit += item.quantity;
    else if (item.fulfillmentStatus === "delivered") unitsDelivered += item.quantity;
  }

  const inventoryStatus =
    product.stock <= 0
      ? "out_of_stock"
      : product.stock <= 5
        ? "low_stock"
        : "in_stock";

  const inventoryStatusLabel =
    inventoryStatus === "out_of_stock"
      ? "Out of stock"
      : inventoryStatus === "low_stock"
        ? "Low stock"
        : "In stock";

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    stock: product.stock,
    featured: product.featured,
    size: product.size,
    condition: product.condition,
    conditionLabel: getProductConditionLabel(product.condition),
    shippingTier: tier,
    shippingTierLabel: SHIPPING_TIER_LABELS[tier],
    shippingTierFee: SHIPPING_TIER_FEES[tier],
    rating: product.rating,
    reviewCount: product.reviewCount,
    image: product.image,
    images,
    inventoryStatus,
    inventoryStatusLabel,
    shop: product.seller?.sellerProfile
      ? {
          shopName: product.seller.sellerProfile.shopName,
          location: product.seller.sellerProfile.location,
          category: product.seller.sellerProfile.category,
          ownerName: product.seller.name,
          ownerPhone: product.seller.phone,
          ownerEmail: product.seller.email,
          listings: product.seller._count.products,
        }
      : null,
    seller: product.seller
      ? {
          id: product.seller.id,
          name: product.seller.name,
          phone: product.seller.phone,
          email: product.seller.email,
        }
      : null,
    sales: {
      unitsSold,
      unitsPending,
      unitsInTransit,
      unitsDelivered,
      unitsCancelled,
      revenue: Math.round(revenue * 100) / 100,
      orderLines: product.orderItems.length,
    },
    storefrontHref: `/product/${product.id}`,
  };
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

export async function getAdminCustomerDetail(
  userId: string,
): Promise<AdminCustomerDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sellerProfile: {
        select: {
          id: true,
          shopName: true,
          location: true,
          category: true,
        },
      },
      deliveryProfile: {
        select: {
          id: true,
          vehicleType: true,
          serviceArea: true,
          active: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          items: { select: { fulfillmentStatus: true } },
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!user) return null;

  const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    orderCount: user._count.orders,
    totalSpent: Math.round(totalSpent * 100) / 100,
    recentOrders: user.orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      city: order.city,
      fulfillmentSummary: getBuyerFulfillmentLabel(
        deriveOrderFulfillmentStatus(order.items),
      ),
    })),
    sellerProfile: user.sellerProfile
      ? {
          id: user.sellerProfile.id,
          shopName: user.sellerProfile.shopName,
          location: user.sellerProfile.location,
          category: user.sellerProfile.category,
        }
      : null,
    deliveryProfile: user.deliveryProfile
      ? {
          id: user.deliveryProfile.id,
          vehicleType: user.deliveryProfile.vehicleType,
          serviceArea: user.deliveryProfile.serviceArea,
          active: user.deliveryProfile.active,
        }
      : null,
  };
}

export async function getAdminSellerDetail(
  sellerProfileId: string,
): Promise<AdminSellerDetail | null> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          products: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              featured: true,
              orderItems: {
                select: {
                  quantity: true,
                  priceAtPurchase: true,
                  fulfillmentStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!seller) return null;

  let unitsInStock = 0;
  let featured = 0;
  let lowStock = 0;
  let unitsSold = 0;
  let revenue = 0;
  let pendingOrders = 0;

  for (const product of seller.user.products) {
    unitsInStock += product.stock;
    if (product.featured) featured += 1;
    if (product.stock <= 5) lowStock += 1;
    for (const item of product.orderItems) {
      if (item.fulfillmentStatus === "cancelled") continue;
      unitsSold += item.quantity;
      revenue += item.priceAtPurchase * item.quantity;
      if (item.fulfillmentStatus === "pending") pendingOrders += 1;
    }
  }

  return {
    id: seller.id,
    userId: seller.userId,
    shopName: seller.shopName,
    location: seller.location,
    category: seller.category,
    licenseUrl: seller.licenseUrl,
    completedAt: seller.completedAt.toISOString(),
    createdAt: seller.createdAt.toISOString(),
    owner: {
      id: seller.user.id,
      name: seller.user.name,
      phone: seller.user.phone,
      email: seller.user.email,
    },
    stats: {
      listings: seller.user.products.length,
      unitsInStock,
      featured,
      lowStock,
      unitsSold,
      revenue: Math.round(revenue * 100) / 100,
      pendingOrders,
    },
    products: seller.user.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      featured: p.featured,
    })),
  };
}

export async function getAdminCourierDetail(
  deliveryProfileId: string,
): Promise<AdminCourierDetail | null> {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: deliveryProfileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          deliveries: {
            orderBy: { deliveryAssignedAt: "desc" },
            take: 40,
            include: {
              order: {
                select: {
                  id: true,
                  shippingName: true,
                  city: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) return null;

  const today = startOfToday();
  const active = profile.user.deliveries.filter(
    (d) => d.fulfillmentStatus === "shipped",
  );
  const delivered = profile.user.deliveries.filter(
    (d) => d.fulfillmentStatus === "delivered",
  );
  const deliveredToday = delivered.filter(
    (d) => d.deliveredAt && d.deliveredAt >= today,
  );

  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    phone: profile.user.phone,
    email: profile.user.email,
    vehicleType: profile.vehicleType,
    vehicleLabel: isDeliveryVehicleType(profile.vehicleType)
      ? DELIVERY_VEHICLE_LABELS[profile.vehicleType]
      : profile.vehicleType,
    serviceArea: profile.serviceArea,
    active: profile.active,
    createdAt: profile.createdAt.toISOString(),
    stats: {
      activeJobs: active.length,
      deliveredTotal: delivered.length,
      deliveredToday: deliveredToday.length,
    },
    activeDeliveries: active.map((d) => ({
      id: d.id,
      orderId: d.order.id,
      productName: d.productName,
      shippingName: d.order.shippingName,
      city: d.order.city,
      assignedAt: d.deliveryAssignedAt?.toISOString() ?? null,
    })),
    recentDeliveries: delivered.slice(0, 15).map((d) => ({
      id: d.id,
      orderId: d.order.id,
      productName: d.productName,
      shippingName: d.order.shippingName,
      city: d.order.city,
      deliveredAt: d.deliveredAt?.toISOString() ?? null,
    })),
  };
}
