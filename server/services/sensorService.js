const SensorReading = require("../models/SensorReading");
const UserCrop = require("../models/UserCrop");
const Crop = require("../models/Crop");
const GrowthRecord = require("../models/GrowthRecord");
const thresholdService = require("./thresholdService");
const alertService = require("./alertService");
const automationService = require("./automationService");

const GROWTH_STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

const GROWTH_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

const DEVICE_KEYS = [
  "ph",
  "ec",
  "temperature",
  "humidity",
  "moisture",
  "nitrogen",
  "phosphorus",
  "potassium",
  "ppfd",
];

const normalizeSensors = (raw = {}) => {
  const sensors = {};

  for (const key of DEVICE_KEYS) {
    const num = Number(raw[key]);

    sensors[key] = Number.isFinite(num) ? num : null;
  }

  return sensors;
};

const findFarmCropForDevice = async (userId, deviceId) => {
  const query = { isActive: true, "device.deviceId": deviceId };

  if (userId) {
    query.userId = userId;
  }

  const userCrop = await UserCrop.findOne(query).sort({ updatedAt: -1 });

  return userCrop || null;
};

/* =========================================================
   GROWTH VERIFICATION
   Stores the photo-based growth stage detected by the
   simulator device for one of the grower's farm crops.
   ========================================================= */

const clampStage = (value) => {
  const stage = Math.round(Number(value));

  if (!Number.isFinite(stage)) {
    return null;
  }

  return Math.min(Math.max(stage, 1), 5);
};

const normalizeConfidence = (value) => {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(Math.max(confidence, 0), 100);
};

const growthStatusFor = (stage, expectedStage) => {
  if (expectedStage === null || stage === expectedStage) {
    return "ON_TRACK";
  }

  return stage > expectedStage ? "AHEAD" : "BEHIND";
};

const findUserCropForGrowth = async (userId, cropKey, deviceId) => {
  const query = {
    userId,

    cropKey,

    $or: [{ "device.deviceId": deviceId }, { device: { $exists: false } }],
  };

  const userCrop = await UserCrop.findOne(query).sort({ updatedAt: -1 });

  return userCrop || null;
};

const expectedStageFromProgress = (progress) => {
  if (progress < 0.12) {
    return 1;
  }

  if (progress < 0.4) {
    return 2;
  }

  if (progress < 0.65) {
    return 3;
  }

  if (progress < 0.85) {
    return 4;
  }

  return 5;
};

const computeExpectedStage = async (userCrop) => {
  if (!userCrop) {
    return { expectedStage: null, expectedStageName: null, dayNumber: null };
  }

  const plantingDate = userCrop.plantingDate
    ? new Date(`${userCrop.plantingDate}T00:00:00`)
    : null;

  if (!plantingDate || Number.isNaN(plantingDate.getTime())) {
    return { expectedStage: null, expectedStageName: null, dayNumber: null };
  }

  const crop = userCrop.cropRef ? await Crop.findById(userCrop.cropRef) : null;

  const cycleDays = crop ? Number(crop.growthCycleDays) : 0;

  if (!cycleDays || cycleDays < 1) {
    return { expectedStage: null, expectedStageName: null, dayNumber: null };
  }

  const dayNumber =
    Math.floor((Date.now() - plantingDate.getTime()) / 86400000) + 1;

  const expectedStage = expectedStageFromProgress(dayNumber / cycleDays);

  return {
    expectedStage,

    expectedStageName: GROWTH_STAGE_NAMES[expectedStage - 1],

    dayNumber,
  };
};

const saveGrowthVerification = async ({ userId, deviceId, growth }) => {
  const cropKey = String(growth.cropKey || "").trim();

  const stage = clampStage(growth.stage);

  if (!cropKey || !stage) {
    return null;
  }

  const userCrop = await findUserCropForGrowth(userId, cropKey, deviceId);

  const { expectedStage, expectedStageName, dayNumber } =
    await computeExpectedStage(userCrop);

  const confidence = normalizeConfidence(growth.confidence);

  const recentCutoff = new Date(Date.now() - GROWTH_DEDUPE_WINDOW_MS);

  const latestRecord = await GrowthRecord.findOne({ userId, cropKey }).sort({
    verifiedAt: -1,
  });

  /* ---------------------------------------------
     DEDUPE - the client posts every ~30s, so reuse
     the latest record while the stage is unchanged.
     --------------------------------------------- */
  if (
    latestRecord &&
    latestRecord.stage === stage &&
    latestRecord.verifiedAt >= recentCutoff
  ) {
    latestRecord.confidence = confidence;
    latestRecord.verifiedAt = new Date();

    await latestRecord.save();

    return latestRecord;
  }

  return GrowthRecord.create({
    userId,

    cropId: userCrop ? userCrop._id : null,

    deviceId,

    cropKey,

    cropName: growth.cropName || (userCrop ? userCrop.name : ""),

    stage,

    stageName: growth.stageName || GROWTH_STAGE_NAMES[stage - 1],

    confidence,

    expectedStage,

    expectedStageName,

    dayNumber,

    status: growthStatusFor(stage, expectedStage),

    source: growth.source || "PHOTO_ANALYSIS",
  });
};

const saveReading = async ({ payload, userId = null }) => {
  const deviceId = String(payload.deviceId || "").trim();

  if (!deviceId) {
    throw Object.assign(new Error("deviceId is required."), { statusCode: 400 });
  }

  const sensors = normalizeSensors(payload.sensors || payload);

  const userCrop = await findFarmCropForDevice(userId, deviceId);

  let requirements = null;

  if (userCrop && userCrop.requirements) {
    requirements = userCrop.requirements.toObject
      ? userCrop.requirements.toObject()
      : userCrop.requirements;
  }

  const findings = requirements
    ? thresholdService.evaluateReading(sensors, requirements)
    : [];

  const status = thresholdService.overallStatus(findings);

  const reading = await SensorReading.create({
    userId: userCrop ? userCrop.userId : userId,

    deviceId,

    cropId: userCrop ? userCrop.cropRef : null,

    cropName: userCrop ? userCrop.name : payload.cropName || "",

    sensors,

    status,

    statusReasons: findings.map((item) => item.message),

    source: ["HARDWARE", "INPUT_SIMULATOR", "MANUAL", "API"].includes(
      payload.source
    )
      ? payload.source
      : "INPUT_SIMULATOR",

    timestamp: payload.timestamp ? new Date(payload.timestamp) : undefined,
  });

  if (userCrop) {
    userCrop.device = {
      ...(userCrop.device ? userCrop.device.toObject() : {}),

      deviceId,

      source: reading.source,

      connected: true,

      lastUpdate: reading.timestamp,
    };

    userCrop.markModified("device");

    await userCrop.save();

    for (const finding of findings) {
      await alertService.createAlert({
        deviceId,

        userId: userCrop.userId,

        cropId: userCrop._id,

        type: "SENSOR",

        severity: finding.severity,

        title: finding.title,

        message: finding.message,

        sensor: finding.sensor,

        value: finding.value,
      });
    }

    await alertService.syncResolvedFindings(userCrop._id, findings);
  }

  const triggeredRules = await automationService.evaluateRulesForReading({
    reading,

    userCrop,

    userId: userCrop ? userCrop.userId : userId,
  });

  /* ---------------------------------------------
     PHOTO GROWTH VERIFICATION - optional payload
     from the simulator's photo analysis. Never
     blocks sensor ingestion on failure.
     --------------------------------------------- */
  if (userId && payload.growth && typeof payload.growth === "object") {
    try {
      await saveGrowthVerification({
        userId,

        deviceId,

        growth: payload.growth,
      });
    } catch (error) {
      console.warn(
        "[sensorService] Growth verification failed:",
        error.message
      );
    }
  }

  return { reading, userCrop, findings, status, triggeredRules };
};

const getLatestReading = async (deviceId) => {
  const reading = await SensorReading.findOne({ deviceId }).sort({
    timestamp: -1,
  });

  return reading;
};

const getHistory = async ({ deviceId, hours = 24, limit = 500 }) => {
  const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  return SensorReading.find({
    deviceId,

    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .limit(Number(limit) || 500);
};

module.exports = {
  normalizeSensors,
  findFarmCropForDevice,
  saveReading,
  getLatestReading,
  getHistory,
};
