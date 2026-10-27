import { createContext, useContext, useEffect, useRef, useState } from "react";

import { getDeviceReadings, sendDeviceControl } from "../services/simulatorService";

import api from "../services/api";

const SensorContext = createContext(null);

const SENSOR_STORAGE_KEY = "hydrogrow_sensor_data";

const HISTORY_STORAGE_KEY = "hydrogrow_sensor_history";

/* =========================================================
   TIMING + LIMITS
   ========================================================= */

const DEVICE_POLL_MS = 3000;

const LOCAL_DRIFT_MS = 3000;

const HISTORY_APPEND_MS = 30000;

const HISTORY_LIMIT = 240;

const BASELINE_POINTS = 48;

const BASELINE_INTERVAL_MS = 30 * 60 * 1000;

/* =========================================================
   SENSOR DEFAULTS + PRESETS
   ========================================================= */

const DEFAULT_SENSOR_DATA = {
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
  healthy: { ...DEFAULT_SENSOR_DATA },

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
    ph: 4.7,
    ec: 3.1,
    temperature: 35,
    humidity: 92,
    moisture: 35,
    nitrogen: 220,
    phosphorus: 15,
    potassium: 300,
    ppfd: 150,
  },
};

/* =========================================================
   LOCAL SIMULATION HELPERS

   Used as the fallback data source whenever the hardware
   unit on port 5174 is unreachable — HydroGrow then runs a
   gentle local drift so charts and alerts keep evolving.
   ========================================================= */

const SENSOR_LIMITS = {
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

const SENSOR_DRIFT = {
  ph: 0.04,
  ec: 0.03,
  temperature: 0.3,
  humidity: 0.8,
  moisture: 0.8,
  nitrogen: 3,
  phosphorus: 1.5,
  potassium: 4,
  ppfd: 10,
};

const SENSOR_DECIMALS = {
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

function clampSensorValue(key, value) {
  const [min, max] = SENSOR_LIMITS[key] || [0, 1000];

  return Math.min(max, Math.max(min, value));
}

function roundSensorValue(key, value) {
  const decimals = SENSOR_DECIMALS[key] ?? 2;

  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function wander(key, base, multiplier = 1) {
  const drift = SENSOR_DRIFT[key] || 1;

  const offset = (Math.random() - 0.5) * 2 * drift * multiplier;

  return roundSensorValue(
    key,
    clampSensorValue(key, base + offset)
  );
}

function driftSensorData(previous) {
  const drifted = {};

  for (const key of Object.keys(previous)) {
    drifted[key] = wander(key, previous[key]);
  }

  return drifted;
}

function buildHistoryPoint(data, date = new Date()) {
  return {
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),

    timestamp: date.toISOString(),

    ...data,
  };
}

function seedBaselineHistory() {
  const now = Date.now();

  const baseline = [];

  for (let index = BASELINE_POINTS; index > 0; index -= 1) {
    const date = new Date(now - index * BASELINE_INTERVAL_MS);

    const point = {
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),

      timestamp: date.toISOString(),
    };

    for (const key of Object.keys(DEFAULT_SENSOR_DATA)) {
      point[key] = wander(key, DEFAULT_SENSOR_DATA[key], 4);
    }

    baseline.push(point);
  }

  return baseline;
}

function readStoredJson(key) {
  try {
    const stored = localStorage.getItem(key);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/* =========================================================
   STATUS ANALYSIS
   ========================================================= */

function getStatus(value, min, max) {
  if (value < min || value > max) {
    return "critical";
  }

  const range = max - min;

  const warningMargin = range * 0.15;

  if (
    value < min + warningMargin ||
    value > max - warningMargin
  ) {
    return "warning";
  }

  return "healthy";
}

function analyzeSensors(data) {
  return {
    ph: getStatus(data.ph, 5.5, 6.5),
    ec: getStatus(data.ec, 1.2, 2.2),
    temperature: getStatus(data.temperature, 20, 28),
    humidity: getStatus(data.humidity, 50, 80),
    moisture: getStatus(data.moisture, 55, 85),
    nitrogen: getStatus(data.nitrogen, 80, 160),
    phosphorus: getStatus(data.phosphorus, 30, 80),
    potassium: getStatus(data.potassium, 120, 220),
    ppfd: getStatus(data.ppfd, 300, 600),
  };
}

/* =========================================================
   PROVIDER
   ========================================================= */

export function SensorProvider({ children }) {
  const [sensorData, setSensorData] = useState(() => {
    return readStoredJson(SENSOR_STORAGE_KEY) || DEFAULT_SENSOR_DATA;
  });

  const [history, setHistory] = useState(() => {
    const stored = readStoredJson(HISTORY_STORAGE_KEY);

    if (Array.isArray(stored) && stored.length > 0) {
      return stored.slice(-HISTORY_LIMIT);
    }

    return seedBaselineHistory();
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [deviceConnected, setDeviceConnected] = useState(false);

  const [deviceInfo, setDeviceInfo] = useState(null);

  const [growthData, setGrowthData] = useState(null);

  const sensorDataRef = useRef(sensorData);

  sensorDataRef.current = sensorData;

  const sensorStatus = analyzeSensors(sensorData);

  const overallStatus = Object.values(sensorStatus).includes("critical")
    ? "critical"
    : Object.values(sensorStatus).includes("warning")
      ? "warning"
      : "healthy";

  const deviceSource = deviceConnected
    ? "HARDWARE_UNIT"
    : "LOCAL_SIMULATION";

  const serverSyncCounter = useRef(0);

  /* -------------------------------------------------------
     PERSISTENCE
     ------------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      SENSOR_STORAGE_KEY,
      JSON.stringify(sensorData)
    );
  }, [sensorData]);

  useEffect(() => {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history)
    );
  }, [history]);

  /* -------------------------------------------------------
     HARDWARE UNIT POLLING (port 5174)
     ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getDeviceReadings();

        if (cancelled) {
          return;
        }

        setDeviceConnected(true);

        setDeviceInfo({
          deviceId: data.deviceId,

          power: data.power,

          mode: data.mode,

          intervalSec: data.intervalSec,

          online: data.online,

          transmissions: data.transmissions,

          lastTickAt: data.lastTickAt,

          startedAt: data.startedAt,

          source: data.source,
        });

        // Photo-based growth verification data (optional)
        // from the device — null when no photo was analyzed.

        setGrowthData(data.growth || null);

        if (data.sensors) {
          setSensorData(data.sensors);

          setLastUpdated(new Date());

          // -------------------------------------------
          // SYNC READING TO BACKEND (every ~30s) so the
          // server can store it, raise alerts and run
          // automation rules.
          // -------------------------------------------

          serverSyncCounter.current += 1;

          if (serverSyncCounter.current % 10 === 0) {
            const reading = {
              deviceId: data.deviceId || "HYDROGROW-SIM-001",
              source: "INPUT_SIMULATOR",
              sensors: data.sensors,
            };

            // Attach growth only when the device has a
            // photo-verified stage for the active crop.

            if (data.growth && data.growth.stage) {
              reading.growth = {
                cropKey: data.growth.cropId,
                cropName: data.growth.cropName,
                stage: data.growth.stage,
                stageName: data.growth.stageName,
                confidence: data.growth.confidence,
                source: data.growth.source,
                analyzedAt: data.growth.analyzedAt,
              };
            }

            api
              .post("/sensors/readings", reading, {
                auth: true,
              })
              .catch(() => {
                // server offline — keep client-side simulation
              });
          }
        }
      } catch {
        if (cancelled) {
          return;
        }

        setDeviceConnected(false);

        setDeviceInfo(null);

        setGrowthData(null);
      }
    };

    poll();

    const timer = setInterval(poll, DEVICE_POLL_MS);

    return () => {
      cancelled = true;

      clearInterval(timer);
    };
  }, []);

  /* -------------------------------------------------------
     LOCAL DRIFT FALLBACK (unit unreachable)
     ------------------------------------------------------- */

  useEffect(() => {
    if (deviceConnected) {
      return;
    }

    const timer = setInterval(() => {
      setSensorData((previous) => driftSensorData(previous));

      setLastUpdated(new Date());
    }, LOCAL_DRIFT_MS);

    return () => {
      clearInterval(timer);
    };
  }, [deviceConnected]);

  /* -------------------------------------------------------
     SLOW HISTORY RECORDING
     ------------------------------------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setHistory((previous) => {
        const point = buildHistoryPoint(sensorDataRef.current);

        return [...previous, point].slice(-HISTORY_LIMIT);
      });
    }, HISTORY_APPEND_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* -------------------------------------------------------
     ACTIONS
     ------------------------------------------------------- */

  const updateSensorData = (newData) => {
    const updatedData = {
      ...sensorDataRef.current,

      ...newData,
    };

    setSensorData(updatedData);

    setLastUpdated(new Date());

    if (deviceConnected) {
      sendDeviceControl({ readings: newData }).catch(() => {});
    }

    return updatedData;
  };

  const applyPreset = (preset) => {
    const presetData = PRESETS[preset];

    if (!presetData) {
      return;
    }

    setSensorData(presetData);

    setLastUpdated(new Date());

    if (deviceConnected) {
      sendDeviceControl({
        preset,

        mode: "auto",
      }).catch(() => {});
    }
  };

  const resetSensors = () => {
    applyPreset("healthy");
  };

  return (
    <SensorContext.Provider
      value={{
        sensorData,
        history,
        sensorStatus,
        overallStatus,
        lastUpdated,
        deviceConnected,
        deviceInfo,
        growthData,
        deviceSource,
        updateSensorData,
        applyPreset,
        resetSensors,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  return useContext(SensorContext);
}
