const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const MarketplaceProduct = require("../models/MarketplaceProduct");
const Order = require("../models/Order");

const ORDER_FLOW = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const formatProduct = (product) => ({
  id: String(product._id),
  cropName: product.cropName,
  title: product.title,
  description: product.description,
  quantity: product.quantity,
  unit: product.unit,
  price: product.price,
  location: product.location,
  image: product.image,
  status: product.status,
  harvestDate: product.harvestDate,
  sellerId: product.sellerId,
  createdAt: product.createdAt,
});

// ---------------------------------------------------
// PRODUCTS
// ---------------------------------------------------

const listProducts = asyncHandler(async (req, res) => {
  const { search, status, crop } = req.query;

  const query = {};

  if (status && status !== "ALL") {
    query.status = status;
  } else if (!status) {
    query.status = "AVAILABLE";
  }

  if (crop) {
    query.cropName = new RegExp(String(crop).trim(), "i");
  }

  if (search) {
    const regex = new RegExp(String(search).trim(), "i");

    query.$or = [{ title: regex }, { cropName: regex }, { location: regex }];
  }

  const products = await MarketplaceProduct.find(query)
    .populate("sellerId", "name username avatar")
    .sort({ createdAt: -1 })
    .limit(300);

  res.status(200).json({
    success: true,
    count: products.length,
    products: products.map((product) => ({
      ...formatProduct(product),
      seller: product.sellerId
        ? {
            id: String(product.sellerId._id),
            name: product.sellerId.name,
            username: product.sellerId.username,
            avatar: product.sellerId.avatar,
          }
        : null,
    })),
  });
});

const myProducts = asyncHandler(async (req, res) => {
  const products = await MarketplaceProduct.find({
    sellerId: req.user._id,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products: products.map(formatProduct),
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { cropName, title, description, quantity, unit, price, location, image, harvestDate } =
    req.body || {};

  if (!cropName || !title) {
    throw new ApiError(400, "Crop name and title are required.");
  }

  const quantityNum = Number(quantity);
  const priceNum = Number(price);

  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    throw new ApiError(400, "Quantity must be a positive number.");
  }

  if (!Number.isFinite(priceNum) || priceNum < 0) {
    throw new ApiError(400, "Price must be a positive number.");
  }

  const product = await MarketplaceProduct.create({
    sellerId: req.user._id,
    cropName,
    title,
    description: description || "",
    quantity: quantityNum,
    unit: unit || "kg",
    price: priceNum,
    location: location || "",
    image: image || "",
    harvestDate: harvestDate ? new Date(harvestDate) : null,
  });

  res.status(201).json({
    success: true,
    message: "Listing created.",
    product: formatProduct(product),
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await MarketplaceProduct.findOne({
    _id: req.params.id,
    sellerId: req.user._id,
  });

  if (!product) {
    throw new ApiError(404, "Listing not found.");
  }

  const body = req.body || {};

  const fields = ["title", "description", "unit", "location", "image", "status"];

  for (const field of fields) {
    if (typeof body[field] === "string") {
      product[field] = body[field].trim();
    }
  }

  if (typeof body.cropName === "string" && body.cropName.trim()) {
    product.cropName = body.cropName.trim();
  }

  if (body.quantity !== undefined) {
    const quantityNum = Number(body.quantity);

    if (!Number.isFinite(quantityNum) || quantityNum < 0) {
      throw new ApiError(400, "Quantity must be a positive number.");
    }

    product.quantity = quantityNum;
  }

  if (body.price !== undefined) {
    const priceNum = Number(body.price);

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      throw new ApiError(400, "Price must be a positive number.");
    }

    product.price = priceNum;
  }

  if (body.harvestDate) {
    product.harvestDate = new Date(body.harvestDate);
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: "Listing updated.",
    product: formatProduct(product),
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await MarketplaceProduct.findOne({
    _id: req.params.id,
    sellerId: req.user._id,
  });

  if (!product) {
    throw new ApiError(404, "Listing not found.");
  }

  await product.deleteOne();

  res.status(200).json({ success: true, message: "Listing removed." });
});

// ---------------------------------------------------
// ORDERS
// ---------------------------------------------------

const generateOrderNumber = () =>
  `HG-ORD-${Date.now().toString(36).toUpperCase()}`;

const createOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, deliveryAddress, note } = req.body || {};

  const product = await MarketplaceProduct.findById(productId);

  if (!product) {
    throw new ApiError(404, "Listing not found.");
  }

  if (product.status !== "AVAILABLE") {
    throw new ApiError(400, "This listing is no longer available.");
  }

  if (String(product.sellerId) === String(req.user._id)) {
    throw new ApiError(400, "You cannot order your own listing.");
  }

  const quantityNum = Number(quantity);

  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    throw new ApiError(400, "Quantity must be a positive number.");
  }

  if (quantityNum > product.quantity) {
    throw new ApiError(
      400,
      `Only ${product.quantity} ${product.unit} available.`
    );
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    productId: product._id,
    productTitle: product.title,
    cropName: product.cropName,
    buyerId: req.user._id,
    sellerId: product.sellerId,
    quantity: quantityNum,
    unit: product.unit,
    pricePerUnit: product.price,
    totalPrice: Number((quantityNum * product.price).toFixed(2)),
    deliveryAddress: deliveryAddress || "",
    note: note || "",
    statusHistory: [
      { status: "PENDING", at: new Date(), by: req.user._id },
    ],
  });

  product.quantity = Number((product.quantity - quantityNum).toFixed(2));

  if (product.quantity <= 0) {
    product.status = "SOLD_OUT";
  }

  await product.save();

  res.status(201).json({
    success: true,
    message: "Order placed.",
    order,
  });
});

const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(200).json({ success: true, count: orders.length, orders });
});

const sellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ sellerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(200).json({ success: true, count: orders.length, orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
    throw new ApiError(400, "Invalid status.");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  const isSeller = String(order.sellerId) === String(req.user._id);
  const isBuyer = String(order.buyerId) === String(req.user._id);

  if (!isSeller && !isBuyer) {
    throw new ApiError(403, "You are not part of this order.");
  }

  if (isBuyer && !isSeller && status !== "CANCELLED") {
    throw new ApiError(403, "Buyers can only cancel an order.");
  }

  if (status === "CANCELLED") {
    const product = await MarketplaceProduct.findById(order.productId);

    if (product && !ORDER_FLOW.includes(order.status)) {
      product.quantity = Number((product.quantity + order.quantity).toFixed(2));

      if (product.status === "SOLD_OUT" && product.quantity > 0) {
        product.status = "AVAILABLE";
      }

      await product.save();
    }
  }

  order.status = status;
  order.statusHistory.push({ status, at: new Date(), by: req.user._id });
  await order.save();

  res.status(200).json({ success: true, message: `Order ${status}.`, order });
});

// ---------------------------------------------------
// ADMIN OVERVIEW
// ---------------------------------------------------

const adminOverview = asyncHandler(async (req, res) => {
  const [productCount, availableCount, orderCount, products, orders, revenueAgg] =
    await Promise.all([
      MarketplaceProduct.countDocuments({}),
      MarketplaceProduct.countDocuments({ status: "AVAILABLE" }),
      Order.countDocuments({}),
      MarketplaceProduct.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("sellerId", "name username"),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("buyerId", "name username")
        .populate("sellerId", "name username"),
      Order.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
      ]),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      products: productCount,
      available: availableCount,
      orders: orderCount,
      revenue: revenueAgg.length > 0 ? revenueAgg[0].revenue : 0,
    },
    products: products.map((product) => ({
      ...formatProduct(product),
      sellerName: product.sellerId ? product.sellerId.name : "",
      sellerUsername: product.sellerId ? product.sellerId.username : "",
    })),
    orders: orders.map((order) => ({
      ...order.toObject(),
      buyerName: order.buyerId ? order.buyerId.name : "",
      sellerName: order.sellerId ? order.sellerId.name : "",
    })),
  });
});

// ---------------------------------------------------
// ADMIN MODERATION
// ---------------------------------------------------

const PRODUCT_ADMIN_STATUS = {
  active: "AVAILABLE",
  paused: "INACTIVE",
};

const adminUpdateProduct = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!Object.prototype.hasOwnProperty.call(PRODUCT_ADMIN_STATUS, status)) {
    throw new ApiError(400, "status must be 'active' or 'paused'.");
  }

  const product = await MarketplaceProduct.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Listing not found.");
  }

  const nextStatus = PRODUCT_ADMIN_STATUS[status];

  if (nextStatus === "AVAILABLE" && product.quantity <= 0) {
    throw new ApiError(400, "Cannot activate a listing with no stock.");
  }

  product.status = nextStatus;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Listing ${status === "active" ? "activated" : "paused"}.`,
    product: formatProduct(product),
  });
});

const adminDeleteProduct = asyncHandler(async (req, res) => {
  const product = await MarketplaceProduct.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Listing not found.");
  }

  await product.deleteOne();

  res.status(200).json({ success: true, message: "Listing removed." });
});

module.exports = {
  listProducts,
  myProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  myOrders,
  sellerOrders,
  updateOrderStatus,
  adminOverview,
  adminUpdateProduct,
  adminDeleteProduct,
};
