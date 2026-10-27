const SENSOR_LABELS = {
  ph: "pH",
  ec: "EC",
  temperature: "Temperature",
  humidity: "Humidity",
  moisture: "Water Level",
  nitrogen: "Nitrogen",
  phosphorus: "Phosphorus",
  potassium: "Potassium",
  ppfd: "Light (PPFD)",
};

const SENSOR_UNITS = {
  ph: "",
  ec: " mS/cm",
  temperature: "°C",
  humidity: "%",
  moisture: "%",
  nitrogen: " mg/L",
  phosphorus: " mg/L",
  potassium: " mg/L",
  ppfd: " µmol/m²/s",
};

const parseRange = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    const min = Number(value.min);
    const max = Number(value.max);

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min, max };
    }

    return null;
  }

  const text = String(value).trim();

  const rangeMatch = text.match(
    /(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i
  );

  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const singleMatch = text.match(/(-?\d+(?:\.\d+)?)/);

  if (singleMatch) {
    const single = Number(singleMatch[1]);
    return { min: single, max: single };
  }

  return null;
};

const evaluateSensor = (sensor, value, range) => {
  if (!range || !SENSOR_LABELS[sensor]) {
    return null;
  }

  const num = Number(value);

  if (!Number.isFinite(num)) {
    return null;
  }

  if (num >= range.min && num <= range.max) {
    return null;
  }

  const span = Math.max(range.max - range.min, 0.5);
  const deviation = num < range.min ? range.min - num : num - range.max;
  const ratio = deviation / span;

  const severity = ratio > 0.2 ? "CRITICAL" : "WARNING";
  const label = SENSOR_LABELS[sensor];
  const unit = SENSOR_UNITS[sensor] || "";
  const side = num < range.min ? "below" : "above";

  return {
    sensor,
    value: num,
    severity,
    title: `${label} ${severity === "CRITICAL" ? "critical" : "out of range"}`,
    message: `${label} is ${num}${unit} — target range ${range.min}–${range.max}${unit} (${side} the ideal band).`,
  };
};

const evaluateReading = (sensors, requirements) => {
  const findings = [];

  for (const [sensor, rawRange] of Object.entries(requirements || {})) {
    const range = parseRange(rawRange);

    if (!range) {
      continue;
    }

    const finding = evaluateSensor(
      sensor,
      sensors ? sensors[sensor] : undefined,
      range
    );

    if (finding) {
      findings.push(finding);
    }
  }

  return findings;
};

const overallStatus = (findings) => {
  if (findings.some((item) => item.severity === "CRITICAL")) {
    return "Critical";
  }

  if (findings.some((item) => item.severity === "WARNING")) {
    return "Warning";
  }

  return "Healthy";
};

module.exports = {
  SENSOR_LABELS,
  SENSOR_UNITS,
  parseRange,
  evaluateSensor,
  evaluateReading,
  overallStatus,
};
