const express = require("express");

const router = express.Router();

const {
  listAlerts,
  markRead,
  markAllRead,
  resolveAlert,
  deleteAlert,
  adminListAlerts,
  adminCreateAlert,
  adminDeleteAlert,
} = require("../controllers/alertController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// ---------------------------------------------------
// USER ALERTS
// ---------------------------------------------------

router.get("/", protect, listAlerts);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markRead);
router.patch("/:id/resolve", protect, resolveAlert);
router.delete("/:id", protect, deleteAlert);

// ---------------------------------------------------
// ADMIN
// ---------------------------------------------------

router.get("/admin/all", protect, adminOnly, adminListAlerts);
router.post("/admin", protect, adminOnly, adminCreateAlert);
router.delete("/admin/:id", protect, adminOnly, adminDeleteAlert);

module.exports = router;
