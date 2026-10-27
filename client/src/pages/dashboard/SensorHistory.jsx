import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useSensor from "../../hooks/useSensor";
import { useCrop } from "../../context/CropContext";
import { getCropById } from "../../data/cropData";

import "../../assets/styles/sensor-history.css";

/* =========================================================
   SENSOR CONFIGURATION
   ========================================================= */

const SENSOR_CONFIG = [
  {
    key: "ph",
    label: "pH",
    unit: "",
    icon: "bi-droplet-half",
    decimals: 2,
    requirementKey: "ph",
  },
  {
    key: "ec",
    label: "EC",
    unit: "mS/cm",
    icon: "bi-beaker",
    decimals: 2,
    requirementKey: "ec",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "bi-thermometer-half",
    decimals: 1,
    requirementKey: "temperature",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    icon: "bi-cloud-drizzle",
    decimals: 1,
    requirementKey: "humidity",
  },
  {
    key: "moisture",
    label: "Moisture",
    unit: "%",
    icon: "bi-moisture",
    decimals: 1,
    min: 55,
    max: 85,
  },
  {
    key: "nitrogen",
    label: "Nitrogen",
    unit: "ppm",
    icon: "bi-flower1",
    decimals: 0,
    min: 80,
    max: 160,
  },
  {
    key: "phosphorus",
    label: "Phosphorus",
    unit: "ppm",
    icon: "bi-circle",
    decimals: 0,
    min: 30,
    max: 80,
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "ppm",
    icon: "bi-circle-fill",
    decimals: 0,
    min: 120,
    max: 220,
  },
  {
    key: "ppfd",
    label: "PPFD",
    unit: "µmol/m²/s",
    icon: "bi-sun",
    decimals: 0,
    requirementKey: "ppfd",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getReadingData(item) {
  return item?.data || item?.sensors || item?.readings || item || {};
}

function getTimestamp(item) {
  return (
    item?.timestamp ||
    item?.createdAt ||
    item?.time ||
    item?.date ||
    null
  );
}

function normalizeStatus(status) {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (
    value === "critical" ||
    value === "danger" ||
    value === "error"
  ) {
    return "critical";
  }

  if (
    value === "warning" ||
    value === "warn"
  ) {
    return "warning";
  }

  if (
    value === "healthy" ||
    value === "safe" ||
    value === "normal"
  ) {
    return "healthy";
  }

  if (
    value === "offline"
  ) {
    return "offline";
  }

  return "unknown";
}

function getStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case "healthy":
      return "Healthy";

    case "warning":
      return "Warning";

    case "critical":
      return "Critical";

    case "offline":
      return "Offline";

    default:
      return "No Data";
  }
}

function getStatusIcon(status) {
  switch (normalizeStatus(status)) {
    case "healthy":
      return "bi-check-circle";

    case "warning":
      return "bi-exclamation-triangle";

    case "critical":
      return "bi-x-circle";

    case "offline":
      return "bi-wifi-off";

    default:
      return "bi-dash-circle";
  }
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value, decimals = 1) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "--";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return number.toFixed(decimals);
}

function parseRange(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value)
    .replace(/–/g, "-")
    .replace(/°C/gi, "")
    .replace(/mS\/cm/gi, "")
    .replace(/µmol\/m²\/s/gi, "")
    .trim();

  const match = text.match(
    /(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/
  );

  if (!match) {
    return null;
  }

  return {
    min: Number(match[1]),
    max: Number(match[2]),
  };
}

function getCropRequirement(crop, sensor) {
  if (!crop || !sensor) {
    return null;
  }

  if (sensor.requirementKey) {
    const rawValue =
      crop[sensor.requirementKey];

    return parseRange(rawValue);
  }

  if (
    Number.isFinite(sensor.min) &&
    Number.isFinite(sensor.max)
  ) {
    return {
      min: sensor.min,
      max: sensor.max,
    };
  }

  return null;
}

function getValueStatus(value, requirement) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "unknown";
  }

  if (!requirement) {
    return "unknown";
  }

  const numericValue = Number(value);

  if (
    numericValue < requirement.min ||
    numericValue > requirement.max
  ) {
    return "critical";
  }

  const range = requirement.max - requirement.min;

  if (range <= 0) {
    return "healthy";
  }

  const margin = range * 0.15;

  if (
    numericValue <= requirement.min + margin ||
    numericValue >= requirement.max - margin
  ) {
    return "warning";
  }

  return "healthy";
}

function getTrend(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return "stable";
  }

  const validValues = values
    .map(Number)
    .filter(Number.isFinite);

  if (validValues.length < 2) {
    return "stable";
  }

  const first = validValues[0];
  const last =
    validValues[validValues.length - 1];

  const difference = last - first;

  if (Math.abs(difference) < 0.01) {
    return "stable";
  }

  return difference > 0
    ? "increasing"
    : "decreasing";
}

function getTrendIcon(trend) {
  switch (trend) {
    case "increasing":
      return "bi-arrow-up-right";

    case "decreasing":
      return "bi-arrow-down-right";

    default:
      return "bi-dash";
  }
}

function getTrendLabel(trend) {
  switch (trend) {
    case "increasing":
      return "Increasing";

    case "decreasing":
      return "Decreasing";

    default:
      return "Stable";
  }
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function SensorHistory() {
  const sensorHook = useSensor();

  const {
    selectedCrops = [],
    activeCrop = null,
    activeCropId = null,
    selectActiveCrop,
  } = useCrop();

  const actualHistory =
    sensorHook?.history ||
    sensorHook?.sensorHistory ||
    [];

  const sensorData =
    sensorHook?.sensorData ||
    sensorHook?.data ||
    null;

  /* =======================================================
     ACTIVE CROP
     ======================================================= */

  const activeCropRecord = useMemo(() => {
    if (!activeCrop) {
      return null;
    }

    const cropId =
      activeCrop.cropId ||
      activeCrop.id;

    const cropDefinition =
      getCropById(cropId);

    return {
      ...activeCrop,
      ...(cropDefinition || {}),
    };
  }, [activeCrop]);

  /* =======================================================
     STATE
     ======================================================= */

  const [selectedSensor, setSelectedSensor] =
    useState("temperature");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedReading, setSelectedReading] =
    useState(null);

  const [showClearModal, setShowClearModal] =
    useState(false);

  /* =======================================================
     NORMALIZE HISTORY
     ======================================================= */

  const normalizedHistory = useMemo(() => {
    if (!Array.isArray(actualHistory)) {
      return [];
    }

    return actualHistory
      .map((item, index) => {
        const data = getReadingData(item);

        const timestamp =
          getTimestamp(item);

        const itemCropId =
          item?.cropId ||
          item?.crop?.id ||
          item?.crop?._id ||
          item?.farmCropId ||
          null;

        const itemDeviceId =
          item?.deviceId ||
          item?.device?.id ||
          item?.device?._id ||
          null;

        return {
          id:
            item?.id ||
            item?._id ||
            `${timestamp || "reading"}-${index}`,

          timestamp,

          data,

          status: normalizeStatus(
            item?.status ||
              item?.systemStatus ||
              item?.overallStatus
          ),

          cropId: itemCropId,

          deviceId: itemDeviceId,

          source:
            item?.source ||
            item?.dataSource ||
            "REST API",
        };
      })
      .filter((item) => {
        if (!item.timestamp) {
          return false;
        }

        if (!activeCropRecord) {
          return false;
        }

        /*
         * When backend records contain cropId,
         * only display records belonging to the
         * active crop.
         */
        if (item.cropId) {
          const currentCropId =
            activeCropRecord.cropId ||
            activeCropRecord.id;

          return (
            String(item.cropId) ===
            String(currentCropId)
          );
        }

        /*
         * Older/local records without cropId are
         * retained only for compatibility.
         */
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [
    actualHistory,
    activeCropRecord,
  ]);

  /* =======================================================
     FILTERED HISTORY
     ======================================================= */

  const filteredHistory = useMemo(() => {
    const now = new Date();

    return normalizedHistory.filter(
      (item) => {
        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
          return false;
        }

        if (dateFilter !== "all") {
          const itemDate =
            new Date(item.timestamp);

          if (
            Number.isNaN(
              itemDate.getTime()
            )
          ) {
            return false;
          }

          if (dateFilter === "today") {
            const sameDay =
              itemDate.getDate() ===
                now.getDate() &&
              itemDate.getMonth() ===
                now.getMonth() &&
              itemDate.getFullYear() ===
                now.getFullYear();

            if (!sameDay) {
              return false;
            }
          }

          if (dateFilter === "7days") {
            const sevenDaysAgo =
              now.getTime() -
              7 *
                24 *
                60 *
                60 *
                1000;

            if (
              itemDate.getTime() <
              sevenDaysAgo
            ) {
              return false;
            }
          }

          if (dateFilter === "30days") {
            const thirtyDaysAgo =
              now.getTime() -
              30 *
                24 *
                60 *
                60 *
                1000;

            if (
              itemDate.getTime() <
              thirtyDaysAgo
            ) {
              return false;
            }
          }
        }

        if (searchTerm.trim()) {
          const search =
            searchTerm
              .toLowerCase()
              .trim();

          const searchableText = [
            formatDateTime(
              item.timestamp
            ),
            getStatusLabel(
              item.status
            ),
            item.id,
            item.deviceId,
            item.source,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (
            !searchableText.includes(
              search
            )
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }, [
    normalizedHistory,
    statusFilter,
    dateFilter,
    searchTerm,
  ]);

  /* =======================================================
     SUMMARY
     ======================================================= */

  const summary = useMemo(() => {
    return {
      total:
        normalizedHistory.length,

      healthy:
        normalizedHistory.filter(
          (item) =>
            item.status ===
            "healthy"
        ).length,

      warning:
        normalizedHistory.filter(
          (item) =>
            item.status ===
            "warning"
        ).length,

      critical:
        normalizedHistory.filter(
          (item) =>
            item.status ===
            "critical"
        ).length,
    };
  }, [normalizedHistory]);

  /* =======================================================
     SELECTED SENSOR CONFIG
     ======================================================= */

  const selectedSensorConfig =
    SENSOR_CONFIG.find(
      (sensor) =>
        sensor.key ===
        selectedSensor
    ) ||
    SENSOR_CONFIG[0];

  /* =======================================================
     CHART DATA
     ======================================================= */

  const chartData = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .slice(-30)
      .map((item) => {
        const value =
          item.data?.[
            selectedSensor
          ];

        return {
          time: formatTime(
            item.timestamp
          ),

          value:
            value === null ||
            value === undefined ||
            value === ""
              ? null
              : Number(value),
        };
      })
      .filter(
        (item) =>
          item.value !== null &&
          Number.isFinite(
            item.value
          )
      );
  }, [
    filteredHistory,
    selectedSensor,
  ]);

  /* =======================================================
     SENSOR ANALYTICS
     ======================================================= */

  const sensorAnalytics = useMemo(() => {
    const values = filteredHistory
      .map(
        (item) =>
          Number(
            item.data?.[
              selectedSensor
            ]
          )
      )
      .filter(Number.isFinite);

    if (values.length === 0) {
      return {
        average: null,
        min: null,
        max: null,
        current: null,
        trend: "stable",
      };
    }

    const average =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length;

    const chronological =
      [...filteredHistory]
        .reverse()
        .map(
          (item) =>
            Number(
              item.data?.[
                selectedSensor
              ]
            )
        )
        .filter(
          Number.isFinite
        );

    return {
      average,
      min: Math.min(...values),
      max: Math.max(...values),
      current:
        values.length > 0
          ? values[0]
          : null,
      trend:
        getTrend(
          chronological
        ),
    };
  }, [
    filteredHistory,
    selectedSensor,
  ]);

  /* =======================================================
     CURRENT SENSOR DATA
     ======================================================= */

  const hasCurrentSensorData =
    sensorData &&
    typeof sensorData ===
      "object" &&
    Object.keys(sensorData).some(
      (key) =>
        sensorData[key] !==
          null &&
        sensorData[key] !==
          undefined &&
        sensorData[key] !== ""
    );

  /* =======================================================
     CLEAR HISTORY
     ======================================================= */

  const handleClearHistory = () => {
    localStorage.removeItem(
      "hydrogrow_sensor_history"
    );

    setShowClearModal(false);

    window.location.reload();
  };

  /* =======================================================
     NO ACTIVE CROP
     ======================================================= */

  if (!activeCropRecord) {
    return (
      <div className="sensor-history-page">
        <div className="sensor-history-header">
          <div>
            <span className="sensor-history-eyebrow">
              SENSOR DATA
            </span>

            <h1>Sensor History</h1>

            <p>
              Review historical sensor
              readings for your active
              hydroponic crop.
            </p>
          </div>
        </div>

        <div className="sensor-history-empty">
          <div className="sensor-history-empty-icon">
            <i className="bi bi-bar-chart-line"></i>
          </div>

          <h2>
            No Crop Selected
          </h2>

          <p>
            Select a crop from your farm
            before viewing sensor history.
          </p>

          <Link
            to="/crop-management"
            className="sensor-history-primary-btn"
          >
            <i className="bi bi-plus-circle"></i>
            Select Your Crop
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="sensor-history-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="sensor-history-header">
        <div>
          <span className="sensor-history-eyebrow">
            SENSOR DATA
          </span>

          <h1>
            Sensor History
          </h1>

          <p>
            Review and analyze historical
            readings for your active
            hydroponic crop.
          </p>
        </div>

        <button
          type="button"
          className="sensor-history-clear-btn"
          onClick={() =>
            setShowClearModal(true)
          }
          disabled={
            normalizedHistory.length ===
            0
          }
        >
          <i className="bi bi-trash3"></i>
          Clear Local History
        </button>
      </div>

      {/* =================================================
          ACTIVE CROP SELECTOR
          ================================================= */}

      <section className="sensor-history-crop-section">
        <div className="sensor-history-section-heading">
          <div>
            <span>
              ACTIVE CROP
            </span>

            <h2>
              Sensor History For
            </h2>
          </div>

          <div className="sensor-history-active-label">
            <span></span>
            Active
          </div>
        </div>

        <div className="sensor-history-crop-row">
          {selectedCrops.map(
            (farmCrop) => {
              const cropId =
                farmCrop.cropId ||
                farmCrop.id;

              const crop =
                getCropById(
                  cropId
                );

              const isActive =
                String(
                  activeCropId
                ) ===
                String(cropId);

              return (
                <button
                  type="button"
                  key={cropId}
                  className={`sensor-history-crop-chip ${
                    isActive
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectActiveCrop(
                      cropId
                    )
                  }
                >
                  <img
                    src={
                      crop?.images?.[0] ||
                      crop?.image ||
                      farmCrop?.image ||
                      "/images/crops/Lettuce1.jpg"
                    }
                    alt={
                      crop?.name ||
                      farmCrop?.cropName ||
                      "Crop"
                    }
                  />

                  <span>
                    {crop?.name ||
                      farmCrop?.cropName ||
                      "Crop"}
                  </span>

                  {isActive && (
                    <i className="bi bi-check-circle-fill"></i>
                  )}
                </button>
              );
            }
          )}
        </div>

        <div className="sensor-history-active-crop">
          <div className="sensor-history-active-crop-image">
            <img
              src={
                activeCropRecord?.images?.[0] ||
                activeCropRecord?.image ||
                "/images/crops/Lettuce1.jpg"
              }
              alt={
                activeCropRecord?.name ||
                "Active crop"
              }
            />
          </div>

          <div>
            <span>
              Monitoring History
            </span>

            <strong>
              {activeCropRecord?.name ||
                activeCropRecord?.cropName ||
                "Active Crop"}
            </strong>

            <small>
              {activeCropRecord?.farmUnit ||
                activeCropRecord?.farmUnitName ||
                "Farm Unit"}{" "}
              ·{" "}
              {activeCropRecord?.plantCount ??
                activeCropRecord?.numberOfPlants ??
                "--"}{" "}
              plants
            </small>
          </div>
        </div>
      </section>

      {/* =================================================
          NO HISTORY NOTICE
          ================================================= */}

      {normalizedHistory.length === 0 && (
        <div className="sensor-history-no-data-banner">
          <div className="sensor-history-no-data-icon">
            <i className="bi bi-database-exclamation"></i>
          </div>

          <div>
            <strong>
              No Sensor History Available
            </strong>

            <p>
              No stored sensor readings are
              available for{" "}
              <b>
                {activeCropRecord?.name ||
                  activeCropRecord?.cropName}
              </b>
              . Readings will appear here
              after the simulator or hardware
              sends data through the REST API.
            </p>
          </div>

          <span className="sensor-history-no-data-status">
            No Data
          </span>
        </div>
      )}

      {/* =================================================
          SUMMARY
          ================================================= */}

      <div className="sensor-history-summary">
        <HistorySummaryCard
          icon="bi-database"
          label="Total Readings"
          value={summary.total}
          type="total"
        />

        <HistorySummaryCard
          icon="bi-check-circle"
          label="Healthy"
          value={summary.healthy}
          type="healthy"
        />

        <HistorySummaryCard
          icon="bi-exclamation-triangle"
          label="Warnings"
          value={summary.warning}
          type="warning"
        />

        <HistorySummaryCard
          icon="bi-x-circle"
          label="Critical"
          value={summary.critical}
          type="critical"
        />
      </div>

      {/* =================================================
          FILTERS
          ================================================= */}

      <div className="sensor-history-filter-card">
        <div className="sensor-history-filter-heading">
          <div className="sensor-history-filter-title">
            <i className="bi bi-funnel"></i>
            Filters
          </div>

          <span>
            {filteredHistory.length} of{" "}
            {normalizedHistory.length} readings
          </span>
        </div>

        <div className="sensor-history-filter-grid">

          <div className="sensor-history-filter-group">
            <label>
              Parameter
            </label>

            <select
              value={selectedSensor}
              onChange={(event) =>
                setSelectedSensor(
                  event.target.value
                )
              }
            >
              {SENSOR_CONFIG.map(
                (sensor) => (
                  <option
                    key={sensor.key}
                    value={sensor.key}
                  >
                    {sensor.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="sensor-history-filter-group">
            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="healthy">
                Healthy
              </option>

              <option value="warning">
                Warning
              </option>

              <option value="critical">
                Critical
              </option>
            </select>
          </div>

          <div className="sensor-history-filter-group">
            <label>
              Date Range
            </label>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Time
              </option>

              <option value="today">
                Today
              </option>

              <option value="7days">
                Last 7 Days
              </option>

              <option value="30days">
                Last 30 Days
              </option>
            </select>
          </div>

          <div className="sensor-history-search">
            <label>
              Search
            </label>

            <div className="sensor-history-search-box">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search readings..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear search"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          SENSOR ANALYTICS
          ================================================= */}

      <section className="sensor-history-analytics">

        <div className="sensor-history-analytics-header">
          <div>
            <span>
              PARAMETER ANALYTICS
            </span>

            <h2>
              {selectedSensorConfig.label}
            </h2>
          </div>

          <span className="sensor-history-analytics-unit">
            {selectedSensorConfig.unit ||
              "Value"}
          </span>
        </div>

        <div className="sensor-history-analytics-grid">

          <AnalyticsCard
            icon="bi-activity"
            label="Current"
            value={formatNumber(
              sensorAnalytics.current,
              selectedSensorConfig.decimals
            )}
            unit={
              selectedSensorConfig.unit
            }
          />

          <AnalyticsCard
            icon="bi-bar-chart"
            label="Average"
            value={formatNumber(
              sensorAnalytics.average,
              selectedSensorConfig.decimals
            )}
            unit={
              selectedSensorConfig.unit
            }
          />

          <AnalyticsCard
            icon="bi-arrow-down"
            label="Minimum"
            value={formatNumber(
              sensorAnalytics.min,
              selectedSensorConfig.decimals
            )}
            unit={
              selectedSensorConfig.unit
            }
          />

          <AnalyticsCard
            icon="bi-arrow-up"
            label="Maximum"
            value={formatNumber(
              sensorAnalytics.max,
              selectedSensorConfig.decimals
            )}
            unit={
              selectedSensorConfig.unit
            }
          />

          <div className="sensor-history-analytics-card trend-card">
            <div className="analytics-card-icon">
              <i
                className={`bi ${getTrendIcon(
                  sensorAnalytics.trend
                )}`}
              ></i>
            </div>

            <div>
              <span>
                Trend
              </span>

              <strong>
                {getTrendLabel(
                  sensorAnalytics.trend
                )}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          TREND CHART
          ================================================= */}

      <div className="sensor-history-chart-card">
        <div className="sensor-history-card-header">
          <div>
            <span>
              HISTORICAL TREND
            </span>

            <h2>
              {selectedSensorConfig.label} Trend
            </h2>

            <p>
              Historical values for the selected
              parameter and active crop.
            </p>
          </div>

          <span className="sensor-history-chart-unit">
            {selectedSensorConfig.unit ||
              "Value"}
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="sensor-history-chart">
            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 20,
                  left: 5,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    formatNumber(
                      value,
                      selectedSensorConfig.decimals
                    ),
                    selectedSensorConfig.label,
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#198754"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="sensor-history-no-chart">
            <div>
              <i className="bi bi-bar-chart-line"></i>
            </div>

            <h3>
              No Chart Data
            </h3>

            <p>
              There are no readings matching
              the selected filters.
            </p>
          </div>
        )}
      </div>

      {/* =================================================
          TABLE
          ================================================= */}

      <div className="sensor-history-table-card">
        <div className="sensor-history-card-header">
          <div>
            <span>
              READING LOG
            </span>

            <h2>
              Historical Readings
            </h2>

            <p>
              {filteredHistory.length} reading
              {filteredHistory.length !== 1
                ? "s"
                : ""}{" "}
              displayed.
            </p>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="sensor-history-table-wrapper">
            <table className="sensor-history-table">
              <thead>
                <tr>
                  <th>
                    Date & Time
                  </th>

                  <th>
                    pH
                  </th>

                  <th>
                    EC
                  </th>

                  <th>
                    Temperature
                  </th>

                  <th>
                    Humidity
                  </th>

                  <th>
                    Moisture
                  </th>

                  <th>
                    N / P / K
                  </th>

                  <th>
                    PPFD
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map(
                  (reading) => {
                    const data =
                      reading.data;

                    return (
                      <tr
                        key={
                          reading.id
                        }
                      >
                        <td>
                          <strong className="history-date">
                            {formatDateTime(
                              reading.timestamp
                            )}
                          </strong>

                          {reading.deviceId && (
                            <small>
                              {reading.deviceId}
                            </small>
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            data.ph,
                            2
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            data.ec,
                            2
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            data.temperature,
                            1
                          )}
                          {data.temperature !==
                            undefined &&
                            " °C"}
                        </td>

                        <td>
                          {formatNumber(
                            data.humidity,
                            1
                          )}
                          {data.humidity !==
                            undefined &&
                            " %"}
                        </td>

                        <td>
                          {formatNumber(
                            data.moisture,
                            1
                          )}
                          {data.moisture !==
                            undefined &&
                            " %"}
                        </td>

                        <td>
                          {formatNumber(
                            data.nitrogen,
                            0
                          )}
                          /
                          {formatNumber(
                            data.phosphorus,
                            0
                          )}
                          /
                          {formatNumber(
                            data.potassium,
                            0
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            data.ppfd,
                            0
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              reading.status
                            }
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="history-view-btn"
                            onClick={() =>
                              setSelectedReading(
                                reading
                              )
                            }
                            aria-label="View reading details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sensor-history-filter-empty">
            <div className="sensor-history-filter-empty-icon">
              <i className="bi bi-search"></i>
            </div>

            <h3>
              No Matching Readings
            </h3>

            <p>
              Try changing the selected
              parameter, status, date range,
              or search term.
            </p>
          </div>
        )}
      </div>

      {/* =================================================
          CURRENT SNAPSHOT
          ================================================= */}

      <div className="sensor-history-current-card">
        <div className="sensor-history-card-header">
          <div>
            <span>
              CURRENT CONDITION
            </span>

            <h2>
              Current Sensor Snapshot
            </h2>

            <p>
              Latest sensor values currently
              available for the active crop.
            </p>
          </div>

          <span
            className={`current-live-badge ${
              hasCurrentSensorData
                ? "available"
                : "no-data"
            }`}
          >
            <span></span>

            {hasCurrentSensorData
              ? "Available"
              : "No Data"}
          </span>
        </div>

        {hasCurrentSensorData ? (
          <div className="sensor-history-current-grid">
            {SENSOR_CONFIG.map(
              (sensor) => {
                const value =
                  sensorData?.[
                    sensor.key
                  ];

                return (
                  <div
                    className="current-sensor-item"
                    key={sensor.key}
                  >
                    <div className="current-sensor-icon">
                      <i
                        className={`bi ${sensor.icon}`}
                      ></i>
                    </div>

                    <div>
                      <span>
                        {sensor.label}
                      </span>

                      <strong>
                        {formatNumber(
                          value,
                          sensor.decimals
                        )}

                        {value !==
                          undefined &&
                          value !==
                            null &&
                          value !== "" &&
                          sensor.unit && (
                            <small>
                              {" "}
                              {
                                sensor.unit
                              }
                            </small>
                          )}
                      </strong>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="sensor-history-current-empty">
            <i className="bi bi-broadcast"></i>

            <h3>
              Current Sensor Data Not Available
            </h3>

            <p>
              Waiting for sensor readings from
              the Input Simulator or connected
              hardware through the REST API.
            </p>
          </div>
        )}
      </div>

      {/* =================================================
          SYSTEM INFORMATION
          ================================================= */}

      <div className="sensor-history-info">
        <div className="sensor-history-info-icon">
          <i className="bi bi-info-circle"></i>
        </div>

        <div>
          <strong>
            Historical Sensor Data
          </strong>

          <p>
            Sensor readings are associated with
            the active crop, farm unit, and device.
            Data is intended to arrive through the
            HydroGrow REST API and be stored for
            historical analysis. No demo readings
            are generated by this page.
          </p>
        </div>
      </div>

      {/* =================================================
          READING DETAILS MODAL
          ================================================= */}

      {selectedReading && (
        <ReadingDetailsModal
          reading={
            selectedReading
          }
          crop={
            activeCropRecord
          }
          onClose={() =>
            setSelectedReading(
              null
            )
          }
        />
      )}

      {/* =================================================
          CLEAR HISTORY MODAL
          ================================================= */}

      {showClearModal && (
        <div
          className="history-modal-overlay"
          onClick={() =>
            setShowClearModal(false)
          }
        >
          <div
            className="history-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="history-confirm-icon">
              <i className="bi bi-trash3"></i>
            </div>

            <h2>
              Clear Local Sensor History?
            </h2>

            <p>
              This removes locally stored
              sensor history from this browser.
              Backend or MongoDB records are not
              deleted by this action.
            </p>

            <div className="history-modal-actions">
              <button
                type="button"
                className="history-cancel-btn"
                onClick={() =>
                  setShowClearModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="history-confirm-btn"
                onClick={
                  handleClearHistory
                }
              >
                Clear Local History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function HistorySummaryCard({
  icon,
  label,
  value,
  type,
}) {
  return (
    <div
      className={`history-summary-card ${type}`}
    >
      <div className="history-summary-icon">
        <i
          className={`bi ${icon}`}
        ></i>
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   ANALYTICS CARD
   ========================================================= */

function AnalyticsCard({
  icon,
  label,
  value,
  unit,
}) {
  return (
    <div className="sensor-history-analytics-card">
      <div className="analytics-card-icon">
        <i
          className={`bi ${icon}`}
        ></i>
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}

          {value !== "--" &&
            unit && (
              <small>
                {" "}
                {unit}
              </small>
            )}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({ status }) {
  const normalized =
    normalizeStatus(status);

  return (
    <span
      className={`history-status-badge ${normalized}`}
    >
      <i
        className={`bi ${getStatusIcon(
          status
        )}`}
      ></i>

      {getStatusLabel(status)}
    </span>
  );
}

/* =========================================================
   READING DETAILS MODAL
   ========================================================= */

function ReadingDetailsModal({
  reading,
  crop,
  onClose,
}) {
  const data =
    reading?.data || {};

  return (
    <div
      className="history-modal-overlay"
      onClick={onClose}
    >
      <div
        className="history-details-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="history-modal-header">
          <div>
            <span>
              SENSOR READING
            </span>

            <h2>
              Reading Details
            </h2>
          </div>

          <button
            type="button"
            className="history-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="history-details-crop">
          <div>
            <span>
              Crop
            </span>

            <strong>
              {crop?.name ||
                crop?.cropName ||
                "Active Crop"}
            </strong>
          </div>

          <div>
            <span>
              Date & Time
            </span>

            <strong>
              {formatDateTime(
                reading?.timestamp
              )}
            </strong>
          </div>
        </div>

        <div className="history-details-meta">
          <div>
            <span>
              Device
            </span>

            <strong>
              {reading?.deviceId ||
                "Not Available"}
            </strong>
          </div>

          <div>
            <span>
              Data Source
            </span>

            <strong>
              {reading?.source ||
                "REST API"}
            </strong>
          </div>

          <div>
            <span>
              Status
            </span>

            <StatusBadge
              status={
                reading?.status
              }
            />
          </div>
        </div>

        <div className="history-details-grid">
          {SENSOR_CONFIG.map(
            (sensor) => {
              const value =
                data?.[
                  sensor.key
                ];

              return (
                <div
                  className="history-detail-item"
                  key={sensor.key}
                >
                  <div className="history-detail-icon">
                    <i
                      className={`bi ${sensor.icon}`}
                    ></i>
                  </div>

                  <div>
                    <span>
                      {sensor.label}
                    </span>

                    <strong>
                      {formatNumber(
                        value,
                        sensor.decimals
                      )}

                      {value !==
                        undefined &&
                        value !==
                          null &&
                        value !== "" &&
                        sensor.unit && (
                          <small>
                            {" "}
                            {
                              sensor.unit
                            }
                          </small>
                        )}
                    </strong>
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div className="history-modal-footer">
          <button
            type="button"
            className="history-cancel-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SensorHistory;