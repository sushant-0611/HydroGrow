import { useEffect, useRef, useState } from "react";

import {
  extractGrowthFeatures,
  loadImageFromFile,
} from "./growthFeatures";

/* =========================================================
   CONTROL PANEL FOR THE SENSOR HARDWARE UNIT (:5174)

   The actual device lives in the dev-server process
   (device/deviceServer.js). This UI never holds the truth:
   it polls the device API and every control sends a command
   to it — like driving a real network-attached sensor unit.
   ========================================================= */

const DEVICE_POLL_MS = 1500;

const HISTORY_POLL_MS = 8000;

const GROWTH_POLL_MS = 10000;

/* =========================================================
   VIRTUAL CROP FARM CONFIGURATION
   ========================================================= */

const FARM_CROPS = [
  {
    key: "tomato",
    name: "Tomato",
    cropId: "HG012",
    icon: "bi-tomato",
  },

  {
    key: "capsicum",
    name: "Capsicum",
    cropId: "HG014",
    icon: "bi-egg-fried",
  },
];

const STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

/* =========================================================
   SENSOR CONFIGURATION
   ========================================================= */

const SENSOR_CONFIG = [
  {
    key: "ph",
    label: "pH Level",
    unit: "",
    min: 0,
    max: 14,
    step: 0.1,
    icon: "bi-droplet-half",
  },

  {
    key: "ec",
    label: "EC",
    unit: "mS/cm",
    min: 0,
    max: 5,
    step: 0.1,
    icon: "bi-lightning-charge",
  },

  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    min: 0,
    max: 50,
    step: 0.1,
    icon: "bi-thermometer-half",
  },

  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    icon: "bi-cloud-drizzle",
  },

  {
    key: "moisture",
    label: "Moisture",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    icon: "bi-moisture",
  },

  {
    key: "nitrogen",
    label: "Nitrogen",
    unit: "ppm",
    min: 0,
    max: 500,
    step: 1,
    icon: "bi-flower1",
  },

  {
    key: "phosphorus",
    label: "Phosphorus",
    unit: "ppm",
    min: 0,
    max: 300,
    step: 1,
    icon: "bi-tree",
  },

  {
    key: "potassium",
    label: "Potassium",
    unit: "ppm",
    min: 0,
    max: 500,
    step: 1,
    icon: "bi-bar-chart",
  },

  {
    key: "ppfd",
    label: "PPFD",
    unit: "µmol/m²/s",
    min: 0,
    max: 1200,
    step: 1,
    icon: "bi-sun",
  },
];

/* =========================================================
   STATUS RANGES
   =========================================================

   NORMAL RANGE
   ↓
   Healthy

   WARNING RANGE
   ↓
   Warning

   CRITICAL RANGE
   ↓
   Critical
   ========================================================= */

const STATUS_RANGES = {
  ph: {
    healthy: [5.5, 6.5],
    critical: [4.8, 7.2],
  },

  ec: {
    healthy: [1.2, 2.2],
    critical: [0.8, 2.8],
  },

  temperature: {
    healthy: [20, 28],
    critical: [16, 34],
  },

  humidity: {
    healthy: [50, 80],
    critical: [40, 90],
  },

  moisture: {
    healthy: [55, 85],
    critical: [40, 95],
  },

  nitrogen: {
    healthy: [80, 160],
    critical: [50, 200],
  },

  phosphorus: {
    healthy: [30, 80],
    critical: [15, 120],
  },

  potassium: {
    healthy: [120, 220],
    critical: [80, 280],
  },

  ppfd: {
    healthy: [300, 600],
    critical: [200, 800],
  },
};

/* =========================================================
   GET PARAMETER STATUS
   ========================================================= */

function getParameterStatus(key, value) {
  const range = STATUS_RANGES[key];

  if (!range) {
    return "healthy";
  }

  const numericValue = Number(value);

  const [healthyMin, healthyMax] = range.healthy;
  const [criticalMin, criticalMax] = range.critical;

  /*
   * CRITICAL
   */

  if (
    numericValue < criticalMin ||
    numericValue > criticalMax
  ) {
    return "critical";
  }

  /*
   * WARNING
   */

  if (
    numericValue < healthyMin ||
    numericValue > healthyMax
  ) {
    return "warning";
  }

  /*
   * HEALTHY
   */

  return "healthy";
}

/* =========================================================
   GET OVERALL STATUS
   ========================================================= */

function getOverallStatus(values) {
  const parameterStatuses = Object.keys(
    STATUS_RANGES
  ).map((key) =>
    getParameterStatus(key, values[key])
  );

  /*
   * If ANY parameter is critical
   * → Overall Critical
   */

  if (parameterStatuses.includes("critical")) {
    return "critical";
  }

  /*
   * If ANY parameter is warning
   * → Overall Warning
   */

  if (parameterStatuses.includes("warning")) {
    return "warning";
  }

  /*
   * Otherwise Healthy
   */

  return "healthy";
}

/* =========================================================
   STATUS DETAILS
   ========================================================= */

const STATUS_DETAILS = {
  healthy: {
    title: "Healthy",
    description: "Normal growing conditions",
    icon: "bi-check-circle-fill",
  },

  warning: {
    title: "Warning",
    description: "Parameters need attention",
    icon: "bi-exclamation-triangle-fill",
  },

  critical: {
    title: "Critical",
    description: "Unsafe growing conditions",
    icon: "bi-x-circle-fill",
  },
};

/* =========================================================
   DEVICE FETCH
   ========================================================= */

async function deviceFetch(path, options = {}) {
  const hasBody = options.body !== undefined;

  const response = await fetch(path, {
    method: options.method || "GET",

    headers: hasBody
      ? { "Content-Type": "application/json" }
      : undefined,

    body: options.body,

    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) {
    throw new Error(
      `Device responded with ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   FORMAT UPTIME
   ========================================================= */

function formatUptime(elapsedMs) {
  const totalSeconds = Math.max(
    0,
    Math.floor(elapsedMs / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (hours > 0 || minutes > 0) {
    parts.push(`${minutes}m`);
  }

  parts.push(`${seconds}s`);

  return parts.join(" ");
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [sensors, setSensors] = useState({
    ph: 6.2,
    ec: 1.8,
    temperature: 25,
    humidity: 65,
    moisture: 72,
    nitrogen: 120,
    phosphorus: 50,
    potassium: 180,
    ppfd: 450,
  });

  const [overrides, setOverrides] = useState({});

  const [deviceInfo, setDeviceInfo] = useState({
    power: true,
    mode: "auto",
    intervalSec: 2,
    transmissions: 0,
    lastTickAt: null,
    startedAt: null,
  });

  const [linkStatus, setLinkStatus] = useState("connecting");

  const [historyCount, setHistoryCount] = useState(0);

  const [intervalInput, setIntervalInput] = useState(2);

  const [now, setNow] = useState(Date.now());

  const [growth, setGrowth] = useState(null);

  const [growthHistory, setGrowthHistory] = useState(
    []
  );

  const [analysis, setAnalysis] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);

  const [dragOver, setDragOver] = useState(false);

  const [analysisError, setAnalysisError] =
    useState(null);

  const photoInputRef = useRef(null);

  const manualTimersRef = useRef({});

  /* =======================================================
     DEVICE CONTROL
     ======================================================= */

  const applyControl = async (payload) => {
    try {
      const status = await deviceFetch(
        "/api/control",
        {
          method: "POST",

          body: JSON.stringify(payload),
        }
      );

      setLinkStatus("live");

      setDeviceInfo((previous) => ({
        ...previous,

        ...status,
      }));

      return true;
    } catch {
      setLinkStatus("offline");

      return false;
    }
  };

  /* =======================================================
     DEVICE READINGS POLLING
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await deviceFetch(
          "/api/readings"
        );

        if (cancelled) {
          return;
        }

        setLinkStatus("live");

        setSensors(data.sensors);

        setGrowth(data.growth || null);

        setDeviceInfo({
          power: data.power,

          mode: data.mode,

          intervalSec: data.intervalSec,

          transmissions: data.transmissions,

          lastTickAt: data.lastTickAt,

          startedAt: data.startedAt,
        });

        if (
          document.activeElement?.id !==
          "interval"
        ) {
          setIntervalInput(data.intervalSec);
        }

        setOverrides((previous) => {
          const remaining = {};

          for (const [key, value] of Object.entries(
            previous
          )) {
            const echoed =
              data.sensors[key];

            if (
              echoed !== undefined &&
              Math.abs(
                Number(value) - Number(echoed)
              ) <= 0.011
            ) {
              continue;
            }

            remaining[key] = value;
          }

          return remaining;
        });
      } catch {
        if (!cancelled) {
          setLinkStatus("offline");
        }
      }
    };

    poll();

    const timer = setInterval(
      poll,
      DEVICE_POLL_MS
    );

    return () => {
      cancelled = true;

      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     HISTORY COUNT POLLING
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await deviceFetch(
          "/api/history?limit=1"
        );

        if (!cancelled) {
          setHistoryCount(data.total ?? 0);
        }
      } catch {
        /*
         * Readings poll already flags the link
         */
      }
    };

    poll();

    const timer = setInterval(
      poll,
      HISTORY_POLL_MS
    );

    return () => {
      cancelled = true;

      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     GROWTH HISTORY POLLING
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await deviceFetch(
          "/api/growth"
        );

        if (!cancelled) {
          setGrowth(data.growth || null);

          setGrowthHistory(data.history || []);
        }
      } catch {
        /*
         * Readings poll already flags the link
         */
      }
    };

    poll();

    const timer = setInterval(
      poll,
      GROWTH_POLL_MS
    );

    return () => {
      cancelled = true;

      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     CLOCK (UPTIME)
     ======================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     MANUAL TIMER CLEANUP
     ======================================================= */

  useEffect(() => {
    const timers = manualTimersRef.current;

    return () => {
      Object.values(timers).forEach(
        clearTimeout
      );
    };
  }, []);

  /* =======================================================
     CONTROL HANDLERS
     ======================================================= */

  const togglePower = () => {
    applyControl({
      power: !deviceInfo.power,
    });
  };

  const setMode = (mode) => {
    if (mode === "auto") {
      setOverrides({});
    }

    applyControl({ mode });
  };

  const applyPreset = (presetName) => {
    setOverrides({});

    applyControl({
      preset: presetName,

      mode: "auto",
    });
  };

  const handleIntervalChange = (rawValue) => {
    const value = Math.max(
      1,
      Math.min(3600, Number(rawValue) || 1)
    );

    setIntervalInput(value);

    clearTimeout(
      manualTimersRef.current.interval
    );

    manualTimersRef.current.interval =
      setTimeout(() => {
        applyControl({ intervalSec: value });
      }, 500);
  };

  const handleManualChange = (key, rawValue) => {
    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return;
    }

    setOverrides((previous) => ({
      ...previous,

      [key]: value,
    }));

    clearTimeout(manualTimersRef.current[key]);

    manualTimersRef.current[key] =
      setTimeout(() => {
        applyControl({
          readings: { [key]: value },
        });
      }, 350);
  };

  /* =======================================================
     DERIVED VALUES
     ======================================================= */

  const effectiveValues = {
    ...sensors,

    ...overrides,
  };

  const currentStatus =
    getOverallStatus(effectiveValues);

  const statusDetails =
    STATUS_DETAILS[currentStatus];

  const uptime =
    deviceInfo.startedAt && deviceInfo.power
      ? formatUptime(
          now -
            new Date(
              deviceInfo.startedAt
            ).getTime()
        )
      : "—";

  const linkBadge =
    linkStatus === "live"
      ? {
          className: "live",

          icon: "bi-broadcast",

          label: "DEVICE LIVE",
        }
      : linkStatus === "connecting"
        ? {
            className: "connecting",

            icon: "bi-hourglass-split",

            label: "CONNECTING",
          }
        : {
            className: "offline",

            icon: "bi-wifi-off",

            label: "UNREACHABLE",
          };

  const payloadPreview = {
    deviceId: "HYDROGROW-SIM-001",

    crop: growth?.cropName || "Not selected",

    timestamp:
      deviceInfo.lastTickAt ||
      new Date().toISOString(),

    sensors: effectiveValues,

    status: currentStatus,

    source: "INPUT_SIMULATOR",

    ...(growth?.stage
      ? {
          growth: {
            cropKey: growth.cropId,

            stage: growth.stage,

            stageName: growth.stageName,

            confidence: growth.confidence,

            source: growth.source,

            analyzedAt: growth.analyzedAt,
          },
        }
      : {}),
  };

  /* =======================================================
     VIRTUAL CROP FARM HANDLERS
     ======================================================= */

  const selectFarmCrop = async (cropKey) => {
    setAnalysisError(null);

    try {
      const data = await deviceFetch(
        "/api/growth/crop",
        {
          method: "POST",

          body: JSON.stringify({ crop: cropKey }),
        }
      );

      setGrowth(data.growth || null);

      setAnalysis(null);
    } catch {
      setAnalysisError(
        "Could not reach the device to select the crop."
      );
    }
  };

  const analyzePhoto = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setAnalysisError("Please drop an image file.");

      return;
    }

    if (!growth?.crop) {
      setAnalysisError(
        "Select the crop on this unit first."
      );

      return;
    }

    setAnalyzing(true);

    setAnalysisError(null);

    try {
      const image = await loadImageFromFile(file);

      const features = extractGrowthFeatures(image);

      const data = await deviceFetch(
        "/api/growth/photo",
        {
          method: "POST",

          body: JSON.stringify({
            crop: growth.crop,

            features,
          }),
        }
      );

      setAnalysis(data);

      setGrowth(data.growth || null);
    } catch (error) {
      setAnalysisError(
        error?.message ||
          "Photo analysis failed. Try another image."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="simulator-app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top hydrogrow-navbar">

        <div className="container py-2">

          {/* LOGO */}

          <div className="navbar-brand d-flex align-items-center gap-2">

            <span className="brand-icon">
              <i className="bi bi-leaf-fill"></i>
            </span>

            <span>

              <span className="brand-name">
                HydroGrow
              </span>

              <small className="brand-tagline d-block">
                Intelligent Hydroponics
              </small>

            </span>

          </div>

          {/* DEVICE CONTROL */}

          <div className="simulator-navbar-controls">

            <span className="simulator-label">
              Hardware Unit
            </span>

            <span
              className={`device-link-badge ${linkBadge.className}`}
            >

              <i
                className={`bi ${linkBadge.icon}`}
              ></i>

              {linkBadge.label}

            </span>

            <div
              className={`simulator-power ${
                deviceInfo.power
                  ? "on"
                  : "off"
              }`}
            >

              <span className="power-indicator"></span>

              {deviceInfo.power
                ? "ONLINE"
                : "OFFLINE"}

            </div>

            <button
              type="button"
              className={`power-button ${
                deviceInfo.power
                  ? "power-off"
                  : "power-on"
              }`}
              onClick={togglePower}
            >

              <i
                className={`bi ${
                  deviceInfo.power
                    ? "bi-stop-circle-fill"
                    : "bi-play-circle-fill"
                }`}
              ></i>

              {deviceInfo.power
                ? "Power OFF"
                : "Power ON"}

            </button>

          </div>

        </div>

      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="container simulator-container">

        {/* PAGE HEADER */}

        <div className="page-heading">

          <div>

            <span className="eyebrow">
              SENSOR HARDWARE UNIT
            </span>

            <h1>
              Device Control Panel
            </h1>

            <p>
              Device HYDROGROW-SIM-001 ·
              Crop {growth?.cropName || "not selected"}.
              This unit runs on
              its own port and streams live
              readings to HydroGrow.
            </p>

          </div>

          {/* =================================================
              SMALL CURRENT STATUS
          ================================================= */}

          <div
            className={`current-status-box ${
              currentStatus
            }`}
          >

            <div className="current-status-header">

              <span className="current-status-label">
                Current Status
              </span>

              <span className="current-status-indicator"></span>

            </div>

            <div className="current-status-value">

              <i
                className={`bi ${statusDetails.icon}`}
              ></i>

              <strong>
                {statusDetails.title}
              </strong>

            </div>

            <small>
              {statusDetails.description}
            </small>

          </div>

        </div>

        {/* =====================================================
            TRANSMISSION SETTINGS
        ===================================================== */}

        <section className="transmission-settings">

          <div className="transmission-setting-info">

            <div className="setting-icon">
              <i className="bi bi-sliders"></i>
            </div>

            <div>

              <h3>
                Device Settings
              </h3>

              <p>
                In AUTO mode the unit drifts
                its readings around the current
                target. In MANUAL mode it holds
                exactly the values you set.
              </p>

            </div>

          </div>

          <div className="delay-control">

            <label htmlFor="interval">

              <i className="bi bi-stopwatch"></i>

              Tick every

            </label>

            <div className="delay-input">

              <input
                id="interval"
                type="number"
                min="1"
                max="3600"
                value={intervalInput}
                onChange={(event) =>
                  handleIntervalChange(
                    event.target.value
                  )
                }
              />

              <span>
                seconds
              </span>

            </div>

          </div>

        </section>

        {/* =====================================================
            TRANSMISSION INFO
        ===================================================== */}

        <section className="transmission-info">

          <div>

            <span className="info-label">
              Unit Status
            </span>

            <strong>
              {deviceInfo.power
                ? `ONLINE · ${uptime}`
                : "POWERED OFF"}
            </strong>

          </div>

          <div>

            <span className="info-label">
              Mode
            </span>

            <div className="mode-toggle">

              <button
                type="button"
                className={`mode-toggle-button ${
                  deviceInfo.mode === "auto"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setMode("auto")
                }
              >

                <i className="bi bi-shuffle"></i>

                AUTO

              </button>

              <button
                type="button"
                className={`mode-toggle-button ${
                  deviceInfo.mode === "manual"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setMode("manual")
                }
              >

                <i className="bi bi-hand-index-thumb"></i>

                MANUAL

              </button>

            </div>

          </div>

          <div>

            <span className="info-label">
              Transmissions
            </span>

            <strong>
              {deviceInfo.transmissions}
            </strong>

          </div>

          <div>

            <span className="info-label">
              Stored Records
            </span>

            <strong>
              {historyCount}
            </strong>

          </div>

        </section>

        {/* =====================================================
            PRESETS
        ===================================================== */}

        <section className="preset-section">

          <div className="section-title">

            <div>

              <h2>
                Simulation Presets
              </h2>

              <p>
                Push a predefined condition
                straight to the hardware unit.
              </p>

            </div>

          </div>

          <div className="preset-grid">

            {/* HEALTHY */}

            <button
              type="button"
              className="preset-card healthy"
              onClick={() =>
                applyPreset("healthy")
              }
            >

              <i className="bi bi-check-circle-fill"></i>

              <div>

                <strong>
                  Healthy
                </strong>

                <span>
                  Normal growing conditions
                </span>

              </div>

            </button>

            {/* WARNING */}

            <button
              type="button"
              className="preset-card warning"
              onClick={() =>
                applyPreset("warning")
              }
            >

              <i className="bi bi-exclamation-triangle-fill"></i>

              <div>

                <strong>
                  Warning
                </strong>

                <span>
                  Parameters need attention
                </span>

              </div>

            </button>

            {/* CRITICAL */}

            <button
              type="button"
              className="preset-card critical"
              onClick={() =>
                applyPreset("critical")
              }
            >

              <i className="bi bi-x-circle-fill"></i>

              <div>

                <strong>
                  Critical
                </strong>

                <span>
                  Unsafe growing conditions
                </span>

              </div>

            </button>

          </div>

        </section>

        {/* =====================================================
            SENSOR PARAMETERS
        ===================================================== */}

        <section className="sensor-section">

          <div className="section-title">

            <div>

              <h2>
                Sensor Parameters
              </h2>

              <p>
                Fine-tune any channel — the
                unit switches to MANUAL and
                holds the exact values you set.
              </p>

            </div>

            <button
              type="button"
              className="reset-btn"
              onClick={() =>
                applyPreset("healthy")
              }
            >

              <i className="bi bi-arrow-counterclockwise"></i>

              Reset

            </button>

          </div>

          <div className="sensor-grid">

            {SENSOR_CONFIG.map(
              (sensor) => {

                const displayValue =
                  effectiveValues[
                    sensor.key
                  ];

                const parameterStatus =
                  getParameterStatus(
                    sensor.key,
                    displayValue
                  );

                return (

                  <div
                    className={`sensor-card ${parameterStatus}`}
                    key={sensor.key}
                  >

                    <div className="sensor-card-header">

                      <div className="sensor-icon">

                        <i
                          className={`bi ${sensor.icon}`}
                        ></i>

                      </div>

                      <div>

                        <h3>
                          {sensor.label}
                        </h3>

                        <span>
                          {
                            sensor.unit ||
                            "Value"
                          }
                        </span>

                      </div>

                      <span
                        className={`parameter-badge ${parameterStatus}`}
                      >
                        {parameterStatus}
                      </span>

                    </div>

                    <div className="sensor-input-wrapper">

                      <input
                        type="number"
                        value={displayValue}
                        min={
                          sensor.min
                        }
                        max={
                          sensor.max
                        }
                        step={
                          sensor.step
                        }
                        onChange={(event) =>
                          handleManualChange(
                            sensor.key,
                            event.target.value
                          )
                        }
                      />

                      {sensor.unit && (

                        <span className="input-unit">
                          {sensor.unit}
                        </span>

                      )}

                    </div>

                    <input
                      type="range"
                      min={
                        sensor.min
                      }
                      max={
                        sensor.max
                      }
                      step={
                        sensor.step
                      }
                      value={displayValue}
                      onChange={(event) =>
                        handleManualChange(
                          sensor.key,
                          event.target.value
                        )
                      }
                    />

                  </div>

                );
              }
            )}

          </div>

        </section>

        {/* =====================================================
            VIRTUAL CROP FARM — GROWTH PHOTO VERIFICATION
        ===================================================== */}

        <section className="farm-section">

          <div className="section-title">

            <div className="section-title-text">

              <span className="eyebrow">
                VIRTUAL CROP FARM
              </span>

              <h2>
                <i className="bi bi-tree-fill farm-title-icon"></i>
                {" "}Crop Growth Verification
              </h2>

              <p>
                Select the crop growing on this
                unit, then drop a photo of the
                plant. HydroGrow matches it
                against the trained growth-stage
                model and reports the actual
                stage — the My Farm animation
                updates from this verification.
              </p>

            </div>

          </div>

          <div className="farm-grid">

            {/* CROP SELECTION */}

            <div className="farm-card farm-crop-picker">

              <h3>
                <i className="bi bi-1-circle-fill"></i>
                {" "}Crop on this unit
              </h3>

              <div className="farm-crop-options">

                {FARM_CROPS.map((crop) => (
                  <button
                    key={crop.key}
                    type="button"
                    className={`farm-crop-option ${
                      growth?.crop === crop.key
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectFarmCrop(crop.key)
                    }
                  >

                    <img
                      src={`/stages/${crop.key}/stage-5.png`}
                      alt={crop.name}
                    />

                    <strong>
                      {crop.name}
                    </strong>

                    <small>
                      {crop.cropId} ·{" "}
                      {growth?.crop === crop.key
                        ? "selected"
                        : "select"}
                    </small>

                  </button>
                ))}

              </div>

              {growth?.crop ? (
                <div className="farm-schedule">
                  <i className="bi bi-calendar3"></i>

                  <span>
                    Day {growth.dayNumber} of{" "}
                    {growth.cycleDays} · schedule
                    expects{" "}
                    <strong>
                      {growth.expectedStageName}
                    </strong>
                  </span>

                </div>
              ) : (
                <div className="farm-schedule muted">
                  <i className="bi bi-info-circle"></i>

                  <span>
                    No crop selected yet.
                  </span>

                </div>
              )}

            </div>

            {/* DROP ZONE */}

            <div
              className={`farm-card farm-dropzone ${
                dragOver ? "drag-over" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();

                setDragOver(true);
              }}

              onDragLeave={() => setDragOver(false)}

              onDrop={(event) => {
                event.preventDefault();

                setDragOver(false);

                analyzePhoto(
                  event.dataTransfer.files?.[0]
                );
              }}
            >

              <h3>
                <i className="bi bi-2-circle-fill"></i>
                {" "}Drop a crop photo
              </h3>

              {analyzing ? (
                <div className="farm-drop-body">
                  <div
                    className="spinner-border text-success"
                    role="status"
                  >

                    <span className="visually-hidden">
                      Analyzing…
                    </span>

                  </div>

                  <p>
                    Analyzing photo against the
                    trained model…
                  </p>

                </div>
              ) : (
                <div className="farm-drop-body">

                  <i className="bi bi-cloud-arrow-up-fill"></i>

                  <p>
                    Drag &amp; drop the plant photo
                    here, or
                  </p>

                  <button
                    type="button"
                    className="farm-browse-btn"
                    onClick={() =>
                      photoInputRef.current?.click()
                    }
                  >
                    <i className="bi bi-images"></i>
                    {" "}Browse photo
                  </button>

                </div>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  analyzePhoto(
                    event.target.files?.[0]
                  );

                  event.target.value = "";
                }}
              />

            </div>

            {/* RESULT */}

            <div className="farm-card farm-result">

              <h3>
                <i className="bi bi-3-circle-fill"></i>
                {" "}Verification result
              </h3>

              {analysisError ? (
                <div className="farm-error">
                  <i className="bi bi-exclamation-triangle-fill"></i>

                  {analysisError}
                </div>
              ) : analysis?.analysis ? (
                <div className="farm-result-body">

                  <img
                    className="farm-result-photo"
                    src={`/stages/${analysis.growth.crop}/stage-${analysis.analysis.stage}.png`}
                    alt={`${analysis.analysis.stageName} reference`}
                  />

                  <div className="farm-result-meta">

                    <span className="farm-stage-badge">
                      <i className="bi bi-patch-check-fill"></i>
                      {" "}
                      {analysis.analysis.stageName} ·
                      Stage {analysis.analysis.stage}
                    </span>

                    <strong className="farm-confidence">
                      {analysis.analysis.confidence}%
                      match
                    </strong>

                    <small>
                      Closest reference:{" "}
                      {analysis.analysis.stageName} (
                      {Math.round(
                        analysis.analysis.similarity *
                          100
                      )}
                      % similar) · schedule expects{" "}
                      {analysis.growth.expectedStageName}
                      {analysis.growth.stage >
                      analysis.growth.expectedStage
                        ? " — ahead of schedule"
                        : analysis.growth.stage <
                          analysis.growth.expectedStage
                        ? " — behind schedule"
                        : " — on schedule"}
                    </small>

                  </div>

                </div>
              ) : (
                <div className="farm-result-body empty">

                  <i className="bi bi-magic"></i>

                  <p>
                    Drop a photo to see the
                    detected growth stage.
                  </p>

                </div>
              )}

            </div>

          </div>

          {growthHistory.length > 0 && (
            <div className="farm-history">

              <span className="info-label">
                Recent verifications
              </span>

              <div className="farm-history-list">

                {growthHistory
                  .slice(-6)
                  .reverse()
                  .map((entry, index) => (
                    <span
                      key={`${entry.analyzedAt}-${index}`}
                      className="farm-history-item"
                    >
                      <i className="bi bi-patch-check-fill"></i>

                      {entry.cropName ||
                        entry.crop}{" "}
                      → {entry.stageName} (
                      {entry.confidence}%)
                    </span>
                  ))}

              </div>

            </div>
          )}

        </section>

        {/* =====================================================
            LIVE TRANSMISSION
        ===================================================== */}

        <section
          className={`live-transmission ${
            linkStatus === "live" &&
            deviceInfo.power
              ? "active"
              : ""
          }`}
        >

          <div className="live-transmission-icon">

            <i
              className={`bi ${
                linkStatus === "live"
                  ? "bi-broadcast-pin"
                  : "bi-broadcast"
              }`}
            ></i>

          </div>

          <div>

            <h3>
              {linkStatus === "live"
                ? deviceInfo.power
                  ? "Live device feed active"
                  : "Device is powered off"
                : "HydroGrow link is down"}
            </h3>

            <p>
              {linkStatus === "live"
                ? deviceInfo.power
                  ? `The unit ticks every ${deviceInfo.intervalSec} second${
                      deviceInfo.intervalSec === 1
                        ? ""
                        : "s"
                    } and HydroGrow polls these readings live.`
                  : "Power the unit back on to resume streaming."
                : "Start the simulator dev server (port 5174) to restore the link."}
            </p>

          </div>

          <span
            className={`sending-badge ${
              linkStatus === "live" &&
              deviceInfo.power
                ? ""
                : "offline"
            }`}
          >

            <span></span>

            {linkStatus === "live"
              ? deviceInfo.power
                ? "STREAMING"
                : "PAUSED"
              : "NO LINK"}

          </span>

        </section>

        {/* =====================================================
            CURRENT PAYLOAD
        ===================================================== */}

        <section className="payload-section">

          <div className="section-title">

            <div>

              <h2>
                Current Sensor Payload
              </h2>

              <p>
                The exact payload HydroGrow
                receives from this unit.
              </p>

            </div>

          </div>

          <pre>
            {JSON.stringify(
              payloadPreview,
              null,
              2
            )}
          </pre>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="simulator-footer">

        <div className="container">

          <span>
            HydroGrow Sensor Hardware Unit ·
            HYDROGROW-SIM-001
          </span>

          <span>
            Port 5174
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;