const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Crop = require("../models/Crop");
const UserCrop = require("../models/UserCrop");
const GrowthRecord = require("../models/GrowthRecord");
const thresholdService = require("../services/thresholdService");

const formatKnowledgeCrop = (crop) => ({
  ...(crop.profile && typeof crop.profile === "object" ? crop.profile : {}),

  id: crop.cropId,

  name: crop.name,

  scientificName: crop.scientificName,

  category: crop.category,

  cropType: crop.cropType,

  hydroponicSystem: crop.recommendedSystem,

  growthCycleDays: crop.growthCycleDays,

  harvestStartDays: crop.harvestStartDays,

  parameters: crop.parameters,

  image: crop.image,

  isActive: crop.isActive,
});

// ---------------------------------------------------
// KNOWLEDGE BASE (PUBLIC)
// ---------------------------------------------------

const listCrops = asyncHandler(async (req, res) => {
  const { search, category } = req.query;

  const query = { isActive: true };

  if (category && category !== "ALL") {
    query.category = category;
  }

  if (search) {
    const regex = new RegExp(String(search).trim(), "i");

    query.$or = [{ name: regex }, { category: regex }];
  }

  const crops = await Crop.find(query).sort({ cropId: 1 });

  res.status(200).json({
    success: true,
    count: crops.length,
    crops: crops.map(formatKnowledgeCrop),
  });
});

const getCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ cropId: req.params.cropId });

  if (!crop) {
    throw new ApiError(404, "Crop not found.");
  }

  res.status(200).json({ success: true, crop: formatKnowledgeCrop(crop) });
});

// ---------------------------------------------------
// MY FARM
// ---------------------------------------------------

const STAGE_THRESHOLDS = [
  { upTo: 0.15, stage: "Seed / Germination" },
  { upTo: 0.5, stage: "Vegetative Growth" },
  { upTo: 0.8, stage: "Flowering / Fruiting" },
  { upTo: 1.01, stage: "Maturity / Harvest" },
];

const computeGrowth = (plantingDate, growthCycle, harvestStart) => {
  const totalDays =
    thresholdService.parseRange(growthCycle)?.max ||
    thresholdService.parseRange(growthCycle)?.min ||
    45;

  const harvestDays =
    thresholdService.parseRange(harvestStart)?.min ||
    thresholdService.parseRange(harvestStart)?.max ||
    Math.max(Math.round(totalDays * 0.7), 1);

  const start = plantingDate ? new Date(`${plantingDate}T00:00:00`) : new Date();

  const elapsedMs = Date.now() - start.getTime();

  const currentDay = Math.max(Math.floor(elapsedMs / 86400000) + 1, 1);

  const ratio = currentDay / totalDays;

  const stage =
    STAGE_THRESHOLDS.find((item) => ratio < item.upTo)?.stage ||
    "Maturity / Harvest";

  return {
    currentDay,

    currentStage: stage,

    estimatedDaysRemaining: Math.max(totalDays - currentDay, 0),

    harvestReady: currentDay >= harvestDays,

    lastUpdated: new Date(),
  };
};

// ---------------------------------------------------
// GROWTH VERIFICATIONS (LATEST PER FARM CROP)
// ---------------------------------------------------

const formatGrowthVerification = (record) =>
  record
    ? {
        stage: record.stage,

        stageName: record.stageName,

        confidence: record.confidence,

        expectedStage: record.expectedStage,

        expectedStageName: record.expectedStageName,

        dayNumber: record.dayNumber,

        status: record.status,

        verifiedAt: record.verifiedAt,

        source: record.source,
      }
    : null;

const fetchLatestVerifications = async (userId, cropKeys = []) => {
  if (!Array.isArray(cropKeys) || cropKeys.length === 0) {
    return new Map();
  }

  /* One query for the whole farm - newest record per cropKey. */
  const records = await GrowthRecord.aggregate([
    { $match: { userId, cropKey: { $in: cropKeys } } },
    { $sort: { verifiedAt: -1 } },
    { $group: { _id: "$cropKey", record: { $first: "$$ROOT" } } },
  ]);

  return new Map(records.map((item) => [item._id, item.record]));
};

const fetchLatestVerification = async (userId, cropKey) => {
  if (!userId || !cropKey) {
    return null;
  }

  return GrowthRecord.findOne({ userId, cropKey }).sort({ verifiedAt: -1 });
};

const formatFarmCrop = (userCrop, growthVerification = null) => ({
  id: String(userCrop._id),

  cropId: userCrop.cropKey,

  name: userCrop.name,

  category: userCrop.category,

  scientificName: userCrop.scientificName,

  cropType: userCrop.cropType,

  hydroponicSystem: userCrop.hydroponicSystem,

  growthCycle: userCrop.growthCycle,

  harvestStart: userCrop.harvestStart,

  difficulty: userCrop.difficulty,

  demand: userCrop.demand,

  phase: userCrop.phase,

  description: userCrop.description,

  harvestGuidance: userCrop.harvestGuidance,

  farmUnit: userCrop.farmUnit,

  plantCount: userCrop.plantCount,

  plantingDate: userCrop.plantingDate,

  notes: userCrop.notes || "",

  status: userCrop.status,

  device: userCrop.device || {},

  automation: userCrop.automation || {},

  growth: {
    ...(userCrop.growth ? userCrop.growth.toObject() : {}),

    verification: formatGrowthVerification(growthVerification),
  },

  alerts: userCrop.alertSummary || {},

  createdAt: userCrop.createdAt,

  updatedAt: userCrop.updatedAt,
});

const listMyCrops = asyncHandler(async (req, res) => {
  const crops = await UserCrop.find({
    userId: req.user._id,
    isActive: true,
  }).sort({ createdAt: 1 });

  const verificationMap = await fetchLatestVerifications(
    req.user._id,
    crops.map((crop) => crop.cropKey)
  );

  res.status(200).json({
    success: true,
    count: crops.length,
    crops: crops.map((crop) =>
      formatFarmCrop(crop, verificationMap.get(crop.cropKey))
    ),
  });
});

const addFarmCrop = asyncHandler(async (req, res) => {
  const { cropId, setup = {} } = req.body || {};

  if (!cropId) {
    throw new ApiError(400, "cropId is required.");
  }

  const crop = await Crop.findOne({ cropId });

  if (!crop) {
    throw new ApiError(404, "Crop not found in the knowledge base.");
  }

  const duplicate = await UserCrop.findOne({
    userId: req.user._id,
    cropKey: crop.cropId,
    isActive: true,
  });

  if (duplicate) {
    throw new ApiError(
      409,
      `${crop.name} is already added to My Farm.`
    );
  }

  const profile = crop.profile || {};

  const plantingDate =
    typeof setup.plantingDate === "string" && setup.plantingDate
      ? setup.plantingDate
      : new Date().toISOString().split("T")[0];

  const plantCount = Number(setup.plantCount);

  const growthCycle = profile.growthCycle || "";

  const harvestStart = profile.harvestStart || "";

  const userCrop = await UserCrop.create({
    userId: req.user._id,

    cropKey: crop.cropId,

    cropRef: crop._id,

    name: crop.name,

    category: crop.category,

    scientificName: crop.scientificName,

    cropType: crop.cropType,

    hydroponicSystem: crop.recommendedSystem,

    growthCycle,

    harvestStart,

    difficulty: profile.difficulty || "",

    demand: profile.demand || "",

    phase: profile.phase || "",

    description: crop.description || profile.description || "",

    harvestGuidance: profile.harvestGuidance || "",

    requirements: {
      ph: profile.ph || "",

      ec: profile.ec || "",

      temperature: profile.temperature || "",

      humidity: profile.humidity || "",

      photoperiod: profile.photoperiod || "",

      ppfd: profile.ppfd || "",
    },

    farmUnit:
      typeof setup.farmUnit === "string" && setup.farmUnit.trim()
        ? setup.farmUnit.trim()
        : "My Farm",

    plantCount: Number.isFinite(plantCount) && plantCount > 0 ? plantCount : 1,

    plantingDate,

    notes: typeof setup.notes === "string" ? setup.notes.trim() : "",

    device: {
      deviceId: setup.deviceId || "HYDROGROW-SIM-001",

      source: setup.source || "INPUT_SIMULATOR",

      connected: false,

      lastUpdate: null,
    },

    automation: {
      mode: setup.automationMode || "automatic",

      enabled: true,

      lastAction: null,

      lastActionAt: null,
    },

    growth: computeGrowth(plantingDate, growthCycle, harvestStart),
  });

  res.status(201).json({
    success: true,

    message: `${crop.name} has been added to My Farm.`,

    crop: formatFarmCrop(
      userCrop,
      await fetchLatestVerification(req.user._id, userCrop.cropKey)
    ),
  });
});

const updateFarmCrop = asyncHandler(async (req, res) => {
  const userCrop = await UserCrop.findOne({
    _id: req.params.id,

    userId: req.user._id,

    isActive: true,
  });

  if (!userCrop) {
    throw new ApiError(404, "Farm crop not found.");
  }

  const body = req.body || {};

  if (typeof body.notes === "string") {
    userCrop.notes = body.notes.trim();
  }

  if (typeof body.farmUnit === "string" && body.farmUnit.trim()) {
    userCrop.farmUnit = body.farmUnit.trim();
  }

  if (body.plantCount !== undefined) {
    const count = Number(body.plantCount);

    if (Number.isFinite(count) && count > 0) {
      userCrop.plantCount = count;
    }
  }

  if (["healthy", "warning", "critical"].includes(body.status)) {
    userCrop.status = body.status;
  }

  if (body.device && typeof body.device === "object") {
    userCrop.device = {
      ...(userCrop.device ? userCrop.device.toObject() : {}),
      ...body.device,
    };

    userCrop.markModified("device");
  }

  if (body.automation && typeof body.automation === "object") {
    userCrop.automation = {
      ...(userCrop.automation ? userCrop.automation.toObject() : {}),
      ...body.automation,
    };

    userCrop.markModified("automation");
  }

  if (body.growth && typeof body.growth === "object") {
    userCrop.growth = {
      ...(userCrop.growth ? userCrop.growth.toObject() : {}),
      ...body.growth,

      lastUpdated: new Date(),
    };

    userCrop.markModified("growth");
  }

  if (body.recomputeGrowth) {
    userCrop.growth = computeGrowth(
      userCrop.plantingDate,
      userCrop.growthCycle,
      userCrop.harvestStart
    );

    userCrop.markModified("growth");
  }

  await userCrop.save();

  res.status(200).json({
    success: true,

    message: "Farm crop updated.",

    crop: formatFarmCrop(
      userCrop,
      await fetchLatestVerification(req.user._id, userCrop.cropKey)
    ),
  });
});

const removeFarmCrop = asyncHandler(async (req, res) => {
  const userCrop = await UserCrop.findOne({
    _id: req.params.id,

    userId: req.user._id,
  });

  if (!userCrop) {
    throw new ApiError(404, "Farm crop not found.");
  }

  await userCrop.deleteOne();

  res.status(200).json({ success: true, message: "Crop removed from My Farm." });
});

module.exports = {
  listCrops,
  getCrop,
  listMyCrops,
  addFarmCrop,
  updateFarmCrop,
  removeFarmCrop,
  computeGrowth,
  formatFarmCrop,
};
