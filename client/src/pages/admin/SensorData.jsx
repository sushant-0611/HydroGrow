import { useCallback, useEffect, useState } from "react";

import useSensor from "../../hooks/useSensor";

import api from "../../services/api";

import {
  DEVICE_ID,
  getDeviceHistory,
  getDeviceUrl,
} from "../../services/simulatorService";

/* =========================================================
   SENSOR TILE CONFIG
   ========================================================= */

const SENSOR_TILES = [
  { key: "ph", label: "pH Level", unit: "", icon: "bi-droplet-half", decimals: 2 },
  { key: "ec", label: "EC", unit: "mS/cm", icon: "bi-lightning-charge", decimals: 2 },
  { key: "temperature", label: "Water Temp", unit: "°C", icon: "bi-thermometer-half", decimals: 1 },
  { key: "humidity", label: "Humidity", unit: "%", icon: "bi-cloud-drizzle", decimals: 1 },
  { key: "moisture", label: "Moisture", unit: "%", icon: "bi-moisture", decimals: 1 },
  { key: "nitrogen", label: "Nitrogen", unit: "mg/kg", icon: "bi-flower2", decimals: 0 },
  { key: "phosphorus", label: "Phosphorus", unit: "mg/kg", icon: "bi-droplet", decimals: 0 },
  { key: "potassium", label: "Potassium", unit: "mg/kg", icon: "bi-tree", decimals: 0 },
  { key: "ppfd", label: "Light PPFD", unit: "µmol", icon: "bi-brightness-high", decimals: 0 },
];

function formatReading(value, decimals) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return parsed.toFixed(decimals);
}

function flattenReading(reading) {
  return {
    timestamp: reading?.timestamp,

    ...(reading?.sensors || {}),
  };
}

/* =========================================================
   ADMIN SENSOR DATA
   ========================================================= */

function AdminSensorData() {
  const {
    sensorData,
    deviceConnected,
    deviceInfo,
    deviceSource,
    overallStatus,
    lastUpdated,
  } = useSensor();

  const [apiReading, setApiReading] = useState(null);
  const [apiStats, setApiStats] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] =
    useState(true);

  const loadLatest = useCallback(async () => {
    try {
      const data = await api.get(
        `/sensors/latest?deviceId=${DEVICE_ID}`
      );

      setApiReading(data?.reading || null);
    } catch {
      setApiReading(null);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.get(
        `/sensors/stats?deviceId=${DEVICE_ID}`
      );

      setApiStats(data?.stats || null);
    } catch {
      setApiStats(null);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);

    try {
      const data = await api.get(
        `/sensors/history?deviceId=${DEVICE_ID}&hours=24&limit=200`
      );

      const records = Array.isArray(data?.readings)
        ? data.readings.map(flattenReading)
        : [];

      setHistory(records);
      setHistoryTotal(data?.count ?? records.length);
    } catch {
      try {
        const data = await getDeviceHistory(12);

        const records = Array.isArray(data?.history)
          ? [...data.history]
          : [];

        records.sort(
          (a, b) =>
            new Date(b.timestamp) -
            new Date(a.timestamp)
        );

        setHistory(records);
        setHistoryTotal(data?.total ?? records.length);
      } catch {
        setHistory([]);
        setHistoryTotal(0);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadLatest();
    loadStats();
    loadHistory();
  }, [loadLatest, loadStats, loadHistory]);

  useEffect(() => {
    refreshAll();

    const timer = setInterval(() => {
      loadLatest();
      loadStats();
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshAll, loadLatest, loadStats]);

  const liveSensors =
    apiReading?.sensors || sensorData;

  const liveStatus = apiReading?.status
    ? apiReading.status.toLowerCase()
    : overallStatus;

  const liveTimestamp =
    apiReading?.timestamp || lastUpdated;

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            LIVE TELEMETRY
          </span>

          <h1>
            <i className="bi bi-cpu"></i>
            Sensor Data
          </h1>

          <p>
            Real-time readings streamed from{" "}
            {deviceInfo?.deviceId ||
              "HYDROGROW-SIM-001"}
            {deviceConnected
              ? ` · source ${deviceSource}`
              : " · device offline, showing local simulation"}
            {apiStats
              ? ` · ${apiStats.readingCount ?? 0} stored readings · ${
                  apiStats.openAlerts ?? 0
                } open alerts · ${apiStats.ruleCount ?? 0} automation rules · ${
                  apiStats.activeCrops ?? 0
                } active crops`
              : ""}
            .
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn ghost"
            onClick={refreshAll}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh History
          </button>

          <a
            href={getDeviceUrl()}
            target="_blank"
            rel="noreferrer"
            className="admin-btn primary"
          >
            <i className="bi bi-sliders"></i>
            Device Control Panel
          </a>
        </div>
      </div>

      {/* ===================================================
          DEVICE STATUS ROW
          =================================================== */}

      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <span
            className={`admin-stat-icon ${
              deviceConnected
                ? ""
                : "warn"
            }`}
          >
            <i
              className={`bi ${
                deviceConnected
                  ? "bi-broadcast-pin"
                  : "bi-wifi-off"
              }`}
            ></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value is-text">
              {deviceConnected
                ? "Connected"
                : "Offline"}
            </span>

            <span className="admin-stat-label">
              Device Link
            </span>

            <span className="admin-stat-sub">
              Port 5174 · {deviceSource || "LOCAL_SIMULATION"}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon info">
            <i className="bi bi-shuffle"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value is-text is-cap">
              {deviceInfo?.mode || "auto"}
            </span>

            <span className="admin-stat-label">
              Control Mode
            </span>

            <span className="admin-stat-sub">
              Interval{" "}
              {deviceInfo?.intervalSec ?? 3}s
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon dark">
            <i className="bi bi-arrow-repeat"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {deviceInfo?.transmissions ?? 0}
            </span>

            <span className="admin-stat-label">
              Transmissions
            </span>

            <span className="admin-stat-sub">
              {apiStats
                ? `${apiStats.readingCount ?? 0} readings stored on the server`
                : "Since device start"}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span
            className={`admin-stat-icon ${
              liveStatus === "healthy"
                ? ""
                : liveStatus === "warning"
                  ? "warn"
                  : "dark"
            }`}
          >
            <i className="bi bi-heart-pulse"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value is-text is-cap">
              {liveStatus || "healthy"}
            </span>

            <span className="admin-stat-label">
              Crop Condition
            </span>

            <span className="admin-stat-sub">
              Updated{" "}
              {liveTimestamp
                ? new Date(
                    liveTimestamp
                  ).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </div>

      </div>

      {/* ===================================================
          LIVE READINGS
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>
              <i className="bi bi-activity"></i>
              Live Readings
            </h2>

            <div className="admin-card-sub">
              {apiReading?.statusReasons?.length
                ? apiReading.statusReasons.join(
                    " · "
                  )
                : "Latest values from the sensor unit"}
            </div>
          </div>

          <span
            className={`admin-badge ${
              deviceConnected
                ? "success"
                : "muted"
            }`}
          >
            <i
              className={`bi ${
                deviceConnected
                  ? "bi-broadcast"
                  : "bi-pause-circle"
              }`}
            ></i>
            {deviceConnected
              ? "Streaming"
              : "Local Simulation"}
          </span>
        </div>

        <div className="admin-card-body">
          <div className="admin-sensor-grid">
            {SENSOR_TILES.map((tile) => (
              <div
                className="admin-sensor-tile"
                key={tile.key}
              >
                <span className="label">
                  <i
                    className={`bi ${tile.icon}`}
                  ></i>
                  {tile.label}
                </span>

                <span className="value">
                  {formatReading(
                    liveSensors?.[tile.key],
                    tile.decimals
                  )}

                  {tile.unit && (
                    <small>{tile.unit}</small>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================
          DEVICE HISTORY
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>
              <i className="bi bi-clock-history"></i>
              Device Transmission History
            </h2>

            <div className="admin-card-sub">
              {loadingHistory
                ? "Loading records..."
                : `${history.length} shown · ${historyTotal} stored on the unit`}
            </div>
          </div>
        </div>

        <div className="admin-card-body flush">
          {loadingHistory ? (
            <div className="admin-empty">
              <i className="bi bi-hourglass-split"></i>
              <h3>Loading Device Records</h3>
              <p>
                Fetching stored transmissions from the
                sensor unit.
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="admin-empty">
              <i className="bi bi-wifi-off"></i>
              <h3>No Device Records</h3>
              <p>
                Power the sensor unit on port 5174 to
                start storing transmission history.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>pH</th>
                    <th>EC</th>
                    <th>Temp °C</th>
                    <th>Hum %</th>
                    <th>Moist %</th>
                    <th>N</th>
                    <th>P</th>
                    <th>K</th>
                    <th>PPFD</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((record, index) => (
                    <tr key={record.timestamp || index}>
                      <td>
                        {record.timestamp
                          ? new Date(
                              record.timestamp
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }
                            )
                          : "—"}
                      </td>

                      <td>{formatReading(record.ph, 2)}</td>
                      <td>{formatReading(record.ec, 2)}</td>
                      <td>
                        {formatReading(
                          record.temperature,
                          1
                        )}
                      </td>
                      <td>
                        {formatReading(
                          record.humidity,
                          1
                        )}
                      </td>
                      <td>
                        {formatReading(
                          record.moisture,
                          1
                        )}
                      </td>
                      <td>
                        {formatReading(
                          record.nitrogen,
                          0
                        )}
                      </td>
                      <td>
                        {formatReading(
                          record.phosphorus,
                          0
                        )}
                      </td>
                      <td>
                        {formatReading(
                          record.potassium,
                          0
                        )}
                      </td>
                      <td>
                        {formatReading(record.ppfd, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </>
  );
}

export default AdminSensorData;
