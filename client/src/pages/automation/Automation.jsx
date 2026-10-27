import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useSensor from "../../hooks/useSensor";
import { useCrop } from "../../context/CropContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getCropById } from "../../data/cropData";

import "../../assets/styles/automation.css";

/* =========================================================
   AUTOMATION RULE DEFINITIONS
   ========================================================= */

const RULES = [
  {
    id: "nutrient",
    title: "Nutrient Management",
    description: "Monitor EC and nutrient conditions.",
    icon: "bi-moisture",
    trigger: "EC outside recommended range",
    action: "Nutrient adjustment required",
    sensor: "ec",
    requirementKey: "ec",
  },
  {
    id: "temperature",
    title: "Temperature Control",
    description: "Monitor growing environment temperature.",
    icon: "bi-thermometer-half",
    trigger: "Temperature outside recommended range",
    action: "Cooling / heating action required",
    sensor: "temperature",
    requirementKey: "temperature",
  },
  {
    id: "humidity",
    title: "Humidity Control",
    description: "Maintain suitable humidity conditions.",
    icon: "bi-cloud-drizzle",
    trigger: "Humidity outside recommended range",
    action: "Ventilation adjustment required",
    sensor: "humidity",
    requirementKey: "humidity",
  },
  {
    id: "moisture",
    title: "Moisture Control",
    description: "Monitor root-zone moisture conditions.",
    icon: "bi-water",
    trigger: "Moisture outside recommended range",
    action: "Irrigation action required",
    sensor: "moisture",
    requirementKey: null,
    fallbackRange: [55, 85],
  },
  {
    id: "light",
    title: "Lighting Control",
    description: "Monitor available PPFD for crop growth.",
    icon: "bi-brightness-high",
    trigger: "PPFD outside recommended range",
    action: "Lighting adjustment required",
    sensor: "ppfd",
    requirementKey: "ppfd",
  },
];

const SENSOR_OPTIONS = [
  "ph",
  "ec",
  "temperature",
  "humidity",
  "moisture",
  "nitrogen",
  "phosphorus",
  "potassium",
  "ppfd",
];

const CONDITION_OPTIONS = [
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_THAN_EQUAL",
  "LESS_THAN_EQUAL",
  "EQUAL",
];

const ACTION_OPTIONS = [
  "PUMP_ON",
  "PUMP_OFF",
  "FAN_ON",
  "FAN_OFF",
  "LIGHT_ON",
  "LIGHT_OFF",
  "ALERT",
];

const SENSOR_LABELS = {
  ph: "pH",
  ec: "EC",
  temperature: "Temperature",
  humidity: "Humidity",
  moisture: "Moisture",
  nitrogen: "Nitrogen",
  phosphorus: "Phosphorus",
  potassium: "Potassium",
  ppfd: "PPFD",
};

const SENSOR_ICONS = {
  ph: "bi-droplet-half",
  ec: "bi-moisture",
  temperature: "bi-thermometer-half",
  humidity: "bi-cloud-drizzle",
  moisture: "bi-water",
  nitrogen: "bi-flower1",
  phosphorus: "bi-flower2",
  potassium: "bi-flower3",
  ppfd: "bi-brightness-high",
};

const CONDITION_SYMBOLS = {
  GREATER_THAN: ">",
  LESS_THAN: "<",
  GREATER_THAN_EQUAL: "≥",
  LESS_THAN_EQUAL: "≤",
  EQUAL: "=",
};

const ACTION_LABELS = {
  PUMP_ON: "Turn pump ON",
  PUMP_OFF: "Turn pump OFF",
  FAN_ON: "Turn fan ON",
  FAN_OFF: "Turn fan OFF",
  LIGHT_ON: "Turn lights ON",
  LIGHT_OFF: "Turn lights OFF",
  ALERT: "Raise an alert",
};

/* =========================================================
   HELPERS
   ========================================================= */

function parseRange(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const numbers = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return null;
  }

  if (numbers.length === 1) {
    const number = Number(numbers[0]);

    return {
      min: number,
      max: number,
    };
  }

  return {
    min: Number(numbers[0]),
    max: Number(numbers[1]),
  };
}

function getRequirement(rule, crop) {
  if (crop && rule.requirementKey) {
    const cropRequirement = parseRange(
      crop[rule.requirementKey]
    );

    if (cropRequirement) {
      return cropRequirement;
    }
  }

  if (rule.fallbackRange) {
    return {
      min: rule.fallbackRange[0],
      max: rule.fallbackRange[1],
    };
  }

  return null;
}

function getRuleStatus(rule, sensorData, crop) {
  const rawValue = sensorData?.[rule.sensor];

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ""
  ) {
    return "unknown";
  }

  const value = Number(rawValue);

  if (Number.isNaN(value)) {
    return "unknown";
  }

  const requirement = getRequirement(rule, crop);

  if (!requirement) {
    return "unknown";
  }

  if (
    value < requirement.min ||
    value > requirement.max
  ) {
    return "triggered";
  }

  return "normal";
}

function formatRequirement(requirement) {
  if (!requirement) {
    return "Not configured";
  }

  return `${requirement.min} – ${requirement.max}`;
}

function formatSensorValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  const numericValue = Number(value);

  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2);
}

function getRuleStatusLabel(status) {
  if (status === "normal") {
    return "Normal";
  }

  if (status === "triggered") {
    return "Triggered";
  }

  return "No Data";
}

function getRuleStatusIcon(status) {
  if (status === "normal") {
    return "bi-check-circle-fill";
  }

  if (status === "triggered") {
    return "bi-exclamation-triangle-fill";
  }

  return "bi-dash-circle-fill";
}

function getSensorLabel(sensor) {
  return SENSOR_LABELS[sensor] || sensor;
}

function getConditionSymbol(condition) {
  return CONDITION_SYMBOLS[condition] || condition;
}

function getConditionOptionLabel(condition) {
  const words = condition
    .toLowerCase()
    .replace(/_/g, " ");

  return `${words} (${CONDITION_SYMBOLS[condition]})`;
}

function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

function isSensorValueMissing(value) {
  return (
    value === undefined ||
    value === null ||
    value === ""
  );
}

function evaluateCondition(value, condition, threshold) {
  if (isSensorValueMissing(value)) {
    return false;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return false;
  }

  if (condition === "GREATER_THAN") {
    return numericValue > threshold;
  }

  if (condition === "LESS_THAN") {
    return numericValue < threshold;
  }

  if (condition === "GREATER_THAN_EQUAL") {
    return numericValue >= threshold;
  }

  if (condition === "LESS_THAN_EQUAL") {
    return numericValue <= threshold;
  }

  if (condition === "EQUAL") {
    return numericValue === threshold;
  }

  return false;
}

/* =========================================================
   AUTOMATION PAGE
   ========================================================= */

function Automation() {
  const { sensorData } = useSensor();

  const { user } = useAuth();

  const {
    selectedCrops,
    activeCrop,
    activeCropId,
    selectActiveCrop,
    updateAutomation,
  } = useCrop();

  const [mode, setMode] = useState(
    activeCrop?.automation?.mode || "automatic"
  );

  const [devices, setDevices] = useState({
    irrigation:
      activeCrop?.automation?.devices?.irrigation || false,
    nutrient:
      activeCrop?.automation?.devices?.nutrient || false,
    ventilation:
      activeCrop?.automation?.devices?.ventilation || false,
    lighting:
      activeCrop?.automation?.devices?.lighting || false,
    cooling:
      activeCrop?.automation?.devices?.cooling || false,
  });

  const [enabledRules, setEnabledRules] = useState({
    nutrient:
      activeCrop?.automation?.rules?.nutrient ?? true,
    temperature:
      activeCrop?.automation?.rules?.temperature ?? true,
    humidity:
      activeCrop?.automation?.rules?.humidity ?? true,
    moisture:
      activeCrop?.automation?.rules?.moisture ?? true,
    light:
      activeCrop?.automation?.rules?.light ?? true,
  });

  const [apiRules, setApiRules] = useState(null);

  const [ruleDraft, setRuleDraft] = useState({
    name: "",
    sensor: "ph",
    condition: "GREATER_THAN",
    threshold: "",
    action: "ALERT",
  });

  const [ruleNotice, setRuleNotice] = useState(null);

  const [savingRule, setSavingRule] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadRules = async () => {
      try {
        const data = await api.get("/automation");

        if (cancelled) {
          return;
        }

        setApiRules(
          Array.isArray(data.rules)
            ? data.rules
            : []
        );
      } catch {
        if (cancelled) {
          return;
        }

        // backend offline — fall back to demo rules
        setApiRules(null);
      }
    };

    loadRules();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* =========================================================
     ACTIVE CROP DATA
     ========================================================= */

  const activeCropData = useMemo(() => {
    if (!activeCrop) {
      return null;
    }

    const cropId =
      activeCrop.cropId ||
      activeCrop.id ||
      activeCropId;

    return getCropById(cropId) || activeCrop;
  }, [activeCrop, activeCropId]);

  /* =========================================================
     RULE STATUS
     ========================================================= */

  const ruleStatus = useMemo(() => {
    return RULES.map((rule) => {
      const requirement = getRequirement(
        rule,
        activeCropData
      );

      const value = sensorData?.[rule.sensor];

      return {
        ...rule,
        value,
        requirement,
        status: getRuleStatus(
          rule,
          sensorData,
          activeCropData
        ),
      };
    });
  }, [sensorData, activeCropData]);

  const realRuleStatus = useMemo(() => {
    if (!apiRules) {
      return null;
    }

    return apiRules.map((rule) => {
      const value = sensorData?.[rule.sensor];

      const triggered =
        rule.enabled &&
        evaluateCondition(
          value,
          rule.condition,
          rule.threshold
        );

      return {
        id: rule._id,
        isApi: true,
        title: rule.name,
        description: `Device ${rule.deviceId} • ${
          rule.lastTriggeredAt
            ? `Last triggered ${new Date(
                rule.lastTriggeredAt
              ).toLocaleString()}`
            : "Never triggered"
        }`,
        icon:
          SENSOR_ICONS[rule.sensor] ||
          "bi-sliders",
        value,
        requirement: null,
        enabled: rule.enabled,
        trigger: `${getSensorLabel(
          rule.sensor
        )} ${getConditionSymbol(
          rule.condition
        )} ${rule.threshold}`,
        action: getActionLabel(rule.action),
        status: isSensorValueMissing(value)
          ? "unknown"
          : triggered
          ? "triggered"
          : "normal",
      };
    });
  }, [apiRules, sensorData]);

  const displayRules = useMemo(() => {
    if (realRuleStatus) {
      return realRuleStatus;
    }

    return ruleStatus.map((rule) => ({
      ...rule,
      enabled: enabledRules[rule.id],
    }));
  }, [realRuleStatus, ruleStatus, enabledRules]);

  const enabledRuleCount = displayRules.filter(
    (rule) => rule.enabled
  ).length;

  const triggeredRules = displayRules.filter(
    (rule) =>
      rule.status === "triggered" &&
      rule.enabled
  );

  const normalRuleCount = displayRules.filter(
    (rule) => rule.status === "normal"
  ).length;

  const noDataRuleCount = displayRules.filter(
    (rule) => rule.status === "unknown"
  ).length;

  /* =========================================================
     DEVICE HELPERS
     ========================================================= */

  const toggleDevice = (device) => {
    if (mode === "automatic") {
      return;
    }

    setDevices((current) => {
      const next = {
        ...current,
        [device]: !current[device],
      };

      updateAutomation?.({
        mode,
        devices: next,
        rules: enabledRules,
      });

      return next;
    });
  };

  const toggleRule = (ruleId) => {
    setEnabledRules((current) => {
      const next = {
        ...current,
        [ruleId]: !current[ruleId],
      };

      updateAutomation?.({
        mode,
        devices,
        rules: next,
      });

      return next;
    });
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);

    updateAutomation?.({
      mode: nextMode,
      devices,
      rules: enabledRules,
    });
  };

  const updateRuleDraft = (field, value) => {
    setRuleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const createRule = async (event) => {
    event.preventDefault();

    setRuleNotice(null);

    if (!ruleDraft.name.trim()) {
      setRuleNotice({
        type: "error",
        text: "Please enter a rule name.",
      });

      return;
    }

    if (
      ruleDraft.threshold === "" ||
      Number.isNaN(Number(ruleDraft.threshold))
    ) {
      setRuleNotice({
        type: "error",
        text: "Please enter a numeric threshold.",
      });

      return;
    }

    setSavingRule(true);

    try {
      const data = await api.post("/automation", {
        name: ruleDraft.name.trim(),
        deviceId,
        sensor: ruleDraft.sensor,
        condition: ruleDraft.condition,
        threshold: Number(ruleDraft.threshold),
        action: ruleDraft.action,
      });

      setApiRules((current) =>
        current
          ? [data.rule, ...current]
          : current
      );

      setRuleDraft((current) => ({
        name: "",
        sensor: current.sensor,
        condition: current.condition,
        threshold: "",
        action: current.action,
      }));

      setRuleNotice({
        type: "success",
        text:
          data.message ||
          "Automation rule created.",
      });
    } catch (error) {
      setRuleNotice({
        type: "error",
        text: error.message,
      });
    } finally {
      setSavingRule(false);
    }
  };

  const toggleApiRule = async (ruleId) => {
    try {
      const data = await api.patch(
        `/automation/${ruleId}/toggle`
      );

      setApiRules((current) =>
        current
          ? current.map((rule) =>
              rule._id === ruleId && data.rule
                ? data.rule
                : rule
            )
          : current
      );
    } catch {
      setRuleNotice({
        type: "error",
        text: "Could not update the rule. Please try again.",
      });
    }
  };

  const deleteApiRule = async (ruleId) => {
    try {
      await api.del(`/automation/${ruleId}`);

      setApiRules((current) =>
        current
          ? current.filter(
              (rule) => rule._id !== ruleId
            )
          : current
      );
    } catch {
      setRuleNotice({
        type: "error",
        text: "Could not delete the rule. Please try again.",
      });
    }
  };

  /* =========================================================
     ACTIVE CROP STATE
     ========================================================= */

  const hasActiveCrop = Boolean(activeCropData);

  const deviceId =
    activeCrop?.device?.deviceId ||
    activeCrop?.device?.id ||
    "HYDROGROW-SIM-001";

  const deviceStatus =
    activeCrop?.device?.status ||
    "Configured";

  return (
    <div className="automation-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="automation-header">
        <div>
          <span className="automation-eyebrow">
            <i className="bi bi-cpu"></i>
            CONTROL & AUTOMATION
          </span>

          <h1>Automation</h1>

          <p>
            Configure crop-specific automation rules
            and control the connected hydroponic
            equipment.
          </p>
        </div>

        <div className="automation-system-status">
          <span></span>
          AUTOMATION ENGINE
        </div>
      </div>

      {/* =====================================================
          ACTIVE CROP
          ===================================================== */}

      <section className="automation-crop-section">

        <div className="automation-section-title">
          <div>
            <span className="automation-section-kicker">
              ACTIVE CROP
            </span>

            <h2>
              {hasActiveCrop
                ? "Automation for selected crop"
                : "Select a crop to configure automation"}
            </h2>
          </div>
        </div>

        {selectedCrops?.length > 0 ? (
          <div className="automation-crop-selector">

            {selectedCrops.map((farmCrop) => {
              const crop =
                getCropById(
                  farmCrop.cropId ||
                  farmCrop.id
                ) || farmCrop;

              const cropId =
                farmCrop.cropId ||
                farmCrop.id;

              const isActive =
                activeCropId === cropId ||
                activeCrop?.cropId === cropId ||
                activeCrop?.id === cropId;

              return (
                <button
                  type="button"
                  key={cropId}
                  className={`automation-crop-chip ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    selectActiveCrop(cropId)
                  }
                >
                  <span className="automation-crop-chip-image">
                    {crop?.images?.[0] ||
                    crop?.image ? (
                      <img
                        src={
                          crop?.images?.[0] ||
                          crop?.image
                        }
                        alt={crop?.name || "Crop"}
                      />
                    ) : (
                      <i className="bi bi-flower1"></i>
                    )}
                  </span>

                  <span>
                    {crop?.name || "Crop"}
                  </span>

                  {isActive && (
                    <i className="bi bi-check-circle-fill"></i>
                  )}
                </button>
              );
            })}

          </div>
        ) : (
          <div className="automation-no-crop">
            <div className="automation-no-crop-icon">
              <i className="bi bi-flower1"></i>
            </div>

            <div>
              <strong>No Crop Selected</strong>

              <p>
                Select and configure a crop before
                using crop-specific automation.
              </p>
            </div>

            <Link
              to="/crop-management"
              className="automation-select-crop-btn"
            >
              Select Your Crop
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        )}

        {hasActiveCrop && (
          <div className="automation-active-crop-info">

            <div className="automation-active-crop-main">

              <div className="automation-active-crop-image">
                {activeCropData?.images?.[0] ||
                activeCropData?.image ? (
                  <img
                    src={
                      activeCropData?.images?.[0] ||
                      activeCropData?.image
                    }
                    alt={activeCropData?.name}
                  />
                ) : (
                  <i className="bi bi-flower1"></i>
                )}
              </div>

              <div>
                <span>Automation Crop</span>

                <h3>
                  {activeCropData?.name}
                </h3>

                <p>
                  {activeCrop?.farmUnit ||
                    "Farm Unit not specified"}
                </p>
              </div>

            </div>

            <div className="automation-device-summary">

              <span>Device</span>

              <strong>
                {deviceId}
              </strong>

              <small>
                <i className="bi bi-circle-fill"></i>
                {deviceStatus}
              </small>

            </div>

          </div>
        )}

      </section>

      {/* =====================================================
          NO CROP STATE
          ===================================================== */}

      {!hasActiveCrop ? (
        <div className="automation-page-empty">

          <div className="automation-page-empty-icon">
            <i className="bi bi-sliders"></i>
          </div>

          <h3>
            Automation Not Configured
          </h3>

          <p>
            Select a crop and add it to My Farm
            before configuring automation rules.
          </p>

          <Link
            to="/crop-management"
            className="automation-primary-btn"
          >
            Select Crop
            <i className="bi bi-arrow-right"></i>
          </Link>

        </div>
      ) : (
        <>
          {/* =================================================
              CONTROL MODE
              ================================================= */}

          <div className="automation-mode-panel">

            <div className="automation-mode-content">

              <div className="automation-mode-icon">
                <i
                  className={
                    mode === "automatic"
                      ? "bi bi-robot"
                      : "bi bi-hand-index"
                  }
                ></i>
              </div>

              <div>
                <span>CONTROL MODE</span>

                <h2>
                  {mode === "automatic"
                    ? "Automatic Mode"
                    : "Manual Mode"}
                </h2>

                <p>
                  {mode === "automatic"
                    ? "HydroGrow evaluates sensor readings and applies configured automation logic."
                    : "Manual control is enabled. You can operate the simulated devices individually."}
                </p>
              </div>

            </div>

            <div className="automation-mode-switch">

              <button
                type="button"
                className={
                  mode === "automatic"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeMode("automatic")
                }
              >
                <i className="bi bi-robot"></i>
                Automatic
              </button>

              <button
                type="button"
                className={
                  mode === "manual"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeMode("manual")
                }
              >
                <i className="bi bi-hand-index"></i>
                Manual
              </button>

            </div>

          </div>

          {/* =================================================
              SUMMARY
              ================================================= */}

          <div className="automation-summary">

            <div className="automation-summary-card">
              <div className="automation-summary-icon">
                <i className="bi bi-diagram-3"></i>
              </div>

              <div>
                <span>Active Rules</span>
                <strong>
                  {enabledRuleCount}
                </strong>
              </div>
            </div>

            <div className="automation-summary-card">
              <div className="automation-summary-icon green">
                <i className="bi bi-check-circle"></i>
              </div>

              <div>
                <span>Normal Rules</span>
                <strong>
                  {normalRuleCount}
                </strong>
              </div>
            </div>

            <div className="automation-summary-card">
              <div className="automation-summary-icon warning">
                <i className="bi bi-exclamation-triangle"></i>
              </div>

              <div>
                <span>Triggered</span>
                <strong>
                  {triggeredRules.length}
                </strong>
              </div>
            </div>

            <div className="automation-summary-card">
              <div className="automation-summary-icon neutral">
                <i className="bi bi-dash-circle"></i>
              </div>

              <div>
                <span>No Data</span>
                <strong>
                  {noDataRuleCount}
                </strong>
              </div>
            </div>

            <div className="automation-summary-card">
              <div className="automation-summary-icon crop">
                <i className="bi bi-flower1"></i>
              </div>

              <div>
                <span>Active Crop</span>
                <strong>
                  {activeCropData?.name || "--"}
                </strong>
              </div>
            </div>

          </div>

          {/* =================================================
              RULES
              ================================================= */}

          <div className="automation-section-header">

            <div>
              <span>
                AUTOMATION RULES
              </span>

              <h2>
                Control Logic
              </h2>

              <p>
                Rules are evaluated using the
                requirements configured for{" "}
                <strong>
                  {activeCropData?.name}
                </strong>.
              </p>
            </div>

            <span className="automation-crop">
              <i className="bi bi-flower1"></i>
              {activeCropData?.name}
            </span>

          </div>

          {realRuleStatus && (
            <div className="automation-rules">

              <form
                className="automation-panel"
                onSubmit={createRule}
              >

                <div className="automation-panel-header">

                  <div>
                    <span>
                      NEW RULE
                    </span>

                    <h2>
                      Create Automation Rule
                    </h2>
                  </div>

                  <span className="automation-crop">
                    <i className="bi bi-cpu"></i>
                    {deviceId}
                  </span>

                </div>

                <div className="row g-2">

                  <div className="col-12 col-md-4">
                    <label className="form-label">
                      Rule Name
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Keep pH below 6.5"
                      value={ruleDraft.name}
                      onChange={(event) =>
                        updateRuleDraft(
                          "name",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label">
                      Sensor
                    </label>

                    <select
                      className="form-select"
                      value={ruleDraft.sensor}
                      onChange={(event) =>
                        updateRuleDraft(
                          "sensor",
                          event.target.value
                        )
                      }
                    >
                      {SENSOR_OPTIONS.map((sensor) => (
                        <option
                          key={sensor}
                          value={sensor}
                        >
                          {getSensorLabel(sensor)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label">
                      Condition
                    </label>

                    <select
                      className="form-select"
                      value={ruleDraft.condition}
                      onChange={(event) =>
                        updateRuleDraft(
                          "condition",
                          event.target.value
                        )
                      }
                    >
                      {CONDITION_OPTIONS.map((condition) => (
                        <option
                          key={condition}
                          value={condition}
                        >
                          {getConditionOptionLabel(
                            condition
                          )}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6 col-md-1">
                    <label className="form-label">
                      Value
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={ruleDraft.threshold}
                      onChange={(event) =>
                        updateRuleDraft(
                          "threshold",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label">
                      Action
                    </label>

                    <select
                      className="form-select"
                      value={ruleDraft.action}
                      onChange={(event) =>
                        updateRuleDraft(
                          "action",
                          event.target.value
                        )
                      }
                    >
                      {ACTION_OPTIONS.map((action) => (
                        <option
                          key={action}
                          value={action}
                        >
                          {getActionLabel(action)}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="d-flex align-items-center flex-wrap gap-3 mt-3">

                  <button
                    type="submit"
                    className="hg-btn hg-btn--primary"
                    disabled={savingRule}
                  >
                    <i className="bi bi-plus-lg"></i>

                    {savingRule
                      ? "Creating..."
                      : "Create Rule"}
                  </button>

                  {ruleNotice && (
                    <span
                      className={`automation-rule-status ${
                        ruleNotice.type === "error"
                          ? "triggered"
                          : ""
                      }`}
                    >
                      <i
                        className={`bi ${
                          ruleNotice.type === "error"
                            ? "bi-exclamation-triangle-fill"
                            : "bi-check-circle-fill"
                        }`}
                      ></i>

                      {ruleNotice.text}
                    </span>
                  )}

                </div>

              </form>

            </div>
          )}

          <div className="automation-rules">

            {displayRules.map((rule) => (
              <div
                className={`automation-rule-card ${
                  !rule.enabled
                    ? "disabled"
                    : ""
                }`}
                key={rule.id}
              >

                <div className="automation-rule-main">

                  <div className="automation-rule-icon">
                    <i
                      className={`bi ${rule.icon}`}
                    ></i>
                  </div>

                  <div className="automation-rule-info">

                    <div className="automation-rule-title">

                      <div>
                        <h3>
                          {rule.title}
                        </h3>

                        <span
                          className={`automation-rule-status ${rule.status}`}
                        >
                          <i
                            className={`bi ${getRuleStatusIcon(
                              rule.status
                            )}`}
                          ></i>

                          {getRuleStatusLabel(
                            rule.status
                          )}
                        </span>
                      </div>

                      <label className="automation-toggle">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() =>
                            rule.isApi
                              ? toggleApiRule(
                                  rule.id
                                )
                              : toggleRule(rule.id)
                          }
                        />

                        <span></span>
                      </label>

                      {rule.isApi && (
                        <button
                          type="button"
                          className="hg-btn hg-btn--danger"
                          onClick={() =>
                            deleteApiRule(rule.id)
                          }
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}

                    </div>

                    <p>
                      {rule.description}
                    </p>

                    <div className="automation-rule-reading">

                      <div>
                        <span>
                          Current Value
                        </span>

                        <strong>
                          {formatSensorValue(
                            rule.value
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Recommended Range
                        </span>

                        <strong>
                          {formatRequirement(
                            rule.requirement
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="automation-rule-flow">

                      <div>
                        <span>IF</span>

                        <strong>
                          {rule.trigger}
                        </strong>
                      </div>

                      <i className="bi bi-arrow-right"></i>

                      <div>
                        <span>THEN</span>

                        <strong>
                          {rule.action}
                        </strong>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* =================================================
              DEVICE CONTROL
              ================================================= */}

          <div className="automation-section-header automation-device-header">

            <div>
              <span>
                DEVICE CONTROL
              </span>

              <h2>
                Hydroponic Equipment
              </h2>

              <p>
                Manual control is available only
                when Manual Mode is selected.
              </p>
            </div>

            <span
              className={`automation-control-badge ${
                mode === "manual"
                  ? "manual"
                  : "locked"
              }`}
            >
              <i
                className={
                  mode === "manual"
                    ? "bi bi-unlock"
                    : "bi bi-lock"
                }
              ></i>

              {mode === "manual"
                ? "Manual Control Enabled"
                : "Switch to Manual Mode"}
            </span>

          </div>

          <div className="automation-device-grid">

            <DeviceCard
              icon="bi-droplet"
              title="Irrigation Pump"
              description="Water delivery system"
              active={devices.irrigation}
              onToggle={() =>
                toggleDevice("irrigation")
              }
              disabled={mode === "automatic"}
            />

            <DeviceCard
              icon="bi-moisture"
              title="Nutrient System"
              description="Nutrient dosing system"
              active={devices.nutrient}
              onToggle={() =>
                toggleDevice("nutrient")
              }
              disabled={mode === "automatic"}
            />

            <DeviceCard
              icon="bi-wind"
              title="Ventilation"
              description="Air circulation system"
              active={devices.ventilation}
              onToggle={() =>
                toggleDevice("ventilation")
              }
              disabled={mode === "automatic"}
            />

            <DeviceCard
              icon="bi-brightness-high"
              title="Grow Lights"
              description="Supplemental lighting"
              active={devices.lighting}
              onToggle={() =>
                toggleDevice("lighting")
              }
              disabled={mode === "automatic"}
            />

            <DeviceCard
              icon="bi-snow"
              title="Cooling System"
              description="Temperature control"
              active={devices.cooling}
              onToggle={() =>
                toggleDevice("cooling")
              }
              disabled={mode === "automatic"}
            />

          </div>

          {/* =================================================
              ACTIVITY + SUMMARY
              ================================================= */}

          <div className="automation-bottom-grid">

            <div className="automation-panel">

              <div className="automation-panel-header">

                <div>
                  <span>
                    ACTIVITY
                  </span>

                  <h2>
                    Automation Activity
                  </h2>
                </div>

                <span className="automation-live-badge">
                  <span></span>
                  LIVE
                </span>

              </div>

              {triggeredRules.length > 0 ? (
                <div className="automation-events">

                  {triggeredRules.map((rule) => (
                    <div
                      className="automation-event"
                      key={rule.id}
                    >

                      <div className="automation-event-icon">
                        <i className="bi bi-lightning-charge"></i>
                      </div>

                      <div>
                        <strong>
                          {rule.title}
                        </strong>

                        <p>
                          Rule triggered because the
                          current sensor value is
                          outside the recommended
                          range.
                        </p>
                      </div>

                      <span>
                        ACTIVE
                      </span>

                    </div>
                  ))}

                </div>
              ) : (
                <div className="automation-empty">

                  <div>
                    <i className="bi bi-check2-circle"></i>
                  </div>

                  <strong>
                    No automation actions required
                  </strong>

                  <span>
                    {noDataRuleCount > 0
                      ? "Waiting for sensor readings before evaluating all automation rules."
                      : "All enabled rules are currently operating within their configured conditions."}
                  </span>

                </div>
              )}

            </div>

            <div className="automation-panel">

              <div className="automation-panel-header">

                <div>
                  <span>
                    SYSTEM
                  </span>

                  <h2>
                    Automation Summary
                  </h2>
                </div>

              </div>

              <div className="automation-summary-list">

                <div>
                  <span>
                    Control Mode
                  </span>

                  <strong>
                    {mode === "automatic"
                      ? "Automatic"
                      : "Manual"}
                  </strong>
                </div>

                <div>
                  <span>
                    Crop
                  </span>

                  <strong>
                    {activeCropData?.name ||
                      "--"}
                  </strong>
                </div>

                <div>
                  <span>
                    Rules Enabled
                  </span>

                  <strong>
                    {enabledRuleCount} /{" "}
                    {displayRules.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Device Interface
                  </span>

                  <strong>
                    Input Simulator
                  </strong>
                </div>

                <div>
                  <span>
                    Device ID
                  </span>

                  <strong>
                    {deviceId}
                  </strong>
                </div>

                <div>
                  <span>
                    Engine Status
                  </span>

                  <strong className="online-text">
                    Ready
                  </strong>
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              INFO
              ================================================= */}

          <div className="automation-info">

            <div className="automation-info-icon">
              <i className="bi bi-info-circle"></i>
            </div>

            <div>
              <strong>
                Automation architecture
              </strong>

              <p>
                HydroGrow evaluates sensor readings
                against the active crop requirements.
                The current implementation uses the
                Input Simulator and REST API architecture.
                Hardware control can be connected to the
                same automation layer later.
              </p>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

/* =========================================================
   DEVICE CARD
   ========================================================= */

function DeviceCard({
  icon,
  title,
  description,
  active,
  onToggle,
  disabled,
}) {
  return (
    <div
      className={`automation-device-card ${
        active ? "active" : ""
      } ${disabled ? "disabled" : ""}`}
    >

      <div className="automation-device-top">

        <div className="automation-device-icon">
          <i className={`bi ${icon}`}></i>
        </div>

        <span
          className={`automation-device-status ${
            active ? "active" : ""
          }`}
        >
          {active ? "ON" : "OFF"}
        </span>

      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`automation-device-button ${
          active ? "active" : ""
        }`}
      >
        <i
          className={
            active
              ? "bi bi-power"
              : "bi bi-circle"
          }
        ></i>

        {active ? "Turn Off" : "Turn On"}
      </button>

    </div>
  );
}

export default Automation;