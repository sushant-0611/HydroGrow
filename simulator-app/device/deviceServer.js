/* =========================================================
   HYDROGROW SENSOR HARDWARE UNIT
   SERVER-SIDE DEVICE EMULATION

   The device state lives in the Vite dev-server process so
   that it behaves like a real network-attached sensor unit:
   it keeps ticking and holding readings even when no browser
   is open, and any client on the network can poll it.
   ========================================================= */

import {
  CROP_PROFILES,
  STAGE_NAMES,
  classifyFeatures,
  expectedStageForProgress,
} from "./growthModel.js";

const DEVICE_ID = "HYDROGROW-SIM-001";

const DEFAULT_READINGS = {
  ph: 6.2,
  ec: 1.8,
  temperature: 25,
  humidity: 65,
  moisture: 72,
  nitrogen: 120,
  phosphorus: 50,
  potassium: 180,
  ppfd: 450,
};

const PRESETS = {
  healthy: { ...DEFAULT_READINGS },

  warning: {
    ph: 5.4,
    ec: 2.4,
    temperature: 29,
    humidity: 82,
    moisture: 52,
    nitrogen: 165,
    phosphorus: 25,
    potassium: 230,
    ppfd: 280,
  },

  critical: {
    ph: 4.5,
    ec: 3.2,
    temperature: 35,
    humidity: 95,
    moisture: 30,
    nitrogen: 230,
    phosphorus: 10,
    potassium: 320,
    ppfd: 150,
  },
};

/* How far a reading may wander from its target each tick */
const DRIFT = {
  ph: 0.06,
  ec: 0.05,
  temperature: 0.4,
  humidity: 1.2,
  moisture: 1.2,
  nitrogen: 4,
  phosphorus: 2,
  potassium: 5,
  ppfd: 12,
};

const DECIMALS = {
  ph: 2,
  ec: 2,
  temperature: 1,
  humidity: 0,
  moisture: 0,
  nitrogen: 0,
  phosphorus: 0,
  potassium: 0,
  ppfd: 0,
};

const HISTORY_LIMIT = 500;

const GROWTH_HISTORY_LIMIT = 50;

/* =========================================================
   DEVICE STATE
   ========================================================= */

const device = {
  deviceId: DEVICE_ID,
  power: true,
  mode: "auto",
  intervalSec: 2,
  startedAt: new Date().toISOString(),
  lastTickAt: null,
  transmissions: 0,
  target: { ...DEFAULT_READINGS },
  readings: { ...DEFAULT_READINGS },
  history: [],

  /* Virtual crop farm state */
  crop: null,
  plantedAt: null,
  growth: null,
  growthHistory: [],
};

let tickTimer = null;

/* =========================================================
   HELPERS
   ========================================================= */

function round(key, value) {
  const places = DECIMALS[key] ?? 2;
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

function clamp(key, value) {
  const limits = {
    ph: [0, 14],
    ec: [0, 5],
    temperature: [0, 50],
    humidity: [0, 100],
    moisture: [0, 100],
    nitrogen: [0, 500],
    phosphorus: [0, 300],
    potassium: [0, 500],
    ppfd: [0, 1200],
  };

  const [min, max] = limits[key] || [0, 1000];

  return Math.min(max, Math.max(min, value));
}

function recordReading() {
  const point = {
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ...device.readings,
  };

  device.history.push(point);

  if (device.history.length > HISTORY_LIMIT) {
    device.history = device.history.slice(-HISTORY_LIMIT);
  }

  return point;
}

/* =========================================================
   TICK
   ========================================================= */

function tick() {
  if (!device.power) {
    return;
  }

  if (device.mode === "auto") {
    for (const key of Object.keys(device.readings)) {
      const wander = (Math.random() - 0.5) * 2 * (DRIFT[key] || 1);

      const pulled =
        device.readings[key] +
        (device.target[key] - device.readings[key]) * 0.25 +
        wander;

      device.readings[key] = round(
        key,
        clamp(key, pulled)
      );
    }
  }

  device.lastTickAt = new Date().toISOString();
  device.transmissions += 1;

  recordReading();
}

function startTicking() {
  if (tickTimer) {
    clearInterval(tickTimer);
  }

  tickTimer = setInterval(tick, device.intervalSec * 1000);
}

/* Seed a short boot history so polling clients see a trace */
(function seedBootHistory() {
  const now = Date.now();

  for (let index = 30; index > 0; index -= 1) {
    const point = {
      timestamp: new Date(
        now - index * 60000
      ).toISOString(),
      time: new Date(
        now - index * 60000
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    for (const key of Object.keys(DEFAULT_READINGS)) {
      const wander =
        (Math.random() - 0.5) * 2 * (DRIFT[key] || 1) * 3;

      point[key] = round(
        key,
        clamp(key, DEFAULT_READINGS[key] + wander)
      );
    }

    device.history.push(point);
  }
})();

/* Started by the dev-server plugin so `vite build`
   (which also imports this module) can exit cleanly. */
export function startDeviceUnit() {
  startTicking();
}

/* =========================================================
   CONTROL
   ========================================================= */

function applyControl(body = {}) {
  if (typeof body.power === "boolean") {
    device.power = body.power;

    if (body.power) {
      device.startedAt = new Date().toISOString();
    }
  }

  if (body.mode === "auto" || body.mode === "manual") {
    device.mode = body.mode;
  }

  if (
    typeof body.intervalSec === "number" &&
    body.intervalSec >= 1 &&
    body.intervalSec <= 3600
  ) {
    device.intervalSec = Math.round(body.intervalSec);
    startTicking();
  }

  if (body.preset && PRESETS[body.preset]) {
    device.target = { ...PRESETS[body.preset] };
    device.readings = { ...PRESETS[body.preset] };
    device.mode = body.mode === "manual" ? "manual" : device.mode;
    recordReading();
  }

  if (body.readings && typeof body.readings === "object") {
    for (const [key, value] of Object.entries(body.readings)) {
      if (!(key in device.readings)) {
        continue;
      }

      const numeric = Number(value);

      if (!Number.isFinite(numeric)) {
        continue;
      }

      const cleaned = round(key, clamp(key, numeric));

      device.readings[key] = cleaned;
      device.target[key] = cleaned;
    }

    device.mode = "manual";
    recordReading();
  }

  return getStatus();
}

/* =========================================================
   RESPONSES
   ========================================================= */

function getStatus() {
  return {
    deviceId: device.deviceId,
    power: device.power,
    mode: device.mode,
    intervalSec: device.intervalSec,
    online: device.power,
    startedAt: device.startedAt,
    lastTickAt: device.lastTickAt,
    transmissions: device.transmissions,
    crop: device.crop,
    growth: device.growth,
    source: "INPUT_SIMULATOR",
  };
}

function getReadings() {
  return {
    ...getStatus(),
    timestamp: device.lastTickAt || new Date().toISOString(),
    sensors: { ...device.readings },
    growth: growthSnapshot(),
  };
}

function getHistory(limit = 100) {
  const size = Math.min(
    Math.max(1, Number(limit) || 100),
    device.history.length
  );

  return {
    deviceId: device.deviceId,
    count: size,
    total: device.history.length,
    history: device.history.slice(-size),
  };
}

/* =========================================================
   VIRTUAL CROP FARM — GROWTH PHOTO ANALYSIS
   ========================================================= */

function growthSnapshot() {
  if (!device.crop) {
    return null;
  }

  const profile = CROP_PROFILES[device.crop];

  const dayNumber = device.plantedAt
    ? Math.max(
        1,
        Math.floor(
          (Date.now() -
            new Date(device.plantedAt).getTime()) /
            86400000
        ) + 1
      )
    : 1;

  const expectedStage = expectedStageForProgress(
    dayNumber / profile.cycleDays
  );

  return {
    crop: device.crop,
    cropName: profile.name,
    cropId: profile.cropId,
    fruitColor: profile.fruitColor,
    cycleDays: profile.cycleDays,
    plantedAt: device.plantedAt,
    dayNumber,
    expectedStage,
    expectedStageName: STAGE_NAMES[expectedStage - 1],
    ...(device.growth || {}),
  };
}

function applyCropSelection(crop) {
  if (!CROP_PROFILES[crop]) {
    return {
      status: 400,
      payload: {
        error: "Unknown crop. Available: tomato, capsicum.",
      },
    };
  }

  if (device.crop !== crop) {
    device.crop = crop;
    device.plantedAt = new Date().toISOString();
    device.growth = null;
  }

  return {
    status: 200,
    payload: {
      success: true,
      growth: growthSnapshot(),
    },
  };
}

function applyPhotoAnalysis(body = {}) {
  const crop = body.crop || device.crop;

  if (!CROP_PROFILES[crop]) {
    return {
      status: 400,
      payload: {
        error: "Select a crop before analyzing a photo.",
      },
    };
  }

  if (
    !Array.isArray(body.features) ||
    body.features.length === 0 ||
    !body.features.every((value) =>
      Number.isFinite(Number(value))
    )
  ) {
    return {
      status: 400,
      payload: {
        error:
          "Photo features are missing or invalid.",
      },
    };
  }

  if (device.crop !== crop) {
    device.crop = crop;
    device.plantedAt = new Date().toISOString();
  }

  const result = classifyFeatures(
    crop,
    body.features.map((value) => Number(value))
  );

  if (!result.ok) {
    return {
      status: 500,
      payload: { error: result.error },
    };
  }

  device.growth = {
    stage: result.stage,
    stageName: result.stageName,
    confidence: result.confidence,
    similarity: result.similarity,
    source: "PHOTO_ANALYSIS",
    analyzedAt: new Date().toISOString(),
  };

  device.growthHistory.push({
    crop,
    cropName: CROP_PROFILES[crop].name,
    ...device.growth,
  });

  device.growthHistory = device.growthHistory.slice(
    -GROWTH_HISTORY_LIMIT
  );

  return {
    status: 200,
    payload: {
      success: true,
      analysis: result,
      growth: growthSnapshot(),
    },
  };
}

/* =========================================================
   HTTP MIDDLEWARE (CORS-ENABLED DEVICE API)
   ========================================================= */

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function deviceApiMiddleware(req, res, next) {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  if (!path.startsWith("/api/")) {
    return next();
  }

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method === "GET" && path === "/api/status") {
    return sendJson(res, 200, getStatus());
  }

  if (req.method === "GET" && path === "/api/readings") {
    return sendJson(res, 200, getReadings());
  }

  if (req.method === "GET" && path === "/api/history") {
    return sendJson(
      res,
      200,
      getHistory(url.searchParams.get("limit"))
    );
  }

  if (req.method === "GET" && path === "/api/growth") {
    return sendJson(res, 200, {
      deviceId: device.deviceId,
      crop: device.crop,
      growth: growthSnapshot(),
      history: device.growthHistory.slice(-20),
    });
  }

  if (req.method === "POST" && path === "/api/growth/crop") {
    return readBody(req).then((body) => {
      const result = applyCropSelection(body.crop);

      sendJson(res, result.status, result.payload);
    });
  }

  if (req.method === "POST" && path === "/api/growth/photo") {
    return readBody(req).then((body) => {
      const result = applyPhotoAnalysis(body);

      sendJson(res, result.status, result.payload);
    });
  }

  if (req.method === "POST" && path === "/api/control") {
    return readBody(req).then((body) => {
      sendJson(res, 200, applyControl(body));
    });
  }

  return sendJson(res, 404, { error: "Unknown device endpoint" });
}

export default deviceApiMiddleware;
