import { useMemo } from "react";

/* =========================================================
   GROWTH ANIMATION

   Photo-based crop growth visualization for fruiting crops
   (tomato / capsicum). Draws a stylized SVG plant whose
   stem, leaves, flowers and fruits scale with the displayed
   growth stage. Stage transitions animate via CSS so the
   plant visibly "grows" when new data arrives.
   ========================================================= */

const STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

const POT_TOP_Y = 204;

const STEM_FULL_HEIGHT = 116;

const STEM_SCALES = [0.14, 0.34, 0.58, 0.8, 1];

const LEAF_SLOTS = [
  { frac: 0.95, side: -1 },
  { frac: 0.88, side: 1 },
  { frac: 0.7, side: -1 },
  { frac: 0.56, side: 1 },
  { frac: 0.42, side: -1 },
  { frac: 0.3, side: 1 },
];

const LEAF_COUNTS = [2, 5, 6, 6, 6];

const LEAF_SCALES = [0.5, 0.85, 1, 1.08, 1.15];

const FLOWER_SLOTS = [
  { frac: 0.97, side: -1, dist: 17 },
  { frac: 0.9, side: 1, dist: 19 },
  { frac: 0.81, side: -1, dist: 15 },
  { frac: 0.73, side: 1, dist: 16 },
];

const FRUIT_SLOTS = [
  { frac: 0.52, side: -1, dist: 30 },
  { frac: 0.6, side: 1, dist: 28 },
  { frac: 0.38, side: -1, dist: 36 },
  { frac: 0.44, side: 1, dist: 38 },
  { frac: 0.68, side: -1, dist: 24 },
  { frac: 0.3, side: 1, dist: 33 },
];

const FRUIT_COUNTS = [0, 0, 0, 4, 6];

const FRUIT_SCALES = [0.3, 0.4, 0.5, 0.7, 1];

function clampStage(stage) {
  const value = Number(stage);

  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function getTimeAgo(iso) {
  if (!iso) return "";

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) return "";

  const seconds = Math.floor(
    (Date.now() - parsed.getTime()) / 1000
  );

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getStatusHint(
  status,
  verifiedStageName,
  expectedStageName,
  dayNumber
) {
  if (status === "ON_TRACK") {
    return {
      icon: "bi-check-circle-fill",
      tone: "on-track",
      text: `On schedule — growth matches day ${dayNumber} expectation`,
    };
  }

  if (status === "AHEAD") {
    return {
      icon: "bi-arrow-up-right-circle-fill",
      tone: "ahead",
      text: `Ahead of schedule — photo shows ${verifiedStageName} at day ${dayNumber}`,
    };
  }

  if (status === "BEHIND") {
    return {
      icon: "bi-exclamation-triangle-fill",
      tone: "behind",
      text: `Behind schedule — photo shows ${verifiedStageName}, schedule expects ${expectedStageName}`,
    };
  }

  return null;
}

function GrowthAnimation({
  cropName = "",
  fruitColor = "#e03e2f",
  dayNumber = 0,
  cycleDays = 0,
  expectedStage = null,
  expectedStageName = null,
  verifiedStage = null,
  verifiedStageName = null,
  confidence = null,
  verifiedAt = null,
  status = null,
}) {
  const displayedStage = useMemo(() => {
    if (verifiedStage) {
      return clampStage(verifiedStage);
    }

    if (expectedStage) {
      return clampStage(expectedStage);
    }

    return 1;
  }, [verifiedStage, expectedStage]);

  const stemScale = STEM_SCALES[displayedStage - 1];

  const leafCount = LEAF_COUNTS[displayedStage - 1];

  const leafScale = LEAF_SCALES[displayedStage - 1];

  const fruitCount = FRUIT_COUNTS[displayedStage - 1];

  const fruitScale = FRUIT_SCALES[displayedStage - 1];

  const flowersVisible = displayedStage === 3;

  const fruitFill =
    displayedStage >= 5 ? fruitColor : "#4a7c2f";

  const progressPercent =
    cycleDays > 0
      ? Math.min(
          100,
          Math.round((dayNumber / cycleDays) * 100)
        )
      : 0;

  const progressWidth = Math.max(2, progressPercent);

  const displayedStageName =
    verifiedStageName ||
    expectedStageName ||
    STAGE_NAMES[displayedStage - 1];

  const timeAgo = getTimeAgo(verifiedAt);

  const badgeText = [
    "Photo verified",
    confidence !== null && confidence !== undefined
      ? `${confidence}%`
      : null,
    timeAgo || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const statusHint = getStatusHint(
    status,
    verifiedStageName,
    expectedStageName,
    dayNumber
  );

  return (
    <div className="gav">
      {/* SVG PLANT */}
      <div className="gav-visual">
        <svg
          viewBox="0 0 320 260"
          role="img"
          aria-label={`${cropName || "Crop"} growth stage visualization`}
        >
          {/* SUN */}
          <circle cx="276" cy="42" r="19" fill="#ffe08a" opacity="0.35" />
          <circle cx="276" cy="42" r="13" fill="#ffd66b" />

          {/* GROUND SHADOW */}
          <ellipse cx="160" cy="250" rx="66" ry="6" fill="rgba(31, 45, 38, 0.1)" />
          <line
            x1="34"
            y1="250"
            x2="286"
            y2="250"
            stroke="#dce5df"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* STEM */}
          <path
            className="gav-stem"
            d="M160 204 C 153 172 167 132 160 88"
            fill="none"
            stroke="#45803b"
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              transform: `scaleY(${stemScale})`,
              transformOrigin: "160px 204px",
            }}
          />

          {/* LEAVES */}
          {LEAF_SLOTS.map((slot, index) => {
            const visible = index < leafCount;

            const scale = visible ? leafScale : 0.2;

            const x = 160 + slot.side * 3;

            const y =
              POT_TOP_Y -
              STEM_FULL_HEIGHT * stemScale * slot.frac;

            return (
              <g
                key={`leaf-${slot.frac}`}
                className="gav-leaf"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${slot.side * scale}, ${scale})`,
                  opacity: visible ? 1 : 0,
                }}
              >
                <path
                  d="M0 0 C 12 -11 32 -10 40 -1 C 31 9 11 8 0 0 Z"
                  fill={index % 2 === 0 ? "#4d8a3d" : "#5b9c48"}
                />
                <path
                  d="M2 0 C 13 -4 26 -4 37 -1"
                  fill="none"
                  stroke="#3a6e2e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* FLOWERS (flowering stage only) */}
          {FLOWER_SLOTS.map((slot) => {
            const scale = flowersVisible ? 1 : 0.4;

            const x = 160 + slot.side * slot.dist;

            const y =
              POT_TOP_Y -
              STEM_FULL_HEIGHT * stemScale * slot.frac;

            return (
              <g
                key={`flower-${slot.frac}`}
                className="gav-flower"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${scale})`,
                  opacity: flowersVisible ? 1 : 0,
                }}
              >
                {[0, 72, 144, 216, 288].map((angle) => (
                  <ellipse
                    key={angle}
                    cx="0"
                    cy="-4.6"
                    rx="2.7"
                    ry="4.4"
                    fill="#fbf0d3"
                    transform={`rotate(${angle})`}
                  />
                ))}
                <circle cx="0" cy="0" r="2.4" fill="#f2b705" />
              </g>
            );
          })}

          {/* FRUITS */}
          {FRUIT_SLOTS.map((slot, index) => {
            const visible = index < fruitCount;

            const scale = visible ? fruitScale : 0.3;

            const x = 160 + slot.side * slot.dist;

            const y =
              POT_TOP_Y -
              STEM_FULL_HEIGHT * stemScale * slot.frac +
              6;

            return (
              <g
                key={`fruit-${slot.frac}`}
                className="gav-fruit"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${scale})`,
                  opacity: visible ? 1 : 0,
                }}
              >
                <circle cx="0" cy="8" r="10" fill={fruitFill} />
                <circle cx="0" cy="-3" r="3.2" fill="#3a6e2e" />
                <ellipse
                  cx="-3.4"
                  cy="5"
                  rx="2"
                  ry="3.4"
                  fill="#ffffff"
                  opacity="0.3"
                />
              </g>
            );
          })}

          {/* NET POT */}
          <ellipse cx="160" cy="201" rx="52" ry="5" fill="#5c4a3a" />
          <path
            d="M104 209 L113 245 Q160 254 207 245 L216 209 Z"
            fill="#b7c7bb"
          />
          <path
            d="M128 214 L133 243 M160 216 L160 247 M192 214 L187 243"
            stroke="#9db2a4"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <rect
            x="98"
            y="196"
            width="124"
            height="13"
            rx="6.5"
            fill="#9db2a4"
          />
        </svg>
      </div>

      {/* INFO PANEL */}
      <div className="gav-info">
        <div className="gav-heading">
          <h3>Growth Visualization</h3>
          <span>{cropName || "Crop"}</span>
        </div>

        {/* CYCLE PROGRESS */}
        <div className="gav-progress">
          <div className="gav-progress-label">
            <span>Cycle Progress</span>
            <strong>
              Day {dayNumber} of {cycleDays}
            </strong>
          </div>

          <div
            className="progress"
            role="progressbar"
            aria-label="Crop cycle progress"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className="progress-bar bg-success"
              style={{ width: `${progressWidth}%` }}
            ></div>
          </div>
        </div>

        {/* STAGE TRACKER */}
        <div className="gav-stages">
          {STAGE_NAMES.map((name, index) => {
            const stageNo = index + 1;

            const isDisplayed =
              stageNo === displayedStage;

            const isVerified =
              Boolean(verifiedStage) &&
              stageNo === verifiedStage;

            const isPassed = stageNo < displayedStage;

            return (
              <div
                key={name}
                className={`gav-stage ${
                  isPassed ? "passed" : ""
                } ${isDisplayed ? "active" : ""} ${
                  isVerified ? "verified" : ""
                }`}
              >
                <span className="gav-stage-dot">
                  {isVerified ? (
                    <i className="bi bi-check-lg"></i>
                  ) : (
                    stageNo
                  )}
                </span>

                <span className="gav-stage-name">
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        {/* VERIFICATION BADGE */}
        <div className="gav-meta">
          {verifiedStage ? (
            <span className="hg-badge hg-badge--success">
              <i className="bi bi-patch-check-fill"></i>
              {badgeText}
            </span>
          ) : (
            <span className="hg-badge hg-badge--neutral">
              <i className="bi bi-hourglass-split"></i>
              Schedule estimate
            </span>
          )}

          <span className="hg-badge hg-badge--info">
            <i className="bi bi-flower2"></i>
            {displayedStageName}
          </span>
        </div>

        {/* STATUS LINE */}
        <div
          className={`gav-status ${
            statusHint ? statusHint.tone : ""
          }`}
        >
          <i
            className={`bi ${
              statusHint
                ? statusHint.icon
                : verifiedStage
                  ? "bi-patch-check-fill"
                  : "bi-camera"
            }`}
          ></i>

          <span>
            {statusHint
              ? statusHint.text
              : verifiedStage
                ? `Photo verified — plant detected in ${
                    verifiedStageName || displayedStageName
                  } stage.`
                : "Awaiting photo verification from the device."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GrowthAnimation;
