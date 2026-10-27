const AutomationRule = require("../models/AutomationRule");
const UserCrop = require("../models/UserCrop");
const alertService = require("./alertService");
const env = require("../config/env");

const compare = (value, condition, threshold) => {
  switch (condition) {
    case "GREATER_THAN":
      return value > threshold;

    case "LESS_THAN":
      return value < threshold;

    case "GREATER_THAN_EQUAL":
      return value >= threshold;

    case "LESS_THAN_EQUAL":
      return value <= threshold;

    case "EQUAL":
      return value === threshold;

    default:
      return false;
  }
};

const TRIGGER_COOLDOWN_MS = 5 * 60 * 1000;

const sendControlToSimulator = async (action, deviceId) => {
  if (!env.simulatorUrl) {
    return false;
  }

  try {
    const response = await fetch(`${env.simulatorUrl}/api/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, deviceId }),
      signal: AbortSignal.timeout(4000),
    });

    return response.ok;
  } catch {
    return false;
  }
};

const evaluateRulesForReading = async ({ reading, userCrop, userId }) => {
  const deviceId = reading.deviceId;

  const rules = await AutomationRule.find({
    deviceId,
    enabled: true,
  });

  if (rules.length === 0) {
    return [];
  }

  const triggered = [];

  const automationEnabled =
    !userCrop || !userCrop.automation || userCrop.automation.mode !== "manual";

  for (const rule of rules) {
    const value = reading.sensors ? reading.sensors[rule.sensor] : undefined;
    const num = Number(value);

    if (!Number.isFinite(num)) {
      continue;
    }

    if (!compare(num, rule.condition, rule.threshold)) {
      continue;
    }

    const recentlyTriggered =
      rule.lastTriggeredAt &&
      Date.now() - rule.lastTriggeredAt.getTime() < TRIGGER_COOLDOWN_MS;

    if (recentlyTriggered) {
      continue;
    }

    rule.lastTriggeredAt = new Date();
    await rule.save();

    triggered.push(rule);

    if (userCrop) {
      userCrop.automation = {
        ...(userCrop.automation ? userCrop.automation.toObject() : {}),

        lastAction: `${rule.name} → ${rule.action}`,

        lastActionAt: new Date(),
      };

      userCrop.markModified("automation");
      await userCrop.save();
    }

    await alertService.createAlert({
      deviceId,
      userId: userId || rule.userId,
      cropId: userCrop ? userCrop._id : null,
      type: "AUTOMATION",
      severity: "INFO",
      title: `Automation triggered: ${rule.name}`,
      message: `${rule.sensor} was ${num} (${rule.condition.replace(/_/g, " ").toLowerCase()} ${rule.threshold}). Action: ${rule.action}.`,
      sensor: rule.sensor,
      value: num,
    });

    if (
      automationEnabled &&
      rule.action !== "ALERT" &&
      rule.action.endsWith("_ON")
    ) {
      await sendControlToSimulator(rule.action, deviceId);
    }
  }

  return triggered;
};

module.exports = {
  evaluateRulesForReading,
  sendControlToSimulator,
};
