const express = require("express");

const router = express.Router();

const {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
} = require("../controllers/automationController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, listRules);
router.post("/", protect, createRule);
router.patch("/:id", protect, updateRule);
router.patch("/:id/toggle", protect, toggleRule);
router.delete("/:id", protect, deleteRule);

module.exports = router;
