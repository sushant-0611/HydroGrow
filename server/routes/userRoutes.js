const express = require("express");

const router = express.Router();

const {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  adminStats,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.use(protect, adminOnly);

router.get("/", listUsers);
router.get("/stats", adminStats);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
