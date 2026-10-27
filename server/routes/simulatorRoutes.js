const express = require("express");

const router = express.Router();

const {
  proxyStatus,
  proxyReadings,
  proxyHistory,
  proxyControl,
} = require("../controllers/simulatorController");

router.get("/status", proxyStatus);
router.get("/readings", proxyReadings);
router.get("/history", proxyHistory);
router.post("/control", proxyControl);

module.exports = router;
