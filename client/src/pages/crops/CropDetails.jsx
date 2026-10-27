import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useCrop } from "../../context/CropContext";
import { useSensor } from "../../context/SensorContext";
import { getCropById } from "../../data/cropData";

import {
  checkCropRequirements,
  getOverallCropStatus,
} from "../../utils/cropRequirementChecker";

import "../../assets/styles/crop-details.css";

/* =========================================================
   HELPERS
========================================================= */

function parseFirstNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const match = String(value).match(
    /\d+(?:\.\d+)?/
  );

  return match
    ? Number(match[0])
    : null;
}

function parseRange(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numbers = String(value)
    .replace(/[–—]/g, "-")
    .match(/\d+(?:\.\d+)?/g);

  if (
    !numbers ||
    numbers.length < 2
  ) {
    return null;
  }

  return {
    min: Number(numbers[0]),
    max: Number(numbers[1]),
  };
}

function getGrowthStage(
  crop,
  day
) {
  const totalDays =
    parseFirstNumber(
      crop?.growthCycle
    ) || 60;

  const percentage = Math.min(
    100,
    Math.max(
      0,
      (day / totalDays) * 100
    )
  );

  if (percentage >= 85) {
    return "Harvest Ready";
  }

  if (percentage >= 65) {
    return "Fruit Development";
  }

  if (percentage >= 45) {
    return "Flowering";
  }

  if (percentage >= 20) {
    return "Vegetative";
  }

  if (percentage >= 5) {
    return "Seedling";
  }

  return "Germination";
}

function getGrowthStageIndex(
  stage
) {
  const stages = [
    "Germination",
    "Seedling",
    "Vegetative",
    "Flowering",
    "Fruit Development",
    "Harvest Ready",
  ];

  return stages.indexOf(stage);
}

function getCurrentValueStatus(
  value,
  range
) {
  const parsedValue =
    Number(value);

  const parsedRange =
    parseRange(range);

  if (
    !Number.isFinite(
      parsedValue
    ) ||
    !parsedRange
  ) {
    return "no-data";
  }

  if (
    parsedValue <
      parsedRange.min ||
    parsedValue >
      parsedRange.max
  ) {
    return "critical";
  }

  const margin =
    (parsedRange.max -
      parsedRange.min) *
    0.15;

  if (
    parsedValue <=
      parsedRange.min +
        margin ||
    parsedValue >=
      parsedRange.max -
        margin
  ) {
    return "warning";
  }

  return "healthy";
}

/* =========================================================
   IMAGE GALLERY
========================================================= */

function CropGallery({
  crop,
}) {
  const [
    activeImage,
    setActiveImage,
  ] = useState(0);

  if (
    !crop?.images?.length
  ) {
    return (
      <div className="crop-details-image-empty">
        <i className="bi bi-flower1"></i>
      </div>
    );
  }

  const nextImage = () => {
    setActiveImage(
      (current) =>
        (current + 1) %
        crop.images.length
    );
  };

  const previousImage = () => {
    setActiveImage(
      (current) =>
        (current -
          1 +
          crop.images.length) %
        crop.images.length
    );
  };

  return (
    <div className="crop-details-gallery">
      <img
        src={
          crop.images[
            activeImage
          ]
        }
        alt={`${crop.name} hydroponic farming`}
        className="crop-details-main-image"
      />

      {crop.images.length >
        1 && (
        <>
          <button
            type="button"
            className="crop-details-gallery-button left"
            onClick={
              previousImage
            }
            aria-label="Previous crop image"
          >
            <i className="bi bi-chevron-left"></i>
          </button>

          <button
            type="button"
            className="crop-details-gallery-button right"
            onClick={
              nextImage
            }
            aria-label="Next crop image"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </>
      )}

      <div className="crop-details-image-counter">
        {activeImage + 1} /{" "}
        {crop.images.length}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function CropDetails() {
  const { cropId } =
    useParams();

  const navigate =
    useNavigate();

  const { sensorData } =
    useSensor();

  const {
    selectedCrops,
    addCrop,
  } = useCrop();

  const crop =
    getCropById(cropId);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    showSetup,
    setShowSetup,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState({
    farmUnit: "",
    plantCount: "1",
    plantingDate:
      new Date()
        .toISOString()
        .split("T")[0],
    notes: "",
  });

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    submitSuccess,
    setSubmitSuccess,
  ] = useState(false);

  /* =======================================================
     CURRENT FARM CROP
  ======================================================= */

  const existingFarmCrop =
    useMemo(() => {
      if (!crop) {
        return null;
      }

      return (
        selectedCrops.find(
          (item) =>
            item.cropId ===
            crop.id
        ) || null
      );
    }, [
      selectedCrops,
      crop,
    ]);

  /* =======================================================
     REQUIREMENT STATUS

     Hook intentionally stays BEFORE conditional return.
  ======================================================= */

  const requirementResults =
    useMemo(() => {
      if (
        !crop ||
        !sensorData
      ) {
        return [];
      }

      return checkCropRequirements(
        crop,
        sensorData
      );
    }, [
      crop,
      sensorData,
    ]);

  const overallStatus =
    useMemo(() => {
      return getOverallCropStatus(
        requirementResults
      );
    }, [
      requirementResults,
    ]);

  /* =======================================================
     GROWTH DATA
  ======================================================= */

  const growthData =
    useMemo(() => {
      if (!crop) {
        return {
          day: 0,
          stage: "Not Started",
          remaining: 0,
          percentage: 0,
        };
      }

      const totalDays =
        parseFirstNumber(
          crop.growthCycle
        ) || 60;

      if (!existingFarmCrop) {
        return {
          day: 0,
          stage: "Not Started",
          remaining:
            totalDays,
          percentage: 0,
        };
      }

      const plantingDate =
        new Date(
          existingFarmCrop.plantingDate
        );

      const today =
        new Date();

      const difference =
        today.getTime() -
        plantingDate.getTime();

      const day = Math.max(
        1,
        Math.floor(
          difference /
            (1000 *
              60 *
              60 *
              24)
        ) + 1
      );

      const percentage =
        Math.min(
          100,
          Math.max(
            0,
            (day /
              totalDays) *
              100
          )
        );

      return {
        day,
        stage:
          getGrowthStage(
            crop,
            day
          ),
        remaining:
          Math.max(
            0,
            totalDays - day
          ),
        percentage,
      };
    }, [
      crop,
      existingFarmCrop,
    ]);

  /* =======================================================
     CROP NOT FOUND
  ======================================================= */

  if (!crop) {
    return (
      <div className="crop-details-page">
        <div className="crop-details-not-found">
          <div className="crop-details-not-found-icon">
            <i className="bi bi-flower1"></i>
          </div>

          <h1>
            Crop Not Found
          </h1>

          <p>
            The selected crop
            could not be found
            in the HydroGrow
            crop database.
          </p>

          <Link
            to="/crops"
            className="crop-details-primary-button"
          >
            <i className="bi bi-arrow-left"></i>
            Back to Crops
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setFormError("");
  };

  const openSetup = () => {
    setFormError("");
    setSubmitSuccess(false);

    if (
      existingFarmCrop
    ) {
      navigate("/my-farm");
      return;
    }

    setShowSetup(true);
  };

  const closeSetup = () => {
    setShowSetup(false);
    setFormError("");
    setSubmitSuccess(false);
  };

  const handleAddCrop = (
    event
  ) => {
    event.preventDefault();

    if (
      !formData.farmUnit.trim()
    ) {
      setFormError(
        "Please enter a farm unit name."
      );
      return;
    }

    const plantCount =
      Number(
        formData.plantCount
      );

    if (
      !Number.isInteger(
        plantCount
      ) ||
      plantCount < 1
    ) {
      setFormError(
        "Plant count must be at least 1."
      );
      return;
    }

    const result =
      addCrop(
        crop,
        {
          ...formData,
          plantCount,
        }
      );

    if (
      !result.success
    ) {
      if (
        result.alreadyExists
      ) {
        navigate(
          "/my-farm"
        );
        return;
      }

      setFormError(
        result.message ||
          "Unable to add crop."
      );

      return;
    }

    setSubmitSuccess(
      true
    );

    setTimeout(() => {
      navigate(
        "/my-farm"
      );
    }, 700);
  };

  /* =======================================================
     REQUIREMENT CARDS
  ======================================================= */

  const requirementCards = [
    {
      key: "ph",
      label: "pH",
      value: crop.ph,
      icon:
        "bi-droplet-half",
      unit: "",
    },
    {
      key: "ec",
      label: "EC",
      value: crop.ec,
      icon: "bi-moisture",
      unit: "mS/cm",
    },
    {
      key: "temperature",
      label:
        "Air Temperature",
      value:
        crop.temperature,
      icon:
        "bi-thermometer-half",
      unit: "°C",
    },
    {
      key: "humidity",
      label: "Humidity",
      value:
        crop.humidity,
      icon:
        "bi-cloud-haze2",
      unit: "%",
    },
    {
      key: "photoperiod",
      label:
        "Photoperiod",
      value:
        crop.photoperiod,
      icon:
        "bi-brightness-high",
      unit: "",
    },
    {
      key: "ppfd",
      label: "PPFD",
      value: crop.ppfd,
      icon: "bi-sun",
      unit:
        "µmol/m²/s",
    },
  ];

  /* =======================================================
     GROWTH SCHEDULE
  ======================================================= */

  const schedule = [
    {
      stage:
        "Germination",
      period:
        "Early Stage",
      icon:
        "bi-record-circle",
      description:
        "Seed establishment and initial root development.",
    },
    {
      stage:
        "Seedling",
      period:
        "Early Growth",
      icon:
        "bi-flower1",
      description:
        "Young plant establishes leaves and root structure.",
    },
    {
      stage:
        "Vegetative",
      period:
        "Growth Phase",
      icon:
        "bi-tree",
      description:
        "Leaf, stem and overall plant biomass development.",
    },
    {
      stage:
        "Flowering",
      period:
        "Mid / Late Stage",
      icon:
        "bi-flower2",
      description:
        "Flower formation and reproductive development.",
    },
    {
      stage:
        "Fruit Development",
      period:
        "Late Stage",
      icon:
        "bi-apple",
      description:
        "Fruit or harvestable structure develops toward maturity.",
    },
    {
      stage:
        "Harvest Ready",
      period:
        `Around ${crop.harvestStart}`,
      icon:
        "bi-basket3",
      description:
        crop.harvestGuidance ||
        "Harvest according to the recommended maturity stage.",
    },
  ];

  /* =======================================================
     ACTIVE GROWTH STAGE
  ======================================================= */

  const currentStageIndex =
    getGrowthStageIndex(
      growthData.stage
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="crop-details-page">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="crop-details-topbar">

        <Link
          to="/crops"
          className="crop-details-back-link"
        >
          <i className="bi bi-arrow-left"></i>
          Back to Crops
        </Link>

        <span>
          Crop ID: {crop.id}
        </span>

      </div>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="crop-details-hero">

        <div className="crop-details-hero-image">
          <CropGallery
            crop={crop}
          />
        </div>

        <div className="crop-details-hero-content">

          <div className="crop-details-badges">

            <span className="crop-details-category">
              {crop.category}
            </span>

            <span
              className={`crop-details-phase ${
                crop.hydroGrowStatus
                  ?.toLowerCase()
                  .includes(
                    "primary"
                  )
                  ? "primary"
                  : ""
              }`}
            >
              {crop.hydroGrowStatus ||
                "HydroGrow Crop"}
            </span>

          </div>

          <h1>
            {crop.name}
          </h1>

          <p className="crop-details-scientific">
            <i className="bi bi-flower2"></i>
            {crop.scientificName}
          </p>

          <p className="crop-details-description">
            {crop.description}
          </p>

          <div className="crop-details-hero-stats">

            <div>
              <span>
                Crop Type
              </span>

              <strong>
                {crop.cropType}
              </strong>
            </div>

            <div>
              <span>
                Difficulty
              </span>

              <strong>
                {crop.difficulty}
              </strong>
            </div>

            <div>
              <span>
                Market Demand
              </span>

              <strong>
                {crop.demand}
              </strong>
            </div>

            <div>
              <span>
                Growth Cycle
              </span>

              <strong>
                {crop.growthCycle}
              </strong>
            </div>

          </div>

          <div className="crop-details-hero-actions">

            <button
              type="button"
              className="crop-details-select-button"
              onClick={
                openSetup
              }
            >
              <i
                className={
                  existingFarmCrop
                    ? "bi bi-house-heart"
                    : "bi bi-plus-circle"
                }
              ></i>

              {existingFarmCrop
                ? "Open My Farm"
                : "Select This Crop"}
            </button>

            <a
              href="#crop-requirements"
              className="crop-details-outline-button"
            >
              <i className="bi bi-arrow-down"></i>
              Explore Details
            </a>

          </div>

        </div>

      </section>

      {/* =================================================
          SELECTED CROP BANNER
      ================================================= */}

      {existingFarmCrop && (
        <div className="crop-details-selected-banner">

          <div>

            <i className="bi bi-check-circle-fill"></i>

            <div>

              <strong>
                {crop.name}
                {" "}
                is already in My Farm
              </strong>

              <span>
                {existingFarmCrop.farmUnit}
                {" · "}
                {existingFarmCrop.plantCount}
                {" plants"}
              </span>

            </div>

          </div>

          <Link to="/my-farm">
            Open My Farm
            <i className="bi bi-arrow-right"></i>
          </Link>

        </div>
      )}

      {/* =================================================
          QUICK OVERVIEW
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            AT A GLANCE
          </span>

          <h2>
            Crop Overview
          </h2>

        </div>

        <div className="crop-details-facts-grid">

          <div className="crop-details-fact-card">
            <i className="bi bi-diagram-3"></i>

            <span>
              Hydroponic System
            </span>

            <strong>
              {crop.hydroponicSystem}
            </strong>
          </div>

          <div className="crop-details-fact-card">
            <i className="bi bi-hourglass-split"></i>

            <span>
              Growth Cycle
            </span>

            <strong>
              {crop.growthCycle}
            </strong>
          </div>

          <div className="crop-details-fact-card">
            <i className="bi bi-calendar2-check"></i>

            <span>
              Harvest Start
            </span>

            <strong>
              {crop.harvestStart}
            </strong>
          </div>

          <div className="crop-details-fact-card">
            <i className="bi bi-bar-chart"></i>

            <span>
              Market Demand
            </span>

            <strong>
              {crop.demand}
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          ENVIRONMENT REQUIREMENTS
      ================================================= */}

      <section
        id="crop-requirements"
        className="crop-details-section"
      >

        <div className="crop-details-section-heading">

          <span>
            GROWING REQUIREMENTS
          </span>

          <h2>
            Recommended Environment
          </h2>

          <p>
            Recommended environmental
            conditions for this crop.
          </p>

        </div>

        <div className="crop-details-requirements-grid">

          {requirementCards.map(
            (item) => {

              const currentValue =
                sensorData?.[
                  item.key
                ];

              const status =
                currentValue !==
                undefined
                  ? getCurrentValueStatus(
                      currentValue,
                      item.value
                    )
                  : "no-data";

              return (
                <div
                  key={
                    item.key
                  }
                  className={`crop-details-requirement-card ${status}`}
                >

                  <div className="crop-details-requirement-icon">

                    <i
                      className={`bi ${item.icon}`}
                    ></i>

                  </div>

                  <div className="crop-details-requirement-content">

                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {item.value}
                      {item.unit &&
                        ` ${item.unit}`}
                    </strong>

                    {currentValue !==
                      undefined && (
                      <small
                        className={`requirement-live-status ${status}`}
                      >
                        Current:{" "}
                        {currentValue}
                        {item.unit &&
                          ` ${item.unit}`}
                      </small>
                    )}

                  </div>

                  {status !==
                    "no-data" && (
                    <i
                      className={`bi ${
                        status ===
                        "healthy"
                          ? "bi-check-circle-fill"
                          : status ===
                              "warning"
                            ? "bi-exclamation-circle-fill"
                            : "bi-x-circle-fill"
                      } crop-details-requirement-status`}
                    ></i>
                  )}

                </div>
              );
            }
          )}

        </div>

        <div className="crop-details-condition-summary">

          <div className="condition-summary-icon">

            <i
              className={`bi ${
                overallStatus.status ===
                "healthy"
                  ? "bi-check-circle-fill"
                  : overallStatus.status ===
                      "warning"
                    ? "bi-exclamation-triangle-fill"
                    : overallStatus.status ===
                        "critical"
                      ? "bi-x-circle-fill"
                      : "bi-dash-circle"
              }`}
            ></i>

          </div>

          <div>

            <span>
              CURRENT CROP CONDITION
            </span>

            <strong>
              {overallStatus.label}
            </strong>

          </div>

          <Link to="/monitoring">
            Open Monitoring
            <i className="bi bi-arrow-right"></i>
          </Link>

        </div>

      </section>

      {/* =================================================
          HYDROPONIC INFORMATION
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            HYDROPONIC INFORMATION
          </span>

          <h2>
            Recommended Growing System
          </h2>

        </div>

        <div className="crop-details-hydro-card">

          <div className="crop-details-hydro-icon">
            <i className="bi bi-diagram-3-fill"></i>
          </div>

          <div>

            <h3>
              {crop.hydroponicSystem}
            </h3>

            <p>
              HydroGrow recommends
              the above hydroponic
              system for this crop
              according to the
              crop dataset.
            </p>

          </div>

        </div>

      </section>

      {/* =================================================
          GROWTH SNAPSHOT
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            GROWTH & HARVEST
          </span>

          <h2>
            Crop Development
          </h2>

          <p>
            Current crop growth information
            based on the selected planting date.
          </p>

        </div>

        <div className="crop-details-growth-grid">

          <div className="crop-details-growth-info">

            <div className="growth-info-item">
              <span>
                Total Growth Cycle
              </span>

              <strong>
                {crop.growthCycle}
              </strong>
            </div>

            <div className="growth-info-item">
              <span>
                Approx. Harvest Start
              </span>

              <strong>
                {crop.harvestStart}
              </strong>
            </div>

            <div className="growth-info-item">
              <span>
                Current Farm Day
              </span>

              <strong>
                {existingFarmCrop
                  ? `Day ${growthData.day}`
                  : "Not Started"}
              </strong>
            </div>

            <div className="growth-info-item">
              <span>
                Current Stage
              </span>

              <strong>
                {growthData.stage}
              </strong>
            </div>

            <div className="growth-info-item">
              <span>
                Estimated Days Remaining
              </span>

              <strong>
                {existingFarmCrop
                  ? growthData.remaining
                  : "—"}
              </strong>
            </div>

          </div>

          <div className="crop-details-harvest-card">

            <div className="harvest-card-icon">
              <i className="bi bi-basket3-fill"></i>
            </div>

            <div>

              <span>
                HARVEST GUIDANCE
              </span>

              <p>
                {crop.harvestGuidance}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          GROWTH STAGE VISUALIZATION
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            GROWTH TIMELINE
          </span>

          <h2>
            Expected Growth Stages
          </h2>

          <p>
            HydroGrow tracks the crop through
            its major development stages.
          </p>

        </div>

        <div className="crop-details-schedule">

          {schedule.map(
            (
              stage,
              index
            ) => {

              const isCurrent =
                existingFarmCrop &&
                stage.stage ===
                  growthData.stage;

              const isCompleted =
                existingFarmCrop &&
                currentStageIndex >
                  index;

              return (
                <div
                  key={
                    stage.stage
                  }
                  className={`crop-schedule-item ${
                    isCurrent
                      ? "current"
                      : ""
                  } ${
                    isCompleted
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="crop-schedule-number">

                    {isCompleted ? (
                      <i className="bi bi-check"></i>
                    ) : (
                      index + 1
                    )}

                  </div>

                  <div className="crop-schedule-icon">

                    <i
                      className={`bi ${stage.icon}`}
                    ></i>

                  </div>

                  <div className="crop-schedule-content">

                    <div className="crop-schedule-heading">

                      <h3>
                        {stage.stage}
                      </h3>

                      <span>
                        {stage.period}
                      </span>

                    </div>

                    <p>
                      {stage.description}
                    </p>

                  </div>

                  {isCurrent && (
                    <span className="crop-current-stage">
                      Current Stage
                    </span>
                  )}

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* =================================================
          HYDROGROW STATUS
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            HYDROGROW
          </span>

          <h2>
            Crop Availability & Phase
          </h2>

        </div>

        <div className="crop-details-phase-card">

          <div className="crop-phase-main-icon">
            <i className="bi bi-stars"></i>
          </div>

          <div className="crop-phase-content">

            <span>
              HYDROGROW STATUS
            </span>

            <h3>
              {crop.hydroGrowStatus ||
                "HydroGrow Crop"}
            </h3>

            <p>
              This crop is part of the
              HydroGrow crop knowledge
              dataset and can be selected
              for farm monitoring and
              management.
            </p>

          </div>

        </div>

      </section>

      {/* =================================================
          COMPLETE TECHNICAL INFORMATION
      ================================================= */}

      <section className="crop-details-section">

        <div className="crop-details-section-heading">

          <span>
            COMPLETE CROP INFORMATION
          </span>

          <h2>
            Technical Details
          </h2>

        </div>

        <div className="crop-details-table-wrapper">

          <table className="crop-details-table">

            <tbody>

              <tr>
                <th>
                  Crop ID
                </th>
                <td>
                  {crop.id}
                </td>
              </tr>

              <tr>
                <th>
                  Category
                </th>
                <td>
                  {crop.category}
                </td>
              </tr>

              <tr>
                <th>
                  Crop Name
                </th>
                <td>
                  {crop.name}
                </td>
              </tr>

              <tr>
                <th>
                  Scientific Name
                </th>
                <td>
                  {crop.scientificName}
                </td>
              </tr>

              <tr>
                <th>
                  Crop Type
                </th>
                <td>
                  {crop.cropType}
                </td>
              </tr>

              <tr>
                <th>
                  Hydroponic System
                </th>
                <td>
                  {crop.hydroponicSystem}
                </td>
              </tr>

              <tr>
                <th>
                  Growth Cycle
                </th>
                <td>
                  {crop.growthCycle}
                </td>
              </tr>

              <tr>
                <th>
                  Harvest Start
                </th>
                <td>
                  {crop.harvestStart}
                </td>
              </tr>

              <tr>
                <th>
                  pH
                </th>
                <td>
                  {crop.ph}
                </td>
              </tr>

              <tr>
                <th>
                  EC
                </th>
                <td>
                  {crop.ec}
                </td>
              </tr>

              <tr>
                <th>
                  Air Temperature
                </th>
                <td>
                  {crop.temperature}
                </td>
              </tr>

              <tr>
                <th>
                  Relative Humidity
                </th>
                <td>
                  {crop.humidity}
                </td>
              </tr>

              <tr>
                <th>
                  Photoperiod
                </th>
                <td>
                  {crop.photoperiod}
                </td>
              </tr>

              <tr>
                <th>
                  PPFD
                </th>
                <td>
                  {crop.ppfd}
                </td>
              </tr>

              <tr>
                <th>
                  Difficulty
                </th>
                <td>
                  {crop.difficulty}
                </td>
              </tr>

              <tr>
                <th>
                  Market Demand
                </th>
                <td>
                  {crop.demand}
                </td>
              </tr>

              <tr>
                <th>
                  HydroGrow Status
                </th>
                <td>
                  {crop.hydroGrowStatus}
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>

      {/* =================================================
          FINAL SELECT CTA
      ================================================= */}

      <section className="crop-details-final-action">

        <div>

          <span>
            READY TO START?
          </span>

          <h2>
            Add {crop.name}
            {" "}
            to Your Farm
          </h2>

          <p>
            Configure your farm unit
            and plant count to start
            managing this crop in
            HydroGrow.
          </p>

        </div>

        <button
          type="button"
          className="crop-details-final-button"
          onClick={
            openSetup
          }
        >

          <i
            className={
              existingFarmCrop
                ? "bi bi-house-heart"
                : "bi bi-plus-circle"
            }
          ></i>

          {existingFarmCrop
            ? "Open My Farm"
            : `Select ${crop.name}`}

        </button>

      </section>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <div className="crop-details-bottom-navigation">

        <Link to="/crops">
          <i className="bi bi-grid"></i>
          All Crops
        </Link>

        <Link to="/my-farm">
          My Farm
          <i className="bi bi-arrow-right"></i>
        </Link>

      </div>

      {/* =================================================
          SETUP MODAL
      ================================================= */}

      {showSetup && (
        <div
          className="crop-setup-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSetup();
            }
          }}
        >

          <div className="crop-setup-modal">

            {/* HEADER */}

            <div className="crop-setup-header">

              <div>

                <span>
                  ADD TO MY FARM
                </span>

                <h2>
                  {crop.name}
                </h2>

              </div>

              <button
                type="button"
                className="crop-setup-close"
                onClick={
                  closeSetup
                }
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

            {/* PREVIEW */}

            <div className="crop-setup-crop-preview">

              <div className="crop-setup-preview-image">

                {crop.images?.[0] ? (
                  <img
                    src={
                      crop.images[0]
                    }
                    alt={
                      crop.name
                    }
                  />
                ) : (
                  <i className="bi bi-flower1"></i>
                )}

              </div>

              <div>

                <strong>
                  {crop.name}
                </strong>

                <span>
                  {crop.category}
                </span>

              </div>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleAddCrop
              }
              className="crop-setup-form"
            >

              {/* FARM UNIT */}

              <div className="crop-setup-field">

                <label htmlFor="farmUnit">
                  Farm Unit Name
                  <span>*</span>
                </label>

                <input
                  id="farmUnit"
                  name="farmUnit"
                  type="text"
                  value={
                    formData.farmUnit
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="e.g. Greenhouse 1"
                  autoFocus
                />

                <small>
                  Your greenhouse,
                  growing area or
                  farm unit name.
                </small>

              </div>

              {/* PLANTS + DATE */}

              <div className="crop-setup-form-row">

                <div className="crop-setup-field">

                  <label htmlFor="plantCount">
                    Number of Plants
                    <span>*</span>
                  </label>

                  <input
                    id="plantCount"
                    name="plantCount"
                    type="number"
                    min="1"
                    value={
                      formData.plantCount
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

                <div className="crop-setup-field">

                  <label htmlFor="plantingDate">
                    Planting Date
                  </label>

                  <input
                    id="plantingDate"
                    name="plantingDate"
                    type="date"
                    value={
                      formData.plantingDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

              </div>

              {/* NOTES */}

              <div className="crop-setup-field">

                <label htmlFor="notes">
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Optional farm notes..."
                />

              </div>

              {/* ERROR */}

              {formError && (
                <div className="crop-setup-error">

                  <i className="bi bi-exclamation-circle"></i>

                  {formError}

                </div>
              )}

              {/* SUCCESS */}

              {submitSuccess && (
                <div className="crop-setup-success">

                  <i className="bi bi-check-circle-fill"></i>

                  {crop.name}
                  {" "}
                  added to My Farm.

                </div>
              )}

              {/* ACTIONS */}

              <div className="crop-setup-actions">

                <button
                  type="button"
                  className="crop-setup-cancel"
                  onClick={
                    closeSetup
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="crop-setup-submit"
                  disabled={
                    submitSuccess
                  }
                >

                  <i className="bi bi-plus-circle"></i>

                  Add to My Farm

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default CropDetails;