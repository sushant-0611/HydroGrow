const Crop = require("../models/Crop");
const UserCrop = require("../models/UserCrop");
const GrowthRecord = require("../models/GrowthRecord");
const SensorReading = require("../models/SensorReading");
const Alert = require("../models/Alert");
const MarketplaceProduct = require("../models/MarketplaceProduct");
const AutomationRule = require("../models/AutomationRule");

/* =========================================================
   HYDROGROW FARM ASSISTANT
   Answers grower questions using live MongoDB data:
   crop knowledge, farm crops, growth verifications,
   sensor readings, alerts, marketplace and automation.
   ========================================================= */

const SENSOR_ORDER = [
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

const SENSOR_META = {
  ph: { label: "pH", unit: "", short: "pH" },
  ec: { label: "EC", unit: " mS/cm", short: "EC" },
  temperature: { label: "Temperature", unit: " °C", short: "Temp" },
  humidity: { label: "Humidity", unit: "%", short: "Humidity" },
  moisture: { label: "Moisture", unit: "%", short: "Moisture" },
  nitrogen: { label: "Nitrogen", unit: " ppm", short: "N" },
  phosphorus: { label: "Phosphorus", unit: " ppm", short: "P" },
  potassium: { label: "Potassium", unit: " ppm", short: "K" },
  ppfd: { label: "PPFD", unit: " µmol/m²/s", short: "PPFD" },
};

const SENSOR_WORDS = {
  ph: ["ph"],
  ec: ["ec", "conductivity", "ms/cm"],
  temperature: ["temperature", "temp", "heat"],
  humidity: ["humidity", "rh "],
  moisture: ["moisture", "pani", "water"],
  nitrogen: ["nitrogen", "nitrate"],
  phosphorus: ["phosphorus", "phosphate"],
  potassium: ["potassium", "potash"],
  ppfd: ["ppfd", "light", "prakash"],
};

const CROP_ALIASES = {
  tomato: ["tomato", "tamatar"],
  capsicum: ["capsicum", "bell pepper", "bellpepper", "shimla mirch"],
  lettuce: ["lettuce"],
  spinach: ["spinach", "palak"],
  cucumber: ["cucumber", "kakdi"],
  strawberry: ["strawberry"],
  basil: ["basil", "tulsi"],
  mint: ["mint", "pudina"],
  chilli: ["chilli", "chili", "mirchi"],
  chili: ["chilli", "chili", "mirchi"],
};

const CONDITION_LABELS = {
  GREATER_THAN: "above",
  LESS_THAN: "below",
  GREATER_THAN_EQUAL: "at or above",
  LESS_THAN_EQUAL: "at or below",
  EQUAL: "equal to",
};

const ACTION_LABELS = {
  PUMP_ON: "pump on",
  PUMP_OFF: "pump off",
  FAN_ON: "fan on",
  FAN_OFF: "fan off",
  LIGHT_ON: "light on",
  LIGHT_OFF: "light off",
  ALERT: "raise alert",
};

const DEFAULT_SUGGESTIONS = [
  "My farm",
  "Sensor status",
  "Growth verification",
  "Tomato requirements",
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text, words) => words.some((word) => text.includes(word));

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsWord = (text, candidate) =>
  new RegExp(`(^|[^a-z0-9])${escapeRegex(candidate)}([^a-z0-9]|$)`).test(
    text
  );

const formatValue = (key, value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  const meta = SENSOR_META[key] || { unit: "" };

  return `${value}${meta.unit}`;
};

const timeAgo = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "time unknown";
  }

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} h ago`;

  return `${Math.floor(hours / 24)} d ago`;
};

const capitalize = (value) => {
  const text = String(value || "");

  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const statusLabel = (status) => {
  if (status === "AHEAD") return "ahead of schedule";
  if (status === "BEHIND") return "behind schedule";
  if (status === "ON_TRACK") return "on schedule";

  return "recorded";
};

const firstName = (user) => {
  const name = String(user?.name || "").trim();

  return name ? name.split(" ")[0] : "grower";
};

/* =========================================================
   DATA HELPERS
   ========================================================= */

const getFarmCrops = (userId) =>
  UserCrop.find({ userId, isActive: true }).sort({ createdAt: 1 }).lean();

const getKnowledgeMap = async (cropKeys = []) => {
  const unique = [...new Set(cropKeys.filter(Boolean))];

  if (!unique.length) {
    return new Map();
  }

  const crops = await Crop.find({ cropId: { $in: unique } }).lean();

  return new Map(crops.map((crop) => [crop.cropId, crop]));
};

const latestGrowthFor = async (userId, cropKeys = []) => {
  const unique = [...new Set(cropKeys.filter(Boolean))];

  if (!unique.length) {
    return new Map();
  }

  const rows = await GrowthRecord.aggregate([
    { $match: { userId, cropKey: { $in: unique } } },
    { $sort: { verifiedAt: -1 } },
    { $group: { _id: "$cropKey", record: { $first: "$$ROOT" } } },
  ]);

  return new Map(rows.map((item) => [item._id, item.record]));
};

const farmCropDay = (farmCrop, cropDoc) => {
  const total = Number(cropDoc?.growthCycleDays) || 0;

  const start = farmCrop.plantingDate
    ? new Date(`${farmCrop.plantingDate}T00:00:00`)
    : null;

  if (!start || Number.isNaN(start.getTime())) {
    return { day: farmCrop.growth?.currentDay || 1, total };
  }

  const day = Math.max(
    1,
    Math.floor((Date.now() - start.getTime()) / 86400000) + 1
  );

  return { day, total };
};

const findCropInMessage = (message, crops) => {
  const text = normalize(message);

  let best = null;
  let bestLength = 0;

  for (const crop of crops) {
    const candidates = new Set([
      crop.name,
      crop.cropId,
      ...String(crop.name || "").split("/"),
    ]);

    const aliasKey = normalize(crop.name).split(" ")[0];

    for (const alias of CROP_ALIASES[aliasKey] || []) {
      candidates.add(alias);
    }

    for (const candidate of candidates) {
      const value = normalize(candidate);

      if (!value) continue;

      if (containsWord(text, value) && value.length > bestLength) {
        best = crop;
        bestLength = value.length;
      }
    }
  }

  return best;
};

const detectSensor = (text) => {
  for (const key of SENSOR_ORDER) {
    if (hasAny(text, SENSOR_WORDS[key] || [])) {
      return key;
    }
  }

  return null;
};

/* =========================================================
   ANSWER BUILDERS
   ========================================================= */

const farmAnswer = async (user) => {
  const crops = await getFarmCrops(user._id);

  if (!crops.length) {
    return {
      reply:
        "Your farm has no active crops yet.\nOpen the Crops page and add a crop — HydroGrow will then track its schedule, alerts and growth.",
      suggestions: ["Supported crops", "Sensor status", "Alerts", "Marketplace"],
    };
  }

  const knowledge = await getKnowledgeMap(crops.map((crop) => crop.cropKey));

  const verifications = await latestGrowthFor(
    user._id,
    crops.map((crop) => crop.cropKey)
  );

  const lines = crops.map((crop) => {
    const doc = knowledge.get(crop.cropKey);

    const { day, total } = farmCropDay(crop, doc);

    const verification = verifications.get(crop.cropKey);

    const verified = verification
      ? ` · ${verification.stageName} photo-verified (${statusLabel(
          verification.status
        )})`
      : "";

    return `• ${crop.name} — Day ${day}${
      total ? ` of ${total}` : ""
    } · ${capitalize(crop.status)}${verified}`;
  });

  return {
    reply: `Hi ${firstName(user)} — My Farm has ${crops.length} active crop${
      crops.length === 1 ? "" : "s"
    }:\n${lines.join(
      "\n"
    )}\n\nAsk "growth" for photo verification details or "sensors" for the latest readings.`,
    suggestions: DEFAULT_SUGGESTIONS,
  };
};

const cropInfoAnswer = async (user, cropDoc) => {
  const farmCrop = await UserCrop.findOne({
    userId: user._id,
    cropKey: cropDoc.cropId,
    isActive: true,
  }).lean();

  const verification = await GrowthRecord.findOne({
    userId: user._id,
    cropKey: cropDoc.cropId,
  })
    .sort({ verifiedAt: -1 })
    .lean();

  const profile = cropDoc.profile || {};

  const lines = [
    `${cropDoc.name} (${cropDoc.cropId}) — ${cropDoc.category || cropDoc.cropType}`,
    cropDoc.scientificName || "",
    `System: ${profile.hydroponicSystem || cropDoc.recommendedSystem || "not listed"}`,
    `Cycle: ${profile.growthCycle || `${cropDoc.growthCycleDays} days`} · Harvest starts: ${
      profile.harvestStart || `${cropDoc.harvestStartDays} days`
    }`,
    `pH ${profile.ph || "—"} · EC ${profile.ec || "—"}`,
    `Temperature ${profile.temperature || "—"} · Humidity ${profile.humidity || "—"}`,
    `Light: ${profile.ppfd || "—"} · Photoperiod ${cropDoc.photoperiod || profile.photoperiod || "—"}`,
    `Difficulty: ${profile.difficulty || "—"} · Demand: ${profile.demand || "—"}`,
    profile.harvestGuidance ? `Harvest: ${profile.harvestGuidance}` : "",
  ].filter(Boolean);

  if (farmCrop) {
    const { day, total } = farmCropDay(farmCrop, cropDoc);

    const verified = verification
      ? `\nLatest photo check: ${verification.stageName} (${verification.confidence}% match) — ${statusLabel(
          verification.status
        )} at day ${verification.dayNumber}.`
      : "\nLatest photo check: none yet — drop a photo in the simulator to verify actual growth.";

    lines.push(
      `\nOn your farm: Day ${day}${total ? ` of ${total}` : ""} · ${capitalize(
        farmCrop.status
      )}.${verified}`
    );
  } else {
    lines.push(
      "\nThis crop is not in My Farm yet — add it from the Crops page to track its schedule and growth."
    );
  }

  return {
    reply: lines.join("\n"),
    suggestions: farmCrop
      ? ["Growth verification", "Sensor status", "My farm", "Alerts"]
      : ["My farm", "Supported crops", "Sensor status", "Marketplace"],
  };
};

const growthAnswer = async (user, cropDoc = null) => {
  const crops = await getFarmCrops(user._id);

  const targets = cropDoc
    ? crops.filter((crop) => crop.cropKey === cropDoc.cropId)
    : crops;

  if (!targets.length) {
    return {
      reply: cropDoc
        ? `${cropDoc.name} is not in My Farm yet, so there is no growth verification linked to your account.\nAdd it from the Crops page, then drop a photo in the simulator's Virtual Crop Farm.`
        : "No crops on your farm yet, so there is no photo verification to show.\nAdd a crop from the Crops page first.",
      suggestions: ["My farm", "Supported crops", "Sensor status", "Alerts"],
    };
  }

  const knowledge = await getKnowledgeMap(targets.map((crop) => crop.cropKey));

  const verifications = await latestGrowthFor(
    user._id,
    targets.map((crop) => crop.cropKey)
  );

  const lines = [];

  for (const crop of targets) {
    const doc = knowledge.get(crop.cropKey);

    const record = verifications.get(crop.cropKey);

    if (!record) {
      lines.push(`• ${crop.name} — no photo verification yet.`);
      continue;
    }

    lines.push(
      `• ${crop.name} — photo shows ${record.stageName} (stage ${
        record.stage
      }, ${record.confidence}% match, ${timeAgo(record.verifiedAt)}).`
    );

    const { day, total } = farmCropDay(crop, doc);

    if (record.expectedStageName) {
      lines.push(
        `   Day ${record.dayNumber || day}${
          total ? ` of ${total}` : ""
        } schedule expects ${record.expectedStageName} → ${statusLabel(
          record.status
        ).toUpperCase()}.`
      );
    }
  }

  return {
    reply: `Photo growth verification\n${lines.join(
      "\n"
    )}\n\nTo verify another photo: open the simulator (port 5174), pick the crop under Virtual Crop Farm, then drag & drop a plant photo.`,
    suggestions: ["My farm", "Sensor status", "Capsicum requirements", "Alerts"],
  };
};

const sensorAnswer = async (user, sensorKey = null) => {
  const reading = await SensorReading.findOne({ userId: user._id })
    .sort({ timestamp: -1 })
    .lean();

  if (!reading) {
    return {
      reply:
        "No sensor readings have reached HydroGrow yet.\nStart the simulator on port 5174 — it streams live readings every few seconds.",
      suggestions: ["My farm", "Growth verification", "Alerts", "Supported crops"],
    };
  }

  const crops = await getFarmCrops(user._id);

  const namedCrop = reading.cropName
    ? crops.find((crop) => crop.name === reading.cropName)
    : null;

  const activeCrop =
    namedCrop ||
    crops.find((crop) => crop.device?.deviceId === reading.deviceId) ||
    crops[0] ||
    null;

  const cropDoc = activeCrop
    ? await Crop.findOne({ cropId: activeCrop.cropKey }).lean()
    : null;

  const environment = ["ph", "ec", "temperature", "humidity", "moisture"]
    .map((key) => `${SENSOR_META[key].short} ${formatValue(key, reading.sensors?.[key])}`)
    .join(" · ");

  const nutrition = ["nitrogen", "phosphorus", "potassium", "ppfd"]
    .map((key) => `${SENSOR_META[key].short} ${formatValue(key, reading.sensors?.[key])}`)
    .join(" · ");

  const issues = [];

  if (cropDoc?.parameters) {
    for (const key of SENSOR_ORDER) {
      const value = reading.sensors?.[key];

      const range = cropDoc.parameters[key];

      if (
        typeof value !== "number" ||
        !range ||
        !Number.isFinite(range.min) ||
        !Number.isFinite(range.max)
      ) {
        continue;
      }

      if (value < range.min) {
        issues.push(
          `${SENSOR_META[key].label} ${formatValue(
            key,
            value
          )} is below ${range.min}–${range.max}${SENSOR_META[key].unit}`
        );
      } else if (value > range.max) {
        issues.push(
          `${SENSOR_META[key].label} ${formatValue(
            key,
            value
          )} is above ${range.min}–${range.max}${SENSOR_META[key].unit}`
        );
      }
    }
  }

  const lines = [
    `Latest reading from ${reading.deviceId} (${timeAgo(reading.timestamp)})`,
    environment,
    nutrition,
    `Status: ${String(reading.status || "unknown").toUpperCase()}${
      cropDoc ? ` against ${cropDoc.name}` : ""
    }.`,
  ];

  if (sensorKey) {
    const range = cropDoc?.parameters?.[sensorKey];

    lines.unshift(
      `• ${SENSOR_META[sensorKey].label}: ${formatValue(
        sensorKey,
        reading.sensors?.[sensorKey]
      )}${
        range ? ` — target ${range.min}–${range.max}${SENSOR_META[sensorKey].unit}` : ""
      }`
    );
  }

  if (issues.length) {
    lines.push(`Out of range: ${issues.join("; ")}.`);
  }

  if (Date.now() - new Date(reading.timestamp).getTime() > 15 * 60000) {
    lines.push("These readings look stale — check that the simulator on port 5174 is running.");
  }

  return {
    reply: lines.join("\n"),
    suggestions: ["Growth verification", "Alerts", "My farm", "Tomato requirements"],
  };
};

const alertAnswer = async (user) => {
  const total = await Alert.countDocuments({
    userId: user._id,
    isResolved: false,
  });

  if (!total) {
    return {
      reply:
        "No unresolved alerts on your account right now.\nHydroGrow raises alerts when sensor values move outside the active crop's range.",
      suggestions: ["Sensor status", "My farm", "Growth verification", "Automation"],
    };
  }

  const recent = await Alert.find({ userId: user._id, isResolved: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unique = [];
  const seen = new Set();

  for (const alert of recent) {
    if (seen.has(alert.title)) continue;

    seen.add(alert.title);
    unique.push(alert);

    if (unique.length === 4) break;
  }

  const lines = unique.map(
    (alert) =>
      `• ${alert.severity} — ${alert.title}: ${String(alert.message).slice(
        0,
        120
      )} (${timeAgo(alert.createdAt)})`
  );

  return {
    reply: `Unresolved alerts: ${total} total across ${seen.size} unique issue${
      seen.size === 1 ? "" : "s"
    }.\n${lines.join(
      "\n"
    )}\n\nOpen the Alerts page to review and resolve them.`,
    suggestions: ["Sensor status", "Growth verification", "My farm", "Automation"],
  };
};

const marketplaceAnswer = async () => {
  const total = await MarketplaceProduct.countDocuments({
    status: "AVAILABLE",
  });

  if (!total) {
    return {
      reply:
        "The marketplace has no active listings right now.\nSellers can publish fresh produce from the Marketplace page.",
      suggestions: ["My farm", "Sensor status", "Automation", "Supported crops"],
    };
  }

  const items = await MarketplaceProduct.find({ status: "AVAILABLE" })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const lines = items.map(
    (item) =>
      `• ${item.title} — ₹${item.price} per ${item.unit} · ${item.quantity} ${
        item.unit
      } available`
  );

  return {
    reply: `Marketplace currently has ${total} active listing${
      total === 1 ? "" : "s"
    }:\n${lines.join("\n")}\n\nOpen the Marketplace page to buy or publish produce.`,
    suggestions: ["My farm", "Automation", "Sensor status", "Alerts"],
  };
};

const automationAnswer = async (user) => {
  const rules = await AutomationRule.find({
    $or: [{ userId: user._id }, { userId: null }],
  })
    .sort({ createdAt: 1 })
    .lean();

  const enabled = rules.filter((rule) => rule.enabled);

  if (!enabled.length) {
    return {
      reply:
        "No automation rules are enabled.\nOpen the Automation page to add a rule such as a low-pH alert or a temperature-controlled pump.",
      suggestions: ["My farm", "Sensor status", "Alerts", "Marketplace"],
    };
  }

  const lines = enabled.slice(0, 4).map(
    (rule) =>
      `• ${rule.name} — ${String(rule.sensor).toUpperCase()} ${
        CONDITION_LABELS[rule.condition] || rule.condition
      } ${rule.threshold} → ${ACTION_LABELS[rule.action] || rule.action}`
  );

  return {
    reply: `Automation: ${enabled.length} rule${
      enabled.length === 1 ? "" : "s"
    } enabled.\n${lines.join(
      "\n"
    )}\n\nFarm control modes are managed per crop on the Automation page.`,
    suggestions: ["My farm", "Sensor status", "Alerts", "Growth verification"],
  };
};

const cropLibraryAnswer = async () => {
  const crops = await Crop.find({ isActive: true })
    .sort({ cropId: 1 })
    .lean();

  const names = crops.map((crop) => crop.name).join(", ");

  return {
    reply: `The HydroGrow crop library has ${crops.length} profiles:\n${names}\n\nAsk about any crop, for example "Tomato requirements" or "Capsicum harvest".`,
    suggestions: ["Tomato requirements", "Capsicum requirements", "My farm", "Sensor status"],
  };
};

const projectAnswer = async (user) => {
  const [cropCount, farmCount, alertCount] = await Promise.all([
    Crop.countDocuments({ isActive: true }),
    UserCrop.countDocuments({ userId: user._id, isActive: true }),
    Alert.countDocuments({ userId: user._id, isResolved: false }),
  ]);

  return {
    reply: `HydroGrow is an intelligent hydroponics monitoring and automation platform.\n\n• Client app: dashboard, live monitoring, My Farm, alerts, automation, crop library, sensor history, analytics and marketplace.\n• REST API: JWT authentication, sensor ingestion, crop knowledge, alerts, automation and growth records stored in MongoDB.\n• Simulator (port 5174): a virtual hardware unit with live telemetry and a Virtual Crop Farm that checks plant photos against a trained 5-stage model for tomato and capsicum.\n\nCurrently: ${cropCount} crop profiles, ${farmCount} crop${
      farmCount === 1 ? "" : "s"
    } on your farm and ${alertCount} unresolved alert${
      alertCount === 1 ? "" : "s"
    }.`,
    suggestions: ["My farm", "Growth verification", "Sensor status", "Supported crops"],
  };
};

const helpAnswer = () => ({
  reply:
    'I can answer these using your live HydroGrow data:\n• "My farm" — crops, days and status\n• "Tomato requirements" — pH, EC, temperature, light\n• "Growth" — photo-verified stage vs schedule\n• "Sensors" — latest pH/EC/temperature readings\n• "Alerts" — unresolved issues\n• "Marketplace" and "Automation"\n\nWhat would you like to check?',
  suggestions: DEFAULT_SUGGESTIONS,
});

const welcomeAnswer = async (user) => {
  const farmCount = await UserCrop.countDocuments({
    userId: user._id,
    isActive: true,
  });

  return {
    reply: `Hi ${firstName(user)}. I'm your HydroGrow farm assistant.\nI can see ${farmCount} active crop${
      farmCount === 1 ? "" : "s"
    } on your farm and I answer from live platform data — crops, growth verification, sensors, alerts and more.`,
    suggestions: DEFAULT_SUGGESTIONS,
  };
};

const fallbackAnswer = () => ({
  reply:
    'I did not catch that. I can help with farm status, crop requirements, photo growth verification, sensor readings, alerts, marketplace and automation.\nTry asking "My farm" or "Tomato requirements".',
  suggestions: DEFAULT_SUGGESTIONS,
});

/* =========================================================
   INTENT ROUTER
   ========================================================= */

const buildAssistantReply = async ({ message, user }) => {
  const text = normalize(message);

  const crops = await Crop.find({ isActive: true }).lean();

  const cropMatch = findCropInMessage(message, crops);

  const isGreeting =
    text.length <= 40 &&
    hasAny(text, ["hi", "hello", "hey", "hii", "namaskar", "namaste"]);

  const asksProject = hasAny(text, [
    "project",
    "platform",
    "module",
    "feature",
    "about hydrogrow",
    "what is hydrogrow",
    "kay ahe he",
  ]);

  const asksHelp = hasAny(text, [
    "help",
    "what can you do",
    "kay karu shakto",
    "options",
    "capabilities",
  ]);

  const asksGrowth = hasAny(text, [
    "growth",
    "stage",
    "photo",
    "verification",
    "verified",
    "animation",
    "kiti zali",
  ]);

  const asksFarm = hasAny(text, [
    "my farm",
    "majha farm",
    "majhya farm",
    "maza farm",
    "majhi",
    "my crop",
    "my crops",
    "on my farm",
    "farm status",
  ]);

  const asksCropList = hasAny(text, [
    "supported crops",
    "crop list",
    "crops available",
    "which crops",
    "all crops",
    "crop library",
  ]);

  const asksAlerts = hasAny(text, [
    "alert",
    "issue",
    "problem",
    "warning",
    "critical",
    "trouble",
  ]);

  const asksMarket = hasAny(text, [
    "market",
    "buy",
    "sell",
    "product",
    "listing",
  ]);

  const asksAutomation = hasAny(text, [
    "automation",
    "rule",
    "pump",
    "irrigation",
    "fan",
  ]);

  const sensorKey = detectSensor(text);

  if (isGreeting && !cropMatch) {
    return { intent: "greeting", ...(await welcomeAnswer(user)) };
  }

  if (asksHelp) {
    return { intent: "help", ...helpAnswer() };
  }

  if (asksProject && !cropMatch) {
    return { intent: "project", ...(await projectAnswer(user)) };
  }

  if (cropMatch) {
    if (asksGrowth) {
      return { intent: "growth", ...(await growthAnswer(user, cropMatch)) };
    }

    return { intent: "crop", ...(await cropInfoAnswer(user, cropMatch)) };
  }

  if (asksGrowth) {
    return { intent: "growth", ...(await growthAnswer(user)) };
  }

  if (asksCropList || (text.includes("crop") && !asksFarm)) {
    return { intent: "crop-library", ...(await cropLibraryAnswer()) };
  }

  if (asksFarm || hasAny(text, ["farm", "field", "plant"])) {
    return { intent: "farm", ...(await farmAnswer(user)) };
  }

  if (sensorKey || hasAny(text, ["sensor", "reading", "threshold", "range"])) {
    return { intent: "sensors", ...(await sensorAnswer(user, sensorKey)) };
  }

  if (asksAlerts) {
    return { intent: "alerts", ...(await alertAnswer(user)) };
  }

  if (asksMarket) {
    return { intent: "marketplace", ...(await marketplaceAnswer()) };
  }

  if (asksAutomation) {
    return { intent: "automation", ...(await automationAnswer(user)) };
  }

  return { intent: "fallback", ...fallbackAnswer() };
};

module.exports = {
  buildAssistantReply,
};
