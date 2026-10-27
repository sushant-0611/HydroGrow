const express = require("express");

const router = express.Router();

const {
  listCrops,
  getCrop,
  listMyCrops,
  addFarmCrop,
  updateFarmCrop,
  removeFarmCrop,
} = require("../controllers/cropController");

const { protect } = require("../middleware/authMiddleware");

// ---------------------------------------------------
// KNOWLEDGE BASE
// ---------------------------------------------------

router.get("/crops", listCrops);
router.get("/crops/:cropId", getCrop);

// ---------------------------------------------------
// MY FARM
// ---------------------------------------------------

router.get("/farm", protect, listMyCrops);
router.post("/farm", protect, addFarmCrop);
router.patch("/farm/:id", protect, updateFarmCrop);
router.delete("/farm/:id", protect, removeFarmCrop);

module.exports = router;
