const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/marketplaceController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// ---------------------------------------------------
// PRODUCTS
// ---------------------------------------------------

router.get("/products", listProducts);
router.get("/products/mine", protect, myProducts);
router.post("/products", protect, createProduct);
router.put("/products/:id", protect, updateProduct);
router.delete("/products/:id", protect, deleteProduct);

// ---------------------------------------------------
// ORDERS
// ---------------------------------------------------

router.post("/orders", protect, createOrder);
router.get("/orders/buyer", protect, myOrders);
router.get("/orders/seller", protect, sellerOrders);
router.patch("/orders/:id/status", protect, updateOrderStatus);

// ---------------------------------------------------
// ADMIN
// ---------------------------------------------------

router.get("/admin/overview", protect, adminOnly, adminOverview);
router.patch("/admin/products/:id", protect, adminOnly, adminUpdateProduct);
router.delete("/admin/products/:id", protect, adminOnly, adminDeleteProduct);

module.exports = router;
