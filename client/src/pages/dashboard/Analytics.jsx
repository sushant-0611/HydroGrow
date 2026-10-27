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

import { useCrop } from "../../context/CropContext";
import useSensor from "../../hooks/useSensor";
import { getCropById } from "../../data/cropData";

import "../../assets/styles/Analytics.css";

/* =========================================================
   PARAMETER CONFIGURATION
   ========================================================= */

const PARAMETER_CONFIG = [
  {
    key: "ph",
    label: "pH",
    unit: "",
    icon: "bi-droplet-half",
    decimals: 2,
    requirementKey: "ph",
    group: "environment",
  },
  {
    key: "ec",
    label: "EC",
    unit: "mS/cm",
    icon: "bi-lightning-charge",
    decimals: 2,
    requirementKey: "ec",
    group: "nutrient",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "bi-thermometer-half",
    decimals: 1,
    requirementKey: "temperature",
    group: "environment",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    icon: "bi-cloud-drizzle",
    decimals: 1,
    requirementKey: "humidity",
    group: "environment",
  },
  {
    key: "moisture",
    label: "Moisture",
    unit: "%",
    icon: "bi-moisture",
    decimals: 1,
    group: "water",
  },
  {
    key: "nitrogen",
    label: "Nitrogen",
    unit: "ppm",
    icon: "bi-flower1",
    decimals: 0,
    group: "nutrient",
  },
  {
    key: "phosphorus",
    label: "Phosphorus",
    unit: "ppm",
    icon: "bi-tree",
    decimals: 0,
    group: "nutrient",
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "ppm",
    icon: "bi-leaf",
    decimals: 0,
    group: "nutrient",
  },
  {
    key: "ppfd",
    label: "PPFD",
    unit: "µmol/m²/s",
    icon: "bi-brightness-high",
    decimals: 0,
    requirementKey: "ppfd",
    group: "environment",
  },
];

/* =========================================================
   FALLBACK REQUIREMENTS
   These are used only where the crop dataset does not
   contain a specific requirement.
   ========================================================= */

const FALLBACK_REQUIREMENTS = {
  moisture: [55, 85],
};

/* =========================================================
   HELPERS
   ========================================================= */

function parseRange(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const min = Number(value[0]);
    const max = Number(value[1]);

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return [min, max];
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const matches = value.match(/-?\d+(?:\.\d+)?/g);

  if (!matches || matches.length < 2) {
    return null;
  }

  const min = Number(matches[0]);
  const max = Number(matches[1]);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  return [min, max];
}

function getCropRequirement(crop, parameter) {
  const requirementKey =
    parameter.requirementKey || parameter.key;

  const cropValue = crop?.[requirementKey];

  const parsedCropRange = parseRange(cropValue);

  if (parsedCropRange) {
    return parsedCropRange;
  }

  return FALLBACK_REQUIREMENTS[parameter.key] || null;
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
    value === "offline" ||
    value === "disconnected"
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

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "healthy":
      return "healthy";

    case "warning":
      return "warning";

    case "critical":
      return "critical";

    case "offline":
      return "offline";

    default:
      return "no-data";
  }
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

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getReadingData(item) {
  return item?.data || item?.sensors || item || {};
}

function getReadingTimestamp(item) {
  return (
    item?.timestamp ||
    item?.createdAt ||
    item?.time ||
    item?.date ||
    null
  );
}

function getReadingCropId(item) {
  return (
    item?.cropId ||
    item?.crop?.id ||
    item?.farmCropId ||
    item?.farmCrop?.id ||
    item?.crop?.cropId ||
    null
  );
}

function getReadingStatus(item) {
  return normalizeStatus(
    item?.status ||
      item?.systemStatus ||
      item?.overallStatus
  );
}

function calculateGrowthDay(activeCrop) {
  if (
    Number.isFinite(Number(activeCrop?.growthDay))
  ) {
    return Math.max(
      0,
      Math.floor(Number(activeCrop.growthDay))
    );
  }

  const plantingDate =
    activeCrop?.plantingDate ||
    activeCrop?.planting?.date;

  if (!plantingDate) {
    return 0;
  }

  const date = new Date(plantingDate);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const difference =
    Date.now() - date.getTime();

  return Math.max(
    0,
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    )
  );
}

function getGrowthStage(activeCrop, crop) {
  if (activeCrop?.growthStage) {
    return activeCrop.growthStage;
  }

  const growthDay = calculateGrowthDay(activeCrop);

  const growthCycle = Number(
    String(crop?.growthCycle || "").match(
      /\d+(?:\.\d+)?/
    )?.[0]
  );

  const harvestStart = Number(
    String(crop?.harvestStart || "").match(
      /\d+(?:\.\d+)?/
    )?.[0]
  );

  if (!growthDay) {
    return "Not Started";
  }

  if (growthDay <= 7) {
    return "Germination";
  }

  if (growthDay <= 21) {
    return "Seedling";
  }

  if (
    Number.isFinite(harvestStart) &&
    growthDay < harvestStart * 0.55
  ) {
    return "Vegetative";
  }

  if (
    Number.isFinite(harvestStart) &&
    growthDay < harvestStart * 0.8
  ) {
    return "Flowering";
  }

  if (
    Number.isFinite(harvestStart) &&
    growthDay < harvestStart
  ) {
    return "Fruit Development";
  }

  if (
    Number.isFinite(growthCycle) &&
    growthDay >= growthCycle
  ) {
    return "Harvest Ready";
  }

  return "Fruit Development";
}

function calculateExpectedHarvest(activeCrop, crop) {
  if (activeCrop?.expectedHarvestDate) {
    return activeCrop.expectedHarvestDate;
  }

  const plantingDate =
    activeCrop?.plantingDate ||
    activeCrop?.planting?.date;

  if (!plantingDate) {
    return null;
  }

  const growthCycle = Number(
    String(crop?.growthCycle || "").match(
      /\d+(?:\.\d+)?/
    )?.[0]
  );

  if (!Number.isFinite(growthCycle)) {
    return null;
  }

  const date = new Date(plantingDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(
    date.getDate() + Math.round(growthCycle)
  );

  return date;
}

function calculateTrend(history, key) {
  if (!history || history.length < 2) {
    return {
      direction: "neutral",
      label: "No Trend",
      difference: null,
    };
  }

  const ordered = [...history]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );

  const values = ordered
    .map((item) => Number(item.data?.[key]))
    .filter(Number.isFinite);

  if (values.length < 2) {
    return {
      direction: "neutral",
      label: "No Trend",
      difference: null,
    };
  }

  const first = values[0];
  const last = values[values.length - 1];

  const difference = last - first;

  if (Math.abs(difference) < 0.001) {
    return {
      direction: "neutral",
      label: "Stable",
      difference: 0,
    };
  }

  return {
    direction:
      difference > 0 ? "up" : "down",
    label:
      difference > 0 ? "Increasing" : "Decreasing",
    difference,
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Analytics() {
  const {
    activeCrop,
    activeCropId,
    selectedCrops = [],
    selectActiveCrop,
  } = useCrop();

  const sensorHook = useSensor();

  const sensorData =
    sensorHook?.sensorData ||
    sensorHook?.data ||
    null;

  const rawHistory =
    sensorHook?.history ||
    sensorHook?.sensorHistory ||
    [];

  const getParameterStatus =
    sensorHook?.getParameterStatus;

  const [selectedParameter, setSelectedParameter] =
    useState("temperature");

  /* =======================================================
     ACTIVE CROP DATA
     ======================================================= */

  const cropId =
    activeCrop?.cropId ||
    activeCrop?.id ||
    activeCropId;

  const crop = useMemo(() => {
    return (
      getCropById(cropId) ||
      activeCrop?.crop ||
      activeCrop ||
      null
    );
  }, [cropId, activeCrop]);

  const cropName =
    crop?.name ||
    activeCrop?.cropName ||
    activeCrop?.name ||
    "Selected Crop";

  const farmUnit =
    activeCrop?.farmUnitName ||
    activeCrop?.farmUnit ||
    "My Farm Unit";

  const plantCount =
    activeCrop?.numberOfPlants ??
    activeCrop?.plantCount ??
    0;

  const deviceId =
    activeCrop?.device?.deviceId ||
    activeCrop?.device?.id ||
    activeCrop?.deviceId ||
    "Not Set";

  /* =======================================================
     ACTIVE CROP ROW
     ======================================================= */

  const cropSelector = (
    <div className="analytics-crop-selector">
      <div className="analytics-section-label">
        <i className="bi bi-flower1" />
        Selected Crops
      </div>

      <div className="analytics-crop-list">
        {selectedCrops.length > 0 ? (
          selectedCrops.map((item) => {
            const itemId =
              item?.cropId || item?.id;

            const itemCrop =
              getCropById(itemId) ||
              item?.crop ||
              item;

            const isActive =
              String(itemId) ===
              String(cropId);

            return (
              <button
                type="button"
                key={itemId}
                className={`analytics-crop-chip ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  selectActiveCrop?.(itemId)
                }
              >
                {itemCrop?.images?.[0] ||
                itemCrop?.image ? (
                  <img
                    src={
                      itemCrop.images?.[0] ||
                      itemCrop.image
                    }
                    alt={itemCrop?.name}
                  />
                ) : (
                  <span className="analytics-crop-chip-icon">
                    <i className="bi bi-leaf" />
                  </span>
                )}

                <span>
                  {itemCrop?.name ||
                    item?.cropName ||
                    "Crop"}
                </span>
              </button>
            );
          })
        ) : (
          <span className="analytics-no-crops">
            No crops selected
          </span>
        )}
      </div>
    </div>
  );

  /* =======================================================
     NORMALIZE HISTORY
     ======================================================= */

  const normalizedHistory = useMemo(() => {
    if (!Array.isArray(rawHistory)) {
      return [];
    }

    return rawHistory
      .map((item, index) => {
        const timestamp =
          getReadingTimestamp(item);

        return {
          id:
            item?.id ||
            item?._id ||
            `${timestamp || "reading"}-${index}`,
          timestamp,
          data: getReadingData(item),
          status: getReadingStatus(item),
          cropId: getReadingCropId(item),
        };
      })
      .filter((item) => {
        if (!item.timestamp) {
          return false;
        }

        if (!cropId) {
          return true;
        }

        /*
         * If backend history contains cropId, only use
         * records belonging to the active crop.
         *
         * If legacy/local records have no cropId,
         * they are not treated as crop-specific history.
         */
        return (
          item.cropId &&
          String(item.cropId) ===
            String(cropId)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );
  }, [rawHistory, cropId]);

  /* =======================================================
     HAS SENSOR DATA
     ======================================================= */

  const hasCurrentSensorData = useMemo(() => {
    if (!sensorData) {
      return false;
    }

    return PARAMETER_CONFIG.some((parameter) => {
      const value =
        sensorData?.[parameter.key];

      return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
      );
    });
  }, [sensorData]);

  const hasHistory =
    normalizedHistory.length > 0;

  /* =======================================================
     PARAMETER ANALYTICS
     ======================================================= */

  const parameterAnalytics = useMemo(() => {
    return PARAMETER_CONFIG.map((parameter) => {
      const currentValue =
        sensorData?.[parameter.key];

      const historicalValues =
        normalizedHistory
          .map((item) =>
            Number(item.data?.[parameter.key])
          )
          .filter(Number.isFinite);

      const values = [
        ...historicalValues,
        ...(Number.isFinite(
          Number(currentValue)
        )
          ? [Number(currentValue)]
          : []),
      ];

      const hasData = values.length > 0;

      const average = hasData
        ? values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        : null;

      const minimum = hasData
        ? Math.min(...values)
        : null;

      const maximum = hasData
        ? Math.max(...values)
        : null;

      let status = "unknown";

      if (
        Number.isFinite(Number(currentValue))
      ) {
        if (
          typeof getParameterStatus ===
          "function"
        ) {
          status = normalizeStatus(
            getParameterStatus(
              parameter.key,
              Number(currentValue)
            )
          );
        } else {
          const range =
            getCropRequirement(
              crop,
              parameter
            );

          if (range) {
            const [
              min,
              max,
            ] = range;

            const value =
              Number(currentValue);

            if (
              value >= min &&
              value <= max
            ) {
              status = "healthy";
            } else {
              status = "critical";
            }
          }
        }
      }

      return {
        ...parameter,
        current: Number.isFinite(
          Number(currentValue)
        )
          ? Number(currentValue)
          : null,
        average,
        minimum,
        maximum,
        status,
        requirement:
          getCropRequirement(
            crop,
            parameter
          ),
        trend: calculateTrend(
          normalizedHistory,
          parameter.key
        ),
        sampleCount: values.length,
        hasData,
      };
    });
  }, [
    sensorData,
    normalizedHistory,
    crop,
    getParameterStatus,
  ]);

  /* =======================================================
     STATUS SUMMARY
     ======================================================= */

  const statusSummary = useMemo(() => {
    return {
      healthy:
        parameterAnalytics.filter(
          (item) =>
            item.status === "healthy"
        ).length,

      warning:
        parameterAnalytics.filter(
          (item) =>
            item.status === "warning"
        ).length,

      critical:
        parameterAnalytics.filter(
          (item) =>
            item.status === "critical"
        ).length,

      noData:
        parameterAnalytics.filter(
          (item) =>
            !item.hasData ||
            item.status === "unknown"
        ).length,
    };
  }, [parameterAnalytics]);

  /* =======================================================
     CHART DATA
     ======================================================= */

  const selectedParameterConfig =
    parameterAnalytics.find(
      (item) =>
        item.key === selectedParameter
    ) ||
    parameterAnalytics[0];

  const chartData = useMemo(() => {
    if (
      !selectedParameterConfig ||
      normalizedHistory.length === 0
    ) {
      return [];
    }

    return normalizedHistory
      .slice(-30)
      .map((item) => {
        const value = Number(
          item.data?.[
            selectedParameterConfig.key
          ]
        );

        if (!Number.isFinite(value)) {
          return null;
        }

        return {
          time: formatTime(
            item.timestamp
          ),
          value,
        };
      })
      .filter(Boolean);
  }, [
    normalizedHistory,
    selectedParameterConfig,
  ]);

  /* =======================================================
     GROWTH ANALYTICS
     ======================================================= */

  const growthDay =
    calculateGrowthDay(activeCrop);

  const growthStage =
    getGrowthStage(
      activeCrop,
      crop
    );

  const expectedHarvest =
    calculateExpectedHarvest(
      activeCrop,
      crop
    );

  /* =======================================================
     ENVIRONMENT / NUTRIENT / WATER GROUPS
     ======================================================= */

  const environmentalParameters =
    parameterAnalytics.filter(
      (item) =>
        item.group === "environment"
    );

  const nutrientParameters =
    parameterAnalytics.filter(
      (item) =>
        item.group === "nutrient"
    );

  const waterParameters =
    parameterAnalytics.filter(
      (item) =>
        item.group === "water"
    );

  /* =======================================================
     NO CROP STATE
     ======================================================= */

  if (!activeCrop) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <div>
            <span className="analytics-eyebrow">
              FARM INTELLIGENCE
            </span>

            <h1>
              <i className="bi bi-bar-chart-line" />
              Analytics
            </h1>

            <p>
              Analyze environmental, nutrient,
              water, growth, alert and automation
              information for your active crop.
            </p>
          </div>
        </div>

        <div className="analytics-empty-state">
          <div className="analytics-empty-icon">
            <i className="bi bi-bar-chart-line" />
          </div>

          <h2>No Crop Selected Yet</h2>

          <p>
            Start managing your hydroponic farm
            by selecting your first crop.
          </p>

          <Link
            to="/crop-management"
            className="analytics-primary-btn"
          >
            <i className="bi bi-plus-circle" />
            Select Your Crop
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
     ======================================================= */

  return (
    <div className="analytics-page">

      {/* HEADER */}
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            FARM INTELLIGENCE
          </span>

          <h1>
            <i className="bi bi-bar-chart-line" />
            Analytics
          </h1>

          <p>
            Crop-specific performance and
            historical farm insights.
          </p>
        </div>

        <div className="analytics-header-status">
          <span className="analytics-status-dot" />
          Active Crop
        </div>
      </div>

      {/* ACTIVE CROP SELECTOR */}
      {cropSelector}

      {/* ACTIVE CROP SUMMARY */}
      <section className="analytics-crop-overview">

        <div className="analytics-crop-identity">

          <div className="analytics-crop-image">
            {crop?.images?.[0] ||
            crop?.image ? (
              <img
                src={
                  crop.images?.[0] ||
                  crop.image
                }
                alt={cropName}
              />
            ) : (
              <i className="bi bi-leaf" />
            )}
          </div>

          <div>
            <span className="analytics-overline">
              CURRENTLY ANALYZING
            </span>

            <h2>{cropName}</h2>

            <p>
              <i className="bi bi-geo-alt" />
              {farmUnit}
            </p>
          </div>

        </div>

        <div className="analytics-overview-stats">

          <div>
            <span>Plants</span>
            <strong>{plantCount}</strong>
          </div>

          <div>
            <span>Growth Day</span>
            <strong>{growthDay}</strong>
          </div>

          <div>
            <span>Growth Stage</span>
            <strong>{growthStage}</strong>
          </div>

          <div>
            <span>Device</span>
            <strong>{deviceId}</strong>
          </div>

        </div>

      </section>

      {/* DATA AVAILABILITY */}
      {!hasCurrentSensorData &&
        !hasHistory && (
          <div className="analytics-no-data-banner">
            <div className="analytics-no-data-icon">
              <i className="bi bi-database-x" />
            </div>

            <div>
              <strong>
                No Sensor Data Available
              </strong>

              <p>
                Analytics will appear here when
                readings for {cropName} are received
                through the HydroGrow REST API.
              </p>
            </div>

            <span className="analytics-no-data-badge">
              No Data
            </span>
          </div>
        )}

      {/* STATUS SUMMARY */}
      <section className="analytics-summary-grid">

        <SummaryCard
          icon="bi-check-circle"
          label="Healthy"
          value={
            statusSummary.healthy
          }
          type="healthy"
        />

        <SummaryCard
          icon="bi-exclamation-triangle"
          label="Warning"
          value={
            statusSummary.warning
          }
          type="warning"
        />

        <SummaryCard
          icon="bi-x-circle"
          label="Critical"
          value={
            statusSummary.critical
          }
          type="critical"
        />

        <SummaryCard
          icon="bi-database"
          label="No Data"
          value={
            statusSummary.noData
          }
          type="neutral"
        />

      </section>

      {/* ENVIRONMENTAL ANALYTICS */}
      <AnalyticsSection
        icon="bi-cloud-sun"
        title="Environmental Analytics"
        description={`Environmental performance for ${cropName}.`}
      >
        <ParameterAnalyticsGrid
          parameters={
            environmentalParameters
          }
        />
      </AnalyticsSection>

      {/* NUTRIENT ANALYTICS */}
      <AnalyticsSection
        icon="bi-droplet"
        title="Nutrient Analytics"
        description="Nutrient availability and historical behavior."
      >
        <ParameterAnalyticsGrid
          parameters={
            nutrientParameters
          }
        />
      </AnalyticsSection>

      {/* WATER / MOISTURE */}
      <AnalyticsSection
        icon="bi-water"
        title="Water & Moisture Analytics"
        description="Moisture conditions associated with the active crop."
      >
        <ParameterAnalyticsGrid
          parameters={
            waterParameters
          }
        />
      </AnalyticsSection>

      {/* TREND ANALYTICS */}
      <section className="analytics-section-card">

        <div className="analytics-section-header">
          <div>
            <span className="analytics-section-icon">
              <i className="bi bi-graph-up-arrow" />
            </span>

            <div>
              <h2>Sensor Trend Analytics</h2>

              <p>
                Historical trend for the selected
                parameter.
              </p>
            </div>
          </div>

          <select
            value={selectedParameter}
            onChange={(event) =>
              setSelectedParameter(
                event.target.value
              )
            }
            className="analytics-select"
          >
            {PARAMETER_CONFIG.map(
              (parameter) => (
                <option
                  key={parameter.key}
                  value={parameter.key}
                >
                  {parameter.label}
                </option>
              )
            )}
          </select>
        </div>

        {chartData.length > 0 ? (
          <div className="analytics-chart-wrapper">
            <div className="analytics-chart-heading">
              <div>
                <strong>
                  {selectedParameterConfig.label}
                </strong>

                <span>
                  {selectedParameterConfig.unit ||
                    "Value"}
                </span>
              </div>

              <TrendBadge
                trend={
                  selectedParameterConfig.trend
                }
              />
            </div>

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
                  bottom: 15,
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

                <Tooltip />

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
          <AnalyticsNoData
            icon="bi-graph-up"
            title="No Historical Trend Available"
            message={`Historical ${selectedParameterConfig?.label || "sensor"} readings for ${cropName} are not available yet.`}
          />
        )}

      </section>

      {/* GROWTH ANALYTICS */}
      <AnalyticsSection
        icon="bi-tree"
        title="Growth Analytics"
        description="Growth information calculated from crop and planting data."
      >
        <div className="growth-analytics-grid">

          <GrowthMetric
            icon="bi-calendar3"
            label="Current Growth Day"
            value={
              growthDay > 0
                ? `Day ${growthDay}`
                : "Not Started"
            }
          />

          <GrowthMetric
            icon="bi-layers"
            label="Current Growth Stage"
            value={growthStage}
          />

          <GrowthMetric
            icon="bi-basket"
            label="Expected Harvest"
            value={
              expectedHarvest
                ? formatDate(
                    expectedHarvest
                  )
                : "Not Available"
            }
          />

          <GrowthMetric
            icon="bi-clock-history"
            label="Growth Cycle"
            value={
              crop?.growthCycle ||
              "Not Available"
            }
          />

        </div>
      </AnalyticsSection>

      {/* ALERT ANALYTICS */}
      <AnalyticsSection
        icon="bi-bell"
        title="Alert Analytics"
        description="Current parameter health based on available sensor data."
      >
        <div className="analytics-alert-grid">

          <AlertMetric
            icon="bi-check-circle"
            label="Healthy Parameters"
            value={
              statusSummary.healthy
            }
            type="healthy"
          />

          <AlertMetric
            icon="bi-exclamation-triangle"
            label="Warnings"
            value={
              statusSummary.warning
            }
            type="warning"
          />

          <AlertMetric
            icon="bi-x-circle"
            label="Critical"
            value={
              statusSummary.critical
            }
            type="critical"
          />

        </div>
      </AnalyticsSection>

      {/* AUTOMATION ANALYTICS */}
      <AnalyticsSection
        icon="bi-cpu"
        title="Automation Analytics"
        description="Automation state associated with the active crop."
      >
        <div className="automation-analytics-panel">

          <div className="automation-analytics-icon">
            <i className="bi bi-cpu" />
          </div>

          <div className="automation-analytics-content">
            <span>Automation Mode</span>

            <strong>
              {activeCrop?.automation?.mode ||
                "Not Configured"}
            </strong>

            <p>
              Automation activity is evaluated
              using the active crop and incoming
              sensor conditions.
            </p>
          </div>

          <div className="automation-analytics-state">
            {activeCrop?.automation?.mode ===
            "automatic" ? (
              <>
                <span className="analytics-state-dot active" />
                Automatic
              </>
            ) : activeCrop?.automation?.mode ===
              "manual" ? (
              <>
                <span className="analytics-state-dot manual" />
                Manual
              </>
            ) : (
              <>
                <span className="analytics-state-dot" />
                Not Configured
              </>
            )}
          </div>

        </div>
      </AnalyticsSection>

      {/* PARAMETER SUMMARY */}
      <section className="analytics-section-card">

        <div className="analytics-section-header">
          <div>
            <span className="analytics-section-icon">
              <i className="bi bi-clipboard-data" />
            </span>

            <div>
              <h2>Parameter Analytics Summary</h2>

              <p>
                Current, average, minimum,
                maximum and trend for the active crop.
              </p>
            </div>
          </div>
        </div>

        <div className="analytics-table-wrapper">

          <table className="analytics-table">

            <thead>
              <tr>
                <th>Parameter</th>
                <th>Current</th>
                <th>Average</th>
                <th>Minimum</th>
                <th>Maximum</th>
                <th>Recommended</th>
                <th>Status</th>
                <th>Trend</th>
              </tr>
            </thead>

            <tbody>
              {parameterAnalytics.map(
                (parameter) => (
                  <tr
                    key={parameter.key}
                  >
                    <td>
                      <div className="analytics-table-parameter">
                        <span>
                          <i
                            className={`bi ${parameter.icon}`}
                          />
                        </span>

                        <strong>
                          {parameter.label}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formatNumber(
                          parameter.current,
                          parameter.decimals
                        )}
                      </strong>

                      {parameter.unit && (
                        <small>
                          {" "}
                          {parameter.unit}
                        </small>
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        parameter.average,
                        parameter.decimals
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        parameter.minimum,
                        parameter.decimals
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        parameter.maximum,
                        parameter.decimals
                      )}
                    </td>

                    <td>
                      {parameter.requirement ? (
                        <span className="analytics-range">
                          {formatNumber(
                            parameter.requirement[0],
                            parameter.decimals
                          )}
                          {" – "}
                          {formatNumber(
                            parameter.requirement[1],
                            parameter.decimals
                          )}
                          {parameter.unit
                            ? ` ${parameter.unit}`
                            : ""}
                        </span>
                      ) : (
                        <span className="analytics-not-available">
                          Not Available
                        </span>
                      )}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          parameter.status
                        }
                      />
                    </td>

                    <td>
                      <TrendBadge
                        trend={
                          parameter.trend
                        }
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>

          </table>

        </div>

      </section>

      {/* DATA SOURCE INFORMATION */}
      <div className="analytics-info-banner">

        <div className="analytics-info-icon">
          <i className="bi bi-info-circle" />
        </div>

        <div>
          <strong>
            HydroGrow Analytics Data Source
          </strong>

          <p>
            Analytics are calculated from sensor
            readings associated with the active crop.
            The platform does not generate random
            sensor values. When no readings are
            available, the corresponding analytics
            remain in the <strong>No Data</strong> state.
          </p>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ANALYTICS SECTION
   ========================================================= */

function AnalyticsSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="analytics-section-card">

      <div className="analytics-section-header">

        <div>
          <span className="analytics-section-icon">
            <i className={`bi ${icon}`} />
          </span>

          <div>
            <h2>{title}</h2>

            <p>{description}</p>
          </div>
        </div>

      </div>

      <div className="analytics-section-body">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  type,
}) {
  return (
    <div
      className={`analytics-summary-card ${type}`}
    >
      <div className="analytics-summary-icon">
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   PARAMETER ANALYTICS GRID
   ========================================================= */

function ParameterAnalyticsGrid({
  parameters,
}) {
  if (!parameters.length) {
    return (
      <AnalyticsNoData
        icon="bi-database"
        title="No Analytics Available"
        message="There are no parameters available for this analytics section."
      />
    );
  }

  return (
    <div className="parameter-analytics-grid">

      {parameters.map((parameter) => (
        <ParameterAnalyticsCard
          key={parameter.key}
          parameter={parameter}
        />
      ))}

    </div>
  );
}

/* =========================================================
   PARAMETER CARD
   ========================================================= */

function ParameterAnalyticsCard({
  parameter,
}) {
  return (
    <div className="parameter-analytics-card">

      <div className="parameter-card-top">

        <div className="parameter-card-title">

          <span className="parameter-card-icon">
            <i
              className={`bi ${parameter.icon}`}
            />
          </span>

          <div>
            <strong>
              {parameter.label}
            </strong>

            {parameter.requirement ? (
              <small>
                Recommended{" "}
                {formatNumber(
                  parameter.requirement[0],
                  parameter.decimals
                )}
                {" – "}
                {formatNumber(
                  parameter.requirement[1],
                  parameter.decimals
                )}
                {parameter.unit
                  ? ` ${parameter.unit}`
                  : ""}
              </small>
            ) : (
              <small>
                Crop range not available
              </small>
            )}
          </div>

        </div>

        <StatusBadge
          status={parameter.status}
        />

      </div>

      <div className="parameter-current-value">

        <strong>
          {formatNumber(
            parameter.current,
            parameter.decimals
          )}
        </strong>

        {parameter.unit && (
          <span>
            {parameter.unit}
          </span>
        )}

      </div>

      <div className="parameter-stats">

        <MiniStat
          label="Average"
          value={formatNumber(
            parameter.average,
            parameter.decimals
          )}
        />

        <MiniStat
          label="Min"
          value={formatNumber(
            parameter.minimum,
            parameter.decimals
          )}
        />

        <MiniStat
          label="Max"
          value={formatNumber(
            parameter.maximum,
            parameter.decimals
          )}
        />

      </div>

      <div className="parameter-card-footer">

        <span>
          {parameter.sampleCount > 0
            ? `${parameter.sampleCount} sample${
                parameter.sampleCount !== 1
                  ? "s"
                  : ""
              }`
            : "No samples"}
        </span>

        <TrendBadge
          trend={parameter.trend}
        />

      </div>

    </div>
  );
}

/* =========================================================
   MINI STAT
   ========================================================= */

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="analytics-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
}) {
  const normalized =
    normalizeStatus(status);

  return (
    <span
      className={`analytics-status-badge ${getStatusClass(
        status
      )}`}
    >
      <span />

      {getStatusLabel(normalized)}
    </span>
  );
}

/* =========================================================
   TREND BADGE
   ========================================================= */

function TrendBadge({
  trend,
}) {
  if (!trend) {
    return (
      <span className="analytics-trend neutral">
        <i className="bi bi-dash" />
        No Trend
      </span>
    );
  }

  let icon = "bi-dash";
  let className = "neutral";

  if (trend.direction === "up") {
    icon = "bi-arrow-up";
    className = "up";
  }

  if (trend.direction === "down") {
    icon = "bi-arrow-down";
    className = "down";
  }

  return (
    <span
      className={`analytics-trend ${className}`}
    >
      <i className={`bi ${icon}`} />
      {trend.label}
    </span>
  );
}

/* =========================================================
   GROWTH METRIC
   ========================================================= */

function GrowthMetric({
  icon,
  label,
  value,
}) {
  return (
    <div className="growth-metric">

      <div className="growth-metric-icon">
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

    </div>
  );
}

/* =========================================================
   ALERT METRIC
   ========================================================= */

function AlertMetric({
  icon,
  label,
  value,
  type,
}) {
  return (
    <div
      className={`analytics-alert-metric ${type}`}
    >
      <div>
        <i className={`bi ${icon}`} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   NO DATA
   ========================================================= */

function AnalyticsNoData({
  icon = "bi-database-x",
  title = "No Data Available",
  message = "There is not enough historical data to calculate this analytics view yet.",
}) {
  return (
    <div className="analytics-no-data">

      <div className="analytics-no-data-small-icon">
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

    </div>
  );
}