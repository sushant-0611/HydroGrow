const express = require("express");

const router = express.Router();

const {
  ingestReading,
  ingestBatch,
  latest,
  history,
  deviceStats,
} = require("../controllers/sensorController");

const { optionalProtect } = require("../middleware/authMiddleware");

router.post("/readings", optionalProtect, ingestReading);
router.post("/readings/batch", optionalProtect, ingestBatch);

router.get("/latest", latest);
router.get("/history", history);
router.get("/stats", deviceStats);

module.exports = router;
