const Alert = require("../models/Alert");
const UserCrop = require("../models/UserCrop");

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

const syncCropAlertSummary = async (userCropId) => {
  if (!userCropId) return;

  const [criticalCount, warningCount] = await Promise.all([
    Alert.countDocuments({
      cropId: userCropId,
      isResolved: false,
      severity: "CRITICAL",
    }),
    Alert.countDocuments({
      cropId: userCropId,
      isResolved: false,
      severity: "WARNING",
    }),
  ]);

  const lastAlert = await Alert.findOne({
    cropId: userCropId,
  }).sort({ createdAt: -1 });

  const status = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";

  await UserCrop.findByIdAndUpdate(userCropId, {
    alertSummary: {
      activeCount: criticalCount + warningCount,
      criticalCount,
      warningCount,
      lastAlert: lastAlert ? lastAlert.createdAt : null,
    },
    status,
  });
};

const createAlert = async (payload) => {
  const {
    deviceId = "",
    userId = null,
    cropId = null,
    type = "SENSOR",
    severity = "INFO",
    title,
    message,
    sensor = "",
    value = null,
  } = payload;

  if (!title || !message) {
    return null;
  }

  if (sensor) {
    const recent = await Alert.findOne({
      deviceId,
      sensor,
      type,
      isResolved: false,
      createdAt: { $gt: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    });

    if (recent) {
      if (recent.value !== value) {
        recent.value = value;
        await recent.save();
      }

      return recent;
    }
  }

  const alert = await Alert.create({
    deviceId,
    userId,
    cropId,
    type,
    severity,
    title,
    message,
    sensor,
    value,
  });

  await syncCropAlertSummary(cropId);

  return alert;
};

const resolveAlertsForSensor = async (cropId, sensor) => {
  const open = await Alert.find({
    cropId,
    sensor,
    isResolved: false,
  });

  if (open.length === 0) {
    return;
  }

  const now = new Date();

  await Alert.updateMany(
    { _id: { $in: open.map((item) => item._id) } },
    { isResolved: true, resolvedAt: now }
  );

  await syncCropAlertSummary(cropId);
};

const syncResolvedFindings = async (cropId, findings) => {
  const flaggedSensors = new Set(findings.map((item) => item.sensor));

  const openAlerts = await Alert.find({
    cropId,
    isResolved: false,
  });

  const stale = openAlerts.filter(
    (item) => item.sensor && !flaggedSensors.has(item.sensor)
  );

  if (stale.length === 0) {
    return;
  }

  const now = new Date();

  await Alert.updateMany(
    { _id: { $in: stale.map((item) => item._id) } },
    { isResolved: true, resolvedAt: now }
  );

  await syncCropAlertSummary(cropId);
};

const listUserAlerts = async ({ userId, deviceId, resolved, limit = 100 }) => {
  const query = { userId };

  if (deviceId) {
    query.deviceId = deviceId;
  }

  if (resolved === "true") {
    query.isResolved = true;
  } else if (resolved === "false") {
    query.isResolved = false;
  }

  return Alert.find(query).sort({ createdAt: -1 }).limit(Number(limit) || 100);
};

module.exports = {
  createAlert,
  syncCropAlertSummary,
  syncResolvedFindings,
  listUserAlerts,
};
