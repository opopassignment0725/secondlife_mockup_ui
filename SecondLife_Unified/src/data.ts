export type Condition = "Like new" | "Good" | "Fair";
export type Seller = {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  sales: number;
  positive: number;
  response: string;
  since: number;
};
export type Product = {
  id: string;
  title: string;
  category: string;
  condition: Condition;
  price: number;
  stock: number;
  sellerId: string;
  minOfferPct: number;
  desc: string;
  hue: number;
};
export type CartLine = {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  status: "ACTIVE" | "SAVED_FOR_LATER";
  offerId?: string;
};
export type Offer = {
  id: string;
  productId: string;
  proposed: number;
  accepted?: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  expiresAt: number;
  note?: string;
  createdAt: number;
};
export type OrderLine = {
  productId: string;
  title: string;
  qty: number;
  unitPrice: number;
  cartLineId: string;
  cartLineQty: number;
};
export type Tracking = "PENDING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
export type Order = {
  id: string;
  sellerId: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  createdAt: number;
  payDeadline: number;
  status: "AWAITING_PAYMENT" | "PAID" | "CANCELLED" | "COMPLETED";
  tracking: Tracking;
  shippedAt?: number;
  deliveredAt?: number;
  failedAttempts: number;
};
export type Review = {
  id: string;
  orderId: string;
  productId: string;
  rating: number;
  text: string;
};
export type Case = {
  id: string;
  sellerId: string;
  orderId: string;
  productId: string;
  type: string;
  details: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "WITHDRAWN";
  createdAt: number;
};
export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  isDefault: boolean;
};
export type Notice = { id: string; title: string; body: string; at: number; read: boolean };

export const SHIP_COOLDOWN_SEC = 20;
export const PAY_WINDOW_MIN = 15;
export const SHIPPING_FEE = 0;
export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Books",
  "Sports",
  "Baby & Kids",
];
export const CONDITIONS: Condition[] = ["Like new", "Good", "Fair"];

export const SELLERS: Seller[] = [
  {
    id: "s1",
    name: "Kedai Ah Seng Preloved",
    city: "Petaling Jaya, Selangor",
    rating: 4.8,
    reviews: 212,
    sales: 389,
    positive: 98,
    response: "within 2 hours",
    since: 2021,
  },
  {
    id: "s2",
    name: "Nurul's Thrift Corner",
    city: "Shah Alam, Selangor",
    rating: 4.9,
    reviews: 340,
    sales: 612,
    positive: 99,
    response: "within 1 hour",
    since: 2020,
  },
  {
    id: "s3",
    name: "KL Gadget Revival",
    city: "Cheras, Kuala Lumpur",
    rating: 4.5,
    reviews: 128,
    sales: 210,
    positive: 94,
    response: "within 5 hours",
    since: 2022,
  },
  {
    id: "s4",
    name: "Penang Pre-Loved Hub",
    city: "George Town, Pulau Pinang",
    rating: 4.7,
    reviews: 96,
    sales: 158,
    positive: 97,
    response: "within 3 hours",
    since: 2022,
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Samsung Galaxy S22 128GB",
    category: "Electronics",
    condition: "Good",
    price: 1280,
    stock: 2,
    sellerId: "s3",
    minOfferPct: 80,
    hue: 160,
    desc: "Phantom Black, battery health 91%. Includes original box and a new case. Minor hairline scratch on the frame, screen is spotless.",
  },
  {
    id: "p2",
    title: "Sony WH-1000XM4 Headphones",
    category: "Electronics",
    condition: "Like new",
    price: 520,
    stock: 1,
    sellerId: "s3",
    minOfferPct: 75,
    hue: 200,
    desc: "Used for three months. Noise cancelling works perfectly. Comes with carry case and cables.",
  },
  {
    id: "p3",
    title: "Baju Kurung Cotton Set (Size M)",
    category: "Fashion",
    condition: "Like new",
    price: 85,
    stock: 3,
    sellerId: "s2",
    minOfferPct: 70,
    hue: 330,
    desc: "Worn once for Hari Raya. Soft cotton, dusty pink with embroidered neckline.",
  },
  {
    id: "p4",
    title: "Nike Revolution 6 Running Shoes UK8",
    category: "Sports",
    condition: "Good",
    price: 120,
    stock: 1,
    sellerId: "s2",
    minOfferPct: 70,
    hue: 25,
    desc: "Around 80 km of use. Clean sole, no odour. Fits true to size.",
  },
  {
    id: "p5",
    title: "IKEA KALLAX Shelf Unit 4x2",
    category: "Home & Living",
    condition: "Good",
    price: 160,
    stock: 1,
    sellerId: "s1",
    minOfferPct: 70,
    hue: 45,
    desc: "White, minor scuffs on one corner. Self-collect in PJ or add courier fee. Disassembled for shipping.",
  },
  {
    id: "p6",
    title: "Philips Air Fryer HD9200",
    category: "Home & Living",
    condition: "Like new",
    price: 210,
    stock: 4,
    sellerId: "s1",
    minOfferPct: 75,
    hue: 10,
    desc: "4.1L capacity. Barely used, basket is still non-stick perfect. Original manual included.",
  },
  {
    id: "p7",
    title: "Harry Potter Complete Box Set",
    category: "Books",
    condition: "Good",
    price: 190,
    stock: 1,
    sellerId: "s4",
    minOfferPct: 70,
    hue: 270,
    desc: "All 7 paperbacks (Bloomsbury edition). Light shelf wear on the box.",
  },
  {
    id: "p8",
    title: "Giant Escape 3 Hybrid Bicycle",
    category: "Sports",
    condition: "Fair",
    price: 650,
    stock: 1,
    sellerId: "s4",
    minOfferPct: 70,
    hue: 140,
    desc: "Size M frame, 21 speed. Recently serviced, new brake pads. Some paint chips.",
  },
  {
    id: "p9",
    title: "Graco Baby Stroller Lightweight",
    category: "Baby & Kids",
    condition: "Good",
    price: 240,
    stock: 0,
    sellerId: "s2",
    minOfferPct: 70,
    hue: 190,
    desc: "Folds with one hand, includes rain cover. Fabric freshly washed.",
  },
  {
    id: "p10",
    title: "Apple iPad 9th Gen 64GB Wi-Fi",
    category: "Electronics",
    condition: "Good",
    price: 890,
    stock: 2,
    sellerId: "s3",
    minOfferPct: 80,
    hue: 215,
    desc: "Space Grey with tempered glass applied. Battery health 94%. Charger included.",
  },
  {
    id: "p11",
    title: "Batik Sarong Handmade Terengganu",
    category: "Fashion",
    condition: "Like new",
    price: 65,
    stock: 5,
    sellerId: "s2",
    minOfferPct: 70,
    hue: 350,
    desc: "Authentic hand-drawn batik in deep teal. Washed once.",
  },
  {
    id: "p12",
    title: "Yonex Astrox 77 Badminton Racket",
    category: "Sports",
    condition: "Good",
    price: 310,
    stock: 2,
    sellerId: "s1",
    minOfferPct: 75,
    hue: 100,
    desc: "Strung at 26 lbs with fresh BG65 string. Grip replaced. Includes racket bag.",
  },
];

export const SELLER_REVIEWS = [
  {
    who: "Farhan A.",
    stars: 5,
    text: "Item exactly as described, packed very well. Fast shipping to Johor.",
  },
  {
    who: "Mei Ling T.",
    stars: 5,
    text: "Friendly seller, answered all my questions before I bought.",
  },
  { who: "Kumar S.", stars: 4, text: "Good condition, delivery took a day longer than expected." },
];

const H = 3600_000;
export function seed() {
  const t = Date.now();
  const addresses: Address[] = [
    {
      id: "a1",
      label: "Home",
      name: "Aisyah binti Rahman",
      phone: "+60 12-345 6789",
      line1: "12, Jalan Telawi 3",
      line2: "Bangsar Baru",
      postcode: "59100",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      isDefault: true,
    },
    {
      id: "a2",
      label: "Office",
      name: "Aisyah binti Rahman",
      phone: "+60 12-345 6789",
      line1: "Level 8, Menara Cyberjaya",
      line2: "Persiaran Multimedia",
      postcode: "63000",
      city: "Cyberjaya",
      state: "Selangor",
      isDefault: false,
    },
  ];
  const notices: Notice[] = [
    {
      id: "n1",
      title: "Offer accepted",
      body: "Nurul's Thrift Corner accepted your offer on the Nike Revolution 6 shoes. The item is not held for you, so check out soon.",
      at: t - 2 * H,
      read: false,
    },
    {
      id: "n2",
      title: "Order on its way",
      body: "Your Sony headphones order is now in transit.",
      at: t - 20 * H,
      read: false,
    },
    {
      id: "n3",
      title: "Welcome to SecondLife",
      body: "Browse preloved items from sellers across Malaysia.",
      at: t - 90 * H,
      read: true,
    },
  ];
  const cart: CartLine[] = [
    { id: "c1", productId: "p6", qty: 1, unitPrice: 210, status: "ACTIVE" },
    { id: "c2", productId: "p12", qty: 1, unitPrice: 310, status: "ACTIVE" },
    { id: "c3", productId: "p3", qty: 2, unitPrice: 85, status: "ACTIVE" },
    { id: "c4", productId: "p4", qty: 1, unitPrice: 100, status: "ACTIVE", offerId: "o2" },
    { id: "c5", productId: "p10", qty: 1, unitPrice: 890, status: "SAVED_FOR_LATER" },
  ];
  const offers: Offer[] = [
    {
      id: "o1",
      productId: "p1",
      proposed: 1100,
      status: "PENDING",
      expiresAt: t + 18 * H,
      createdAt: t - 6 * H,
      note: "Can do COD at Cheras?",
    },
    {
      id: "o2",
      productId: "p4",
      proposed: 95,
      accepted: 100,
      status: "ACCEPTED",
      expiresAt: t + 22 * H,
      createdAt: t - 2 * H,
    },
    {
      id: "o3",
      productId: "p8",
      proposed: 500,
      status: "PENDING",
      expiresAt: t - 3 * H,
      createdAt: t - 27 * H,
    },
  ];
  const line = (productId: string, title: string, qty: number, unitPrice: number): OrderLine => ({
    productId,
    title,
    qty,
    unitPrice,
    cartLineId: "x" + productId,
    cartLineQty: qty,
  });
  const mk = (id: string, sellerId: string, lines: OrderLine[], o: Partial<Order>): Order => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    return {
      id,
      sellerId,
      lines,
      subtotal,
      shipping: SHIPPING_FEE,
      total: subtotal + SHIPPING_FEE,
      address: "12, Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur",
      createdAt: t - 30 * H,
      payDeadline: t - 29 * H,
      status: "PAID",
      tracking: "PENDING",
      failedAttempts: 0,
      ...o,
    };
  };
  const orders: Order[] = [
    mk("SL-240611-0003", "s4", [line("p7", "Harry Potter Complete Box Set", 1, 190)], {
      status: "AWAITING_PAYMENT",
      createdAt: t - 4 * 60_000,
      payDeadline: t + (PAY_WINDOW_MIN - 4) * 60_000,
    }),
    mk("SL-240609-0002", "s3", [line("p2", "Sony WH-1000XM4 Headphones", 1, 480)], {
      tracking: "IN_TRANSIT",
      shippedAt: t - 26 * H,
      createdAt: t - 50 * H,
    }),
    mk(
      "SL-240601-0001",
      "s1",
      [
        line("p5", "IKEA KALLAX Shelf Unit 4x2", 1, 150),
        line("p11", "Batik Sarong Handmade Terengganu", 2, 65),
      ],
      {
        status: "COMPLETED",
        tracking: "DELIVERED",
        shippedAt: t - 200 * H,
        deliveredAt: t - 150 * H,
        createdAt: t - 220 * H,
      },
    ),
  ];
  const reviews: Review[] = [];
  const cases: Case[] = [
    {
      id: "cs1",
      sellerId: "s1",
      orderId: "SL-240601-0001",
      productId: "p5",
      type: "Not as described",
      details: "One shelf corner has a larger chip than shown in the photos.",
      status: "IN_REVIEW",
      createdAt: t - 100 * H,
    },
  ];
  return { addresses, notices, cart, offers, orders, reviews, cases };
}
