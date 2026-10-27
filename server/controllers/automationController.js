const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const AutomationRule = require("../models/AutomationRule");

const listRules = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };

  if (req.query.deviceId) {
    query.deviceId = req.query.deviceId;
  }

  const rules = await AutomationRule.find(query).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: rules.length, rules });
});

const createRule = asyncHandler(async (req, res) => {
  const { name, deviceId, sensor, condition, threshold, action, enabled } =
    req.body || {};

  if (!name || !deviceId || !sensor || !condition || !action) {
    throw new ApiError(
      400,
      "name, deviceId, sensor, condition and action are required."
    );
  }

  const thresholdNum = Number(threshold);

  if (!Number.isFinite(thresholdNum)) {
    throw new ApiError(400, "threshold must be a number.");
  }

  const rule = await AutomationRule.create({
    name,
    userId: req.user._id,
    deviceId,
    sensor,
    condition,
    threshold: thresholdNum,
    action,
    enabled: enabled === undefined ? true : Boolean(enabled),
  });

  res.status(201).json({
    success: true,
    message: "Automation rule created.",
    rule,
  });
});

const updateRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!rule) {
    throw new ApiError(404, "Automation rule not found.");
  }

  const body = req.body || {};

  if (typeof body.name === "string" && body.name.trim()) {
    rule.name = body.name.trim();
  }

  if (typeof body.deviceId === "string" && body.deviceId.trim()) {
    rule.deviceId = body.deviceId.trim();
  }

  if (body.sensor) {
    rule.sensor = body.sensor;
  }

  if (body.condition) {
    rule.condition = body.condition;
  }

  if (body.threshold !== undefined) {
    const thresholdNum = Number(body.threshold);

    if (!Number.isFinite(thresholdNum)) {
      throw new ApiError(400, "threshold must be a number.");
    }

    rule.threshold = thresholdNum;
  }

  if (body.action) {
    rule.action = body.action;
  }

  if (typeof body.enabled === "boolean") {
    rule.enabled = body.enabled;
  }

  await rule.save();

  res.status(200).json({ success: true, message: "Rule updated.", rule });
});

const deleteRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!rule) {
    throw new ApiError(404, "Automation rule not found.");
  }

  await rule.deleteOne();

  res.status(200).json({ success: true, message: "Rule deleted." });
});

const toggleRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!rule) {
    throw new ApiError(404, "Automation rule not found.");
  }

  rule.enabled = !rule.enabled;
  await rule.save();

  res.status(200).json({
    success: true,
    message: rule.enabled ? "Rule enabled." : "Rule disabled.",
    rule,
  });
});

module.exports = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
};
