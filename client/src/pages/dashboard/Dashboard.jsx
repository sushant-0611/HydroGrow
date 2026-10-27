import { useMemo } from "react";
import { Link } from "react-router-dom";

import useSensor from "../../hooks/useSensor";
import { useCrop } from "../../context/CropContext";
import { getCropById } from "../../data/cropData";
import { getDeviceUrl } from "../../services/simulatorService";

import {
  checkCropRequirements,
  getOverallCropStatus,
  getStatusClass,
  getStatusIcon,
} from "../../utils/cropRequirementChecker";

import "../../assets/styles/dashboard.css";

function Dashboard() {
  const { sensorData, history, deviceConnected, deviceInfo, deviceSource: liveDeviceSource } =
    useSensor();

  const {
    selectedCrops,
    activeCrop,
    activeCropId,
    selectActiveCrop,
  } = useCrop();

  // =====================================================
  // ACTIVE CROP DATA
  // =====================================================

  const crop = useMemo(() => {
    if (!activeCrop?.cropId) {
      return null;
    }

    return getCropById(activeCrop.cropId);
  }, [activeCrop]);

  // =====================================================
  // CROP REQUIREMENT ANALYSIS
  // =====================================================

  const requirementResults = useMemo(() => {
    if (!crop || !sensorData) {
      return [];
    }

    return checkCropRequirements(crop, sensorData);
  }, [crop, sensorData]);

  // =====================================================
  // OVERALL CROP STATUS
  // =====================================================

  const overallStatus = useMemo(() => {
    if (!requirementResults.length) {
      return {
        status: "no-data",
        label: "No Data",
      };
    }

    return getOverallCropStatus(requirementResults);
  }, [requirementResults]);

  // =====================================================
  // STATUS SUMMARY
  // =====================================================

  const statusSummary = useMemo(() => {
    return {
      healthy: requirementResults.filter(
        (item) => item.status === "healthy"
      ).length,

      warning: requirementResults.filter(
        (item) => item.status === "warning"
      ).length,

      critical: requirementResults.filter(
        (item) => item.status === "critical"
      ).length,
    };
  }, [requirementResults]);

  // =====================================================
  // CROP DAY
  // =====================================================

  const cropDay = useMemo(() => {
    if (!activeCrop?.plantingDate) {
      return 1;
    }

    const plantingDate = new Date(
      `${activeCrop.plantingDate}T00:00:00`
    );

    if (Number.isNaN(plantingDate.getTime())) {
      return 1;
    }

    const today = new Date();

    const diff =
      today.getTime() -
      plantingDate.getTime();

    const calculatedDay =
      Math.floor(
        diff / (1000 * 60 * 60 * 24)
      ) + 1;

    return Math.max(1, calculatedDay);
  }, [activeCrop]);

  // =====================================================
  // GROWTH STAGE
  // =====================================================

  const growthStage = useMemo(() => {
    if (!crop) {
      return {
        key: "unknown",
        label: "Not Started",
        icon: "bi-question-circle",
        description:
          "Select a crop to begin tracking growth.",
      };
    }

    const cycle = parseGrowthCycle(
      crop.growthCycle
    );

    const day = cropDay;

    const ratio =
      cycle > 0
        ? day / cycle
        : 0;

    if (ratio <= 0.08) {
      return {
        key: "seed",
        label: "Germination",
        icon: "bi-circle",
        description:
          "Seeds are establishing and beginning germination.",
      };
    }

    if (ratio <= 0.20) {
      return {
        key: "seedling",
        label: "Seedling",
        icon: "bi-flower1",
        description:
          "Young seedlings are establishing their first leaves.",
      };
    }

    if (ratio <= 0.55) {
      return {
        key: "vegetative",
        label: "Vegetative",
        icon: "bi-tree",
        description:
          "The plant is actively developing leaves, roots and structure.",
      };
    }

    if (ratio <= 0.78) {
      return {
        key: "flowering",
        label: "Flowering",
        icon: "bi-flower2",
        description:
          "The crop is entering its reproductive growth stage.",
      };
    }

    if (ratio <= 0.95) {
      return {
        key: "fruiting",
        label: "Fruit Development",
        icon: "bi-apple",
        description:
          "Flowers are developing into harvestable crop output.",
      };
    }

    return {
      key: "harvest",
      label: "Harvest Ready",
      icon: "bi-basket3",
      description:
        "The crop is approaching or within its expected harvest period.",
    };
  }, [crop, cropDay]);

  // =====================================================
  // EXPECTED HARVEST
  // =====================================================

  const harvestInfo = useMemo(() => {
    if (!crop) {
      return {
        start: "--",
        remaining: "--",
        cycleRemaining: 0,
      };
    }

    const harvestStart = parseGrowthValue(
      crop.harvestStart
    );

    const growthCycle = parseGrowthCycle(
      crop.growthCycle
    );

    const remaining = Math.max(
      0,
      harvestStart - cropDay
    );

    const cycleRemaining = Math.max(
      0,
      growthCycle - cropDay
    );

    return {
      start:
        harvestStart > 0
          ? `Day ${harvestStart}`
          : "--",

      remaining:
        remaining === 0
          ? "Harvest window open"
          : `${remaining} days`,

      cycleRemaining,
    };
  }, [crop, cropDay]);

  // =====================================================
  // DASHBOARD ENVIRONMENT PARAMETERS
  // =====================================================

  const dashboardParameters = [
    {
      key: "ph",
      label: "pH",
      icon: "bi-droplet-half",
      unit: "",
    },
    {
      key: "ec",
      label: "EC",
      icon: "bi-lightning-charge",
      unit: "mS/cm",
    },
    {
      key: "temperature",
      label: "Temperature",
      icon: "bi-thermometer-half",
      unit: "°C",
    },
    {
      key: "humidity",
      label: "Humidity",
      icon: "bi-cloud-drizzle",
      unit: "%",
    },
    {
      key: "moisture",
      label: "Moisture",
      icon: "bi-water",
      unit: "%",
    },
    {
      key: "ppfd",
      label: "PPFD",
      icon: "bi-brightness-high",
      unit: "µmol/m²/s",
    },
  ];

  // =====================================================
  // REQUIREMENT LOOKUP
  // =====================================================

  const getRequirementResult = (key) => {
    return requirementResults.find(
      (item) => item.key === key
    );
  };

  // =====================================================
  // LAST SENSOR UPDATE
  // =====================================================

  const lastUpdated =
    history && history.length > 0
      ? history[history.length - 1]?.timestamp
      : null;

  // =====================================================
  // DEVICE INFORMATION
  // =====================================================

  const deviceId =
    deviceInfo?.deviceId ||
    activeCrop?.device?.deviceId ||
    activeCrop?.deviceId ||
    "HYDROGROW-SIM-001";

  const deviceSource = deviceConnected
    ? liveDeviceSource
    : activeCrop?.device?.source ||
      activeCrop?.source ||
      "LOCAL_SIMULATION";

  const deviceStatus = deviceConnected
    ? deviceInfo?.power
      ? "Connected"
      : "Powered Off"
    : "Disconnected";

  // =====================================================
  // NO CROP SELECTED
  // =====================================================

  if (!activeCrop || !crop) {
    return (
      <div className="dashboard-page">
        {/* PAGE HEADER */}

        <div className="dashboard-page-header">
          <div>
            <span className="dashboard-eyebrow">
              <i className="bi bi-grid-1x2-fill" />
              CONTROL CENTER
            </span>

            <h1>Dashboard</h1>

            <p>
              Manage your hydroponic crops,
              growing environment and farm
              operations from one place.
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}

        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon">
            <i className="bi bi-flower1" />
          </div>

          <span className="dashboard-empty-label">
            FARM SETUP REQUIRED
          </span>

          <h2>No Crop Selected Yet</h2>

          <p>
            Start managing your hydroponic farm
            by selecting your first crop.
          </p>

          <Link
            to="/crop-management"
            className="dashboard-primary-button"
          >
            <i className="bi bi-plus-circle" />

            Select Your Crop

            <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {/* SETUP STEPS */}

        {selectedCrops.length === 0 && (
          <div className="dashboard-empty-info-grid">
            <div>
              <i className="bi bi-flower2" />

              <strong>
                Choose a Crop
              </strong>

              <span>
                Select a crop from the
                HydroGrow crop database.
              </span>
            </div>

            <div>
              <i className="bi bi-sliders" />

              <strong>
                Configure Your Farm
              </strong>

              <span>
                Set your farm unit,
                planting details and
                plant count.
              </span>
            </div>

            <div>
              <i className="bi bi-speedometer2" />

              <strong>
                Start Monitoring
              </strong>

              <span>
                Monitor crop conditions,
                growth and alerts.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">
            <i className="bi bi-grid-1x2-fill" />
            CONTROL CENTER
          </span>

          <h1>Dashboard</h1>

          <p>
            Crop-specific overview for your
            active hydroponic growing unit.
          </p>
        </div>

        <div className="dashboard-header-actions">

          <div className="dashboard-live-indicator">
            <span />
            {deviceStatus === "Connected"
              ? "Simulator Connected"
              : deviceStatus}
          </div>

          <Link
            to="/monitoring"
            className="dashboard-action-button"
          >
            <i className="bi bi-activity" />
            Monitoring
          </Link>
        </div>
      </div>

      {/* =================================================
          SELECTED CROPS
          ================================================= */}

      <div className="dashboard-section-header">
        <div>
          <span className="dashboard-section-label">
            MY FARM
          </span>

          <h2>Selected Crops</h2>
        </div>

        <Link
          to="/my-farm"
          className="dashboard-view-link"
        >
          Manage My Farm
          <i className="bi bi-arrow-right" />
        </Link>
      </div>

      <div className="dashboard-crop-selector">

        {selectedCrops.map((farmCrop) => {
          const cropData = getCropById(
            farmCrop.cropId
          );

          if (!cropData) {
            return null;
          }

          const isActive =
            farmCrop.id === activeCropId;

          return (
            <button
              type="button"
              key={farmCrop.id}
              className={`dashboard-crop-selector-item ${
                isActive ? "active" : ""
              }`}
              onClick={() =>
                selectActiveCrop(farmCrop.id)
              }
            >
              <img
                src={cropData.images?.[0]}
                alt={cropData.name}
              />

              <span>
                <strong>
                  {cropData.name}
                </strong>

                <small>
                  {farmCrop.plantCount || 0} plants
                </small>
              </span>

              {isActive && (
                <i className="bi bi-check-circle-fill" />
              )}
            </button>
          );
        })}

        <Link
          to="/crop-management"
          className="dashboard-add-crop-button"
        >
          <i className="bi bi-plus" />

          <span>
            Add Crop
          </span>
        </Link>
      </div>

      {/* =================================================
          ACTIVE CROP HERO
          ================================================= */}

      <div className="dashboard-active-crop-card">

        <div className="dashboard-active-crop-image">
          <img
            src={crop.images?.[0]}
            alt={crop.name}
          />

          <span className="dashboard-active-crop-status">
            <i
              className={`bi ${getStatusIcon(
                overallStatus.status
              )}`}
            />

            {overallStatus.label}
          </span>
        </div>

        <div className="dashboard-active-crop-content">

          <div className="dashboard-active-crop-heading">
            <div>
              <span className="dashboard-section-label">
                ACTIVE CROP
              </span>

              <h2>
                {crop.name}
              </h2>

              <p>
                {crop.scientificName}
              </p>
            </div>

            <Link
              to={`/crops/${crop.id}`}
              className="dashboard-outline-button"
            >
              Crop Details

              <i className="bi bi-arrow-up-right" />
            </Link>
          </div>

          <div className="dashboard-active-crop-meta">

            <div>
              <span>Farm Unit</span>

              <strong>
                {activeCrop.farmUnit ||
                  activeCrop.farmUnitName ||
                  "Not configured"}
              </strong>
            </div>

            <div>
              <span>Plants</span>

              <strong>
                {activeCrop.plantCount ||
                  activeCrop.numberOfPlants ||
                  0}
              </strong>
            </div>

            <div>
              <span>Crop Day</span>

              <strong>
                Day {cropDay}
              </strong>
            </div>

            <div>
              <span>
                Hydroponic System
              </span>

              <strong>
                {crop.hydroponicSystem}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          CROP OVERVIEW
          ================================================= */}

      <div className="dashboard-overview-grid">

        {/* CONDITION */}

        <div className="dashboard-status-card">

          <div className="dashboard-status-icon">
            <i
              className={`bi ${getStatusIcon(
                overallStatus.status
              )}`}
            />
          </div>

          <div className="dashboard-status-content">

            <span>
              Crop Condition
            </span>

            <strong>
              {overallStatus.label}
            </strong>

            <small>
              {statusSummary.critical > 0
                ? `${statusSummary.critical} parameter${
                    statusSummary.critical > 1
                      ? "s"
                      : ""
                  } require immediate attention`
                : statusSummary.warning > 0
                ? `${statusSummary.warning} parameter${
                    statusSummary.warning > 1
                      ? "s"
                      : ""
                  } need attention`
                : "All monitored crop parameters are within range"}
            </small>
          </div>

          <span
            className={`dashboard-status-badge ${overallStatus.status}`}
          >
            <span />
            {overallStatus.label}
          </span>
        </div>

        {/* GROWTH */}

        <div className="dashboard-summary-card">

          <div className="dashboard-summary-icon">
            <i className="bi bi-tree" />
          </div>

          <div>
            <span>
              Growth Stage
            </span>

            <strong>
              {growthStage.label}
            </strong>

            <small>
              Day {cropDay} of approximately{" "}
              {parseGrowthCycle(
                crop.growthCycle
              )} days
            </small>
          </div>
        </div>

        {/* HARVEST */}

        <div className="dashboard-summary-card">

          <div className="dashboard-summary-icon">
            <i className="bi bi-calendar-check" />
          </div>

          <div>
            <span>
              Harvest
            </span>

            <strong>
              {harvestInfo.remaining}
            </strong>

            <small>
              Expected from{" "}
              {harvestInfo.start}
            </small>
          </div>
        </div>
      </div>

      {/* =================================================
          CURRENT CONDITION
          ================================================= */}

      <div className="dashboard-section-header">

        <div>
          <span className="dashboard-section-label">
            CURRENT CONDITION
          </span>

          <h2>
            {crop.name} Environment
          </h2>
        </div>

        <Link
          to="/monitoring"
          className="dashboard-view-link"
        >
          Detailed Monitoring
          <i className="bi bi-arrow-right" />
        </Link>
      </div>

      <div className="dashboard-condition-grid">

        {dashboardParameters.map(
          (parameter) => {
            const result =
              getRequirementResult(
                parameter.key
              );

            const value =
              sensorData?.[
                parameter.key
              ];

            return (
              <div
                key={parameter.key}
                className={`dashboard-condition-card ${
                  result
                    ? getStatusClass(
                        result.status
                      )
                    : "no-data"
                }`}
              >
                <div className="dashboard-condition-top">

                  <div className="dashboard-condition-icon">
                    <i
                      className={`bi ${parameter.icon}`}
                    />
                  </div>

                  <span
                    className={`dashboard-condition-status ${
                      result?.status ||
                      "no-data"
                    }`}
                  >
                    {result?.label ||
                      "No Data"}
                  </span>
                </div>

                <span className="dashboard-condition-label">
                  {parameter.label}
                </span>

                <strong className="dashboard-condition-value">
                  {value ?? "--"}

                  <small>
                    {parameter.unit}
                  </small>
                </strong>

                <div className="dashboard-condition-range">

                  <span>
                    Recommended
                  </span>

                  <strong>
                    {result?.requiredRange ||
                      "N/A"}
                  </strong>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* =================================================
          GROWTH OVERVIEW
          ================================================= */}

      <div className="dashboard-growth-panel">

        <div className="dashboard-panel-header">

          <div>
            <span className="dashboard-panel-label">
              GROWTH TRACKING
            </span>

            <h3>
              Crop Growth Overview
            </h3>
          </div>

          <Link
            to={`/crops/${crop.id}/growth`}
            className="dashboard-panel-link"
          >
            Open Growth Tracking
            <i className="bi bi-arrow-right" />
          </Link>
        </div>

        <div className="dashboard-growth-content">

          {/* PLANT VISUAL */}

          <div className="dashboard-growth-plant">

            <div
              className={`dashboard-growth-plant-visual stage-${growthStage.key}`}
            >
              <div className="dashboard-growth-soil" />

              <div className="dashboard-growth-stem" />

              <div className="dashboard-growth-leaf leaf-left" />

              <div className="dashboard-growth-leaf leaf-right" />

              <div className="dashboard-growth-leaf leaf-left-small" />

              <div className="dashboard-growth-leaf leaf-right-small" />

              {[
                "flowering",
                "fruiting",
                "harvest",
              ].includes(
                growthStage.key
              ) && (
                <>
                  <div className="dashboard-growth-flower flower-one">
                    ✿
                  </div>

                  <div className="dashboard-growth-flower flower-two">
                    ✿
                  </div>
                </>
              )}

              {[
                "fruiting",
                "harvest",
              ].includes(
                growthStage.key
              ) && (
                <>
                  <div className="dashboard-growth-fruit fruit-one" />

                  <div className="dashboard-growth-fruit fruit-two" />

                  <div className="dashboard-growth-fruit fruit-three" />
                </>
              )}
            </div>
          </div>

          {/* GROWTH DETAILS */}

          <div className="dashboard-growth-details">

            <span className="dashboard-growth-stage-label">
              CURRENT STAGE
            </span>

            <div className="dashboard-growth-stage">

              <div className="dashboard-growth-stage-icon">
                <i
                  className={`bi ${growthStage.icon}`}
                />
              </div>

              <div>
                <strong>
                  {growthStage.label}
                </strong>

                <span>
                  Crop Day {cropDay}
                </span>
              </div>
            </div>

            <p>
              {growthStage.description}
            </p>

            {/* TIMELINE */}

            <div className="dashboard-growth-timeline">

              {[
                {
                  key: "seed",
                  label: "Germination",
                },
                {
                  key: "seedling",
                  label: "Seedling",
                },
                {
                  key: "vegetative",
                  label: "Vegetative",
                },
                {
                  key: "flowering",
                  label: "Flowering",
                },
                {
                  key: "fruiting",
                  label: "Fruit",
                },
                {
                  key: "harvest",
                  label: "Harvest",
                },
              ].map(
                (stage) => (
                  <div
                    key={stage.key}
                    className={
                      stage.key ===
                      growthStage.key
                        ? "active"
                        : ""
                    }
                  >
                    <span />

                    <small>
                      {stage.label}
                    </small>
                  </div>
                )
              )}
            </div>

            {/* GROWTH META */}

            <div className="dashboard-growth-meta">

              <div>
                <span>
                  Expected Harvest
                </span>

                <strong>
                  {crop.harvestStart
                    ? `Day ${parseGrowthValue(
                        crop.harvestStart
                      )}+`
                    : "--"}
                </strong>
              </div>

              <div>
                <span>
                  Growth Cycle
                </span>

                <strong>
                  {parseGrowthCycle(
                    crop.growthCycle
                  )}{" "}
                  days
                </strong>
              </div>

              <div>
                <span>
                  System
                </span>

                <strong>
                  {crop.hydroponicSystem}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          ALERT + DEVICE
          ================================================= */}

      <div className="dashboard-bottom-grid">

        {/* ALERT SUMMARY */}

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>
              <span className="dashboard-panel-label">
                SYSTEM EVENTS
              </span>

              <h3>
                {crop.name} Alert Summary
              </h3>
            </div>

            <Link
              to="/alerts"
              className="dashboard-panel-link"
            >
              View all
              <i className="bi bi-arrow-right" />
            </Link>
          </div>

          <div className="dashboard-alert-summary">

            <div className="dashboard-alert-stat critical">

              <div>
                <i className="bi bi-exclamation-octagon" />
              </div>

              <div>
                <strong>
                  {statusSummary.critical}
                </strong>

                <span>
                  Critical
                </span>
              </div>
            </div>

            <div className="dashboard-alert-stat warning">

              <div>
                <i className="bi bi-exclamation-triangle" />
              </div>

              <div>
                <strong>
                  {statusSummary.warning}
                </strong>

                <span>
                  Warnings
                </span>
              </div>
            </div>

            <div className="dashboard-alert-stat healthy">

              <div>
                <i className="bi bi-check-circle" />
              </div>

              <div>
                <strong>
                  {statusSummary.healthy}
                </strong>

                <span>
                  Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-alert-message">

            <i className="bi bi-info-circle" />

            <div>
              <strong>
                Crop monitoring active
              </strong>

              <p>
                Current readings are being
                evaluated against the
                recommended requirements
                for {crop.name}.
              </p>
            </div>
          </div>
        </div>

        {/* DEVICE STATUS */}

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>
              <span className="dashboard-panel-label">
                DEVICE
              </span>

              <h3>
                Sensor Hardware Unit
              </h3>
            </div>

            <span className="dashboard-device-online">
              <span />
              {deviceStatus.toUpperCase()}
            </span>
          </div>

          <div className="dashboard-device-card">

            <div className="dashboard-device-icon">
              <i
                className={
                  deviceConnected
                    ? "bi bi-broadcast-pin"
                    : "bi bi-wifi-off"
                }
              />
            </div>

            <div>
              <strong>
                {deviceId}
              </strong>

              <span>
                {deviceSource}
              </span>
            </div>
          </div>

          <div className="dashboard-device-details">

            <div>
              <span>
                Connection
              </span>

              <strong>
                {deviceStatus}
              </strong>
            </div>

            <div>
              <span>
                Data Mode
              </span>

              <strong>
                {deviceConnected
                  ? deviceInfo?.mode === "manual"
                    ? "Manual Hold"
                    : "Live Auto"
                  : "Local Simulation"}
              </strong>
            </div>

            <div>
              <span>
                Active Crop
              </span>

              <strong>
                {crop.name}
              </strong>
            </div>
          </div>

          <a
            href={getDeviceUrl()}
            target="_blank"
            rel="noreferrer"
            className="dashboard-simulator-link"
          >
            <i className="bi bi-sliders" />

            {deviceConnected
              ? "Open Device Control Panel"
              : "Start Sensor Unit (Port 5174)"}

            <i className="bi bi-box-arrow-up-right" />
          </a>
        </div>
      </div>

      {/* =================================================
          QUICK ACCESS
          ================================================= */}

      <div className="dashboard-section-header dashboard-quick-header">

        <div>
          <span className="dashboard-section-label">
            QUICK ACCESS
          </span>

          <h2>
            Manage {crop.name}
          </h2>
        </div>
      </div>

      <div className="dashboard-quick-grid">

        <Link
          to="/monitoring"
          className="dashboard-quick-card"
        >
          <div className="dashboard-quick-icon">
            <i className="bi bi-activity" />
          </div>

          <div>
            <strong>
              Live Monitoring
            </strong>

            <span>
              View current sensor readings
            </span>
          </div>

          <i className="bi bi-arrow-right" />
        </Link>

        <Link
          to="/my-farm"
          className="dashboard-quick-card"
        >
          <div className="dashboard-quick-icon">
            <i className="bi bi-house-heart" />
          </div>

          <div>
            <strong>
              My Farm
            </strong>

            <span>
              Manage crop and farm settings
            </span>
          </div>

          <i className="bi bi-arrow-right" />
        </Link>

        <Link
          to="/automation"
          className="dashboard-quick-card"
        >
          <div className="dashboard-quick-icon">
            <i className="bi bi-cpu" />
          </div>

          <div>
            <strong>
              Automation
            </strong>

            <span>
              Manage automatic actions
            </span>
          </div>

          <i className="bi bi-arrow-right" />
        </Link>

        <Link
          to="/alerts"
          className="dashboard-quick-card"
        >
          <div className="dashboard-quick-icon">
            <i className="bi bi-bell" />
          </div>

          <div>
            <strong>
              Alerts
            </strong>

            <span>
              Review crop notifications
            </span>
          </div>

          <i className="bi bi-arrow-right" />
        </Link>
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <div className="dashboard-page-footer">

        <div>
          <i className="bi bi-clock-history" />

          <span>
            Last sensor update:{" "}
            <strong>
              {lastUpdated
                ? new Date(
                    lastUpdated
                  ).toLocaleTimeString()
                : "Waiting for data"}
            </strong>
          </span>
        </div>

        <span className="dashboard-device-id">
          Active Device:{" "}
          {deviceId}
        </span>
      </div>
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================

function parseGrowthValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const match =
    String(value).match(/\d+/);

  return match
    ? Number(match[0])
    : 0;
}

function parseGrowthCycle(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const numbers =
    String(value)
      .match(/\d+/g)
      ?.map(Number) || [];

  if (!numbers.length) {
    return 0;
  }

  return Math.max(...numbers);
}

export default Dashboard;