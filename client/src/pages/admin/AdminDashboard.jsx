import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import useSensor from "../../hooks/useSensor";

import api from "../../services/api";

import {
  getPlatformStats,
  getActivityLog,
  getSystemAlerts,
  formatAdminRelative,
} from "../../data/adminData";

import {
  getOrderStatusMeta,
  formatCurrency,
} from "../../data/marketplaceData";

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard() {
  const { deviceConnected, deviceInfo, deviceSource } =
    useSensor();

  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setStats(getPlatformStats());
    setActivity(getActivityLog().slice(0, 6));
    setAlerts(getSystemAlerts());
  }, []);

  const loadRemoteStats = async () => {
    const [usersResult, alertsResult, marketResult, sensorResult] =
      await Promise.allSettled([
        api.get("/users/stats"),
        api.get("/alerts/admin/all"),
        api.get("/marketplace/admin/overview"),
        api.get("/sensors/stats"),
      ]);

    setStats((previous) => {
      const next = { ...previous };

      if (usersResult.status === "fulfilled") {
        const remote = usersResult.value.stats;

        if (remote) {
          next.totalUsers = remote.totalUsers;
          next.activeUsers = remote.activeUsers;
          next.adminUsers = remote.adminUsers;
        }
      }

      if (marketResult.status === "fulfilled") {
        const remote = marketResult.value.stats;

        if (remote) {
          next.totalListings = remote.products;
          next.activeListings = remote.available;
          next.totalOrders = remote.orders;
          next.grossRevenue = remote.revenue;

          next.recentOrders = (
            marketResult.value.orders || []
          )
            .slice(0, 5)
            .map((order) => ({
              id: order.orderNumber,
              ownerName:
                order.buyerName ||
                order.sellerName ||
                "HydroGrow customer",
              items: [
                {
                  name: order.productTitle,
                  quantity: order.quantity,
                },
              ],
              total: order.totalPrice,
              status: (
                order.status || ""
              ).toLowerCase(),
              placedAt: order.createdAt,
            }));
        }
      }

      if (sensorResult.status === "fulfilled") {
        const remote = sensorResult.value.stats;

        if (remote) {
          next.cropsTracked = remote.activeCrops;
        }
      }

      return next;
    });

    if (alertsResult.status === "fulfilled") {
      const remoteAlerts =
        alertsResult.value.alerts || [];

      setAlerts(
        remoteAlerts.map((alert) => ({
          id: alert._id,
          severity: (
            alert.severity || "INFO"
          ).toLowerCase(),
          title: alert.title,
          message: alert.message,
          createdAt: alert.createdAt,
          acknowledged: Boolean(alert.isResolved),
        }))
      );

      setActivity(
        remoteAlerts.slice(0, 5).map((alert) => ({
          id: alert._id,
          icon:
            alert.severity === "CRITICAL"
              ? "bi-exclamation-octagon"
              : alert.severity === "WARNING"
                ? "bi-exclamation-triangle"
                : "bi-info-circle",
          text: alert.title,
          at: alert.createdAt,
        }))
      );
    }
  };

  useEffect(() => {
    loadRemoteStats();
  }, []);

  if (!stats) {
    return (
      <div className="admin-empty">
        <i className="bi bi-hourglass-split"></i>
        <h3>Loading platform overview...</h3>
      </div>
    );
  }

  const unresolvedAlerts = alerts.filter(
    (alert) => !alert.acknowledged
  );

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            ADMIN CONTROL CENTER
          </span>

          <h1>
            <i className="bi bi-speedometer2"></i>
            Platform Overview
          </h1>

          <p>
            Live snapshot of HydroGrow users, sensor
            hardware, marketplace activity and system
            health.
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn ghost"
            onClick={() => {
              setStats(getPlatformStats());
              setActivity(getActivityLog().slice(0, 6));
              setAlerts(getSystemAlerts());
              loadRemoteStats();
            }}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* ===================================================
          STAT CARDS
          =================================================== */}

      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <span className="admin-stat-icon">
            <i className="bi bi-people"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {stats.totalUsers}
            </span>

            <span className="admin-stat-label">
              Platform Users
            </span>

            <span className="admin-stat-sub">
              <b>{stats.activeUsers}</b> active ·{" "}
              {stats.adminUsers} admins
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon info">
            <i className="bi bi-shop"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {stats.totalListings}
            </span>

            <span className="admin-stat-label">
              Marketplace Listings
            </span>

            <span className="admin-stat-sub">
              <b>{stats.activeListings}</b> active
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon warn">
            <i className="bi bi-bag-check"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {stats.totalOrders}
            </span>

            <span className="admin-stat-label">
              Orders
            </span>

            <span className="admin-stat-sub">
              {formatCurrency(stats.grossRevenue)} gross
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon dark">
            <i className="bi bi-flower1"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {stats.cropsTracked}
            </span>

            <span className="admin-stat-label">
              Crops Tracked
            </span>

            <span className="admin-stat-sub">
              Knowledge base entries
            </span>
          </div>
        </div>

      </div>

      {/* ===================================================
          DEVICE PANEL + ALERTS SUMMARY
          =================================================== */}

      <div className="admin-card-grid">

        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>
                <i className="bi bi-cpu"></i>
                Sensor Hardware Unit
              </h2>

              <div className="admin-card-sub">
                {deviceConnected
                  ? "Streaming live readings to the platform"
                  : "No live device — local simulation active"}
              </div>
            </div>

            <span
              className={`admin-badge ${
                deviceConnected
                  ? "success"
                  : "muted"
              }`}
            >
              <i
                className={`bi ${
                  deviceConnected
                    ? "bi-broadcast"
                    : "bi-wifi-off"
                }`}
              ></i>
              {deviceConnected
                ? "Connected"
                : "Offline"}
            </span>
          </div>

          <div className="admin-card-body">

            <div className="admin-sensor-grid">

              <div className="admin-sensor-tile">
                <span className="label">
                  <i className="bi bi-upc-scan"></i>
                  Device ID
                </span>

                <span className="value">
                  {deviceInfo?.deviceId ||
                    "HYDROGROW-SIM-001"}
                </span>
              </div>

              <div className="admin-sensor-tile">
                <span className="label">
                  <i className="bi bi-shuffle"></i>
                  Data Source
                </span>

                <span className="value value--sm">
                  {deviceConnected
                    ? deviceSource
                    : "LOCAL_SIMULATION"}
                </span>
              </div>

              <div className="admin-sensor-tile">
                <span className="label">
                  <i className="bi bi-gear"></i>
                  Mode
                </span>

                <span className="value value--cap">
                  {deviceInfo?.mode || "auto"}
                </span>
              </div>

              <div className="admin-sensor-tile">
                <span className="label">
                  <i className="bi bi-arrow-repeat"></i>
                  Transmissions
                </span>

                <span className="value">
                  {deviceInfo?.transmissions ?? 0}
                </span>
              </div>

            </div>

            <div className="admin-card-actions">
              <Link
                to="/admin/sensor-data"
                className="admin-btn primary"
              >
                <i className="bi bi-activity"></i>
                View Sensor Data
              </Link>

              <Link
                to="/admin/alerts"
                className="admin-btn ghost"
              >
                <i className="bi bi-bell"></i>
                {unresolvedAlerts.length} Unresolved{" "}
                {unresolvedAlerts.length === 1
                  ? "Alert"
                  : "Alerts"}
              </Link>
            </div>

          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>
                <i className="bi bi-activity"></i>
                Recent Activity
              </h2>

              <div className="admin-card-sub">
                Latest platform events
              </div>
            </div>
          </div>

          <div className="admin-card-body flush">
            {activity.length === 0 ? (
              <div className="admin-empty">
                <i className="bi bi-activity"></i>
                <h3>No Activity Yet</h3>
                <p>
                  Platform events will appear here.
                </p>
              </div>
            ) : (
              activity.map((item) => (
                <div
                  className="admin-activity-item"
                  key={item.id}
                >
                  <span className="admin-activity-icon">
                    <i
                      className={`bi ${item.icon}`}
                    ></i>
                  </span>

                  <span className="admin-activity-text">
                    {item.text}
                  </span>

                  <span className="admin-activity-time">
                    {formatAdminRelative(item.at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ===================================================
          RECENT ORDERS
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>
              <i className="bi bi-bag-check"></i>
              Recent Orders
            </h2>

            <div className="admin-card-sub">
              Latest {stats.recentOrders.length}{" "}
              marketplace orders
            </div>
          </div>

          <Link
            to="/admin/marketplace"
            className="admin-btn ghost small"
          >
            Manage Marketplace
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        <div className="admin-card-body flush">
          {stats.recentOrders.length === 0 ? (
            <div className="admin-empty">
              <i className="bi bi-bag"></i>
              <h3>No Orders Yet</h3>
              <p>
                Marketplace orders will appear here as
                customers start purchasing.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Placed</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.recentOrders.map((order) => {
                    const meta = getOrderStatusMeta(
                      order.status
                    );

                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id}</strong>
                        </td>

                        <td>{order.ownerName}</td>

                        <td>
                          {order.items?.length || 0}{" "}
                          product
                          {order.items?.length === 1
                            ? ""
                            : "s"}
                        </td>

                        <td>
                          {formatCurrency(order.total)}
                        </td>

                        <td>
                          <span
                            className={`admin-badge ${
                              order.status ===
                              "delivered"
                                ? "success"
                                : order.status ===
                                  "cancelled"
                                  ? "danger"
                                  : order.status ===
                                    "shipped"
                                    ? "info"
                                    : "warning"
                            }`}
                          >
                            <i
                              className={`bi ${meta?.icon}`}
                            ></i>
                            {meta?.label ||
                              order.status}
                          </span>
                        </td>

                        <td>
                          {formatAdminRelative(
                            order.placedAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </>
  );
}

export default AdminDashboard;
