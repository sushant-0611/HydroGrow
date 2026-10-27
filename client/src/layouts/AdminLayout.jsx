import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useSensor from "../hooks/useSensor";

import "../assets/styles/admin.css";

/* =========================================================
   ADMIN NAV ITEMS
   ========================================================= */

const ADMIN_NAV_ITEMS = [
  {
    to: "/admin",
    icon: "bi-speedometer2",
    label: "Overview",
    end: true,
  },
  {
    to: "/admin/users",
    icon: "bi-people",
    label: "Users",
  },
  {
    to: "/admin/crops",
    icon: "bi-flower1",
    label: "Crops",
  },
  {
    to: "/admin/sensor-data",
    icon: "bi-cpu",
    label: "Sensor Data",
  },
  {
    to: "/admin/alerts",
    icon: "bi-bell",
    label: "Alerts",
  },
  {
    to: "/admin/marketplace",
    icon: "bi-shop",
    label: "Marketplace",
  },
];

/* =========================================================
   ADMIN LAYOUT
   ========================================================= */

function AdminLayout() {
  const { user, logout } = useAuth();
  const { deviceConnected } = useSensor();
  const navigate = useNavigate();

  const userName = user?.name || "HydroGrow Admin";
  const userInitial = userName.trim().charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="admin-sidebar">

        <Link to="/admin" className="admin-brand">
          <span className="admin-brand-icon">
            <i className="bi bi-shield-lock-fill"></i>
          </span>

          <span className="admin-brand-text">
            <strong>HydroGrow</strong>
            <small>Admin Console</small>
          </span>
        </Link>

        <div className="admin-sidebar-label">
          ADMINISTRATION
        </div>

        <nav
          className="admin-nav"
          aria-label="Admin navigation"
        >
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item ${
                  isActive ? "active" : ""
                }`
              }
              title={item.label}
            >
              <i className={`bi ${item.icon}`}></i>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="device-line">
            <span
              className={`device-dot ${
                deviceConnected ? "online" : ""
              }`}
            ></span>

            <span>
              {deviceConnected
                ? "Sensor unit online"
                : "Sensor unit offline"}
            </span>
          </div>

          <div>
            HydroGrow Admin · v1.0
          </div>
        </div>

      </aside>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <div className="admin-main">

        {/* ===================================================
            TOPBAR
            =================================================== */}

        <header className="admin-topbar">

          <div className="admin-topbar-title">
            <strong>Control Center</strong>
            <span>
              Platform administration and monitoring
            </span>
          </div>

          <div className="admin-topbar-right">

            <span className="admin-topbar-status">
              <span
                className={`dot ${
                  deviceConnected ? "" : "off"
                }`}
              ></span>
              {deviceConnected
                ? "Device Live"
                : "Device Offline"}
            </span>

            <span className="admin-topbar-divider"></span>

            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">
                {userInitial}
              </div>

              <div className="admin-topbar-user-info">
                <strong>{userName}</strong>
                <span>{user?.role || "ADMIN"}</span>
              </div>
            </div>

            <span className="admin-topbar-divider"></span>

            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>

          </div>

        </header>

        {/* ===================================================
            PAGE CONTENT
            =================================================== */}

        <main className="admin-page">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;
