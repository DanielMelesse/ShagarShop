export interface AdminOverviewStats {
  revenueTotal: number;
  revenueToday: number;
  ordersTotal: number;
  ordersToday: number;
  pendingFulfillment: number;
  unassignedDeliveries: number;
  productsLive: number;
  lowStock: number;
  buyers: number;
  sellers: number;
  couriers: number;
  activeCouriers: number;
}

export interface AdminOrderRow {
  id: string;
  createdAt: string;
  total: number;
  shipping: number;
  shippingName: string;
  city: string;
  buyerName: string | null;
  buyerPhone: string | null;
  itemCount: number;
  fulfillmentSummary: string;
}

export interface AdminOrderLineDetail {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  fulfillmentStatus: string;
  fulfillmentLabel: string;
  seller: {
    id: string;
    name: string;
    phone: string;
    shopName: string | null;
  } | null;
  courier: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string | null;
    serviceArea: string | null;
  } | null;
  deliveryAssignedAt: string | null;
  deliveredAt: string | null;
}

export interface AdminOrderDetail {
  id: string;
  status: string;
  createdAt: string;
  subtotal: number;
  shipping: number;
  /** Courier payout for the stop (standard % split or fixed large/oversized). */
  courierPayout: number;
  /** Buyer shipping − courier payout (ShegerShop margin). */
  platformDeliveryMargin: number;
  /** Sum of seller commissions on this order. */
  platformCommission: number;
  tax: number;
  total: number;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  fulfillmentSummary: string;
  fulfillmentStatus: string;
  buyer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  items: AdminOrderLineDetail[];
  timeline: {
    key: string;
    label: string;
    at: string | null;
    done: boolean;
  }[];
}

export interface AdminProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  featured: boolean;
  sellerName: string | null;
  shopName: string | null;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  featured: boolean;
  size: string | null;
  condition: string;
  conditionLabel: string;
  shippingTier: string;
  shippingTierLabel: string;
  shippingTierFee: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  inventoryStatus: "in_stock" | "low_stock" | "out_of_stock";
  inventoryStatusLabel: string;
  shop: {
    shopName: string;
    location: string;
    category: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string | null;
    listings: number;
  } | null;
  seller: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  sales: {
    unitsSold: number;
    unitsPending: number;
    unitsInTransit: number;
    unitsDelivered: number;
    unitsCancelled: number;
    revenue: number;
    orderLines: number;
  };
  storefrontHref: string;
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  recentOrders: {
    id: string;
    createdAt: string;
    total: number;
    city: string;
    fulfillmentSummary: string;
  }[];
  sellerProfile: {
    id: string;
    shopName: string;
    location: string;
    category: string;
  } | null;
  deliveryProfile: {
    id: string;
    vehicleType: string;
    serviceArea: string;
    active: boolean;
  } | null;
}

export interface AdminSellerRow {
  id: string;
  userId: string;
  shopName: string;
  location: string;
  category: string;
  ownerName: string;
  ownerPhone: string;
  listings: number;
  completedAt: string;
}

export interface AdminSellerDetail {
  id: string;
  userId: string;
  shopName: string;
  location: string;
  category: string;
  licenseUrl: string;
  completedAt: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  stats: {
    listings: number;
    unitsInStock: number;
    featured: number;
    lowStock: number;
    unitsSold: number;
    revenue: number;
    pendingOrders: number;
  };
  products: {
    id: string;
    name: string;
    price: number;
    stock: number;
    featured: boolean;
  }[];
}

export interface AdminCourierRow {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  serviceArea: string;
  active: boolean;
  activeJobs: number;
}

export interface AdminCourierDetail {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  vehicleType: string;
  vehicleLabel: string;
  serviceArea: string;
  active: boolean;
  createdAt: string;
  stats: {
    activeJobs: number;
    deliveredTotal: number;
    deliveredToday: number;
  };
  activeDeliveries: {
    id: string;
    orderId: string;
    productName: string;
    shippingName: string;
    city: string;
    assignedAt: string | null;
  }[];
  recentDeliveries: {
    id: string;
    orderId: string;
    productName: string;
    shippingName: string;
    city: string;
    deliveredAt: string | null;
  }[];
}
