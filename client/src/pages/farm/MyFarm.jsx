import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useCrop } from "../../context/CropContext";
import { useSensor } from "../../context/SensorContext";
import { getCropById } from "../../data/cropData";
import CropGrowthAnimation from "../../components/CropGrowthAnimation";
import GrowthAnimation from "../../components/GrowthAnimation";

import "../../assets/styles/my-farm.css";

function getDaysSince(date) {
  if (!date) return 0;

  const start = new Date(date);
  const today = new Date();

  if (Number.isNaN(start.getTime())) return 0;

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today - start) / (1000 * 60 * 60 * 24))
  );
}

function parseMaxGrowth(value) {
  if (!value) return 0;

  const match = String(value).match(/\d+/g);

  if (!match || match.length === 0) {
    return 0;
  }

  return Number(match[match.length - 1]);
}

function parseHarvestStart(value) {
  if (!value) return 0;

  const match = String(value).match(/\d+/g);

  if (!match || match.length === 0) {
    return 0;
  }

  return Number(match[0]);
}

function formatDate(date) {
  if (!date) return "Not set";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateExpectedHarvest(plantingDate, harvestStart) {
  if (!plantingDate || !harvestStart) {
    return null;
  }

  const date = new Date(plantingDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + harvestStart);

  return date;
}

function getGrowthStage(growthDay, cropData) {
  const growthCycle = parseMaxGrowth(cropData?.growthCycle);
  const harvestStart = parseHarvestStart(cropData?.harvestStart);

  if (growthDay <= 0) {
    return "Germination";
  }

  if (growthDay <= Math.max(3, Math.round(growthCycle * 0.12))) {
    return "Seedling";
  }

  if (growthDay <= Math.max(7, Math.round(growthCycle * 0.42))) {
    return "Vegetative";
  }

  if (growthDay <= Math.max(10, harvestStart * 0.72)) {
    return "Flowering";
  }

  if (growthDay < harvestStart) {
    return "Fruit Development";
  }

  return "Harvest Ready";
}

// Photo verification stages (device schedule 1-5)

const GROWTH_STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

// Fruiting crops supported by the photo classifier

const FRUIT_COLORS = {
  HG012: "#e03e2f",
  HG014: "#d94f30",
};

function getExpectedStage(progressPercent) {
  if (progressPercent < 12) return 1;
  if (progressPercent < 40) return 2;
  if (progressPercent < 65) return 3;
  if (progressPercent < 85) return 4;

  return 5;
}

function getGrowthStatus(verifiedStage, expectedStage) {
  if (verifiedStage > expectedStage) return "AHEAD";
  if (verifiedStage < expectedStage) return "BEHIND";

  return "ON_TRACK";
}

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "critical") return "Critical";
  if (normalized === "warning") return "Warning";
  if (normalized === "offline") return "Offline";
  if (normalized === "healthy") return "Healthy";
  if (normalized === "connected") return "Connected";

  return "No Data";
}

function getStatusIcon(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "critical") {
    return "bi-exclamation-octagon-fill";
  }

  if (normalized === "warning") {
    return "bi-exclamation-triangle-fill";
  }

  if (normalized === "offline") {
    return "bi-wifi-off";
  }

  if (normalized === "healthy") {
    return "bi-check-circle-fill";
  }

  return "bi-dash-circle";
}

function MyFarm() {
  const {
    selectedCrops,
    activeCrop,
    selectActiveCrop,
    updateFarmCrop,
    updateAutomation,
  } = useCrop();

  const { growthData } = useSensor();

  const activeCropData = useMemo(() => {
    if (!activeCrop) return null;

    return (
      getCropById(activeCrop.cropId) ||
      getCropById(activeCrop.id) ||
      null
    );
  }, [activeCrop]);

  const growthDay = activeCrop
    ? getDaysSince(activeCrop.plantingDate)
    : 0;

  const growthStage = activeCropData
    ? getGrowthStage(growthDay, activeCropData)
    : "Germination";

  const harvestStart = activeCropData
    ? parseHarvestStart(activeCropData.harvestStart)
    : 0;

  const expectedHarvestDate = activeCrop
    ? calculateExpectedHarvest(
        activeCrop.plantingDate,
        harvestStart
      )
    : null;

  const deviceConnected = Boolean(
    activeCrop?.device?.connected ||
      activeCrop?.device?.status === "connected" ||
      activeCrop?.device?.status === "Connected"
  );

  const deviceStatus = activeCrop?.device
    ? deviceConnected
      ? "Connected"
      : "Disconnected"
    : "Not Configured";

  const automationMode =
    activeCrop?.automation?.mode === "manual"
      ? "Manual"
      : "Automatic";

  const cropStatus = getStatusLabel(activeCrop?.status);

  // -----------------------------------------------------------
  // GROWTH VISUALIZATION (schedule estimate + photo verification)
  // -----------------------------------------------------------

  const farmGrowth = activeCrop?.growth || null;

  const cycleDays = activeCropData
    ? parseMaxGrowth(activeCropData.growthCycle)
    : 0;

  const scheduleDay = growthDay || farmGrowth?.currentDay || 1;

  const progressPercent =
    typeof farmGrowth?.progressPercent === "number"
      ? farmGrowth.progressPercent
      : cycleDays > 0
        ? Math.min(100, (scheduleDay / cycleDays) * 100)
        : 0;

  const expectedStage = getExpectedStage(progressPercent);

  // Live device verification wins; falls back to the server
  // payload (crop.growth.verification) when present.

  const deviceVerification =
    growthData &&
    growthData.stage &&
    (growthData.cropId === activeCrop?.id ||
      growthData.cropId === activeCrop?.cropId)
      ? growthData
      : null;

  const verification = deviceVerification
    ? {
        stage: deviceVerification.stage,
        stageName: deviceVerification.stageName,
        confidence: deviceVerification.confidence,
        status: getGrowthStatus(
          deviceVerification.stage,
          expectedStage
        ),
        verifiedAt: deviceVerification.analyzedAt,
      }
    : farmGrowth?.verification || null;

  const fruitColor = activeCrop
    ? FRUIT_COLORS[activeCrop.cropId] || null
    : null;

  if (!selectedCrops.length) {
    return (
      <section className="my-farm-page">
        <div className="container">
          <div className="my-farm-empty">
            <div className="my-farm-empty-icon">
              <i className="bi bi-flower1"></i>
            </div>

            <span className="my-farm-empty-label">
              MY FARM
            </span>

            <h1>No Crop Selected Yet</h1>

            <p>
              Start managing your hydroponic farm by
              selecting your first crop.
            </p>

            <Link
              to="/crop-management"
              className="btn btn-success px-4 py-2"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Select Your Crop
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-farm-page">
      <div className="container-fluid px-0">
        {/* PAGE HEADER */}
        <div className="my-farm-header">
          <div>
            <span className="my-farm-eyebrow">
              FARM MANAGEMENT
            </span>

            <h1>My Farm</h1>

            <p>
              Manage your crops, farm setup, growth,
              devices, automation and cultivation
              settings.
            </p>
          </div>

          <Link
            to="/crop-management"
            className="my-farm-add-button"
          >
            <i className="bi bi-plus-lg"></i>
            Add Crop
          </Link>
        </div>

        {/* SELECTED CROPS */}
        <section className="my-farm-crop-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                ACTIVE CROP SELECTION
              </span>

              <h2>My Crops</h2>

              <p>
                Select a crop to manage its farm data.
              </p>
            </div>

            <span className="crop-count-badge">
              {selectedCrops.length}{" "}
              {selectedCrops.length === 1
                ? "Crop"
                : "Crops"}
            </span>
          </div>

          <div className="my-farm-crop-row">
            {selectedCrops.map((farmCrop) => {
              const crop = getCropById(farmCrop.cropId);

              const isActive =
                farmCrop.id === activeCrop?.id;

              const cropImage =
                crop?.images?.[0] ||
                crop?.image ||
                null;

              return (
                <button
                  type="button"
                  key={farmCrop.id}
                  className={`my-farm-crop-card ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    selectActiveCrop(farmCrop.id)
                  }
                >
                  <div className="my-farm-crop-image">
                    {cropImage ? (
                      <img
                        src={cropImage}
                        alt={farmCrop.name}
                      />
                    ) : (
                      <i className="bi bi-flower1"></i>
                    )}
                  </div>

                  <div className="my-farm-crop-info">
                    <strong>
                      {farmCrop.name}
                    </strong>

                    <span>
                      {farmCrop.farmUnit ||
                        "Farm Unit"}
                    </span>

                    <small>
                      {farmCrop.plantCount || 0} plants
                    </small>
                  </div>

                  <span
                    className={`farm-status-dot ${
                      farmCrop.status || "no-data"
                    }`}
                    title={getStatusLabel(
                      farmCrop.status
                    )}
                  ></span>
                </button>
              );
            })}
          </div>
        </section>

        {activeCrop && activeCropData && (
          <>
            {/* ACTIVE CROP */}
            <section className="active-farm-crop">
              <div className="active-farm-crop-image">
                <img
                  src={
                    activeCropData.images?.[0] ||
                    activeCropData.image
                  }
                  alt={activeCrop.name}
                />
              </div>

              <div className="active-farm-crop-info">
                <span className="active-label">
                  ACTIVE CROP
                </span>

                <h2>{activeCrop.name}</h2>

                <p>
                  {activeCropData.scientificName}
                </p>

                <div className="active-crop-meta">
                  <span>
                    <i className="bi bi-building"></i>
                    {activeCrop.farmUnit ||
                      "Farm Unit Not Set"}
                  </span>

                  <span>
                    <i className="bi bi-flower1"></i>
                    {activeCrop.plantCount || 0} plants
                  </span>

                  <span>
                    <i className="bi bi-calendar3"></i>
                    Day {growthDay}
                  </span>
                </div>
              </div>

              <div
                className={`active-crop-status ${String(
                  activeCrop?.status || "no-data"
                ).toLowerCase()}`}
              >
                <span>Farm Status</span>

                <strong>
                  <i
                    className={`bi ${getStatusIcon(
                      activeCrop?.status
                    )}`}
                  ></i>

                  {cropStatus}
                </strong>
              </div>
            </section>

            {/* FARM OVERVIEW */}
            <div className="my-farm-grid">
              {/* GROWTH */}
              <section className="farm-panel growth-panel">
                <div className="panel-heading">
                  <div>
                    <span>CROP GROWTH</span>
                    <h3>{activeCrop.name}</h3>
                  </div>

                  <i className="bi bi-flower1"></i>
                </div>

                <div className="growth-animation-wrapper">
                  <CropGrowthAnimation
                    crop={activeCropData}
                    growthDay={growthDay}
                    growthStage={growthStage}
                    growthCycle={parseMaxGrowth(
                      activeCropData.growthCycle
                    )}
                    harvestStart={harvestStart}
                  />
                </div>

                <div className="growth-summary">
                  <div>
                    <span>Current Stage</span>
                    <strong>{growthStage}</strong>
                  </div>

                  <div>
                    <span>Crop Day</span>
                    <strong>Day {growthDay}</strong>
                  </div>

                  <div>
                    <span>Harvest Start</span>
                    <strong>
                      {activeCropData.harvestStart ||
                        "Not available"}
                    </strong>
                  </div>
                </div>
              </section>

              {/* FARM CONDITION */}
              <section className="farm-panel">
                <div className="panel-heading">
                  <div>
                    <span>CURRENT CONDITION</span>
                    <h3>Farm Overview</h3>
                  </div>

                  <i className="bi bi-heart-pulse"></i>
                </div>

                <div className="condition-grid">
                  <div className="condition-item">
                    <span>
                      <i className="bi bi-cloud-sun"></i>
                      Environment
                    </span>

                    <strong className="no-data-text">
                      No Data
                    </strong>
                  </div>

                  <div className="condition-item">
                    <span>
                      <i className="bi bi-droplet-half"></i>
                      Nutrients
                    </span>

                    <strong className="no-data-text">
                      No Data
                    </strong>
                  </div>

                  <div className="condition-item">
                    <span>
                      <i className="bi bi-water"></i>
                      Water
                    </span>

                    <strong className="no-data-text">
                      No Data
                    </strong>
                  </div>

                  <div className="condition-item">
                    <span>
                      <i className="bi bi-bell"></i>
                      Alerts
                    </span>

                    <strong className="no-data-text">
                      No Data
                    </strong>
                  </div>
                </div>

                <div className="condition-note">
                  <i className="bi bi-info-circle"></i>

                  <span>
                    Detailed live conditions are available
                    in Monitoring when sensor readings are
                    received for this crop.
                  </span>
                </div>
              </section>

              {/* DEVICE */}
              <section className="farm-panel">
                <div className="panel-heading">
                  <div>
                    <span>DEVICE</span>
                    <h3>Sensor Connection</h3>
                  </div>

                  <i className="bi bi-cpu"></i>
                </div>

                <div className="device-card">
                  <div className="device-icon">
                    <i className="bi bi-broadcast-pin"></i>
                  </div>

                  <div className="device-main">
                    <strong>
                      {activeCrop.device?.deviceId ||
                        activeCrop.device?.id ||
                        "HYDROGROW-SIM-001"}
                    </strong>

                    <span>
                      {activeCrop.device?.source ||
                        "INPUT_SIMULATOR"}
                    </span>
                  </div>

                  <span
                    className={`device-connection ${
                      deviceConnected
                        ? "connected"
                        : "disconnected"
                    }`}
                  >
                    <i
                      className={`bi ${
                        deviceConnected
                          ? "bi-check-circle-fill"
                          : "bi-dash-circle"
                      }`}
                    ></i>

                    {deviceStatus}
                  </span>
                </div>

                <div className="device-note">
                  <i className="bi bi-shield-check"></i>

                  <span>
                    Device readings are associated with the
                    active crop.
                  </span>
                </div>
              </section>

              {/* AUTOMATION */}
              <section className="farm-panel">
                <div className="panel-heading">
                  <div>
                    <span>AUTOMATION</span>
                    <h3>Farm Control</h3>
                  </div>

                  <i className="bi bi-robot"></i>
                </div>

                <div className="automation-mode-card">
                  <div className="automation-mode-icon">
                    <i
                      className={`bi ${
                        automationMode === "Automatic"
                          ? "bi-cpu"
                          : "bi-hand-index"
                      }`}
                    ></i>
                  </div>

                  <div>
                    <span>Control Mode</span>

                    <strong>
                      {automationMode}
                    </strong>
                  </div>

                  <span className="automation-status">
                    <i className="bi bi-check-circle-fill"></i>
                    Configured
                  </span>
                </div>

                <div className="automation-devices">
                  <span>
                    <i className="bi bi-droplet"></i>
                    Irrigation
                  </span>

                  <span>
                    <i className="bi bi-moisture"></i>
                    Nutrients
                  </span>

                  <span>
                    <i className="bi bi-wind"></i>
                    Ventilation
                  </span>

                  <span>
                    <i className="bi bi-brightness-high"></i>
                    Grow Light
                  </span>
                </div>
              </section>
            </div>

            {/* GROWTH VISUALIZATION */}
            {fruitColor && (
              <section className="farm-panel growth-viz-panel">
                <GrowthAnimation
                  cropName={activeCrop.name}
                  fruitColor={fruitColor}
                  dayNumber={scheduleDay}
                  cycleDays={cycleDays}
                  expectedStage={expectedStage}
                  expectedStageName={
                    GROWTH_STAGE_NAMES[expectedStage - 1]
                  }
                  verifiedStage={verification?.stage || null}
                  verifiedStageName={
                    verification?.stageName || null
                  }
                  confidence={verification?.confidence ?? null}
                  verifiedAt={
                    verification?.verifiedAt ||
                    verification?.analyzedAt ||
                    null
                  }
                  status={verification?.status || null}
                />
              </section>
            )}

            {/* CROP INFORMATION */}
            <section className="farm-panel crop-information-panel">
              <div className="panel-heading">
                <div>
                  <span>CROP INFORMATION</span>

                  <h3>
                    {activeCrop.name} Requirements
                  </h3>
                </div>

                <i className="bi bi-journal-text"></i>
              </div>

              <div className="crop-info-grid">
                <div>
                  <span>Hydroponic System</span>
                  <strong>
                    {activeCropData.hydroponicSystem ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Growth Cycle</span>
                  <strong>
                    {activeCropData.growthCycle ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>pH Range</span>
                  <strong>
                    {activeCropData.ph ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>EC Range</span>
                  <strong>
                    {activeCropData.ec ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Temperature</span>
                  <strong>
                    {activeCropData.temperature ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Humidity</span>
                  <strong>
                    {activeCropData.humidity ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Photoperiod</span>
                  <strong>
                    {activeCropData.photoperiod ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>PPFD</span>
                  <strong>
                    {activeCropData.ppfd ||
                      "Not available"}
                  </strong>
                </div>
              </div>
            </section>

            {/* FARM SETTINGS */}
            <section className="farm-settings-panel">
              <div className="panel-heading">
                <div>
                  <span>FARM SETTINGS</span>

                  <h3>
                    {activeCrop.name} Configuration
                  </h3>
                </div>

                <i className="bi bi-sliders"></i>
              </div>

              <div className="farm-settings-grid">
                <label>
                  <span>Farm Unit Name</span>

                  <input
                    type="text"
                    value={activeCrop.farmUnit || ""}
                    onChange={(event) =>
                      updateFarmCrop(activeCrop.id, {
                        farmUnit:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Number of Plants</span>

                  <input
                    type="number"
                    min="1"
                    value={activeCrop.plantCount || 1}
                    onChange={(event) =>
                      updateFarmCrop(activeCrop.id, {
                        plantCount:
                          Number(
                            event.target.value
                          ) || 1,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Planting Date</span>

                  <input
                    type="date"
                    value={
                      activeCrop.plantingDate || ""
                    }
                    onChange={(event) =>
                      updateFarmCrop(activeCrop.id, {
                        plantingDate:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Automation Mode</span>

                  <select
                    value={
                      activeCrop.automation?.mode ||
                      "automatic"
                    }
                    onChange={(event) =>
                      updateAutomation(
                        activeCrop.id,
                        {
                          mode:
                            event.target.value,
                        }
                      )
                    }
                  >
                    <option value="automatic">
                      Automatic
                    </option>

                    <option value="manual">
                      Manual
                    </option>
                  </select>
                </label>

                <label className="full-width">
                  <span>Farmer Notes</span>

                  <textarea
                    rows="3"
                    value={activeCrop.notes || ""}
                    onChange={(event) =>
                      updateFarmCrop(activeCrop.id, {
                        notes:
                          event.target.value,
                      })
                    }
                    placeholder="Add notes about this crop..."
                  />
                </label>
              </div>

              <div className="farm-settings-note">
                <i className="bi bi-info-circle"></i>

                <span>
                  Farm configuration is stored for the
                  selected crop independently.
                </span>
              </div>
            </section>

            {/* IMPORTANT DATES */}
            <section className="farm-panel important-dates-panel">
              <div className="panel-heading">
                <div>
                  <span>IMPORTANT DATES</span>

                  <h3>Crop Schedule</h3>
                </div>

                <i className="bi bi-calendar-event"></i>
              </div>

              <div className="important-dates-grid">
                <div>
                  <span>
                    <i className="bi bi-calendar-check"></i>
                    Planting Date
                  </span>

                  <strong>
                    {formatDate(
                      activeCrop.plantingDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-calendar2-week"></i>
                    Expected Harvest
                  </span>

                  <strong>
                    {expectedHarvestDate
                      ? formatDate(
                          expectedHarvestDate
                        )
                      : "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-hourglass-split"></i>
                    Harvest Start
                  </span>

                  <strong>
                    {activeCropData.harvestStart ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-clock-history"></i>
                    Growth Cycle
                  </span>

                  <strong>
                    {activeCropData.growthCycle ||
                      "Not available"}
                  </strong>
                </div>
              </div>
            </section>

            {/* QUICK LINKS */}
            <section className="farm-quick-links">
              <Link to="/monitoring">
                <i className="bi bi-activity"></i>

                <div>
                  <strong>Live Monitoring</strong>

                  <span>
                    View detailed sensor conditions
                  </span>
                </div>

                <i className="bi bi-arrow-right"></i>
              </Link>

              <Link to="/automation">
                <i className="bi bi-robot"></i>

                <div>
                  <strong>Automation</strong>

                  <span>
                    Manage farm automation
                  </span>
                </div>

                <i className="bi bi-arrow-right"></i>
              </Link>

              <Link to="/alerts">
                <i className="bi bi-bell"></i>

                <div>
                  <strong>Alerts</strong>

                  <span>
                    View crop alerts
                  </span>
                </div>

                <i className="bi bi-arrow-right"></i>
              </Link>

              <Link to="/sensor-history">
                <i className="bi bi-clock-history"></i>

                <div>
                  <strong>Sensor History</strong>

                  <span>
                    View historical data
                  </span>
                </div>

                <i className="bi bi-arrow-right"></i>
              </Link>
            </section>
          </>
        )}
      </div>
    </section>
  );
}

export default MyFarm;