/* =========================================================
   HYDROGROW MARKETPLACE DATA

   Static product catalogue plus a localStorage backed
   persistence layer for seller listings and buyer orders.

   Storage keys:
   - hydrogrow_marketplace_listings
   - hydrogrow_marketplace_orders
   ========================================================= */

/* =========================================================
   STORAGE KEYS
   ========================================================= */

export const LISTINGS_STORAGE_KEY =
  "hydrogrow_marketplace_listings";

export const ORDERS_STORAGE_KEY =
  "hydrogrow_marketplace_orders";

const GUEST_OWNER = "guest";

/* =========================================================
   SHIPPING RULES
   ========================================================= */

export const FREE_SHIPPING_THRESHOLD = 999;

export const SHIPPING_FEE = 49;

/* =========================================================
   CATEGORIES
   ========================================================= */

export const CATEGORIES = [
  {
    id: "all",
    name: "All Products",
    icon: "bi-grid",
  },
  {
    id: "seeds",
    name: "Seeds",
    icon: "bi-flower1",
  },
  {
    id: "nutrients",
    name: "Nutrients",
    icon: "bi-droplet",
  },
  {
    id: "media",
    name: "Growing Media",
    icon: "bi-layers",
  },
  {
    id: "equipment",
    name: "Equipment",
    icon: "bi-tools",
  },
  {
    id: "sensors",
    name: "Sensors",
    icon: "bi-cpu",
  },
  {
    id: "pumps",
    name: "Pumps",
    icon: "bi-water",
  },
  {
    id: "lights",
    name: "Grow Lights",
    icon: "bi-brightness-high",
  },
  {
    id: "accessories",
    name: "Accessories",
    icon: "bi-box-seam",
  },
  {
    id: "produce",
    name: "Fresh Produce",
    icon: "bi-basket",
  },
];

/* =========================================================
   PRODUCTS
   ========================================================= */

export const PRODUCTS = [
  {
    id: "HG-SEED-001",
    name: "Hydroponic Lettuce Seeds",
    category: "seeds",
    categoryName: "Seeds",
    price: 149,
    unit: "Pack",
    seller: "HydroGrow Seeds",
    rating: 4.7,
    reviews: 42,
    stock: 28,
    image: "/images/crops/Lettuce1.jpg",
    icon: "bi-flower1",
    description:
      "Hydroponic-friendly lettuce seeds suitable for controlled growing systems.",
    tags: ["Lettuce", "Seeds", "Beginner"],
  },
  {
    id: "HG-SEED-002",
    name: "Premium Basil Seeds",
    category: "seeds",
    categoryName: "Seeds",
    price: 129,
    unit: "Pack",
    seller: "GreenGrow Seeds",
    rating: 4.6,
    reviews: 31,
    stock: 35,
    image: "/images/crops/Basil1.jpg",
    icon: "bi-flower1",
    description:
      "Basil seeds suitable for NFT, DWC and other hydroponic systems.",
    tags: ["Basil", "Seeds", "Herbs"],
  },
  {
    id: "HG-NUT-001",
    name: "Hydroponic A+B Nutrient Solution",
    category: "nutrients",
    categoryName: "Nutrients",
    price: 699,
    unit: "1 L Kit",
    seller: "HydroNutrients",
    rating: 4.8,
    reviews: 86,
    stock: 17,
    image: null,
    icon: "bi-droplet-half",
    description:
      "Two-part nutrient solution designed for controlled hydroponic feeding.",
    tags: ["A+B", "Nutrients", "Hydroponics"],
  },
  {
    id: "HG-NUT-002",
    name: "Calcium & Magnesium Supplement",
    category: "nutrients",
    categoryName: "Nutrients",
    price: 449,
    unit: "500 ml",
    seller: "Plant Nutrition Co.",
    rating: 4.5,
    reviews: 27,
    stock: 21,
    image: null,
    icon: "bi-droplet",
    description:
      "Supplement intended for calcium and magnesium management in hydroponic crops.",
    tags: ["Cal-Mag", "Supplement"],
  },
  {
    id: "HG-MED-001",
    name: "Coco Coir Growing Media",
    category: "media",
    categoryName: "Growing Media",
    price: 299,
    unit: "5 kg",
    seller: "GrowMedia India",
    rating: 4.6,
    reviews: 54,
    stock: 40,
    image: null,
    icon: "bi-layers",
    description:
      "Coco-based growing medium for hydroponic and soilless cultivation.",
    tags: ["Coco Coir", "Media"],
  },
  {
    id: "HG-MED-002",
    name: "Hydroponic Clay Pebbles",
    category: "media",
    categoryName: "Growing Media",
    price: 399,
    unit: "5 L",
    seller: "GrowMedia India",
    rating: 4.7,
    reviews: 39,
    stock: 24,
    image: null,
    icon: "bi-circle",
    description:
      "Lightweight clay growing media for supporting roots in hydroponic systems.",
    tags: ["Clay Pebbles", "LECA"],
  },
  {
    id: "HG-SEN-001",
    name: "Digital pH Sensor",
    category: "sensors",
    categoryName: "Sensors",
    price: 899,
    unit: "Unit",
    seller: "AgriSense",
    rating: 4.4,
    reviews: 19,
    stock: 11,
    image: null,
    icon: "bi-droplet-half",
    description:
      "Digital pH sensing module for hydroponic water monitoring.",
    tags: ["pH", "Sensor", "Monitoring"],
  },
  {
    id: "HG-SEN-002",
    name: "EC / TDS Sensor Module",
    category: "sensors",
    categoryName: "Sensors",
    price: 1099,
    unit: "Unit",
    seller: "AgriSense",
    rating: 4.5,
    reviews: 23,
    stock: 9,
    image: null,
    icon: "bi-lightning-charge",
    description:
      "EC/TDS sensing module for monitoring nutrient concentration.",
    tags: ["EC", "TDS", "Sensor"],
  },
  {
    id: "HG-PUMP-001",
    name: "12V Hydroponic Water Pump",
    category: "pumps",
    categoryName: "Pumps",
    price: 549,
    unit: "Unit",
    seller: "HydroEquip",
    rating: 4.6,
    reviews: 48,
    stock: 18,
    image: null,
    icon: "bi-water",
    description:
      "Compact 12V pump suitable for hydroponic circulation and irrigation.",
    tags: ["12V", "Pump", "Irrigation"],
  },
  {
    id: "HG-LIGHT-001",
    name: "Full Spectrum Grow Light",
    category: "lights",
    categoryName: "Grow Lights",
    price: 1899,
    unit: "Panel",
    seller: "GrowLight Systems",
    rating: 4.8,
    reviews: 64,
    stock: 7,
    image: null,
    icon: "bi-brightness-high",
    description:
      "Full-spectrum LED grow light for controlled indoor crop cultivation.",
    tags: ["LED", "Full Spectrum", "PPFD"],
  },
  {
    id: "HG-EQP-001",
    name: "NFT Hydroponic Channel Kit",
    category: "equipment",
    categoryName: "Equipment",
    price: 2499,
    unit: "Kit",
    seller: "HydroEquip",
    rating: 4.7,
    reviews: 35,
    stock: 6,
    image: null,
    icon: "bi-tools",
    description:
      "NFT channel kit for setting up a small-scale hydroponic growing system.",
    tags: ["NFT", "System", "Kit"],
  },
  {
    id: "HG-ACC-001",
    name: "Net Pots - 2 Inch",
    category: "accessories",
    categoryName: "Accessories",
    price: 199,
    unit: "20 Pieces",
    seller: "Grow Accessories",
    rating: 4.5,
    reviews: 72,
    stock: 50,
    image: null,
    icon: "bi-grid-3x3",
    description:
      "Reusable net pots designed for hydroponic plant support.",
    tags: ["Net Pots", "Accessories"],
  },
  {
    id: "HG-PROD-001",
    name: "Fresh Hydroponic Lettuce",
    category: "produce",
    categoryName: "Fresh Produce",
    price: 180,
    unit: "1 kg",
    seller: "GreenLeaf Farm",
    rating: 4.9,
    reviews: 17,
    stock: 12,
    image: "/images/crops/Lettuce2.jpg",
    icon: "bi-basket",
    description:
      "Freshly harvested hydroponic lettuce offered directly by the grower.",
    tags: ["Fresh", "Lettuce", "Farm Produce"],
  },
];

/* =========================================================
   STATUS METADATA
   ========================================================= */

export const LISTING_STATUS_META = {
  active: {
    label: "Active",
    icon: "bi-broadcast",
  },
  paused: {
    label: "Paused",
    icon: "bi-pause-circle",
  },
  "sold-out": {
    label: "Sold Out",
    icon: "bi-x-octagon",
  },
};

export const ORDER_STATUS_FLOW = [
  "placed",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_META = {
  placed: {
    label: "Placed",
    icon: "bi-bag-check",
  },
  shipped: {
    label: "Shipped",
    icon: "bi-truck",
  },
  delivered: {
    label: "Delivered",
    icon: "bi-house-check",
  },
  cancelled: {
    label: "Cancelled",
    icon: "bi-x-circle",
  },
};

/* =========================================================
   GENERIC UTILITIES
   ========================================================= */

function toNumber(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function createId(prefix) {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");

  return `${prefix}-${time}${random}`;
}

function daysAgo(days) {
  const date = new Date();

  date.setDate(date.getDate() - days);
  date.setHours(11, 24, 0, 0);

  return date.toISOString();
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + days);

  return date.toISOString();
}

/* =========================================================
   OWNER HELPERS
   ========================================================= */

export function normalizeOwner(owner) {
  if (typeof owner !== "string") {
    return GUEST_OWNER;
  }

  const value = owner.trim().toLowerCase();

  return value || GUEST_OWNER;
}

function ownerDisplayName(owner) {
  if (typeof owner !== "string" || !owner.trim()) {
    return "HydroGrow Guest";
  }

  return owner.trim();
}

/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

export function getCategoryOptions() {
  return CATEGORIES.filter(
    (category) => category.id !== "all"
  );
}

export function getCategoryById(id) {
  return (
    CATEGORIES.find((category) => category.id === id) ||
    null
  );
}

export function getCategoryName(id) {
  return getCategoryById(id)?.name || "Uncategorised";
}

export function getCategoryIcon(id) {
  return getCategoryById(id)?.icon || "bi-box-seam";
}

/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

export function getProducts() {
  return PRODUCTS.map((product) => ({ ...product }));
}

export function getProductById(id) {
  return PRODUCTS.find((product) => product.id === id) || null;
}

/* =========================================================
   FORMATTING HELPERS
   ========================================================= */

export function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString("en-IN")}`;
}

export function formatDate(value, options) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-IN",
    options || {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export function formatDateTime(value) {
  return formatDate(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);

  if (months === 1) {
    return "Last month";
  }

  if (months < 12) {
    return `${months} months ago`;
  }

  const years = Math.floor(months / 12);

  return years === 1 ? "Last year" : `${years} years ago`;
}

export function isValidImageUrl(value) {
  if (!value) {
    return true;
  }

  const url = String(value).trim();

  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("data:image/")
  );
}

/* =========================================================
   STORAGE PRIMITIVES
   ========================================================= */

function readCollection(key) {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCollection(key, value) {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.isArray(value) ? value : [])
    );

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   LISTINGS
   ========================================================= */

function sortListings(listings) {
  return [...listings].sort((a, b) =>
    String(b.createdAt || "").localeCompare(
      String(a.createdAt || "")
    )
  );
}

export function getListingStatus(listing) {
  if (!listing) {
    return "active";
  }

  if (listing.status === "paused") {
    return "paused";
  }

  if (toNumber(listing.stock) <= 0) {
    return "sold-out";
  }

  return "active";
}

export function getListingStatusMeta(listing) {
  const status = getListingStatus(listing);

  return {
    status,
    ...(LISTING_STATUS_META[status] ||
      LISTING_STATUS_META.active),
  };
}

export function getAllListings() {
  return sortListings(readCollection(LISTINGS_STORAGE_KEY));
}

export function getMyListings(owner) {
  const listings = readCollection(LISTINGS_STORAGE_KEY);

  if (!owner) {
    return sortListings(listings);
  }

  const scoped = normalizeOwner(owner);

  return sortListings(
    listings.filter(
      (listing) => listing.ownerId === scoped
    )
  );
}

export function saveMyListings(listings, owner) {
  const next = Array.isArray(listings) ? listings : [];

  if (!owner) {
    writeCollection(LISTINGS_STORAGE_KEY, next);

    return sortListings(next);
  }

  const scoped = normalizeOwner(owner);

  const others = readCollection(LISTINGS_STORAGE_KEY).filter(
    (listing) => listing.ownerId !== scoped
  );

  const owned = next.map((listing) => ({
    ...listing,
    ownerId: scoped,
    ownerName: listing.ownerName || ownerDisplayName(owner),
  }));

  const merged = [...others, ...owned];

  writeCollection(LISTINGS_STORAGE_KEY, merged);

  return sortListings(owned);
}

export function createListing(data = {}, owner) {
  const now = new Date().toISOString();
  const category =
    String(data.category || "").trim() || "produce";

  const listing = {
    id: createId("HG-LST"),
    ownerId: normalizeOwner(owner),
    ownerName: ownerDisplayName(owner),
    name: String(data.name || "").trim(),
    category,
    categoryName: getCategoryName(category),
    price: Math.max(0, toNumber(data.price)),
    unit: String(data.unit || "Pack").trim() || "Pack",
    stock: Math.max(0, Math.round(toNumber(data.stock))),
    description: String(data.description || "").trim(),
    image: String(data.image || "").trim() || null,
    icon: getCategoryIcon(category),
    status: data.status === "paused" ? "paused" : "active",
    unitsSold: 0,
    createdAt: now,
    updatedAt: now,
  };

  const listings = readCollection(LISTINGS_STORAGE_KEY);

  listings.unshift(listing);
  writeCollection(LISTINGS_STORAGE_KEY, listings);

  return listing;
}

export function updateListing(id, patch = {}) {
  const listings = readCollection(LISTINGS_STORAGE_KEY);
  const index = listings.findIndex(
    (listing) => listing.id === id
  );

  if (index === -1) {
    return null;
  }

  const current = listings[index];

  const category =
    patch.category === undefined
      ? current.category
      : String(patch.category).trim() || current.category;

  let status = current.status;

  if (patch.status === "paused") {
    status = "paused";
  }

  if (patch.status === "active") {
    status = "active";
  }

  const updated = {
    ...current,
    ...patch,
    id: current.id,
    ownerId: current.ownerId,
    ownerName: current.ownerName,
    createdAt: current.createdAt,
    category,
    categoryName: getCategoryName(category),
    icon: getCategoryIcon(category),
    name:
      patch.name === undefined
        ? current.name
        : String(patch.name).trim(),
    description:
      patch.description === undefined
        ? current.description
        : String(patch.description).trim(),
    image:
      patch.image === undefined
        ? current.image
        : String(patch.image).trim() || null,
    unit:
      patch.unit === undefined
        ? current.unit
        : String(patch.unit).trim() || current.unit,
    price:
      patch.price === undefined
        ? current.price
        : Math.max(0, toNumber(patch.price, current.price)),
    stock:
      patch.stock === undefined
        ? current.stock
        : Math.max(
            0,
            Math.round(toNumber(patch.stock, current.stock))
          ),
    unitsSold: Math.max(
      0,
      Math.round(toNumber(current.unitsSold))
    ),
    status,
    updatedAt: new Date().toISOString(),
  };

  listings[index] = updated;
  writeCollection(LISTINGS_STORAGE_KEY, listings);

  return updated;
}

export function deleteListing(id) {
  const listings = readCollection(LISTINGS_STORAGE_KEY);
  const next = listings.filter(
    (listing) => listing.id !== id
  );

  if (next.length === listings.length) {
    return false;
  }

  writeCollection(LISTINGS_STORAGE_KEY, next);

  return true;
}

/* =========================================================
   ORDERS
   ========================================================= */

function sortOrders(orders) {
  return [...orders].sort((a, b) =>
    String(b.placedAt || "").localeCompare(
      String(a.placedAt || "")
    )
  );
}

export function buildOrderTotals(items) {
  const subtotal = (Array.isArray(items) ? items : []).reduce(
    (total, item) =>
      total +
      toNumber(item.price) * Math.max(0, toNumber(item.quantity, 1)),
    0
  );

  const quantity = (Array.isArray(items) ? items : []).reduce(
    (total, item) => total + Math.max(0, toNumber(item.quantity, 1)),
    0
  );

  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;

  return {
    quantity,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

function buildOrderItem(product, quantity) {
  return {
    productId: product.id,
    id: product.id,
    name: product.name,
    category: product.category,
    categoryName: product.categoryName || getCategoryName(product.category),
    price: toNumber(product.price),
    unit: product.unit || "Unit",
    seller: product.seller || "HydroGrow Seller",
    image: product.image || null,
    icon: product.icon || getCategoryIcon(product.category),
    quantity: Math.max(1, Math.round(toNumber(quantity, 1))),
  };
}

function buildOrder({
  id,
  owner,
  items,
  status,
  placedAt,
  shippedAt,
  deliveredAt,
  paymentMethod,
  address,
  source,
}) {
  const totals = buildOrderTotals(items);

  return {
    id,
    ownerId: normalizeOwner(owner),
    ownerName: ownerDisplayName(owner),
    placedAt,
    shippedAt: shippedAt || null,
    deliveredAt: deliveredAt || null,
    status,
    items,
    quantity: totals.quantity,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    paymentMethod: paymentMethod || "Cash on Delivery",
    address: address || null,
    source: source || "marketplace",
  };
}

const SEED_ADDRESS = {
  name: "HydroGrow Grower",
  phone: "+91 98765 43210",
  line1: "24 Greenhouse Lane, Agri Tech Park",
  line2: "HydroGrow Farm, Pune",
  pincode: "411045",
  state: "Maharashtra",
};

function seedOrders(owner) {
  const scoped = normalizeOwner(owner);

  const existing = readCollection(ORDERS_STORAGE_KEY);

  if (
    existing.some((order) => order.ownerId === scoped)
  ) {
    return sortOrders(
      existing.filter((order) => order.ownerId === scoped)
    );
  }

  const lettuce = getProductById("HG-PROD-001");
  const netPots = getProductById("HG-ACC-001");
  const nutrients = getProductById("HG-NUT-001");
  const calMag = getProductById("HG-NUT-002");
  const growLight = getProductById("HG-LIGHT-001");

  const seeds = [
    buildOrder({
      id: "HG-ORD-10248",
      owner,
      status: "delivered",
      placedAt: daysAgo(26),
      shippedAt: daysAgo(25),
      deliveredAt: daysAgo(23),
      paymentMethod: "UPI",
      address: SEED_ADDRESS,
      source: "seed",
      items: [buildOrderItem(growLight, 1)],
    }),
    buildOrder({
      id: "HG-ORD-10391",
      owner,
      status: "delivered",
      placedAt: daysAgo(11),
      shippedAt: daysAgo(10),
      deliveredAt: daysAgo(8),
      paymentMethod: "Cash on Delivery",
      address: SEED_ADDRESS,
      source: "seed",
      items: [
        buildOrderItem(lettuce, 2),
        buildOrderItem(netPots, 1),
      ],
    }),
    buildOrder({
      id: "HG-ORD-10477",
      owner,
      status: "shipped",
      placedAt: daysAgo(4),
      shippedAt: daysAgo(3),
      paymentMethod: "UPI",
      address: SEED_ADDRESS,
      source: "seed",
      items: [
        buildOrderItem(nutrients, 1),
        buildOrderItem(calMag, 1),
      ],
    }),
  ].filter(
    (order) =>
      order.items.every((item) => Boolean(item.name))
  );

  writeCollection(ORDERS_STORAGE_KEY, [
    ...seeds,
    ...existing,
  ]);

  return sortOrders(seeds);
}

export function getAllOrders() {
  return sortOrders(readCollection(ORDERS_STORAGE_KEY));
}

export function getOrders(owner) {
  const orders = readCollection(ORDERS_STORAGE_KEY);

  if (!owner) {
    return sortOrders(orders);
  }

  const scoped = normalizeOwner(owner);
  const mine = orders.filter(
    (order) => order.ownerId === scoped
  );

  if (mine.length === 0) {
    return seedOrders(owner);
  }

  return sortOrders(mine);
}

export function getOrderById(id, owner) {
  const orders = owner ? getOrders(owner) : getAllOrders();

  return orders.find((order) => order.id === id) || null;
}

export function saveOrders(orders, owner) {
  const next = Array.isArray(orders) ? orders : [];

  if (!owner) {
    writeCollection(ORDERS_STORAGE_KEY, next);

    return sortOrders(next);
  }

  const scoped = normalizeOwner(owner);

  const others = readCollection(ORDERS_STORAGE_KEY).filter(
    (order) => order.ownerId !== scoped
  );

  const owned = next.map((order) => ({
    ...order,
    ownerId: scoped,
    ownerName: order.ownerName || ownerDisplayName(owner),
  }));

  writeCollection(ORDERS_STORAGE_KEY, [
    ...owned,
    ...others,
  ]);

  return sortOrders(owned);
}

export function placeOrder(product, quantity = 1, owner) {
  if (!product || !product.id) {
    return null;
  }

  const items = [buildOrderItem(product, quantity)];

  const order = buildOrder({
    id: createId("HG-ORD"),
    owner,
    items,
    status: "placed",
    placedAt: new Date().toISOString(),
    paymentMethod: "Cash on Delivery",
    address: SEED_ADDRESS,
    source: "marketplace",
  });

  const orders = readCollection(ORDERS_STORAGE_KEY);

  orders.unshift(order);
  writeCollection(ORDERS_STORAGE_KEY, orders);

  return order;
}

export function updateOrderStatus(id, status) {
  if (!ORDER_STATUS_META[status]) {
    return null;
  }

  const orders = readCollection(ORDERS_STORAGE_KEY);
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();

  const updated = {
    ...orders[index],
    status,
    shippedAt:
      status === "shipped" || status === "delivered"
        ? orders[index].shippedAt || now
        : orders[index].shippedAt,
    deliveredAt:
      status === "delivered"
        ? orders[index].deliveredAt || now
        : null,
  };

  orders[index] = updated;
  writeCollection(ORDERS_STORAGE_KEY, orders);

  return updated;
}

export function getOrderStatusMeta(status) {
  return (
    ORDER_STATUS_META[status] || ORDER_STATUS_META.placed
  );
}

export function getOrderTimeline(order) {
  if (!order) {
    return [];
  }

  const placedAt = order.placedAt || new Date().toISOString();
  const shippedAt =
    order.shippedAt || addDays(placedAt, 1);
  const deliveredAt =
    order.deliveredAt || addDays(placedAt, 3);

  const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const currentIndex =
    statusIndex === -1 ? 0 : statusIndex;

  return [
    {
      key: "placed",
      label: "Order Placed",
      icon: "bi-bag-check",
      at: placedAt,
      confirmed: true,
      note: "HydroGrow has confirmed your order.",
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: "bi-truck",
      at: shippedAt,
      confirmed: currentIndex >= 1,
      note:
        currentIndex >= 1
          ? "Picked up by our logistics partner."
          : "Expected handover to logistics partner.",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: "bi-house-check",
      at: deliveredAt,
      confirmed: currentIndex >= 2,
      note:
        currentIndex >= 2
          ? "Delivered to your registered address."
          : "Expected delivery to your address.",
    },
  ];
}
