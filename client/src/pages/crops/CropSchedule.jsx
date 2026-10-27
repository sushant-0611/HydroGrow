import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCropById } from "../../data/cropData";
import useSensor from "../../hooks/useSensor";

import {
  checkCropRequirements,
  getOverallCropStatus,
  getStatusClass,
  getStatusIcon,
} from "../../utils/cropRequirementChecker";

import "../../assets/styles/crop-schedule.css";


function CropSchedule() {
  const { cropId } = useParams();
  const navigate = useNavigate();

  const { sensorData } = useSensor();

  const crop = getCropById(cropId);

  // =====================================================
  // CROP NOT FOUND
  // =====================================================

  if (!crop) {
    return (
      <section className="crop-schedule-page">
        <div className="container">
          <div className="crop-schedule-not-found">

            <div className="crop-schedule-not-found-icon">
              <i className="bi bi-calendar-x"></i>
            </div>

            <h1>Crop Not Found</h1>

            <p>
              The selected crop could not be found in the
              HydroGrow crop dataset.
            </p>

            <button
              type="button"
              className="crop-schedule-primary-btn"
              onClick={() => navigate("/crop-management")}
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
  // LIVE REQUIREMENT ANALYSIS
  // =====================================================

  const requirementResults = useMemo(
    () => checkCropRequirements(crop, sensorData),
    [crop, sensorData]
  );

  const overallStatus = useMemo(
    () => getOverallCropStatus(requirementResults),
    [requirementResults]
  );


  // =====================================================
  // HELPERS
  // =====================================================

  const getRequirementResult = (key) => {
    return requirementResults.find(
      (item) => item.key === key
    );
  };


  const formatCurrentValue = (result) => {
    if (
      !result ||
      result.currentValue === null ||
      result.currentValue === undefined
    ) {
      return "No Data";
    }

    return `${result.currentValue}${
      result.unit ? ` ${result.unit}` : ""
    }`;
  };


  const getParameterIcon = (key) => {
    const icons = {
      ph: "bi-droplet-half",
      ec: "bi-beaker",
      temperature: "bi-thermometer-half",
      humidity: "bi-cloud-haze2",
      ppfd: "bi-brightness-high",
    };

    return icons[key] || "bi-circle";
  };


  const getParameterLabel = (key) => {
    const labels = {
      ph: "pH",
      ec: "EC",
      temperature: "Temperature",
      humidity: "Humidity",
      ppfd: "PPFD",
    };

    return labels[key] || key;
  };


  return (
    <section className="crop-schedule-page">

      <div className="container">

        {/* =================================================
            BREADCRUMB
            ================================================= */}

        <div className="crop-schedule-breadcrumb">

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

          <span>Schedule</span>

        </div>


        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="crop-schedule-header">

          <div className="crop-schedule-header-content">

            <span className="crop-schedule-label">
              CROP GROWTH PLANNING
            </span>

            <h1>
              {crop.name}
              <span> Growth Schedule</span>
            </h1>

            <p>
              Monitor the recommended growth cycle, harvest
              window and environmental requirements for this
              crop using HydroGrow's crop dataset.
            </p>

          </div>


          <div className="crop-schedule-header-actions">

            <button
              type="button"
              className="crop-schedule-secondary-btn"
              onClick={() =>
                navigate(`/crops/${crop.id}`)
              }
            >
              <i className="bi bi-arrow-left"></i>
              Crop Details
            </button>

            <button
              type="button"
              className="crop-schedule-primary-btn"
              onClick={() =>
                navigate(`/crops/${crop.id}/growth`)
              }
            >
              <i className="bi bi-graph-up-arrow"></i>
              Track Growth
            </button>

          </div>

        </div>


        {/* =================================================
            CROP SUMMARY
            ================================================= */}

        <div className="crop-schedule-summary">

          <div className="crop-schedule-summary-image">

            <img
              src={crop.images[0]}
              alt={`${crop.name} hydroponic cultivation`}
            />

          </div>


          <div className="crop-schedule-summary-content">

            <div className="crop-schedule-summary-top">

              <div>

                <span className="crop-schedule-category">
                  {crop.category}
                </span>

                <h2>{crop.name}</h2>

                <p>
                  <i className="bi bi-flower2"></i>
                  {crop.scientificName}
                </p>

              </div>


              <div
                className={`crop-schedule-status ${getStatusClass(
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


            <div className="crop-schedule-summary-grid">

              <SummaryItem
                icon="bi-clock"
                label="Growth Cycle"
                value={`${crop.growthCycle} days`}
              />

              <SummaryItem
                icon="bi-calendar-check"
                label="Harvest Start"
                value={`Day ${crop.harvestStart}`}
              />

              <SummaryItem
                icon="bi-diagram-3"
                label="System"
                value={crop.hydroponicSystem}
              />

              <SummaryItem
                icon="bi-bar-chart"
                label="Difficulty"
                value={crop.difficulty}
              />

            </div>

          </div>

        </div>


        {/* =================================================
            GROWTH CYCLE
            ================================================= */}

        <section className="crop-schedule-section">

          <div className="crop-schedule-section-heading">

            <div>
              <span className="crop-schedule-section-label">
                CYCLE INFORMATION
              </span>

              <h2>
                Growth & Harvest Timeline
              </h2>

              <p>
                The following timeline is based directly on
                the growth cycle and harvest-start ranges
                provided in the HydroGrow crop dataset.
              </p>
            </div>

          </div>


          <div className="crop-timeline">

            <TimelineItem
              number="01"
              icon="bi-seedling"
              title="Growth Cycle"
              value={`${crop.growthCycle} days`}
              description="Expected overall crop growth cycle according to the dataset."
            />

            <div className="crop-timeline-line"></div>

            <TimelineItem
              number="02"
              icon="bi-calendar-event"
              title="Harvest Start"
              value={`Day ${crop.harvestStart}`}
              description="Approximate period when harvesting can begin."
            />

            <div className="crop-timeline-line"></div>

            <TimelineItem
              number="03"
              icon="bi-basket3"
              title="Harvest Guidance"
              value="Crop-specific"
              description={crop.harvestGuidance}
            />

          </div>

        </section>


        {/* =================================================
            ENVIRONMENT REQUIREMENTS
            ================================================= */}

        <section className="crop-schedule-section">

          <div className="crop-schedule-section-heading">

            <div>
              <span className="crop-schedule-section-label">
                ENVIRONMENT
              </span>

              <h2>
                Recommended Growing Conditions
              </h2>

              <p>
                Maintain the following parameters within
                the recommended crop ranges.
              </p>
            </div>

          </div>


          <div className="crop-schedule-environment-grid">

            <RequirementCard
              icon="bi-droplet-half"
              label="pH"
              value={crop.ph}
              result={getRequirementResult("ph")}
            />

            <RequirementCard
              icon="bi-beaker"
              label="EC"
              value={`${crop.ec} mS/cm`}
              result={getRequirementResult("ec")}
            />

            <RequirementCard
              icon="bi-thermometer-half"
              label="Temperature"
              value={`${crop.temperature} °C`}
              result={getRequirementResult("temperature")}
            />

            <RequirementCard
              icon="bi-cloud-haze2"
              label="Humidity"
              value={`${crop.humidity} %`}
              result={getRequirementResult("humidity")}
            />

            <RequirementCard
              icon="bi-brightness-high"
              label="PPFD"
              value={crop.ppfd}
              result={getRequirementResult("ppfd")}
            />

            <div className="crop-schedule-environment-card">

              <div className="crop-schedule-environment-icon">
                <i className="bi bi-sun"></i>
              </div>

              <div className="crop-schedule-environment-content">

                <span>Photoperiod</span>

                <strong>
                  {crop.photoperiod}
                </strong>

                <small>
                  Recommended light duration
                </small>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            LIVE MONITORING
            ================================================= */}

        <section className="crop-schedule-section">

          <div className="crop-schedule-section-heading">

            <div>
              <span className="crop-schedule-section-label">
                LIVE MONITORING
              </span>

              <h2>
                Current vs Recommended
              </h2>

              <p>
                HydroGrow compares the current simulator
                values with the selected crop requirements.
              </p>
            </div>

            <div
              className={`crop-schedule-overall-status ${getStatusClass(
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


          <div className="crop-schedule-monitor-grid">

            {requirementResults.map((result) => (
              <div
                className={`crop-schedule-monitor-card ${getStatusClass(
                  result.status
                )}`}
                key={result.key}
              >

                <div className="crop-schedule-monitor-top">

                  <div className="crop-schedule-monitor-icon">
                    <i
                      className={`bi ${getParameterIcon(
                        result.key
                      )}`}
                    ></i>
                  </div>

                  <span>
                    {getParameterLabel(result.key)}
                  </span>

                  <i
                    className={`bi ${getStatusIcon(
                      result.status
                    )} crop-schedule-monitor-status-icon`}
                  ></i>

                </div>


                <div className="crop-schedule-monitor-values">

                  <div>
                    <small>Current</small>

                    <strong>
                      {formatCurrentValue(result)}
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


                <div className="crop-schedule-monitor-message">
                  {result.message}
                </div>

              </div>
            ))}

          </div>


          <div className="crop-schedule-monitor-note">

            <i className="bi bi-info-circle"></i>

            <p>
              Photoperiod is displayed as a crop requirement,
              but it is not compared against the current
              sensor data because the current sensor model
              does not contain a light-duration measurement.
            </p>

          </div>

        </section>


        {/* =================================================
            MONITORING CHECKLIST
            ================================================= */}

        <section className="crop-schedule-section">

          <div className="crop-schedule-section-heading">

            <div>
              <span className="crop-schedule-section-label">
                DAILY MONITORING
              </span>

              <h2>
                Recommended Monitoring Checklist
              </h2>

              <p>
                These are monitoring parameters supported by
                the current HydroGrow platform.
              </p>
            </div>

          </div>


          <div className="crop-schedule-checklist">

            <ChecklistItem
              icon="bi-droplet-half"
              title="Check pH"
              description={`Maintain pH within ${crop.ph}.`}
            />

            <ChecklistItem
              icon="bi-beaker"
              title="Check EC"
              description={`Maintain EC within ${crop.ec} mS/cm.`}
            />

            <ChecklistItem
              icon="bi-thermometer-half"
              title="Check Temperature"
              description={`Keep air temperature within ${crop.temperature} °C.`}
            />

            <ChecklistItem
              icon="bi-cloud-haze2"
              title="Check Humidity"
              description={`Maintain relative humidity within ${crop.humidity}%.`}
            />

            <ChecklistItem
              icon="bi-brightness-high"
              title="Check PPFD"
              description={`Maintain light intensity within ${crop.ppfd}.`}
            />

            <ChecklistItem
              icon="bi-activity"
              title="Review Sensor Status"
              description="Review the current parameter status and respond to warnings or critical conditions."
            />

          </div>

        </section>


        {/* =================================================
            HYDROPONIC SYSTEM
            ================================================= */}

        <section className="crop-schedule-system">

          <div className="crop-schedule-system-icon">
            <i className="bi bi-diagram-3"></i>
          </div>

          <div className="crop-schedule-system-content">

            <span className="crop-schedule-section-label">
              HYDROPONIC SYSTEM
            </span>

            <h2>
              Recommended System
            </h2>

            <p>
              {crop.hydroponicSystem}
            </p>

          </div>

          <div className="crop-schedule-system-badge">
            {crop.cropType}
          </div>

        </section>


        {/* =================================================
            HARVEST GUIDANCE
            ================================================= */}

        <section className="crop-schedule-harvest">

          <div className="crop-schedule-harvest-icon">
            <i className="bi bi-basket3"></i>
          </div>

          <div>

            <span className="crop-schedule-section-label">
              HARVEST GUIDANCE
            </span>

            <h2>
              Harvest Information
            </h2>

            <p>
              {crop.harvestGuidance}
            </p>

            <div className="crop-schedule-harvest-window">

              <div>
                <span>Harvest Start</span>
                <strong>
                  Day {crop.harvestStart}
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
            DATA LIMITATION
            ================================================= */}

        <div className="crop-schedule-data-note">

          <div className="crop-schedule-data-note-icon">
            <i className="bi bi-database"></i>
          </div>

          <div>

            <strong>
              Schedule data source
            </strong>

            <p>
              HydroGrow uses the defined crop dataset for
              growth-cycle, harvest-start, environmental
              requirement, hydroponic-system and harvest
              guidance information. Exact day-by-day
              biological stages are not generated because
              they are not included in the current dataset.
            </p>

          </div>

        </div>


        {/* =================================================
            BOTTOM ACTIONS
            ================================================= */}

        <div className="crop-schedule-bottom-actions">

          <button
            type="button"
            className="crop-schedule-secondary-btn"
            onClick={() =>
              navigate(`/crops/${crop.id}`)
            }
          >
            <i className="bi bi-arrow-left"></i>
            Crop Details
          </button>

          <button
            type="button"
            className="crop-schedule-primary-btn"
            onClick={() =>
              navigate(`/crops/${crop.id}/growth`)
            }
          >
            Track Growth
            <i className="bi bi-arrow-right"></i>
          </button>

        </div>

      </div>

    </section>
  );
}


// =====================================================
// SUMMARY ITEM
// =====================================================

function SummaryItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="crop-schedule-summary-item">

      <div className="crop-schedule-summary-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

    </div>
  );
}


// =====================================================
// TIMELINE ITEM
// =====================================================

function TimelineItem({
  number,
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="crop-timeline-item">

      <div className="crop-timeline-number">
        {number}
      </div>

      <div className="crop-timeline-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="crop-timeline-content">

        <span>{title}</span>

        <strong>{value}</strong>

        <p>{description}</p>

      </div>

    </div>
  );
}


// =====================================================
// REQUIREMENT CARD
// =====================================================

function RequirementCard({
  icon,
  label,
  value,
  result,
}) {
  return (
    <div
      className={`crop-schedule-environment-card ${
        result
          ? getStatusClass(result.status)
          : ""
      }`}
    >

      <div className="crop-schedule-environment-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div className="crop-schedule-environment-content">

        <div className="crop-schedule-environment-title">

          <span>{label}</span>

          {result && (
            <i
              className={`bi ${getStatusIcon(
                result.status
              )}`}
            ></i>
          )}

        </div>

        <strong>{value}</strong>

        {result && (
          <small>
            Current:{" "}
            {result.currentValue !== null
              ? `${result.currentValue}${
                  result.unit
                    ? ` ${result.unit}`
                    : ""
                }`
              : "No Data"}
          </small>
        )}

      </div>

    </div>
  );
}


// =====================================================
// CHECKLIST ITEM
// =====================================================

function ChecklistItem({
  icon,
  title,
  description,
}) {
  return (
    <div className="crop-schedule-check-item">

      <div className="crop-schedule-check-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div>

        <strong>{title}</strong>

        <p>{description}</p>

      </div>

    </div>
  );
}


export default CropSchedule;