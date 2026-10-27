import { useMemo } from "react";

function parseNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const match = String(value).match(/\d+/g);

  if (!match || match.length === 0) {
    return 0;
  }

  return Number(match[0]);
}

function getStageIndex(stage) {
  const stages = [
    "Germination",
    "Seedling",
    "Vegetative",
    "Flowering",
    "Fruit Development",
    "Harvest Ready",
  ];

  const index = stages.indexOf(stage);

  return index >= 0 ? index : 0;
}

function getStageDescription(stage) {
  const descriptions = {
    Germination:
      "Seeds are establishing and beginning early development.",

    Seedling:
      "Young plants are developing their first healthy growth.",

    Vegetative:
      "The crop is building leaves, roots and overall plant structure.",

    Flowering:
      "The plant is entering its flowering and reproductive phase.",

    "Fruit Development":
      "Flowers are developing into harvestable produce.",

    "Harvest Ready":
      "The crop has reached its expected harvest stage.",
  };

  return (
    descriptions[stage] ||
    "Crop growth information is being monitored."
  );
}

function CropGrowthAnimation({
  crop,
  growthDay = 0,
  growthStage = "Germination",
  growthCycle = 0,
  harvestStart = 0,
}) {
  const stages = useMemo(
    () => [
      {
        name: "Germination",
        icon: "bi-seedling",
      },
      {
        name: "Seedling",
        icon: "bi-flower1",
      },
      {
        name: "Vegetative",
        icon: "bi-tree",
      },
      {
        name: "Flowering",
        icon: "bi-flower2",
      },
      {
        name: "Fruit Development",
        icon: "bi-apple",
      },
      {
        name: "Harvest Ready",
        icon: "bi-basket2",
      },
    ],
    []
  );

  const currentStageIndex = getStageIndex(growthStage);

  const cycleDays =
    growthCycle || parseNumber(crop?.growthCycle);

  const harvestDays =
    harvestStart || parseNumber(crop?.harvestStart);

  const cropImage =
    crop?.images?.[0] ||
    crop?.image ||
    null;

  const remainingDays =
    cycleDays > 0
      ? Math.max(0, cycleDays - growthDay)
      : null;

  return (
    <div className="crop-growth-animation">
      {/* VISUAL PLANT AREA */}
      <div className="growth-visual">
        <div className="growth-sun">
          <i className="bi bi-brightness-high"></i>
        </div>

        <div className="growth-ground">
          <div className="growth-soil"></div>

          <div
            className={`growth-plant growth-stage-${currentStageIndex}`}
          >
            {cropImage ? (
              <img
                src={cropImage}
                alt={`${crop?.name || "Crop"} growth`}
              />
            ) : (
              <div className="growth-placeholder">
                <i className="bi bi-flower1"></i>
              </div>
            )}
          </div>
        </div>

        <div className="growth-day-badge">
          <span>Crop Day</span>
          <strong>{growthDay}</strong>
        </div>
      </div>

      {/* CURRENT STAGE */}
      <div className="growth-current-stage">
        <div className="growth-stage-icon">
          <i
            className={`bi ${
              stages[currentStageIndex]?.icon ||
              "bi-flower1"
            }`}
          ></i>
        </div>

        <div className="growth-stage-content">
          <span>Current Growth Stage</span>

          <strong>{growthStage}</strong>

          <p>
            {getStageDescription(growthStage)}
          </p>
        </div>
      </div>

      {/* STAGE TIMELINE */}
      <div className="growth-stage-timeline">
        {stages.map((stage, index) => {
          const completed =
            index < currentStageIndex;

          const active =
            index === currentStageIndex;

          return (
            <div
              key={stage.name}
              className={`growth-stage ${
                completed ? "completed" : ""
              } ${active ? "active" : ""}`}
            >
              <div className="growth-stage-marker">
                <i
                  className={`bi ${stage.icon}`}
                ></i>
              </div>

              <span>{stage.name}</span>
            </div>
          );
        })}
      </div>

      {/* GROWTH INFORMATION */}
      <div className="growth-metrics">
        <div>
          <span>Growth Cycle</span>

          <strong>
            {cycleDays > 0
              ? `${cycleDays} days`
              : "Not available"}
          </strong>
        </div>

        <div>
          <span>Harvest Start</span>

          <strong>
            {harvestDays > 0
              ? `Day ${harvestDays}`
              : "Not available"}
          </strong>
        </div>

        <div>
          <span>Remaining</span>

          <strong>
            {remainingDays !== null
              ? `${remainingDays} days`
              : "Not available"}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default CropGrowthAnimation;