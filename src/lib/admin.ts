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
  shippingName: string;
  city: string;
  buyerName: string | null;
  buyerPhone: string | null;
  itemCount: number;
  fulfillmentSummary: string;
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

export interface AdminCustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
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
