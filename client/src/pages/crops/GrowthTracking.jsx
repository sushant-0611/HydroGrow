import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCropById } from "../../data/cropData";
import useSensor from "../../hooks/useSensor";

import {
  checkCropRequirements,
  getOverallCropStatus,
  getStatusClass,
  getStatusIcon,
} from "../../utils/cropRequirementChecker";

import "../../assets/styles/growth-tracking.css";


// =====================================================
// STORAGE KEY
// =====================================================

const STORAGE_KEY = "hydrogrow_crop_tracking";


// =====================================================
// RANGE PARSER
// =====================================================

function parseDayRange(value) {
  if (!value) {
    return null;
  }

  const cleaned = String(value)
    .replace(/[–—]/g, "-")
    .replace(/\+/g, "")
    .replace(/[^\d.-]/g, "");

  const numbers = cleaned
    .split("-")
    .map(Number)
    .filter((number) => Number.isFinite(number));

  if (numbers.length === 1) {
    return {
      min: numbers[0],
      max: numbers[0],
    };
  }

  if (numbers.length >= 2) {
    return {
      min: numbers[0],
      max: numbers[1],
    };
  }

  return null;
}


// =====================================================
// DATE HELPERS
// =====================================================

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function parseLocalDate(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}


function getDayDifference(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (!start || !end) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor(
    (end.getTime() - start.getTime()) /
      millisecondsPerDay
  );
}


// =====================================================
// LOAD TRACKING DATA
// =====================================================

function getStoredTracking() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );
  } catch {
    return {};
  }
}


// =====================================================
// COMPONENT
// =====================================================

function GrowthTracking() {
  const { cropId } = useParams();
  const navigate = useNavigate();

  const { sensorData } = useSensor();

  const crop = getCropById(cropId);

  const [trackingData, setTrackingData] = useState(() => {
    const stored = getStoredTracking();
    return stored[cropId] || null;
  });

  const [plantingDate, setPlantingDate] = useState(
    trackingData?.plantingDate || ""
  );

  const [notes, setNotes] = useState(
    trackingData?.notes || ""
  );

  const [savedMessage, setSavedMessage] =
    useState("");

  const [showResetConfirm, setShowResetConfirm] =
    useState(false);


  // =====================================================
  // CROP NOT FOUND
  // =====================================================

  if (!crop) {
    return (
      <section className="growth-tracking-page">
        <div className="container">

          <div className="growth-tracking-not-found">

            <div className="growth-tracking-not-found-icon">
              <i className="bi bi-graph-down"></i>
            </div>

            <h1>Crop Not Found</h1>

            <p>
              The selected crop could not be found in the
              HydroGrow crop dataset.
            </p>

            <button
              type="button"
              className="growth-primary-btn"
              onClick={() =>
                navigate("/crop-management")
              }
            >
              <i className="bi bi-arrow-left"></i>
              Back to Crops
            </button>

          </div>

        </div>
      </section>
    );
  }


  // =====================================================
  // CROP REQUIREMENTS
  // =====================================================

  const requirementResults = useMemo(
    () =>
      checkCropRequirements(
        crop,
        sensorData
      ),
    [crop, sensorData]
  );


  const overallStatus = useMemo(
    () =>
      getOverallCropStatus(
        requirementResults
      ),
    [requirementResults]
  );


  // =====================================================
  // DAY RANGES
  // =====================================================

  const growthRange = useMemo(
    () => parseDayRange(crop.growthCycle),
    [crop.growthCycle]
  );

  const harvestRange = useMemo(
    () => parseDayRange(crop.harvestStart),
    [crop.harvestStart]
  );


  // =====================================================
  // CURRENT GROWTH DAY
  // =====================================================

  const currentDay = useMemo(() => {
    if (!plantingDate) {
      return null;
    }

    const difference = getDayDifference(
      plantingDate,
      getTodayString()
    );

    if (difference === null) {
      return null;
    }

    return Math.max(1, difference + 1);
  }, [plantingDate]);


  // =====================================================
  // STATUS
  // =====================================================

  const growthStatus = useMemo(() => {
    if (
      currentDay === null ||
      !growthRange ||
      !harvestRange
    ) {
      return {
        key: "not-started",
        label: "Tracking Not Started",
        description:
          "Enter the planting date to start tracking this crop.",
      };
    }

    if (currentDay < harvestRange.min) {
      return {
        key: "growing",
        label: "Growing",
        description:
          "The crop is currently in the growth period. The harvest window has not started yet.",
      };
    }

    if (
      currentDay >= harvestRange.min &&
      currentDay <= harvestRange.max
    ) {
      return {
        key: "harvest",
        label: "Harvest Window Active",
        description:
          "The crop is within the approximate harvest-start window.",
      };
    }

    if (
      currentDay > harvestRange.max &&
      currentDay <= growthRange.max
    ) {
      return {
        key: "extended",
        label: "Extended Growth",
        description:
          "The crop has passed the listed harvest-start window but remains within the overall growth cycle.",
      };
    }

    if (currentDay > growthRange.max) {
      return {
        key: "exceeded",
        label: "Cycle Exceeded",
        description:
          "The crop has passed the maximum listed growth-cycle duration. Review the crop condition and harvest status.",
      };
    }

    return {
      key: "growing",
      label: "Growing",
      description:
        "The crop is currently being tracked.",
    };
  }, [
    currentDay,
    growthRange,
    harvestRange,
  ]);


  // =====================================================
  // PROGRESS
  // =====================================================

  const growthProgress = useMemo(() => {
    if (
      currentDay === null ||
      !growthRange ||
      growthRange.max <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (currentDay / growthRange.max) * 100
      )
    );
  }, [currentDay, growthRange]);


  const harvestProgress = useMemo(() => {
    if (
      currentDay === null ||
      !harvestRange ||
      harvestRange.max <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (currentDay / harvestRange.max) * 100
      )
    );
  }, [currentDay, harvestRange]);


  // =====================================================
  // DAYS REMAINING
  // =====================================================

  const daysUntilHarvest = useMemo(() => {
    if (
      currentDay === null ||
      !harvestRange
    ) {
      return null;
    }

    return Math.max(
      0,
      harvestRange.min - currentDay
    );
  }, [currentDay, harvestRange]);


  const daysUntilCycleEnd = useMemo(() => {
    if (
      currentDay === null ||
      !growthRange
    ) {
      return null;
    }

    return Math.max(
      0,
      growthRange.max - currentDay
    );
  }, [currentDay, growthRange]);


  // =====================================================
  // SAVE TRACKING
  // =====================================================

  const handleSaveTracking = () => {
    if (!plantingDate) {
      setSavedMessage(
        "Please select the planting date."
      );
      return;
    }

    const selectedDate =
      parseLocalDate(plantingDate);

    const today =
      parseLocalDate(getTodayString());

    if (
      !selectedDate ||
      !today
    ) {
      setSavedMessage(
        "Please enter a valid planting date."
      );
      return;
    }

    if (selectedDate > today) {
      setSavedMessage(
        "Planting date cannot be in the future."
      );
      return;
    }

    const stored = getStoredTracking();

    const newTrackingData = {
      cropId: crop.id,
      cropName: crop.name,
      plantingDate,
      notes,
      updatedAt: new Date().toISOString(),
    };

    stored[cropId] = newTrackingData;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(stored)
    );

    setTrackingData(newTrackingData);

    setSavedMessage(
      "Growth tracking information saved successfully."
    );

    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };


  // =====================================================
  // RESET TRACKING
  // =====================================================

  const handleResetTracking = () => {
    const stored = getStoredTracking();

    delete stored[cropId];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(stored)
    );

    setTrackingData(null);
    setPlantingDate("");
    setNotes("");
    setSavedMessage("");

    setShowResetConfirm(false);
  };


  // =====================================================
  // PARAMETER RESULT
  // =====================================================

  const getRequirementResult = (key) => {
    return requirementResults.find(
      (item) => item.key === key
    );
  };


  // =====================================================
  // PARAMETER ICON
  // =====================================================

  const getParameterIcon = (key) => {
    const icons = {
      ph: "bi-droplet-half",
      ec: "bi-beaker",
      temperature: "bi-thermometer-half",
      humidity: "bi-cloud-haze2",
      ppfd: "bi-brightness-high",
    };

    return (
      icons[key] ||
      "bi-circle"
    );
  };


  // =====================================================
  // CURRENT VALUE
  // =====================================================

  const getCurrentValue = (result) => {
    if (
      !result ||
      result.currentValue === null ||
      result.currentValue === undefined
    ) {
      return "No Data";
    }

    return `${result.currentValue}${
      result.unit
        ? ` ${result.unit}`
        : ""
    }`;
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="growth-tracking-page">

      <div className="container">

        {/* =================================================
            BREADCRUMB
            ================================================= */}

        <div className="growth-tracking-breadcrumb">

          <Link to="/dashboard">
            Dashboard
          </Link>

          <i className="bi bi-chevron-right"></i>

          <Link to="/crop-management">
            Crops
          </Link>

          <i className="bi bi-chevron-right"></i>

          <Link to={`/crops/${crop.id}`}>
            {crop.name}
          </Link>

          <i className="bi bi-chevron-right"></i>

          <span>
            Growth Tracking
          </span>

        </div>


        {/* =================================================
            HEADER
            ================================================= */}

        <div className="growth-tracking-header">

          <div>

            <span className="growth-section-label">
              CROP GROWTH TRACKING
            </span>

            <h1>
              {crop.name}
              <span> Growth Tracking</span>
            </h1>

            <p>
              Track the crop from its planting date through
              the expected growth cycle and harvest-start
              window.
            </p>

          </div>

          <div className="growth-header-actions">

            <button
              type="button"
              className="growth-secondary-btn"
              onClick={() =>
                navigate(
                  `/crops/${crop.id}/schedule`
                )
              }
            >
              <i className="bi bi-calendar3"></i>
              Growth Schedule
            </button>

            <button
              type="button"
              className="growth-secondary-btn"
              onClick={() =>
                navigate(
                  `/crops/${crop.id}`
                )
              }
            >
              <i className="bi bi-arrow-left"></i>
              Crop Details
            </button>

          </div>

        </div>


        {/* =================================================
            CROP IDENTITY
            ================================================= */}

        <div className="growth-crop-card">

          <div className="growth-crop-image">

            <img
              src={crop.images[0]}
              alt={`${crop.name} hydroponic crop`}
            />

          </div>

          <div className="growth-crop-info">

            <div className="growth-crop-title-row">

              <div>

                <span className="growth-crop-category">
                  {crop.category}
                </span>

                <h2>{crop.name}</h2>

                <p>
                  <i className="bi bi-flower2"></i>
                  {crop.scientificName}
                </p>

              </div>

              <div
                className={`growth-live-status ${getStatusClass(
                  overallStatus.status
                )}`}
              >
                <i
                  className={`bi ${getStatusIcon(
                    overallStatus.status
                  )}`}
                ></i>

                Sensor: {overallStatus.label}
              </div>

            </div>

            <div className="growth-crop-meta">

              <div>
                <span>Growth Cycle</span>
                <strong>
                  {crop.growthCycle} days
                </strong>
              </div>

              <div>
                <span>Harvest Start</span>
                <strong>
                  Day {crop.harvestStart}
                </strong>
              </div>

              <div>
                <span>System</span>
                <strong>
                  {crop.hydroponicSystem}
                </strong>
              </div>

              <div>
                <span>Difficulty</span>
                <strong>
                  {crop.difficulty}
                </strong>
              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            TRACKING SETUP
            ================================================= */}

        <section className="growth-section">

          <div className="growth-section-heading">

            <div>

              <span className="growth-section-label">
                TRACKING SETUP
              </span>

              <h2>
                Planting Information
              </h2>

              <p>
                Enter the planting date to calculate the
                current growth day automatically.
              </p>

            </div>

            {trackingData && (
              <div className="growth-saved-indicator">
                <i className="bi bi-check-circle-fill"></i>
                Tracking Saved
              </div>
            )}

          </div>


          <div className="growth-setup-grid">

            <div className="growth-form-group">

              <label htmlFor="plantingDate">
                <i className="bi bi-calendar-event"></i>
                Planting Date
              </label>

              <input
                id="plantingDate"
                type="date"
                value={plantingDate}
                max={getTodayString()}
                onChange={(event) =>
                  setPlantingDate(
                    event.target.value
                  )
                }
              />

              <small>
                Select the date when this crop was planted.
              </small>

            </div>


            <div className="growth-form-group">

              <label htmlFor="growthNotes">
                <i className="bi bi-journal-text"></i>
                Notes
              </label>

              <textarea
                id="growthNotes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Add optional crop tracking notes..."
                rows="3"
              />

              <small>
                Notes are stored locally in this software-only
                version.
              </small>

            </div>

          </div>


          <div className="growth-setup-actions">

            <button
              type="button"
              className="growth-primary-btn"
              onClick={handleSaveTracking}
            >
              <i className="bi bi-save"></i>
              Save Tracking
            </button>

            {trackingData && (
              <button
                type="button"
                className="growth-danger-outline-btn"
                onClick={() =>
                  setShowResetConfirm(true)
                }
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                Reset Tracking
              </button>
            )}

          </div>


          {savedMessage && (
            <div className="growth-save-message">

              <i className="bi bi-info-circle"></i>

              <span>{savedMessage}</span>

            </div>
          )}

        </section>


        {/* =================================================
            CURRENT STATUS
            ================================================= */}

        <section className="growth-status-section">

          <div className="growth-status-main">

            <div className="growth-status-icon">
              <i className="bi bi-calendar2-week"></i>
            </div>

            <div>

              <span className="growth-section-label">
                CURRENT GROWTH STATUS
              </span>

              <h2>
                {growthStatus.label}
              </h2>

              <p>
                {growthStatus.description}
              </p>

            </div>

          </div>

          {currentDay !== null && (
            <div className="growth-day-display">

              <span>Current Day</span>

              <strong>
                Day {currentDay}
              </strong>

            </div>
          )}

        </section>


        {/* =================================================
            KEY METRICS
            ================================================= */}

        <div className="growth-metrics-grid">

          <MetricCard
            icon="bi-calendar-day"
            label="Current Day"
            value={
              currentDay !== null
                ? `Day ${currentDay}`
                : "--"
            }
            description={
              currentDay !== null
                ? "Days since planting"
                : "Set planting date"
            }
          />

          <MetricCard
            icon="bi-hourglass-split"
            label="Growth Cycle"
            value={
              growthRange
                ? `${growthRange.min}-${growthRange.max} days`
                : crop.growthCycle
            }
            description="Expected crop cycle"
          />

          <MetricCard
            icon="bi-basket3"
            label="Harvest Start"
            value={
              harvestRange
                ? `Day ${harvestRange.min}-${harvestRange.max}`
                : crop.harvestStart
            }
            description={
              daysUntilHarvest !== null
                ? daysUntilHarvest > 0
                  ? `${daysUntilHarvest} day(s) until start`
                  : "Harvest window started"
                : "Set planting date"
            }
          />

          <MetricCard
            icon="bi-clock-history"
            label="Cycle Remaining"
            value={
              daysUntilCycleEnd !== null
                ? `${daysUntilCycleEnd} days`
                : "--"
            }
            description="Until maximum cycle"
          />

        </div>


        {/* =================================================
            GROWTH PROGRESS
            ================================================= */}

        <section className="growth-section">

          <div className="growth-section-heading">

            <div>

              <span className="growth-section-label">
                PROGRESS
              </span>

              <h2>
                Growth Cycle Progress
              </h2>

              <p>
                Progress is calculated against the maximum
                growth-cycle duration in the crop dataset.
              </p>

            </div>

            <strong className="growth-progress-number">
              {Math.round(growthProgress)}%
            </strong>

          </div>


          <div className="growth-progress-wrapper">

            <div className="growth-progress-track">

              <div
                className="growth-progress-fill"
                style={{
                  width: `${growthProgress}%`,
                }}
              ></div>

            </div>

            <div className="growth-progress-labels">

              <span>
                Planting
              </span>

              <span>
                Maximum Cycle
                {growthRange
                  ? ` · Day ${growthRange.max}`
                  : ""}
              </span>

            </div>

          </div>


          {/* HARVEST MARKER */}

          {growthRange &&
            harvestRange && (
              <div className="growth-cycle-visual">

                <div className="growth-cycle-point">

                  <span className="growth-cycle-dot planting"></span>

                  <div>
                    <strong>
                      Planting
                    </strong>

                    <small>
                      Day 1
                    </small>
                  </div>

                </div>


                <div className="growth-cycle-line"></div>


                <div className="growth-cycle-point">

                  <span className="growth-cycle-dot harvest"></span>

                  <div>
                    <strong>
                      Harvest Start
                    </strong>

                    <small>
                      Day {harvestRange.min}
                    </small>
                  </div>

                </div>


                <div className="growth-cycle-line"></div>


                <div className="growth-cycle-point">

                  <span className="growth-cycle-dot end"></span>

                  <div>
                    <strong>
                      Maximum Cycle
                    </strong>

                    <small>
                      Day {growthRange.max}
                    </small>
                  </div>

                </div>

              </div>
            )}

        </section>


        {/* =================================================
            HARVEST WINDOW
            ================================================= */}

        <section className="growth-harvest-section">

          <div className="growth-harvest-icon">
            <i className="bi bi-basket3"></i>
          </div>

          <div className="growth-harvest-content">

            <span className="growth-section-label">
              HARVEST WINDOW
            </span>

            <h2>
              Harvest Planning
            </h2>

            <p>
              {crop.harvestGuidance}
            </p>

            <div className="growth-harvest-stats">

              <div>
                <span>Harvest Start</span>
                <strong>
                  Day{" "}
                  {harvestRange
                    ? harvestRange.min
                    : crop.harvestStart}
                </strong>
              </div>

              <div>
                <span>Harvest Window</span>
                <strong>
                  {harvestRange
                    ? `Day ${harvestRange.min}-${harvestRange.max}`
                    : crop.harvestStart}
                </strong>
              </div>

              <div>
                <span>Growth Cycle</span>
                <strong>
                  {crop.growthCycle} days
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            LIVE SENSOR CHECK
            ================================================= */}

        <section className="growth-section">

          <div className="growth-section-heading">

            <div>

              <span className="growth-section-label">
                LIVE CONDITIONS
              </span>

              <h2>
                Current Crop Environment
              </h2>

              <p>
                Current simulator values are compared with
                the selected crop requirements.
              </p>

            </div>

            <div
              className={`growth-overall-status ${getStatusClass(
                overallStatus.status
              )}`}
            >

              <i
                className={`bi ${getStatusIcon(
                  overallStatus.status
                )}`}
              ></i>

              {overallStatus.label}

            </div>

          </div>


          <div className="growth-sensor-grid">

            {requirementResults.map(
              (result) => (
                <div
                  className={`growth-sensor-card ${getStatusClass(
                    result.status
                  )}`}
                  key={result.key}
                >

                  <div className="growth-sensor-top">

                    <div className="growth-sensor-icon">

                      <i
                        className={`bi ${getParameterIcon(
                          result.key
                        )}`}
                      ></i>

                    </div>

                    <span>
                      {result.label}
                    </span>

                    <i
                      className={`bi ${getStatusIcon(
                        result.status
                      )} growth-sensor-status-icon`}
                    ></i>

                  </div>


                  <div className="growth-sensor-values">

                    <div>
                      <small>Current</small>

                      <strong>
                        {getCurrentValue(result)}
                      </strong>
                    </div>

                    <div>
                      <small>Required</small>

                      <strong>
                        {result.requiredRange || "N/A"}
                        {result.unit
                          ? ` ${result.unit}`
                          : ""}
                      </strong>
                    </div>

                  </div>

                  <p>
                    {result.message}
                  </p>

                </div>
              )
            )}

          </div>


          <div className="growth-sensor-note">

            <i className="bi bi-info-circle"></i>

            <p>
              The current growth tracker monitors pH, EC,
              temperature, humidity and PPFD. Other available
              sensor parameters can be viewed from the main
              Monitoring page.
            </p>

          </div>

        </section>


        {/* =================================================
            CROP INFORMATION
            ================================================= */}

        <section className="growth-section">

          <div className="growth-section-heading">

            <div>

              <span className="growth-section-label">
                CROP PROFILE
              </span>

              <h2>
                Crop Information
              </h2>

            </div>

          </div>


          <div className="growth-profile-grid">

            <ProfileItem
              icon="bi-flower1"
              label="Crop Type"
              value={crop.cropType}
            />

            <ProfileItem
              icon="bi-diagram-3"
              label="Hydroponic System"
              value={crop.hydroponicSystem}
            />

            <ProfileItem
              icon="bi-bar-chart"
              label="Difficulty"
              value={crop.difficulty}
            />

            <ProfileItem
              icon="bi-graph-up-arrow"
              label="Market Demand"
              value={crop.demand}
            />

            <ProfileItem
              icon="bi-brightness-high"
              label="Photoperiod"
              value={crop.photoperiod}
            />

            <ProfileItem
              icon="bi-lightbulb"
              label="PPFD"
              value={crop.ppfd}
            />

          </div>

        </section>


        {/* =================================================
            NOTES
            ================================================= */}

        {notes && (
          <section className="growth-notes-section">

            <div className="growth-notes-icon">
              <i className="bi bi-journal-text"></i>
            </div>

            <div>

              <span className="growth-section-label">
                TRACKING NOTES
              </span>

              <h2>
                Your Notes
              </h2>

              <p>
                {notes}
              </p>

            </div>

          </section>
        )}


        {/* =================================================
            SOFTWARE NOTE
            ================================================= */}

        <div className="growth-data-note">

          <div className="growth-data-note-icon">
            <i className="bi bi-database"></i>
          </div>

          <div>

            <strong>
              Growth tracking storage
            </strong>

            <p>
              This software-only version stores the planting
              date and notes in browser local storage. In the
              complete HydroGrow backend, this information can
              be persisted in MongoDB against the authenticated
              user's crop record.
            </p>

          </div>

        </div>


        {/* =================================================
            BOTTOM ACTIONS
            ================================================= */}

        <div className="growth-bottom-actions">

          <button
            type="button"
            className="growth-secondary-btn"
            onClick={() =>
              navigate(
                `/crops/${crop.id}/schedule`
              )
            }
          >
            <i className="bi bi-calendar3"></i>
            Growth Schedule
          </button>

          <button
            type="button"
            className="growth-primary-btn"
            onClick={() =>
              navigate(
                `/crops/${crop.id}`
              )
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back to Crop Details
          </button>

        </div>


        {/* =================================================
            RESET CONFIRMATION
            ================================================= */}

        {showResetConfirm && (
          <div className="growth-modal-overlay">

            <div className="growth-confirm-modal">

              <div className="growth-confirm-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>

              <h3>
                Reset Growth Tracking?
              </h3>

              <p>
                This will remove the saved planting date and
                notes for {crop.name} from this browser.
              </p>

              <div className="growth-confirm-actions">

                <button
                  type="button"
                  className="growth-secondary-btn"
                  onClick={() =>
                    setShowResetConfirm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="growth-danger-btn"
                  onClick={handleResetTracking}
                >
                  Reset Tracking
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </section>
  );
}


// =====================================================
// METRIC CARD
// =====================================================

function MetricCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="growth-metric-card">

      <div className="growth-metric-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}


// =====================================================
// PROFILE ITEM
// =====================================================

function ProfileItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="growth-profile-item">

      <div className="growth-profile-icon">
        <i className={`bi ${icon}`}></i>
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


export default GrowthTracking;