import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "wireless-headphones",
    name: "AeroSound Pro Wireless Headphones",
    description:
      "Active noise cancellation, 40-hour battery, and studio-grade drivers for immersive listening anywhere.",
    price: 149.99,
    category: "electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    rating: 4.7,
    reviewCount: 2841,
    stock: 42,
    featured: true,
  },
  {
    id: "smart-watch",
    name: "PulseTrack Smart Watch",
    description:
      "Heart-rate monitoring, GPS, sleep tracking, and 7-day battery in a lightweight aluminum case.",
    price: 229.0,
    category: "electronics",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    rating: 4.5,
    reviewCount: 1203,
    stock: 28,
    featured: true,
  },
  {
    id: "linen-shirt",
    name: "Coastal Linen Shirt",
    description:
      "Breathable European linen with a relaxed fit — perfect for warm days and easy layering.",
    price: 68.0,
    category: "fashion",
    size: "L",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    rating: 4.6,
    reviewCount: 512,
    stock: 65,
    featured: true,
  },
  {
    id: "running-shoes",
    name: "Velocity Run Sneakers",
    description:
      "Lightweight mesh upper with responsive foam cushioning for daily miles and race day.",
    price: 119.99,
    category: "sports",
    size: "42",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    rating: 4.8,
    reviewCount: 3420,
    stock: 18,
    featured: true,
  },
  {
    id: "ceramic-planter",
    name: "Minimal Ceramic Planter Set",
    description:
      "Hand-glazed trio of planters with drainage trays — ideal for succulents and herbs.",
    price: 45.0,
    category: "home",
    image:
      "https://images.unsplash.com/photo-1485955900006-10f4d024d42d?w=800&q=80",
    rating: 4.4,
    reviewCount: 189,
    stock: 33,
    featured: false,
  },
  {
    id: "desk-lamp",
    name: "Lumen Desk Lamp",
    description:
      "Adjustable warm-to-cool LED with touch dimmer and USB-C charging port built into the base.",
    price: 79.5,
    category: "home",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    rating: 4.3,
    reviewCount: 276,
    stock: 50,
    featured: false,
  },
  {
    id: "yoga-mat",
    name: "GripFlow Yoga Mat",
    description:
      "Extra-thick eco rubber with alignment guides and a carrying strap included.",
    price: 54.99,
    category: "sports",
    size: "One Size",
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
    rating: 4.6,
    reviewCount: 891,
    stock: 74,
    featured: false,
  },
  {
    id: "design-book",
    name: "The Art of Everyday Design",
    description:
      "A beautifully illustrated guide to creating products people love — 320 pages, hardcover.",
    price: 38.0,
    category: "books",
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    rating: 4.9,
    reviewCount: 156,
    stock: 120,
    featured: false,
  },
  {
    id: "leather-tote",
    name: "Heritage Leather Tote",
    description:
      "Full-grain vegetable-tanned leather with interior laptop sleeve and magnetic closure.",
    price: 185.0,
    category: "fashion",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    rating: 4.7,
    reviewCount: 423,
    stock: 12,
    featured: false,
  },
  {
    id: "bluetooth-speaker",
    name: "WaveBox Portable Speaker",
    description:
      "IPX7 waterproof, 360° sound, and 18-hour playtime — party-ready and pocket-sized.",
    price: 89.99,
    category: "electronics",
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
    rating: 4.5,
    reviewCount: 967,
    stock: 55,
    featured: false,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
