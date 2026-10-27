import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import useSensor from "../../hooks/useSensor";
import { useCrop } from "../../context/CropContext";
import { getCropById } from "../../data/cropData";

import "../../assets/styles/monitoring.css";

const SENSOR_CONFIG = {
  ph: {
    label: "pH Level",
    unit: "",
    icon: "bi-droplet-half",
    decimals: 2,
    requirementKey: "ph",
  },

  ec: {
    label: "Electrical Conductivity",
    unit: "mS/cm",
    icon: "bi-moisture",
    decimals: 2,
    requirementKey: "ec",
  },

  temperature: {
    label: "Temperature",
    unit: "°C",
    icon: "bi-thermometer-half",
    decimals: 1,
    requirementKey: "temperature",
  },

  humidity: {
    label: "Humidity",
    unit: "%",
    icon: "bi-cloud-drizzle",
    decimals: 1,
    requirementKey: "humidity",
  },

  moisture: {
    label: "Moisture",
    unit: "%",
    icon: "bi-water",
    min: 55,
    max: 85,
    decimals: 1,
  },

  nitrogen: {
    label: "Nitrogen",
    unit: "ppm",
    icon: "bi-nut",
    min: 80,
    max: 160,
    decimals: 0,
  },

  phosphorus: {
    label: "Phosphorus",
    unit: "ppm",
    icon: "bi-circle-fill",
    min: 30,
    max: 80,
    decimals: 0,
  },

  potassium: {
    label: "Potassium",
    unit: "ppm",
    icon: "bi-flower1",
    min: 120,
    max: 220,
    decimals: 0,
  },

  ppfd: {
    label: "Light PPFD",
    unit: "µmol/m²/s",
    icon: "bi-brightness-high",
    decimals: 0,
    requirementKey: "ppfd",
  },
};

function parseRange(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return {
      min: value,
      max: value,
    };
  }

  const text = String(value)
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/to/gi, "-")
    .trim();

  const numbers = text.match(/-?\d+(\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return null;
  }

  const values = numbers.map(Number);

  if (values.length === 1) {
    return {
      min: values[0],
      max: values[0],
    };
  }

  return {
    min: Math.min(values[0], values[1]),
    max: Math.max(values[0], values[1]),
  };
}

function getRequirement(config, crop) {
  if (!config.requirementKey || !crop) {
    if (
      config.min !== undefined &&
      config.max !== undefined
    ) {
      return {
        min: config.min,
        max: config.max,
      };
    }

    return null;
  }

  const cropValue = crop[config.requirementKey];

  const range = parseRange(cropValue);

  if (range) {
    return range;
  }

  if (
    config.min !== undefined &&
    config.max !== undefined
  ) {
    return {
      min: config.min,
      max: config.max,
    };
  }

  return null;
}

function getStatus(value, requirement) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value)) ||
    !requirement
  ) {
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

function formatValue(value, config) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  return Number(value).toFixed(config.decimals);
}

function getStatusLabel(status) {
  if (status === "healthy") return "Healthy";
  if (status === "warning") return "Warning";
  if (status === "critical") return "Critical";

  return "No Data";
}

function getStatusIcon(status) {
  if (status === "healthy") {
    return "bi bi-check-circle-fill";
  }

  if (status === "warning") {
    return "bi bi-exclamation-triangle-fill";
  }

  if (status === "critical") {
    return "bi bi-exclamation-octagon-fill";
  }

  return "bi bi-dash-circle";
}

function Monitoring() {
  const { sensorData, history = [], deviceConnected, deviceInfo } = useSensor();

  const {
    activeCrop,
    activeCropId,
    selectedCrops = [],
    selectActiveCrop,
  } = useCrop();

  const [selectedSensor, setSelectedSensor] = useState("ph");

  const cropFromData = useMemo(() => {
    if (!activeCrop) {
      return null;
    }

    return (
      getCropById(activeCrop.cropId || activeCrop.id) ||
      activeCrop
    );
  }, [activeCrop]);

  const selectedConfig = SENSOR_CONFIG[selectedSensor];

  /*
   * ---------------------------------------------------------
   * SENSOR AVAILABILITY
   * ---------------------------------------------------------
   */

  const hasSensorData = useMemo(() => {
    if (!sensorData) {
      return false;
    }

    return Object.keys(SENSOR_CONFIG).some((key) => {
      const value = sensorData[key];

      return (
        value !== undefined &&
        value !== null &&
        !Number.isNaN(Number(value))
      );
    });
  }, [sensorData]);

  /*
   * ---------------------------------------------------------
   * REQUIREMENTS
   * ---------------------------------------------------------
   */

  const requirements = useMemo(() => {
    const result = {};

    Object.entries(SENSOR_CONFIG).forEach(
      ([key, config]) => {
        result[key] = getRequirement(
          config,
          cropFromData
        );
      }
    );

    return result;
  }, [cropFromData]);

  /*
   * ---------------------------------------------------------
   * STATUS SUMMARY
   * ---------------------------------------------------------
   */

  const statusSummary = useMemo(() => {
    const result = {
      healthy: 0,
      warning: 0,
      critical: 0,
      unknown: 0,
    };

    Object.entries(SENSOR_CONFIG).forEach(
      ([key]) => {
        const status = getStatus(
          sensorData?.[key],
          requirements[key]
        );

        result[status] += 1;
      }
    );

    return result;
  }, [sensorData, requirements]);

  /*
   * ---------------------------------------------------------
   * SELECTED SENSOR STATUS
   * ---------------------------------------------------------
   */

  const currentStatus = getStatus(
    sensorData?.[selectedSensor],
    requirements[selectedSensor]
  );

  /*
   * ---------------------------------------------------------
   * HISTORY
   * ---------------------------------------------------------
   */

  const cropHistory = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }

    if (!activeCropId) {
      return [];
    }

    /*
     * History may already be filtered by SensorContext.
     * If cropId exists in a history record, use it.
     * Records without cropId remain usable for the current
     * active crop because the current local simulator flow
     * may not yet attach crop metadata to every record.
     */

    const records = history.filter((item) => {
      const itemCropId =
        item?.cropId ??
        item?.crop?.id ??
        item?.data?.cropId;

      if (!itemCropId) {
        return true;
      }

      return String(itemCropId) === String(activeCropId);
    });

    return records.slice(-20);
  }, [history, activeCropId]);

  const chartData = useMemo(() => {
    if (!cropHistory.length) {
      return [];
    }

    return cropHistory.map((item, index) => {
      const value =
        item?.data?.[selectedSensor] ??
        item?.sensors?.[selectedSensor] ??
        item?.[selectedSensor];

      const timestamp =
        item?.timestamp ??
        item?.createdAt ??
        item?.time;

      return {
        index: index + 1,
        value:
          value !== undefined &&
          value !== null &&
          !Number.isNaN(Number(value))
            ? Number(value)
            : null,

        time: timestamp
          ? new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : `#${index + 1}`,
      };
    });
  }, [cropHistory, selectedSensor]);

  /*
   * ---------------------------------------------------------
   * LAST UPDATED
   * ---------------------------------------------------------
   */

  const lastUpdated = useMemo(() => {
    if (!cropHistory.length) {
      return null;
    }

    const last = cropHistory[cropHistory.length - 1];

    return (
      last?.timestamp ??
      last?.createdAt ??
      last?.time ??
      null
    );
  }, [cropHistory]);

  /*
   * ---------------------------------------------------------
   * DEVICE
   * ---------------------------------------------------------
   */

  const deviceId =
    deviceInfo?.deviceId ||
    activeCrop?.device?.deviceId ||
    activeCrop?.device?.id ||
    "HYDROGROW-SIM-001";

  const deviceStatus = deviceConnected
    ? deviceInfo?.power
      ? "Connected"
      : "Powered Off"
    : "Local Simulation";

  const isDeviceConnected = deviceConnected && deviceInfo?.power !== false;

  /*
   * ---------------------------------------------------------
   * NO ACTIVE CROP
   * ---------------------------------------------------------
   */

  if (!activeCrop) {
    return (
      <div className="monitoring-page">
        <div className="monitoring-empty-state">
          <div className="monitoring-empty-icon">
            <i className="bi bi-activity"></i>
          </div>

          <span className="monitoring-eyebrow">
            <i className="bi bi-activity"></i>
            LIVE SENSOR MONITORING
          </span>

          <h1>No Crop Selected</h1>

          <p>
            Select a crop and add it to your farm before
            viewing crop-specific monitoring data.
          </p>

          <a
            href="/crop-management"
            className="btn monitoring-primary-btn"
          >
            <i className="bi bi-plus-circle"></i>
            Select Your Crop
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="monitoring-header">
        <div>
          <span className="monitoring-eyebrow">
            <i className="bi bi-activity"></i>
            LIVE SENSOR MONITORING
          </span>

          <h1>Monitoring</h1>

          <p>
            Track the active crop's environmental,
            nutrient and growth-related sensor parameters.
          </p>
        </div>

        <div
          className={`monitoring-live ${
            isDeviceConnected
              ? "connected"
              : "configured"
          }`}
        >
          <span></span>

          {isDeviceConnected
            ? "DEVICE CONNECTED"
            : "LOCAL SIMULATION"}
        </div>
      </div>

      {/* =====================================================
          ACTIVE CROP SELECTOR
      ===================================================== */}

      {selectedCrops.length > 0 && (
        <section className="monitoring-crop-section">

          <div className="monitoring-section-heading">
            <div>
              <span>ACTIVE FARM CROP</span>
              <h2>Select Crop</h2>
            </div>

            <span className="monitoring-crop-count">
              {selectedCrops.length} crop
              {selectedCrops.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="monitoring-crop-row">
            {selectedCrops.map((farmCrop) => {
              const crop =
                getCropById(
                  farmCrop.cropId || farmCrop.id
                ) || farmCrop;

              const cropId =
                farmCrop.cropId || farmCrop.id;

              const isActive =
                String(cropId) === String(activeCropId);

              return (
                <button
                  key={cropId}
                  type="button"
                  className={`monitoring-crop-chip ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    selectActiveCrop(cropId)
                  }
                >
                  {crop?.images?.[0] && (
                    <img
                      src={crop.images[0]}
                      alt={crop.name}
                    />
                  )}

                  <span>
                    {crop?.name || "Crop"}
                  </span>

                  {isActive && (
                    <i className="bi bi-check-circle-fill"></i>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================
          ACTIVE CROP INFO
      ===================================================== */}

      <section className="monitoring-active-crop">

        <div className="monitoring-active-crop-image">
          {cropFromData?.images?.[0] ? (
            <img
              src={cropFromData.images[0]}
              alt={cropFromData.name}
            />
          ) : (
            <i className="bi bi-flower1"></i>
          )}
        </div>

        <div className="monitoring-active-crop-info">
          <span>MONITORING ACTIVE CROP</span>

          <h2>
            {cropFromData?.name || "Active Crop"}
          </h2>

          <p>
            {activeCrop.farmUnitName ||
              activeCrop.farmUnit ||
              "Farm Unit"}
          </p>
        </div>

        <div className="monitoring-active-crop-meta">

          <div>
            <span>Device</span>
            <strong>{deviceId}</strong>
          </div>

          <div>
            <span>Plants</span>
            <strong>
              {activeCrop.numberOfPlants ??
                activeCrop.plantCount ??
                "--"}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong
              className={
                isDeviceConnected
                  ? "text-success"
                  : "text-secondary"
              }
            >
              {isDeviceConnected
                ? "Connected"
                : "Local Simulation"}
            </strong>
          </div>

        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="monitoring-summary">

        <div className="monitoring-summary-card">
          <div className="monitoring-summary-icon">
            <i className="bi bi-speedometer2"></i>
          </div>

          <div>
            <span>Total Parameters</span>
            <strong>9</strong>
          </div>
        </div>

        <div className="monitoring-summary-card healthy">
          <div className="monitoring-summary-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <span>Healthy</span>
            <strong>
              {statusSummary.healthy}
            </strong>
          </div>
        </div>

        <div className="monitoring-summary-card warning">
          <div className="monitoring-summary-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <div>
            <span>Warning</span>
            <strong>
              {statusSummary.warning}
            </strong>
          </div>
        </div>

        <div className="monitoring-summary-card critical">
          <div className="monitoring-summary-icon">
            <i className="bi bi-exclamation-octagon"></i>
          </div>

          <div>
            <span>Critical</span>
            <strong>
              {statusSummary.critical}
            </strong>
          </div>
        </div>

      </section>

      {/* =====================================================
          SENSOR PARAMETERS
      ===================================================== */}

      <div className="monitoring-section-title">

        <div>
          <span>CURRENT READINGS</span>
          <h2>Sensor Parameters</h2>
        </div>

        <div className="monitoring-device">
          <i className="bi bi-cpu"></i>
          {deviceId}
        </div>

      </div>

      <div className="monitoring-sensor-grid">

        {Object.entries(SENSOR_CONFIG).map(
          ([key, config]) => {

            const requirement =
              requirements[key];

            const status = getStatus(
              sensorData?.[key],
              requirement
            );

            return (
              <button
                type="button"
                key={key}
                className={`monitoring-sensor-card ${
                  selectedSensor === key
                    ? "selected"
                    : ""
                } ${status}`}
                onClick={() =>
                  setSelectedSensor(key)
                }
              >

                <div className="monitoring-sensor-top">

                  <div className="monitoring-sensor-icon">
                    <i
                      className={`bi ${config.icon}`}
                    ></i>
                  </div>

                  <span
                    className={`monitoring-status ${status}`}
                  >
                    {getStatusLabel(status)}
                  </span>

                </div>

                <div className="monitoring-sensor-name">
                  {config.label}
                </div>

                <div className="monitoring-sensor-value">
                  {hasSensorData
                    ? formatValue(
                        sensorData?.[key],
                        config
                      )
                    : "--"}

                  {config.unit && (
                    <small>
                      {config.unit}
                    </small>
                  )}
                </div>

                <div className="monitoring-range">

                  <span>
                    Recommended
                  </span>

                  <strong>
                    {requirement
                      ? `${requirement.min} – ${requirement.max}`
                      : "Not available"}
                  </strong>

                </div>

              </button>
            );
          }
        )}

      </div>

      {/* =====================================================
          CHART + PARAMETER DETAILS
      ===================================================== */}

      <div className="monitoring-content-grid">

        {/* CHART */}

        <div className="monitoring-panel monitoring-chart-panel">

          <div className="monitoring-panel-header">

            <div>
              <span>
                HISTORICAL TREND
              </span>

              <h2>
                {selectedConfig.label}
              </h2>
            </div>

            <div
              className={`monitoring-chart-status ${
                currentStatus
              }`}
            >
              <span></span>

              {currentStatus === "healthy" &&
                "Within Range"}

              {currentStatus === "warning" &&
                "Needs Attention"}

              {currentStatus === "critical" &&
                "Critical"}

              {currentStatus === "unknown" &&
                "No Data"}
            </div>

          </div>

          <div className="monitoring-chart-value">

            <strong>
              {hasSensorData
                ? formatValue(
                    sensorData?.[selectedSensor],
                    selectedConfig
                  )
                : "--"}
            </strong>

            {selectedConfig.unit && (
              <span>
                {selectedConfig.unit}
              </span>
            )}

          </div>

          <div className="monitoring-chart">

            {chartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <LineChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    domain={[
                      requirements[
                        selectedSensor
                      ]
                        ? Math.floor(
                            requirements[
                              selectedSensor
                            ].min * 0.8
                          )
                        : "auto",

                      requirements[
                        selectedSensor
                      ]
                        ? Math.ceil(
                            requirements[
                              selectedSensor
                            ].max * 1.2
                          )
                        : "auto",
                    ]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value}${
                        selectedConfig.unit
                          ? ` ${selectedConfig.unit}`
                          : ""
                      }`,
                      selectedConfig.label,
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#198754"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />

                </LineChart>
              </ResponsiveContainer>

            ) : (

              <div className="monitoring-no-history">

                <div>
                  <i className="bi bi-bar-chart-line"></i>
                </div>

                <strong>
                  No historical data available
                </strong>

                <span>
                  Sensor history will appear here
                  after readings are received and
                  stored for the active crop.
                </span>

              </div>

            )}

          </div>

        </div>

        {/* DETAILS */}

        <div className="monitoring-panel monitoring-details-panel">

          <div className="monitoring-panel-header">

            <div>
              <span>
                PARAMETER DETAILS
              </span>

              <h2>
                Crop Requirement
              </h2>
            </div>

          </div>

          <div className="monitoring-detail-icon">
            <i
              className={`bi ${selectedConfig.icon}`}
            ></i>
          </div>

          <h3>
            {selectedConfig.label}
          </h3>

          <p className="monitoring-detail-description">
            Current reading compared with the
            recommended operating range for the
            active crop.
          </p>

          <div className="monitoring-detail-current">

            <span>
              Current Value
            </span>

            <strong>
              {hasSensorData
                ? formatValue(
                    sensorData?.[selectedSensor],
                    selectedConfig
                  )
                : "--"}

              {selectedConfig.unit && (
                <small>
                  {selectedConfig.unit}
                </small>
              )}
            </strong>

          </div>

          <div className="monitoring-detail-range">

            <span>
              Recommended Range
            </span>

            <strong>
              {requirements[selectedSensor]
                ? `${requirements[selectedSensor].min} – ${requirements[selectedSensor].max}`
                : "Not available"}

              {requirements[selectedSensor] &&
                selectedConfig.unit
                ? ` ${selectedConfig.unit}`
                : ""}
            </strong>

          </div>

          <div className="monitoring-range-bar">

            <div
              className={`monitoring-range-indicator ${
                currentStatus
              }`}
            ></div>

          </div>

          <div
            className={`monitoring-detail-status ${
              currentStatus
            }`}
          >

            <i
              className={getStatusIcon(
                currentStatus
              )}
            ></i>

            <div>

              <strong>
                {currentStatus === "healthy"
                  ? "Parameter is within the recommended range"
                  : currentStatus === "warning"
                    ? "Parameter is approaching the recommended limit"
                    : currentStatus === "critical"
                      ? "Parameter is outside the recommended range"
                      : "Waiting for sensor data"}
              </strong>

              <span>
                Active crop:{" "}
                <b>
                  {cropFromData?.name ||
                    "Unknown"}
                </b>
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          MONITORING INFORMATION
      ===================================================== */}

      <div className="monitoring-info">

        <div className="monitoring-info-icon">
          <i className="bi bi-info-circle"></i>
        </div>

        <div>

          <strong>
            How monitoring works
          </strong>

          <p>
            Sensor readings are received through
            the HydroGrow REST API. The monitoring
            interface compares available readings
            with the active crop requirements and
            displays the current status and trends.
          </p>

        </div>

        <div className="monitoring-last-update">

          <span>
            Last Update
          </span>

          <strong>
            {lastUpdated
              ? new Date(
                  lastUpdated
                ).toLocaleTimeString()
              : "Waiting for data"}
          </strong>

        </div>

      </div>

    </div>
  );
}

export default Monitoring;