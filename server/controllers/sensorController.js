const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const SensorReading = require("../models/SensorReading");
const sensorService = require("../services/sensorService");
const UserCrop = require("../models/UserCrop");
const AutomationRule = require("../models/AutomationRule");
const Alert = require("../models/Alert");

const ingestReading = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  const result = await sensorService.saveReading({
    payload,
    userId: req.user ? req.user._id : null,
  });

  res.status(201).json({
    success: true,
    message: "Reading stored.",
    reading: result.reading,
    status: result.status,
    findings: result.findings,
    triggeredRules: result.triggeredRules.map((rule) => rule.name),
  });
});

const ingestBatch = asyncHandler(async (req, res) => {
  const { readings } = req.body || {};

  if (!Array.isArray(readings) || readings.length === 0) {
    throw new ApiError(400, "readings array is required.");
  }

  let stored = 0;

  for (const payload of readings.slice(0, 100)) {
    await sensorService.saveReading({
      payload,
      userId: req.user ? req.user._id : null,
    });

    stored += 1;
  }

  res.status(201).json({ success: true, message: `${stored} readings stored.` });
});

const latest = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || "HYDROGROW-SIM-001";

  const reading = await sensorService.getLatestReading(deviceId);

  res.status(200).json({ success: true, reading });
});

const history = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || "HYDROGROW-SIM-001";

  const readings = await sensorService.getHistory({
    deviceId,
    hours: req.query.hours || 24,
    limit: req.query.limit || 500,
  });

  res.status(200).json({
    success: true,
    count: readings.length,
    readings,
  });
});

const deviceStats = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || "HYDROGROW-SIM-001";

  const [readingCount, openAlerts, ruleCount, activeCrops] = await Promise.all([
    SensorReading.countDocuments({ deviceId }),
    Alert.countDocuments({ deviceId, isResolved: false }),
    AutomationRule.countDocuments({ deviceId }),
    UserCrop.countDocuments({
      "device.deviceId": deviceId,
      isActive: true,
    }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      deviceId,
      readingCount,
      openAlerts,
      ruleCount,
      activeCrops,
    },
  });
});

module.exports = {
  ingestReading,
  ingestBatch,
  latest,
  history,
  deviceStats,
};
