const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Alert = require("../models/Alert");
const alertService = require("../services/alertService");

const listAlerts = asyncHandler(async (req, res) => {
  const { deviceId, resolved, limit } = req.query;

  const alerts = await alertService.listUserAlerts({
    userId: req.user._id,
    deviceId,
    resolved,
    limit,
  });

  res.status(200).json({
    success: true,
    count: alerts.length,
    alerts,
  });
});

const markRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!alert) {
    throw new ApiError(404, "Alert not found.");
  }

  alert.isRead = true;
  await alert.save();

  res.status(200).json({ success: true, alert });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Alert.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, message: "All alerts marked as read." });
});

const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!alert) {
    throw new ApiError(404, "Alert not found.");
  }

  alert.isResolved = true;
  alert.resolvedAt = new Date();
  await alert.save();

  await alertService.syncCropAlertSummary(alert.cropId);

  res.status(200).json({ success: true, message: "Alert resolved.", alert });
});

const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!alert) {
    throw new ApiError(404, "Alert not found.");
  }

  const cropId = alert.cropId;

  await alert.deleteOne();

  await alertService.syncCropAlertSummary(cropId);

  res.status(200).json({ success: true, message: "Alert deleted." });
});

// ---------------------------------------------------
// ADMIN — SYSTEM ALERTS
// ---------------------------------------------------

const adminListAlerts = asyncHandler(async (req, res) => {
  const { severity, type, limit } = req.query;

  const query = {};

  if (severity && severity !== "ALL") {
    query.severity = severity;
  }

  if (type && type !== "ALL") {
    query.type = type;
  }

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 200);

  const [total, critical, unresolved] = await Promise.all([
    Alert.countDocuments({}),
    Alert.countDocuments({ severity: "CRITICAL", isResolved: false }),
    Alert.countDocuments({ isResolved: false }),
  ]);

  res.status(200).json({
    success: true,
    stats: { total, critical, unresolved },
    count: alerts.length,
    alerts,
  });
});

const adminCreateAlert = asyncHandler(async (req, res) => {
  const { title, message, severity, deviceId } = req.body || {};

  if (!title || !message) {
    throw new ApiError(400, "Title and message are required.");
  }

  const alert = await Alert.create({
    deviceId: deviceId || "",
    userId: null,
    cropId: null,
    type: "SYSTEM",
    severity: ["INFO", "WARNING", "CRITICAL"].includes(severity)
      ? severity
      : "INFO",
    title,
    message,
  });

  res.status(201).json({ success: true, message: "System alert created.", alert });
});

const adminDeleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    throw new ApiError(404, "Alert not found.");
  }

  await alert.deleteOne();

  res.status(200).json({ success: true, message: "Alert deleted." });
});

module.exports = {
  listAlerts,
  markRead,
  markAllRead,
  resolveAlert,
  deleteAlert,
  adminListAlerts,
  adminCreateAlert,
  adminDeleteAlert,
};
