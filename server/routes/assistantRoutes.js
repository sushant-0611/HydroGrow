const express = require("express");

const router = express.Router();

const { sendMessage } = require("../controllers/assistantController");
const { protect } = require("../middleware/authMiddleware");

router.post("/message", protect, sendMessage);

module.exports = router;
