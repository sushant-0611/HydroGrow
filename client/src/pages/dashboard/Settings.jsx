import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useCrop } from "../../context/CropContext";

import "../../assets/styles/Settings.css";

const SETTINGS_STORAGE_KEY = "hydrogrow_settings";

const DEFAULT_SETTINGS = {
  autoRefresh: true,
  notifications: true,
  emailAlerts: true,
  criticalAlerts: true,
  harvestReminders: true,
  automationMode: "Automatic",
  measurementUnit: "Metric",
};

const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(stored),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const getCropName = (crop) =>
  crop?.crop?.name ||
  crop?.cropName ||
  crop?.name ||
  crop?.cropData?.name ||
  "Selected Crop";

const getFarmUnit = (crop) =>
  crop?.farmUnitName ||
  crop?.farmUnit ||
  crop?.farm?.name ||
  "My Farm Unit";

const getPlantCount = (crop) =>
  crop?.numberOfPlants ??
  crop?.plantCount ??
  crop?.plants ??
  0;

const getDeviceId = (crop) =>
  crop?.device?.deviceId ||
  crop?.device?.id ||
  crop?.deviceId ||
  "HYDROGROW-SIM-001";

const getDeviceStatus = (crop) =>
  crop?.device?.status ||
  crop?.deviceStatus ||
  "Configured";

const getAutomationMode = (crop) =>
  crop?.automation?.mode ||
  "Automatic";

export default function Settings() {
  const {
    user,
    updateUserProfile,
    updateUserSettings,
  } = useAuth();

  const {
    activeCrop,
    selectedCrops = [],
    updateFarmCrop,
    updateDeviceStatus,
    updateAutomation,
  } = useCrop();

  const [settings, setSettings] = useState(() => {
    const stored = getStoredSettings();
    const userSettings = user?.settings;

    if (!userSettings) {
      return stored;
    }

    const notifications =
      userSettings.notifications || {};

    return {
      ...stored,
      notifications:
        notifications.sensorAlerts ??
        stored.notifications,
      emailAlerts:
        notifications.marketplaceUpdates ??
        stored.emailAlerts,
      criticalAlerts:
        notifications.automationActions ??
        stored.criticalAlerts,
      measurementUnit:
        userSettings.units === "imperial"
          ? "Imperial"
          : "Metric",
    };
  });

  const [profile, setProfile] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
  });

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const [farmUnit, setFarmUnit] = useState(
    getFarmUnit(activeCrop)
  );

  const [plantCount, setPlantCount] = useState(
    getPlantCount(activeCrop)
  );

  const [automationMode, setAutomationMode] = useState(
    getAutomationMode(activeCrop)
  );

  const [deviceStatus, setDeviceStatus] = useState(
    getDeviceStatus(activeCrop)
  );

  /*
   * Keep local Settings state synchronized when
   * the user changes the active crop.
   */
  useEffect(() => {
    if (!activeCrop) {
      setFarmUnit("");
      setPlantCount(0);
      setAutomationMode("Automatic");
      setDeviceStatus("Configured");
      return;
    }

    setFarmUnit(getFarmUnit(activeCrop));
    setPlantCount(getPlantCount(activeCrop));
    setAutomationMode(getAutomationMode(activeCrop));
    setDeviceStatus(getDeviceStatus(activeCrop));
  }, [activeCrop]);

  const activeCropName = useMemo(
    () => getCropName(activeCrop),
    [activeCrop]
  );

  const activeDeviceId = useMemo(
    () => getDeviceId(activeCrop),
    [activeCrop]
  );

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );

      if (activeCrop) {
        if (typeof updateFarmCrop === "function") {
          updateFarmCrop(activeCrop.id, {
            farmUnitName: farmUnit,
            farmUnit,
            numberOfPlants: Number(plantCount),
            plantCount: Number(plantCount),
          });
        }

        if (typeof updateAutomation === "function") {
          updateAutomation({
            mode: automationMode,
          });
        }

        if (typeof updateDeviceStatus === "function") {
          updateDeviceStatus(activeCrop.id, deviceStatus);
        }
      }

      if (user) {
        await updateUserProfile({
          name: profile.name,
          mobile: profile.mobile,
          email: profile.email,
        });

        await updateUserSettings({
          farmName: user.settings?.farmName,
          units: settings.measurementUnit.toLowerCase(),
          notifications: {
            sensorAlerts: settings.notifications,
            automationActions: settings.criticalAlerts,
            marketplaceUpdates: settings.emailAlerts,
          },
          thresholds: user.settings?.thresholds,
        });
      }

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      setSaveError(error.message);

      window.setTimeout(() => {
        setSaveError(null);
      }, 4000);
    }
  };

  const handleDeviceStatus = (status) => {
    if (!activeCrop) return;

    setDeviceStatus(status);

    if (typeof updateDeviceStatus === "function") {
      updateDeviceStatus(activeCrop.id, status);
    }
  };

  const handleAutomationMode = (mode) => {
    setAutomationMode(mode);

    if (typeof updateAutomation === "function") {
      updateAutomation({
        mode,
      });
    }
  };

  const handleClearLocalData = () => {
    localStorage.removeItem("hydrogrow_sensor_history");
    localStorage.removeItem("hydrogrow_marketplace_cart");

    setShowClearModal(false);

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="settings-page container-fluid py-4">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="settings-header mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="settings-header-icon">
              <i className="bi bi-gear" />
            </div>

            <h2 className="fw-bold mb-0">
              Settings
            </h2>
          </div>

          <p className="text-muted mb-0">
            Manage your HydroGrow account, farm preferences,
            monitoring, notifications and device configuration.
          </p>
        </div>
      </div>

      {/* =========================================================
          SAVE SUCCESS
      ========================================================= */}

      {saved && (
        <div
          className="alert alert-success settings-success-alert d-flex align-items-center"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2" />

          <div>
            <strong>Settings saved successfully.</strong>

            <span className="d-block small">
              Your HydroGrow preferences have been updated.
            </span>
          </div>
        </div>
      )}

      {saveError && (
        <div
          className="alert alert-danger settings-success-alert d-flex align-items-center"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2" />

          <div>
            <strong>Could not save settings.</strong>

            <span className="d-block small">
              {saveError}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================
          ACCOUNT
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">
          <div className="settings-section-icon">
            <i className="bi bi-person-circle" />
          </div>

          <div>
            <h5 className="mb-1">
              Account
            </h5>

            <p className="text-muted small mb-0">
              Your HydroGrow account information.
            </p>
          </div>
        </div>

        <div className="settings-section-body">

          <div className="row g-3">

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Name
              </label>

              <input
                type="text"
                className="form-control"
                value={profile.name}
                onChange={(e) =>
                  setProfile((previous) => ({
                    ...previous,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Username
              </label>

              <input
                type="text"
                className="form-control"
                value={user?.username || ""}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Mobile
              </label>

              <input
                type="text"
                className="form-control"
                value={profile.mobile}
                onChange={(e) =>
                  setProfile((previous) => ({
                    ...previous,
                    mobile: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Role
              </label>

              <input
                type="text"
                className="form-control"
                value={user?.role || "USER"}
                readOnly
              />
            </div>

          </div>

          <div className="settings-readonly-note mt-3">
            <i className="bi bi-info-circle me-2" />

            Account details are managed through your
            HydroGrow account system.
          </div>

        </div>
      </section>

      {/* =========================================================
          ACTIVE CROP
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">
          <div className="settings-section-icon">
            <i className="bi bi-leaf" />
          </div>

          <div>
            <h5 className="mb-1">
              Active Crop Settings
            </h5>

            <p className="text-muted small mb-0">
              Manage settings associated with your currently
              active crop.
            </p>
          </div>
        </div>

        <div className="settings-section-body">

          {!activeCrop ? (
            <div className="settings-empty-state">

              <div className="settings-empty-icon">
                <i className="bi bi-flower1" />
              </div>

              <h6 className="fw-bold mt-3">
                No Active Crop
              </h6>

              <p className="text-muted mb-3">
                Select a crop before managing crop-specific
                settings.
              </p>

              <Link
                to="/crop-management"
                className="btn btn-success"
              >
                <i className="bi bi-plus-circle me-2" />
                Select Your Crop
              </Link>

            </div>
          ) : (
            <>

              {/* Active crop identity */}

              <div className="active-crop-settings-banner">

                <div className="active-crop-settings-icon">
                  <i className="bi bi-leaf" />
                </div>

                <div>
                  <span className="small text-muted d-block">
                    Currently Active Crop
                  </span>

                  <strong>
                    {activeCropName}
                  </strong>
                </div>

                <span className="badge bg-success-subtle text-success ms-auto">
                  Active
                </span>

              </div>

              <div className="row g-3 mt-1">

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Crop
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={activeCropName}
                    readOnly
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Farm Unit
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={farmUnit}
                    onChange={(e) =>
                      setFarmUnit(e.target.value)
                    }
                    placeholder="Enter farm unit name"
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Number of Plants
                  </label>

                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={plantCount}
                    onChange={(e) =>
                      setPlantCount(e.target.value)
                    }
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Device ID
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={activeDeviceId}
                    readOnly
                  />

                </div>

              </div>

            </>
          )}

        </div>
      </section>

      {/* =========================================================
          MONITORING PREFERENCES
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">
          <div className="settings-section-icon">
            <i className="bi bi-sliders" />
          </div>

          <div>
            <h5 className="mb-1">
              Monitoring Preferences
            </h5>

            <p className="text-muted small mb-0">
              Control how monitoring information is refreshed
              and presented.
            </p>
          </div>
        </div>

        <div className="settings-section-body">

          <div className="settings-option">

            <div className="settings-option-content">

              <div className="settings-option-icon">
                <i className="bi bi-arrow-repeat" />
              </div>

              <div>
                <strong>
                  Automatic Monitoring Refresh
                </strong>

                <span>
                  Keep monitoring information updated automatically.
                </span>
              </div>

            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={settings.autoRefresh}
                onChange={(e) =>
                  updateSetting(
                    "autoRefresh",
                    e.target.checked
                  )
                }
              />
            </div>

          </div>

          <div className="settings-option">

            <div className="settings-option-content">

              <div className="settings-option-icon">
                <i className="bi bi-bell" />
              </div>

              <div>
                <strong>
                  In-App Notifications
                </strong>

                <span>
                  Show important crop and system alerts inside HydroGrow.
                </span>
              </div>

            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={settings.notifications}
                onChange={(e) =>
                  updateSetting(
                    "notifications",
                    e.target.checked
                  )
                }
              />
            </div>

          </div>

          <div className="settings-option">

            <div className="settings-option-content">

              <div className="settings-option-icon">
                <i className="bi bi-envelope" />
              </div>

              <div>
                <strong>
                  Email Alerts
                </strong>

                <span>
                  Enable email notification preferences when supported.
                </span>
              </div>

            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={settings.emailAlerts}
                onChange={(e) =>
                  updateSetting(
                    "emailAlerts",
                    e.target.checked
                  )
                }
              />
            </div>

          </div>

          <div className="settings-option">

            <div className="settings-option-content">

              <div className="settings-option-icon">
                <i className="bi bi-exclamation-triangle" />
              </div>

              <div>
                <strong>
                  Critical Alerts
                </strong>

                <span>
                  Prioritize critical crop and environmental alerts.
                </span>
              </div>

            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={settings.criticalAlerts}
                onChange={(e) =>
                  updateSetting(
                    "criticalAlerts",
                    e.target.checked
                  )
                }
              />
            </div>

          </div>

          <div className="settings-option">

            <div className="settings-option-content">

              <div className="settings-option-icon">
                <i className="bi bi-calendar-check" />
              </div>

              <div>
                <strong>
                  Harvest Reminders
                </strong>

                <span>
                  Receive reminders related to expected crop harvest.
                </span>
              </div>

            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={settings.harvestReminders}
                onChange={(e) =>
                  updateSetting(
                    "harvestReminders",
                    e.target.checked
                  )
                }
              />
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          AUTOMATION PREFERENCES
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <i className="bi bi-robot" />
          </div>

          <div>
            <h5 className="mb-1">
              Automation Preferences
            </h5>

            <p className="text-muted small mb-0">
              Choose the preferred operating mode for your
              active crop.
            </p>
          </div>

        </div>

        <div className="settings-section-body">

          {!activeCrop ? (
            <div className="settings-inline-empty">
              <i className="bi bi-info-circle me-2" />
              Select an active crop to configure automation.
            </div>
          ) : (
            <div className="row g-3">

              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Operating Mode
                </label>

                <select
                  className="form-select"
                  value={automationMode}
                  onChange={(e) =>
                    handleAutomationMode(e.target.value)
                  }
                >
                  <option value="Automatic">
                    Automatic
                  </option>

                  <option value="Manual">
                    Manual
                  </option>
                </select>

                <div className="form-text">
                  Automatic mode allows configured automation
                  rules to control supported devices.
                </div>

              </div>

              <div className="col-md-6">

                <div className="automation-mode-preview">

                  <div className="automation-mode-preview-icon">
                    <i
                      className={
                        automationMode === "Automatic"
                          ? "bi bi-robot"
                          : "bi bi-hand-index"
                      }
                    />
                  </div>

                  <div>

                    <small className="text-muted d-block">
                      Current Preference
                    </small>

                    <strong>
                      {automationMode}
                    </strong>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </section>

      {/* =========================================================
          DEVICE & SIMULATOR
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <i className="bi bi-cpu" />
          </div>

          <div>
            <h5 className="mb-1">
              Device & Simulator
            </h5>

            <p className="text-muted small mb-0">
              Manage the device connection state associated
              with your active crop.
            </p>
          </div>

        </div>

        <div className="settings-section-body">

          {!activeCrop ? (
            <div className="settings-inline-empty">
              <i className="bi bi-info-circle me-2" />
              Select a crop to manage its device configuration.
            </div>
          ) : (
            <>

              <div className="device-settings-panel">

                <div className="device-settings-main">

                  <div className="device-settings-icon">
                    <i className="bi bi-cpu" />
                  </div>

                  <div>

                    <small className="text-muted d-block">
                      Current Device
                    </small>

                    <strong>
                      {activeDeviceId}
                    </strong>

                    <span className="d-block small text-muted mt-1">
                      Associated with {activeCropName}
                    </span>

                  </div>

                </div>

                <span
                  className={
                    deviceStatus === "Connected"
                      ? "badge bg-success-subtle text-success"
                      : deviceStatus === "Disconnected"
                        ? "badge bg-secondary-subtle text-secondary"
                        : "badge bg-warning-subtle text-warning"
                  }
                >
                  <i
                    className={
                      deviceStatus === "Connected"
                        ? "bi bi-wifi me-1"
                        : "bi bi-wifi-off me-1"
                    }
                  />

                  {deviceStatus}
                </span>

              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">

                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() =>
                    handleDeviceStatus("Connected")
                  }
                >
                  <i className="bi bi-wifi me-2" />
                  Set Connected
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    handleDeviceStatus("Disconnected")
                  }
                >
                  <i className="bi bi-wifi-off me-2" />
                  Set Disconnected
                </button>

              </div>

              <div className="settings-device-note mt-3">

                <i className="bi bi-info-circle me-2" />

                Input Simulator runs separately from the main
                farmer interface. Sensor readings should be
                associated with the selected crop and device.

              </div>

            </>
          )}

        </div>
      </section>

      {/* =========================================================
          DISPLAY / MEASUREMENT
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <i className="bi bi-display" />
          </div>

          <div>
            <h5 className="mb-1">
              Display Preferences
            </h5>

            <p className="text-muted small mb-0">
              Configure measurement preferences used throughout
              the HydroGrow interface.
            </p>
          </div>

        </div>

        <div className="settings-section-body">

          <div className="row g-3">

            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Measurement System
              </label>

              <select
                className="form-select"
                value={settings.measurementUnit}
                onChange={(e) =>
                  updateSetting(
                    "measurementUnit",
                    e.target.value
                  )
                }
              >
                <option value="Metric">
                  Metric
                </option>

                <option value="Imperial">
                  Imperial
                </option>
              </select>

              <div className="form-text">
                HydroGrow currently uses metric units for
                environmental measurements.
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          DATA MANAGEMENT
      ========================================================= */}

      <section className="settings-section settings-danger-section">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <i className="bi bi-database" />
          </div>

          <div>
            <h5 className="mb-1">
              Data Management
            </h5>

            <p className="text-muted small mb-0">
              Manage locally stored HydroGrow application data.
            </p>
          </div>

        </div>

        <div className="settings-section-body">

          <div className="data-management-row">

            <div>

              <strong>
                Clear Local Sensor History
              </strong>

              <span className="d-block text-muted small">
                Removes locally stored sensor-history records
                from this browser.
              </span>

            </div>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setShowClearModal(true)}
            >
              <i className="bi bi-trash3 me-2" />
              Clear Data
            </button>

          </div>

          <div className="settings-danger-note mt-3">

            <i className="bi bi-exclamation-circle me-2" />

            This action only removes locally stored browser
            data. It does not delete server-side or MongoDB
            records.

          </div>

        </div>
      </section>

      {/* =========================================================
          SELECTED CROPS SUMMARY
      ========================================================= */}

      <section className="settings-section">

        <div className="settings-section-header">

          <div className="settings-section-icon">
            <i className="bi bi-grid" />
          </div>

          <div>
            <h5 className="mb-1">
              Crop Configuration
            </h5>

            <p className="text-muted small mb-0">
              Overview of crops currently configured in your farm.
            </p>
          </div>

        </div>

        <div className="settings-section-body">

          {selectedCrops.length === 0 ? (
            <div className="settings-inline-empty">
              <i className="bi bi-flower1 me-2" />
              No crops have been added to your farm yet.
            </div>
          ) : (
            <div className="settings-crop-list">

              {selectedCrops.map((crop, index) => {

                const cropId = crop.id || crop.cropId || index;
                const cropName = getCropName(crop);

                const isActive =
                  activeCrop &&
                  (activeCrop.id === crop.id ||
                    activeCrop.cropId === crop.cropId);

                return (
                  <div
                    className={
                      isActive
                        ? "settings-crop-item active"
                        : "settings-crop-item"
                    }
                    key={cropId}
                  >

                    <div className="settings-crop-item-icon">
                      <i className="bi bi-leaf" />
                    </div>

                    <div>

                      <strong>
                        {cropName}
                      </strong>

                      <span>
                        {getFarmUnit(crop)}
                      </span>

                    </div>

                    {isActive && (
                      <span className="badge bg-success-subtle text-success ms-auto">
                        Active
                      </span>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </section>

      {/* =========================================================
          SAVE
      ========================================================= */}

      <div className="settings-save-bar">

        <div className="settings-save-info">

          <i className="bi bi-shield-check" />

          <div>

            <strong>
              HydroGrow Settings
            </strong>

            <span>
              Save your preferences to keep this configuration
              for your next session.
            </span>

          </div>

        </div>

        <button
          type="button"
          className="btn btn-success px-4"
          onClick={handleSave}
        >
          <i className="bi bi-check2-circle me-2" />
          Save Settings
        </button>

      </div>

      {/* =========================================================
          CLEAR DATA MODAL
      ========================================================= */}

      {showClearModal && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setShowClearModal(false)}
        >

          <div
            className="settings-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="settings-modal-icon">
              <i className="bi bi-trash3" />
            </div>

            <h5 className="fw-bold">
              Clear Local Sensor History?
            </h5>

            <p className="text-muted">
              This will remove sensor-history data stored
              locally in this browser. Server-side data will
              not be affected.
            </p>

            <div className="d-flex justify-content-end gap-2">

              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearLocalData}
              >
                <i className="bi bi-trash3 me-2" />
                Clear History
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}