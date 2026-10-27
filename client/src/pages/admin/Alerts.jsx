import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

import {
  getSystemAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  dismissAlert,
  ALERT_SEVERITY_META,
  formatAdminDateTime,
} from "../../data/adminData";

/* =========================================================
   ADMIN SYSTEM ALERTS
   ========================================================= */

function normalizeAlert(alert) {
  return {
    id: alert._id,
    severity: String(alert.severity || "INFO").toLowerCase(),
    title: alert.title,
    message: alert.message,
    source: alert.type || alert.deviceId || "System",
    createdAt: alert.createdAt,
    acknowledged: Boolean(alert.isRead || alert.isResolved),
  };
}

function summarizeAlerts(list) {
  return {
    total: list.length,
    critical: list.filter(
      (alert) => alert.severity === "critical"
    ).length,
    unresolved: list.filter(
      (alert) => !alert.acknowledged
    ).length,
  };
}

function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    unresolved: 0,
  });

  const [apiConnected, setApiConnected] =
    useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await api.get("/alerts/admin/all");

      const records = Array.isArray(data?.alerts)
        ? data.alerts.map(normalizeAlert)
        : [];

      setAlerts(records);

      setApiConnected(true);

      setStats({
        total: data?.stats?.total ?? records.length,
        critical: data?.stats?.critical ?? 0,
        unresolved:
          data?.stats?.unresolved ??
          records.filter((alert) => !alert.acknowledged)
            .length,
      });
    } catch {
      const demoAlerts = getSystemAlerts();

      setAlerts(demoAlerts);

      setApiConnected(false);
      setStats(summarizeAlerts(demoAlerts));
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const unresolved = alerts.filter(
    (alert) => !alert.acknowledged
  );

  const handleAcknowledge = (id) => {
    if (apiConnected) {
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id
            ? { ...alert, acknowledged: true }
            : alert
        )
      );

      setStats((current) => ({
        ...current,
        unresolved: Math.max(
          current.unresolved - 1,
          0
        ),
      }));

      return;
    }

    setAlerts(acknowledgeAlert(id));
  };

  const handleDismiss = async (id) => {
    if (!apiConnected) {
      const remaining = dismissAlert(id);

      setAlerts(remaining);
      setStats(summarizeAlerts(remaining));

      return;
    }

    try {
      await api.del(`/alerts/admin/${id}`);
    } catch {
      await loadAlerts();

      return;
    }

    const target = alerts.find(
      (alert) => alert.id === id
    );

    setAlerts((current) =>
      current.filter((alert) => alert.id !== id)
    );

    if (!target) {
      return;
    }

    setStats((current) => ({
      total: Math.max(current.total - 1, 0),
      critical:
        target.severity === "critical"
          ? Math.max(current.critical - 1, 0)
          : current.critical,
      unresolved: target.acknowledged
        ? current.unresolved
        : Math.max(current.unresolved - 1, 0),
    }));
  };

  const handleAcknowledgeAll = () => {
    if (apiConnected) {
      setAlerts((current) =>
        current.map((alert) => ({
          ...alert,
          acknowledged: true,
        }))
      );

      setStats((current) => ({
        ...current,
        unresolved: 0,
      }));

      return;
    }

    setAlerts(acknowledgeAllAlerts());
  };

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            SYSTEM MONITORING
          </span>

          <h1>
            <i className="bi bi-bell"></i>
            System Alerts
          </h1>

          <p>
            {unresolved.length > 0
              ? `${unresolved.length} alert${
                  unresolved.length === 1 ? "" : "s"
                } need attention.`
              : "All alerts acknowledged — platform is healthy."}
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn primary"
            disabled={unresolved.length === 0}
            onClick={handleAcknowledgeAll}
          >
            <i className="bi bi-check2-all"></i>
            Acknowledge All
          </button>

          <Link
            to="/alerts"
            className="admin-btn ghost"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            Grower Alerts
          </Link>
        </div>
      </div>

      {/* ===================================================
          ALERT LIST
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>
              <i className="bi bi-list-check"></i>
              Alert Feed
            </h2>

            <div className="admin-card-sub">
              {stats.total} total ·{" "}
              {stats.critical} critical ·{" "}
              {stats.unresolved} unresolved
            </div>
          </div>
        </div>

        <div className="admin-card-body flush">
          {alerts.length === 0 ? (
            <div className="admin-empty">
              <i className="bi bi-bell-slash"></i>
              <h3>No Alerts</h3>
              <p>
                System alerts will appear here when
                the platform detects an issue.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const meta =
                ALERT_SEVERITY_META[
                  alert.severity
                ] ||
                ALERT_SEVERITY_META.info;

              return (
                <div
                  key={alert.id}
                  className={`admin-alert-item ${alert.severity}`}
                >
                  <span className="admin-alert-icon">
                    <i
                      className={`bi ${meta.icon}`}
                    ></i>
                  </span>

                  <div className="admin-alert-content">
                    <h3>
                      {alert.title}

                      <span
                        className={`admin-badge ${
                          alert.severity ===
                          "critical"
                            ? "danger"
                            : alert.severity ===
                              "warning"
                              ? "warning"
                              : "info"
                        }`}
                      >
                        {meta.label}
                      </span>

                      {alert.acknowledged && (
                        <span className="admin-badge muted">
                          <i className="bi bi-check2"></i>
                          Acknowledged
                        </span>
                      )}
                    </h3>

                    <p>{alert.message}</p>

                    <span className="admin-alert-time">
                      <i className="bi bi-clock me-1"></i>
                      {formatAdminDateTime(
                        alert.createdAt
                      )}{" "}
                      · {alert.source}
                    </span>
                  </div>

                  <div className="admin-alert-actions">
                    {!alert.acknowledged && (
                      <button
                        type="button"
                        className="admin-btn ghost small"
                        onClick={() =>
                          handleAcknowledge(
                            alert.id
                          )
                        }
                      >
                        <i className="bi bi-check2"></i>
                        Acknowledge
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-btn danger small"
                      onClick={() =>
                        handleDismiss(alert.id)
                      }
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </>
  );
}

export default AdminAlerts;
