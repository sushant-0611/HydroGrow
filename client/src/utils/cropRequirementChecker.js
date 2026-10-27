// client/src/utils/cropRequirementChecker.js

/*
 * HydroGrow Crop Requirement Checker
 *
 * Compares current simulator/sensor values
 * against the selected crop's requirements.
 *
 * Supported crop-specific comparisons:
 * - pH
 * - EC
 * - Temperature
 * - Humidity
 * - PPFD
 *
 * Photoperiod is displayed as a crop requirement,
 * but is not compared because the current sensor
 * data does not contain a light-duration value.
 *
 * N/P/K are also not compared because the provided
 * crop dataset does not contain crop-specific N/P/K
 * requirement ranges.
 */

// --------------------------------------------------
// RANGE PARSER
// --------------------------------------------------

export function parseRange(range) {
  if (!range) {
    return null;
  }

  const cleaned = String(range)
    .replace(/[–—]/g, "-")
    .replace(/[^\d.+-]/g, " ")
    .trim();

  const numbers = cleaned
    .split(/\s+/)
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (numbers.length < 2) {
    return null;
  }

  return {
    min: numbers[0],
    max: numbers[1],
  };
}

// --------------------------------------------------
// NUMBER PARSER
// --------------------------------------------------

export function parseValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// --------------------------------------------------
// RANGE CHECK
// --------------------------------------------------

export function checkRange(
  currentValue,
  range,
  warningMargin = 0.15
) {
  const value = parseValue(currentValue);
  const parsedRange =
    typeof range === "string"
      ? parseRange(range)
      : range;

  if (
    value === null ||
    !parsedRange ||
    !Number.isFinite(parsedRange.min) ||
    !Number.isFinite(parsedRange.max)
  ) {
    return {
      status: "no-data",
      label: "No Data",
      message: "Requirement data is unavailable.",
    };
  }

  const { min, max } = parsedRange;

  // Outside required range
  if (value < min) {
    const distance = min - value;
    const warningZone =
      (max - min) * warningMargin;

    if (distance <= warningZone) {
      return {
        status: "warning",
        label: "Warning",
        message: "Slightly below recommended range.",
      };
    }

    return {
      status: "critical",
      label: "Critical",
      message: "Below recommended range.",
    };
  }

  if (value > max) {
    const distance = value - max;
    const warningZone =
      (max - min) * warningMargin;

    if (distance <= warningZone) {
      return {
        status: "warning",
        label: "Warning",
        message: "Slightly above recommended range.",
      };
    }

    return {
      status: "critical",
      label: "Critical",
      message: "Above recommended range.",
    };
  }

  // Inside recommended range
  return {
    status: "healthy",
    label: "Healthy",
    message: "Within recommended range.",
  };
}

// --------------------------------------------------
// SENSOR → CROP PARAMETER MAPPING
// --------------------------------------------------

const PARAMETER_CONFIG = [
  {
    key: "ph",
    cropKey: "ph",
    label: "pH",
    unit: "",
  },
  {
    key: "ec",
    cropKey: "ec",
    label: "EC",
    unit: "",
  },
  {
    key: "temperature",
    cropKey: "temperature",
    label: "Temperature",
    unit: "°C",
  },
  {
    key: "humidity",
    cropKey: "humidity",
    label: "Humidity",
    unit: "%",
  },
  {
    key: "ppfd",
    cropKey: "ppfd",
    label: "PPFD",
    unit: "µmol/m²/s",
  },
];

// --------------------------------------------------
// CHECK SELECTED CROP
// --------------------------------------------------

export function checkCropRequirements(
  crop,
  sensorData
) {
  if (!crop) {
    return [];
  }

  if (!sensorData) {
    return [];
  }

  return PARAMETER_CONFIG.map((parameter) => {
    const currentValue =
      sensorData[parameter.key];

    const requiredRange =
      crop[parameter.cropKey];

    const result = checkRange(
      currentValue,
      requiredRange
    );

    return {
      key: parameter.key,
      label: parameter.label,
      unit: parameter.unit,
      currentValue: parseValue(currentValue),
      requiredRange,
      ...result,
    };
  });
}

// --------------------------------------------------
// OVERALL CROP STATUS
// --------------------------------------------------

export function getOverallCropStatus(results) {
  if (!results || results.length === 0) {
    return {
      status: "no-data",
      label: "No Data",
    };
  }

  const hasCritical = results.some(
    (item) => item.status === "critical"
  );

  const hasWarning = results.some(
    (item) => item.status === "warning"
  );

  if (hasCritical) {
    return {
      status: "critical",
      label: "Critical",
    };
  }

  if (hasWarning) {
    return {
      status: "warning",
      label: "Warning",
    };
  }

  return {
    status: "healthy",
    label: "Healthy",
  };
}

// --------------------------------------------------
// RECOMMENDATION
// --------------------------------------------------

export function getRecommendation(result) {
  if (!result) {
    return "";
  }

  if (result.status === "healthy") {
    return `${result.label} is within the recommended range.`;
  }

  if (result.status === "warning") {
    if (result.message.includes("below")) {
      return `Increase ${result.label} gradually toward the recommended range.`;
    }

    if (result.message.includes("above")) {
      return `Reduce ${result.label} gradually toward the recommended range.`;
    }

    return `Monitor ${result.label} closely.`;
  }

  if (result.status === "critical") {
    if (result.message.includes("Below")) {
      return `${result.label} is below the crop requirement. Correct the condition toward the recommended range.`;
    }

    if (result.message.includes("Above")) {
      return `${result.label} is above the crop requirement. Correct the condition toward the recommended range.`;
    }

    return `Immediate attention is required for ${result.label}.`;
  }

  return "No recommendation available.";
}

// --------------------------------------------------
// STATUS CLASS
// --------------------------------------------------

export function getStatusClass(status) {
  switch (status) {
    case "healthy":
      return "status-healthy";

    case "warning":
      return "status-warning";

    case "critical":
      return "status-critical";

    default:
      return "status-no-data";
  }
}

// --------------------------------------------------
// STATUS ICON
// --------------------------------------------------

export function getStatusIcon(status) {
  switch (status) {
    case "healthy":
      return "bi-check-circle-fill";

    case "warning":
      return "bi-exclamation-triangle-fill";

    case "critical":
      return "bi-x-circle-fill";

    default:
      return "bi-dash-circle";
  }
}