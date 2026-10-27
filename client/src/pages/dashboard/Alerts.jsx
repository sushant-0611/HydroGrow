import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useSensor from "../../hooks/useSensor";
import { useCrop } from "../../context/CropContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getCropById } from "../../data/cropData";

import "../../assets/styles/alerts.css";

const SENSOR_CONFIG = [
  {
    key: "ph",
    label: "pH Level",
    unit: "",
    requirementKey: "ph",
    icon: "bi-droplet-half",
  },
  {
    key: "ec",
    label: "EC",
    unit: "mS/cm",
    requirementKey: "ec",
    icon: "bi-moisture",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    requirementKey: "temperature",
    icon: "bi-thermometer-half",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    requirementKey: "humidity",
    icon: "bi-cloud-drizzle",
  },
  {
    key: "moisture",
    label: "Moisture",
    unit: "%",
    min: 55,
    max: 85,
    icon: "bi-water",
  },
  {
    key: "nitrogen",
    label: "Nitrogen",
    unit: "ppm",
    min: 80,
    max: 160,
    icon: "bi-flower1",
  },
  {
    key: "phosphorus",
    label: "Phosphorus",
    unit: "ppm",
    min: 30,
    max: 80,
    icon: "bi-flower2",
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "ppm",
    min: 120,
    max: 220,
    icon: "bi-flower3",
  },
  {
    key: "ppfd",
    label: "PPFD",
    unit: "µmol/m²/s",
    requirementKey: "ppfd",
    icon: "bi-sun",
  },
];

function parseRange(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const numbers = String(value)
    .replace(/,/g, "")
    .replace(
      /(\d)\s*[-–—]\s*(\d)/g,
      "$1 to $2"
    )
    .match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return null;
  }

  if (numbers.length === 1) {
    const number = Number(numbers[0]);

    return {
      min: number,
      max: number,
    };
  }

  return {
    min: Number(numbers[0]),
    max: Number(numbers[1]),
  };
}

function getRequirement(sensor, crop) {
  if (!crop || !sensor.requirementKey) {
    if (
      sensor.min !== undefined &&
      sensor.max !== undefined
    ) {
      return {
        min: sensor.min,
        max: sensor.max,
      };
    }

    return null;
  }

  const cropValue = crop[sensor.requirementKey];

  const parsed = parseRange(cropValue);

  if (parsed) {
    return parsed;
  }

  if (
    sensor.min !== undefined &&
    sensor.max !== undefined
  ) {
    return {
      min: sensor.min,
      max: sensor.max,
    };
  }

  return null;
}

function getAlertSeverity(value, requirement) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "no-data";
  }

  if (!requirement) {
    return "no-data";
  }

  const numericValue = Number(value);
  const { min, max } = requirement;

  if (
    numericValue < min ||
    numericValue > max
  ) {
    return "critical";
  }

  const range = max - min;

  if (range <= 0) {
    return "healthy";
  }

  const warningMargin = range * 0.15;

  if (
    numericValue <= min + warningMargin ||
    numericValue >= max - warningMargin
  ) {
    return "warning";
  }

  return "healthy";
}

function getRecommendation(sensor, severity, value, requirement) {
  if (severity === "healthy") {
    return "Parameter is within the recommended range.";
  }

  if (severity === "no-data") {
    return "No sensor value is currently available.";
  }

  const min = requirement?.min;
  const max = requirement?.max;

  if (sensor.key === "ph") {
    return value < min
      ? "Increase pH gradually using the appropriate pH adjustment solution."
      : "Reduce pH gradually and recheck the nutrient solution.";
  }

  if (sensor.key === "ec") {
    return value < min
      ? "Check nutrient concentration and increase EC gradually."
      : "Check nutrient concentration and dilute the solution if required.";
  }

  if (sensor.key === "temperature") {
    return value < min
      ? "Temperature is low. Check the growing environment."
      : "Temperature is high. Improve ventilation or cooling.";
  }

  if (sensor.key === "humidity") {
    return value < min
      ? "Humidity is low. Review environmental conditions."
      : "Humidity is high. Improve ventilation and airflow.";
  }

  if (sensor.key === "moisture") {
    return value < min
      ? "Moisture is low. Check irrigation availability."
      : "Moisture is high. Review irrigation frequency.";
  }

  if (sensor.key === "nitrogen") {
    return value < min
      ? "Nitrogen level is low. Review the nutrient solution."
      : "Nitrogen level is high. Review nutrient concentration.";
  }

  if (sensor.key === "phosphorus") {
    return value < min
      ? "Phosphorus level is low. Review the nutrient solution."
      : "Phosphorus level is high. Review nutrient concentration.";
  }

  if (sensor.key === "potassium") {
    return value < min
      ? "Potassium level is low. Review the nutrient solution."
      : "Potassium level is high. Review nutrient concentration.";
  }

  if (sensor.key === "ppfd") {
    return value < min
      ? "Light intensity is low. Review grow-light settings."
      : "Light intensity is high. Review grow-light intensity or duration.";
  }

  return value < min
    ? `${sensor.label} is below the recommended range.`
    : `${sensor.label} is above the recommended range.`;
}

function formatValue(value, unit) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  const numericValue = Number(value);

  const formatted = Number.isInteger(numericValue)
    ? numericValue
    : numericValue.toFixed(2);

  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function formatRange(requirement, unit) {
  if (!requirement) {
    return "Not available";
  }

  return `${requirement.min} – ${requirement.max}${
    unit ? ` ${unit}` : ""
  }`;
}

function getStatusLabel(severity) {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "Warning";
  if (severity === "healthy") return "Healthy";
  if (severity === "info") return "Info";
  if (severity === "resolved") return "Resolved";

  return "No Data";
}

function getStatusIcon(severity) {
  if (severity === "critical") {
    return "bi-exclamation-octagon-fill";
  }

  if (severity === "warning") {
    return "bi-exclamation-triangle-fill";
  }

  if (severity === "healthy") {
    return "bi-check-circle-fill";
  }

  if (severity === "info") {
    return "bi-info-circle-fill";
  }

  if (severity === "resolved") {
    return "bi-check-circle-fill";
  }

  return "bi-dash-circle-fill";
}

function getApiAlertSeverity(alert) {
  if (alert.isResolved) {
    return "resolved";
  }

  if (alert.severity === "CRITICAL") {
    return "critical";
  }

  if (alert.severity === "WARNING") {
    return "warning";
  }

  return "info";
}

function getApiSensorConfig(sensor) {
  return (
    SENSOR_CONFIG.find(
      (item) => item.key === sensor
    ) || null
  );
}

function mapApiAlert(alert, crop) {
  const sensor = getApiSensorConfig(
    alert.sensor
  );

  return {
    key: alert._id,
    isApi: true,
    label: alert.title,
    severity: getApiAlertSeverity(alert),
    sensorLabel:
      sensor?.label ||
      alert.sensor ||
      "System",
    value: alert.value,
    unit: sensor?.unit || "",
    requirement: sensor
      ? getRequirement(sensor, crop)
      : null,
    recommendation: alert.message,
    createdAt: alert.createdAt
      ? new Date(alert.createdAt).toLocaleString()
      : null,
  };
}

function Alerts() {
  const { sensorData } = useSensor();

  const { user } = useAuth();

  const {
    selectedCrops,
    activeCrop,
    activeCropId,
    selectActiveCrop,
  } = useCrop();

  const [filter, setFilter] = useState("all");

  const [apiAlerts, setApiAlerts] = useState(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadAlerts = async () => {
      try {
        const data = await api.get("/alerts");

        if (cancelled) {
          return;
        }

        setApiAlerts(
          Array.isArray(data.alerts)
            ? data.alerts
            : []
        );
      } catch {
        if (cancelled) {
          return;
        }

        // backend offline — fall back to local alerts
        setApiAlerts(null);
      }
    };

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeCropData = useMemo(() => {
    if (!activeCrop) {
      return null;
    }

    const cropId =
      activeCrop.cropId ||
      activeCrop.id ||
      activeCropId;

    return getCropById(cropId) || activeCrop;
  }, [activeCrop, activeCropId]);

  const alertData = useMemo(() => {
    return SENSOR_CONFIG.map((sensor) => {
      const value = sensorData?.[sensor.key];

      const requirement = getRequirement(
        sensor,
        activeCropData
      );

      const severity = getAlertSeverity(
        value,
        requirement
      );

      return {
        ...sensor,
        value,
        requirement,
        severity,
        recommendation: getRecommendation(
          sensor,
          severity,
          Number(value),
          requirement
        ),
      };
    });
  }, [sensorData, activeCropData]);

  const realAlerts = useMemo(() => {
    if (!apiAlerts) {
      return null;
    }

    return apiAlerts.map((alert) =>
      mapApiAlert(alert, activeCropData)
    );
  }, [apiAlerts, activeCropData]);

  const activeAlerts = useMemo(() => {
    if (realAlerts) {
      return realAlerts;
    }

    return alertData.filter(
      (alert) =>
        alert.severity === "critical" ||
        alert.severity === "warning"
    );
  }, [realAlerts, alertData]);

  const summaryAlerts = useMemo(() => {
    if (!realAlerts) {
      return alertData;
    }

    return realAlerts.filter(
      (alert) => !alert.isResolved
    );
  }, [realAlerts, alertData]);

  const criticalCount = useMemo(
    () =>
      summaryAlerts.filter(
        (alert) => alert.severity === "critical"
      ).length,
    [summaryAlerts]
  );

  const warningCount = useMemo(
    () =>
      summaryAlerts.filter(
        (alert) => alert.severity === "warning"
      ).length,
    [summaryAlerts]
  );

  const healthyCount = useMemo(
    () =>
      summaryAlerts.filter(
        (alert) => alert.severity === "healthy"
      ).length,
    [summaryAlerts]
  );

  const noDataCount = useMemo(
    () =>
      summaryAlerts.filter(
        (alert) => alert.severity === "no-data"
      ).length,
    [summaryAlerts]
  );

  const resolveAlert = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/resolve`);

      setApiAlerts((current) =>
        current
          ? current.map((alert) =>
              alert._id === alertId
                ? {
                    ...alert,
                    isResolved: true,
                    resolvedAt:
                      new Date().toISOString(),
                  }
                : alert
            )
          : current
      );
    } catch {
      // backend offline — alert stays active
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await api.del(`/alerts/${alertId}`);

      setApiAlerts((current) =>
        current
          ? current.filter(
              (alert) => alert._id !== alertId
            )
          : current
      );
    } catch {
      // backend offline — alert stays in list
    }
  };

  const filteredAlerts =
    filter === "all"
      ? activeAlerts
      : activeAlerts.filter(
          (alert) => alert.severity === filter
        );

  const hasActiveCrop = Boolean(activeCropData);

  const deviceId =
    activeCrop?.device?.deviceId ||
    activeCrop?.device?.id ||
    "HYDROGROW-SIM-001";

  const deviceStatus =
    activeCrop?.device?.status ||
    "Configured";

  return (
    <div className="alerts-page">

      {/* HEADER */}
      <div className="alerts-page-header">
        <div>
          <span className="alerts-eyebrow">
            <i className="bi bi-bell"></i>
            SYSTEM ALERTS
          </span>

          <h1>Alerts & Notifications</h1>

          <p>
            Monitor crop conditions and identify
            parameters that require attention.
          </p>
        </div>

        <div className="alerts-header-status">
          <span className="alerts-status-dot"></span>
          Monitoring Active
        </div>
      </div>

      {/* ACTIVE CROP */}
      <section className="alerts-crop-section">

        <div className="alerts-section-title">
          <div>
            <span className="alerts-section-kicker">
              ACTIVE CROP
            </span>

            <h2>
              {hasActiveCrop
                ? "Alert monitoring for selected crop"
                : "Select a crop to view alerts"}
            </h2>
          </div>
        </div>

        {selectedCrops?.length > 0 ? (
          <div className="alerts-crop-selector">

            {selectedCrops.map((farmCrop) => {
              const crop =
                getCropById(
                  farmCrop.cropId ||
                  farmCrop.id
                ) || farmCrop;

              const cropId =
                farmCrop.cropId ||
                farmCrop.id;

              const isActive =
                activeCropId === cropId ||
                activeCrop?.cropId === cropId ||
                activeCrop?.id === cropId;

              return (
                <button
                  type="button"
                  key={cropId}
                  className={`alerts-crop-chip ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    selectActiveCrop(cropId)
                  }
                >
                  <span className="alerts-crop-chip-image">
                    {crop?.images?.[0] ||
                    crop?.image ? (
                      <img
                        src={
                          crop?.images?.[0] ||
                          crop?.image
                        }
                        alt={crop?.name}
                      />
                    ) : (
                      <i className="bi bi-flower1"></i>
                    )}
                  </span>

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
        ) : (
          <div className="alerts-no-crop">
            <div className="alerts-no-crop-icon">
              <i className="bi bi-flower1"></i>
            </div>

            <div>
              <strong>No Crop Selected</strong>

              <p>
                Select a crop before monitoring
                crop-specific alerts.
              </p>
            </div>

            <Link
              to="/crop-management"
              className="alerts-select-crop-btn"
            >
              Select Your Crop
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        )}

        {hasActiveCrop && (
          <div className="alerts-active-crop-info">
            <div className="alerts-active-crop-main">

              <div className="alerts-active-crop-image">
                {activeCropData?.images?.[0] ||
                activeCropData?.image ? (
                  <img
                    src={
                      activeCropData?.images?.[0] ||
                      activeCropData?.image
                    }
                    alt={activeCropData?.name}
                  />
                ) : (
                  <i className="bi bi-flower1"></i>
                )}
              </div>

              <div>
                <span>Monitoring Crop</span>

                <h3>
                  {activeCropData?.name}
                </h3>

                <p>
                  {activeCrop?.farmUnit ||
                    "Farm Unit not specified"}
                </p>
              </div>
            </div>

            <div className="alerts-device-summary">
              <span>Device</span>
              <strong>{deviceId}</strong>

              <small>
                <i className="bi bi-circle-fill"></i>
                {deviceStatus}
              </small>
            </div>
          </div>
        )}
      </section>

      {/* NO CROP STATE */}
      {!hasActiveCrop ? (
        <div className="alerts-page-empty">

          <div className="alerts-page-empty-icon">
            <i className="bi bi-shield-check"></i>
          </div>

          <h3>
            Crop Monitoring Not Started
          </h3>

          <p>
            HydroGrow will generate crop-specific
            alerts after you select and configure
            a crop in My Farm.
          </p>

          <Link
            to="/crop-management"
            className="alerts-primary-btn"
          >
            Select Crop
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="alerts-summary-grid">

            <div className="alerts-summary-card">
              <div className="alerts-summary-icon total">
                <i className="bi bi-bell-fill"></i>
              </div>

              <div>
                <span>Active Alerts</span>
                <strong>{summaryAlerts.length}</strong>
              </div>
            </div>

            <div className="alerts-summary-card critical">
              <div className="alerts-summary-icon">
                <i className="bi bi-exclamation-octagon-fill"></i>
              </div>

              <div>
                <span>Critical</span>
                <strong>{criticalCount}</strong>
              </div>
            </div>

            <div className="alerts-summary-card warning">
              <div className="alerts-summary-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>

              <div>
                <span>Warning</span>
                <strong>{warningCount}</strong>
              </div>
            </div>

            <div className="alerts-summary-card healthy">
              <div className="alerts-summary-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <span>Healthy</span>
                <strong>{healthyCount}</strong>
              </div>
            </div>

            <div className="alerts-summary-card no-data">
              <div className="alerts-summary-icon">
                <i className="bi bi-dash-circle-fill"></i>
              </div>

              <div>
                <span>No Data</span>
                <strong>{noDataCount}</strong>
              </div>
            </div>

          </div>

          {/* CURRENT ALERTS */}
          <section className="alerts-main-section">

            <div className="alerts-section-header">

              <div>
                <span className="alerts-section-kicker">
                  LIVE CONDITIONS
                </span>

                <h2>Current Alerts</h2>

                <p>
                  Alerts generated from the current
                  sensor readings for{" "}
                  <strong>
                    {activeCropData?.name}
                  </strong>.
                </p>
              </div>

              <div className="alerts-filter-group">

                <button
                  type="button"
                  className={
                    filter === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("all")
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  className={
                    filter === "critical"
                      ? "active critical"
                      : ""
                  }
                  onClick={() =>
                    setFilter("critical")
                  }
                >
                  Critical
                </button>

                <button
                  type="button"
                  className={
                    filter === "warning"
                      ? "active warning"
                      : ""
                  }
                  onClick={() =>
                    setFilter("warning")
                  }
                >
                  Warning
                </button>

              </div>
            </div>

            {filteredAlerts.length > 0 ? (
              <div className="alerts-list">

                {filteredAlerts.map((alert) => (
                  <div
                    className={`alert-item-card ${alert.severity}`}
                    key={alert.key}
                  >

                    <div className="alert-item-icon">
                      <i
                        className={`bi ${getStatusIcon(
                          alert.severity
                        )}`}
                      ></i>
                    </div>

                    <div className="alert-item-content">

                      <div className="alert-item-top">

                        <div>
                          <span className="alert-item-category">
                            {alert.severity ===
                            "critical"
                              ? "CRITICAL ALERT"
                              : alert.severity ===
                              "warning"
                              ? "WARNING"
                              : alert.severity ===
                              "resolved"
                              ? "RESOLVED"
                              : "INFO"}
                          </span>

                          <h3>
                            {alert.label}
                          </h3>
                        </div>

                        <span
                          className={`alert-severity ${alert.severity}`}
                        >
                          {getStatusLabel(
                            alert.severity
                          )}
                        </span>
                      </div>

                      <div className="alert-reading-row">

                        <div>
                          <span>
                            Current Value
                          </span>

                          <strong>
                            {formatValue(
                              alert.value,
                              alert.unit
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Recommended Range
                          </span>

                          <strong>
                            {formatRange(
                              alert.requirement,
                              alert.unit
                            )}
                          </strong>
                        </div>

                        {alert.createdAt && (
                          <div>
                            <span>
                              Sensor
                            </span>

                            <strong>
                              {alert.sensorLabel}
                            </strong>
                          </div>
                        )}

                        {alert.createdAt && (
                          <div>
                            <span>
                              Raised
                            </span>

                            <strong>
                              {alert.createdAt}
                            </strong>
                          </div>
                        )}

                      </div>

                      <div className="alert-recommendation">

                        <i className="bi bi-lightbulb-fill"></i>

                        <div>
                          <strong>
                            Recommended Action
                          </strong>

                          <p>
                            {alert.recommendation}
                          </p>
                        </div>

                      </div>

                      {alert.isApi && (
                        <div className="alert-reading-row">

                          <div>
                            {!alert.isResolved && (
                              <button
                                type="button"
                                className="hg-btn hg-btn--outline"
                                onClick={() =>
                                  resolveAlert(
                                    alert.key
                                  )
                                }
                              >
                                <i className="bi bi-check2"></i>
                                Mark Resolved
                              </button>
                            )}
                          </div>

                          <div>
                            <button
                              type="button"
                              className="hg-btn hg-btn--danger"
                              onClick={() =>
                                deleteAlert(
                                  alert.key
                                )
                              }
                            >
                              <i className="bi bi-trash3"></i>
                              Delete
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <div className="alerts-empty">

                <div className="alerts-empty-icon">
                  <i className="bi bi-shield-check"></i>
                </div>

                <h3>
                  {filter === "all"
                    ? "No Active Alerts"
                    : `No ${filter} alerts`}
                </h3>

                <p>
                  All available monitored parameters
                  are currently within the configured
                  range.
                </p>

              </div>
            )}

          </section>

          {/* PARAMETER STATUS */}
          <section className="alerts-parameter-section">

            <div className="alerts-section-header compact">

              <div>
                <span className="alerts-section-kicker">
                  PARAMETER OVERVIEW
                </span>

                <h2>Parameter Status</h2>

                <p>
                  Current status of all monitored
                  parameters for the active crop.
                </p>
              </div>

            </div>

            <div className="alerts-parameter-grid">

              {alertData.map((alert) => (
                <div
                  className={`alerts-parameter-card ${alert.severity}`}
                  key={alert.key}
                >

                  <div className="alerts-parameter-top">

                    <div className="alerts-parameter-icon">
                      <i
                        className={`bi ${alert.icon}`}
                      ></i>
                    </div>

                    <span
                      className={`parameter-status ${alert.severity}`}
                    >
                      <i
                        className={`bi ${getStatusIcon(
                          alert.severity
                        )}`}
                      ></i>

                      {getStatusLabel(
                        alert.severity
                      )}
                    </span>

                  </div>

                  <h3>
                    {alert.label}
                  </h3>

                  <strong className="alerts-parameter-value">
                    {formatValue(
                      alert.value,
                      alert.unit
                    )}
                  </strong>

                  <span className="alerts-parameter-range">
                    Range:{" "}
                    {formatRange(
                      alert.requirement,
                      alert.unit
                    )}
                  </span>

                </div>
              ))}

            </div>

          </section>

          {/* DEVICE / ENGINE INFO */}
          <div className="alerts-info-grid">

            <div className="alerts-info">

              <div className="alerts-info-icon">
                <i className="bi bi-cpu-fill"></i>
              </div>

              <div>
                <strong>Monitoring Device</strong>

                <p>
                  {deviceId} is associated with the
                  active crop. Sensor readings are
                  evaluated for this crop context.
                </p>
              </div>

            </div>

            <div className="alerts-info">

              <div className="alerts-info-icon">
                <i className="bi bi-shield-check"></i>
              </div>

              <div>
                <strong>Alert Engine</strong>

                <p>
                  HydroGrow evaluates sensor values
                  against the configured crop
                  requirements. Values outside the
                  range are critical, while values
                  close to a boundary are warnings.
                </p>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default Alerts;